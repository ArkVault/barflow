#!/usr/bin/env tsx
/**
 * Benchmark: Gemma 4 vs Gemini Flash 2.5 for Menu Parsing
 *
 * Measures: schema compliance, extraction accuracy, latency, category adherence,
 * unit normalization, matching quality, and estimated cost.
 *
 * Usage:
 *   GEMINI_API_KEY=<key> npx tsx scripts/benchmark/run-benchmark.ts
 *   GEMINI_API_KEY=<key> npx tsx scripts/benchmark/run-benchmark.ts --runs=3
 */

import { GoogleGenAI, Type } from '@google/genai';
import { z } from 'zod';
import {
  ALL_TEST_CASES,
  VALID_CATEGORIES,
  EXISTING_SUPPLIES,
  type TestCase,
  type GroundTruthItem,
} from './test-data';

// ─── Config ───
const MODELS = [
  {
    id: 'gemini-2.5-flash',
    label: 'Gemini 2.5 Flash',
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.60,
  },
  {
    id: 'gemma-4-26b-a4b-it',
    label: 'Gemma 4 26B MoE',
    inputCostPer1M: 0, // open-weight, self-hosted cost varies
    outputCostPer1M: 0,
  },
  {
    id: 'gemma-4-31b-it',
    label: 'Gemma 4 31B Dense',
    inputCostPer1M: 0, // open-weight, self-hosted cost varies
    outputCostPer1M: 0,
  },
];

const NUM_RUNS = parseInt(process.argv.find(a => a.startsWith('--runs='))?.split('=')[1] ?? '1', 10);

// ─── Zod schema (same as production) ───
const AISupplySchema = z.object({
  name: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  category: z.string().min(1),
  matched_existing: z.boolean().optional().default(false),
  existing_id: z.string().nullable().optional(),
  confidence: z.number().min(0).max(1).optional().default(0),
});
const AIResponseSchema = z.array(AISupplySchema);

// ─── Types ───
interface ModelResult {
  modelId: string;
  modelLabel: string;
  testCaseId: string;
  run: number;
  latencyMs: number;
  rawResponse: string;
  jsonValid: boolean;
  zodValid: boolean;
  zodErrors: string[];
  itemCount: number;
  expectedCount: number;
  categoryAdherence: number;    // % items using valid categories
  unitNormalization: number;    // % items with standard units
  nameAccuracy: number;         // fuzzy match score vs ground truth
  quantityAccuracy: number;     // % correct quantities
  matchingAccuracy: number;     // % correct existing-supply matches
  estimatedCostUSD: number;
  error?: string;
}

// ─── Helpers ───
function buildPrompt(csv: string): string {
  return `You are a data extraction assistant for a bar inventory system.

Parse the following inventory data and extract supply items.

VALID CATEGORIES (ONLY use these): ${VALID_CATEGORIES.join(', ')}

EXISTING SUPPLIES IN DATABASE (match new items to these when possible):
${EXISTING_SUPPLIES.map(s => `- ${s.name} (id: ${s.id}, category: ${s.category}, unit: ${s.unit})`).join('\n')}

RULES:
- Name: valid supply/ingredient name
- Quantity: positive number. Normalize compound values (e.g., "750ml" → quantity: 750, unit: "ml")
- Unit: normalize to standard units (ml, L, g, kg, units, oz, bottles)
- Category: MUST be one of the valid categories above. If uncertain, use "Otros"
- Matching: if a similar name exists in the database, set matched_existing=true and existing_id to that supply's id. Set confidence 0-1 based on match quality
- If no match, set matched_existing=false, existing_id=null, confidence=0

DATA TO PARSE:
${csv}`;
}

const STANDARD_UNITS = new Set(['ml', 'l', 'g', 'kg', 'units', 'oz', 'bottles', 'lbs']);

function normalizeStr(s: string): string {
  return s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

function fuzzyMatch(a: string, b: string): number {
  const na = normalizeStr(a);
  const nb = normalizeStr(b);
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.8;

  // Jaccard on words
  const wordsA = new Set(na.split(/\s+/));
  const wordsB = new Set(nb.split(/\s+/));
  const intersection = [...wordsA].filter(w => wordsB.has(w)).length;
  const union = new Set([...wordsA, ...wordsB]).size;
  return union > 0 ? intersection / union : 0;
}

function findBestMatch(parsed: any[], truth: GroundTruthItem): { item: any; score: number } | null {
  let best: { item: any; score: number } | null = null;
  for (const item of parsed) {
    const score = fuzzyMatch(item.name ?? '', truth.name);
    if (!best || score > best.score) {
      best = { item, score };
    }
  }
  return best && best.score >= 0.3 ? best : null;
}

function estimateCost(prompt: string, response: string, model: typeof MODELS[0]): number {
  // Rough token estimate: ~4 chars per token
  const inputTokens = prompt.length / 4;
  const outputTokens = response.length / 4;
  return (inputTokens / 1_000_000) * model.inputCostPer1M +
    (outputTokens / 1_000_000) * model.outputCostPer1M;
}

// ─── Core benchmark runner ───
async function runSingleBenchmark(
  client: GoogleGenAI,
  model: typeof MODELS[0],
  testCase: TestCase,
  runIndex: number
): Promise<ModelResult> {
  const prompt = buildPrompt(testCase.csv);
  const result: ModelResult = {
    modelId: model.id,
    modelLabel: model.label,
    testCaseId: testCase.id,
    run: runIndex + 1,
    latencyMs: 0,
    rawResponse: '',
    jsonValid: false,
    zodValid: false,
    zodErrors: [],
    itemCount: 0,
    expectedCount: testCase.groundTruth.length,
    categoryAdherence: 0,
    unitNormalization: 0,
    nameAccuracy: 0,
    quantityAccuracy: 0,
    matchingAccuracy: 0,
    estimatedCostUSD: 0,
  };

  try {
    const start = performance.now();

    // Gemma models don't support responseSchema constrained decoding via AI Studio API.
    // Use schema enforcement for Gemini, prompt-only JSON for Gemma (realistic comparison).
    const isGemma = model.id.startsWith('gemma');

    const config: any = {};
    if (isGemma) {
      // Gemma: rely on prompt instructions + responseMimeType only
      config.responseMimeType = 'application/json';
    } else {
      // Gemini: full schema-constrained decoding
      config.responseMimeType = 'application/json';
      config.responseSchema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            quantity: { type: Type.NUMBER },
            unit: { type: Type.STRING },
            category: { type: Type.STRING },
            matched_existing: { type: Type.BOOLEAN },
            existing_id: { type: Type.STRING, nullable: true },
            confidence: { type: Type.NUMBER },
          },
          required: ['name', 'quantity', 'unit', 'category', 'matched_existing', 'confidence'],
        },
      };
    }

    // For Gemma, add explicit JSON schema instructions to the prompt
    const finalPrompt = isGemma
      ? prompt + `\n\nIMPORTANT: Return ONLY a valid JSON array. Each object must have these exact keys:
- "name" (string)
- "quantity" (number, positive)
- "unit" (string: ml, L, g, kg, units, oz, or bottles)
- "category" (string: one of the valid categories)
- "matched_existing" (boolean)
- "existing_id" (string UUID or null)
- "confidence" (number 0-1)

Return ONLY the JSON array, no markdown, no explanation.`
      : prompt;

    const response = await client.models.generateContent({
      model: model.id,
      contents: finalPrompt,
      config,
    });

    result.latencyMs = Math.round(performance.now() - start);
    result.rawResponse = response.text ?? '';
    result.estimatedCostUSD = estimateCost(prompt, result.rawResponse, model);

    // 1. JSON validity
    let parsed: any[];
    try {
      parsed = JSON.parse(result.rawResponse);
      result.jsonValid = Array.isArray(parsed);
    } catch {
      result.jsonValid = false;
      result.error = 'Invalid JSON';
      return result;
    }

    if (!Array.isArray(parsed)) {
      result.error = 'Response is not an array';
      return result;
    }

    result.itemCount = parsed.length;

    // 2. Zod validation
    const zodResult = AIResponseSchema.safeParse(parsed);
    result.zodValid = zodResult.success;
    if (!zodResult.success) {
      result.zodErrors = zodResult.error.issues.map(
        i => `[${i.path.join('.')}] ${i.message}`
      );
    }

    // 3. Category adherence
    const validCats = parsed.filter(i =>
      VALID_CATEGORIES.includes(i.category)
    ).length;
    result.categoryAdherence = parsed.length > 0 ? validCats / parsed.length : 0;

    // 4. Unit normalization
    const normalizedUnits = parsed.filter(i =>
      STANDARD_UNITS.has((i.unit ?? '').toLowerCase())
    ).length;
    result.unitNormalization = parsed.length > 0 ? normalizedUnits / parsed.length : 0;

    // 5. Name accuracy & quantity accuracy vs ground truth
    let nameScoreSum = 0;
    let qtyCorrect = 0;
    let matchCorrect = 0;
    const matchedTruth = new Set<number>();

    for (const truth of testCase.groundTruth) {
      const match = findBestMatch(parsed, truth);
      if (match) {
        nameScoreSum += match.score;

        // Quantity: allow 10% tolerance for compound value interpretation
        const qtyRatio = match.item.quantity / truth.quantity;
        if (qtyRatio >= 0.9 && qtyRatio <= 1.1) {
          qtyCorrect++;
        }

        // Matching: check if items that should match existing supplies do
        const shouldMatch = EXISTING_SUPPLIES.some(
          es => fuzzyMatch(es.name, truth.name) >= 0.6
        );
        const didMatch = match.item.matched_existing === true;
        if (shouldMatch === didMatch) {
          matchCorrect++;
        }
      }
    }

    const truthCount = testCase.groundTruth.length;
    result.nameAccuracy = truthCount > 0 ? nameScoreSum / truthCount : 0;
    result.quantityAccuracy = truthCount > 0 ? qtyCorrect / truthCount : 0;
    result.matchingAccuracy = truthCount > 0 ? matchCorrect / truthCount : 0;

  } catch (err: any) {
    result.error = err.message ?? String(err);
  }

  return result;
}

// ─── Aggregation ───
interface AggregatedScore {
  modelLabel: string;
  avgLatencyMs: number;
  jsonValidRate: number;
  zodValidRate: number;
  avgCategoryAdherence: number;
  avgUnitNormalization: number;
  avgNameAccuracy: number;
  avgQuantityAccuracy: number;
  avgMatchingAccuracy: number;
  avgItemCountDelta: number;  // how close to expected count
  totalEstimatedCost: number;
  compositeScore: number;     // weighted overall
  errorRate: number;
}

function aggregate(results: ModelResult[]): AggregatedScore {
  const n = results.length;
  if (n === 0) {
    return {
      modelLabel: 'N/A', avgLatencyMs: 0, jsonValidRate: 0, zodValidRate: 0,
      avgCategoryAdherence: 0, avgUnitNormalization: 0, avgNameAccuracy: 0,
      avgQuantityAccuracy: 0, avgMatchingAccuracy: 0, avgItemCountDelta: 0,
      totalEstimatedCost: 0, compositeScore: 0, errorRate: 0,
    };
  }

  const sum = (fn: (r: ModelResult) => number) => results.reduce((a, r) => a + fn(r), 0);

  const avgLatencyMs = Math.round(sum(r => r.latencyMs) / n);
  const jsonValidRate = sum(r => r.jsonValid ? 1 : 0) / n;
  const zodValidRate = sum(r => r.zodValid ? 1 : 0) / n;
  const avgCategoryAdherence = sum(r => r.categoryAdherence) / n;
  const avgUnitNormalization = sum(r => r.unitNormalization) / n;
  const avgNameAccuracy = sum(r => r.nameAccuracy) / n;
  const avgQuantityAccuracy = sum(r => r.quantityAccuracy) / n;
  const avgMatchingAccuracy = sum(r => r.matchingAccuracy) / n;
  const avgItemCountDelta = sum(r => Math.abs(r.itemCount - r.expectedCount)) / n;
  const totalEstimatedCost = sum(r => r.estimatedCostUSD);
  const errorRate = sum(r => r.error ? 1 : 0) / n;

  // Composite: weighted average (higher = better)
  const compositeScore =
    (zodValidRate * 0.20) +
    (avgCategoryAdherence * 0.15) +
    (avgUnitNormalization * 0.10) +
    (avgNameAccuracy * 0.20) +
    (avgQuantityAccuracy * 0.20) +
    (avgMatchingAccuracy * 0.15);

  return {
    modelLabel: results[0].modelLabel,
    avgLatencyMs, jsonValidRate, zodValidRate,
    avgCategoryAdherence, avgUnitNormalization,
    avgNameAccuracy, avgQuantityAccuracy, avgMatchingAccuracy,
    avgItemCountDelta, totalEstimatedCost, compositeScore, errorRate,
  };
}

// ─── Report ───
function printReport(allResults: ModelResult[], scores: AggregatedScore[]) {
  console.log('\n' + '═'.repeat(80));
  console.log('  BENCHMARK: Menu Parsing — Gemma 4 vs Gemini Flash 2.5');
  console.log('  Test cases: ' + ALL_TEST_CASES.map(t => t.id).join(', '));
  console.log('  Runs per model per test: ' + NUM_RUNS);
  console.log('═'.repeat(80));

  // Per-test-case breakdown
  for (const tc of ALL_TEST_CASES) {
    console.log(`\n─── Test: ${tc.id} (${tc.description}) ───`);
    console.log(`    Expected items: ${tc.groundTruth.length}`);
    for (const model of MODELS) {
      const runs = allResults.filter(r => r.testCaseId === tc.id && r.modelId === model.id);
      if (runs.length === 0) continue;
      const avg = (fn: (r: ModelResult) => number) =>
        (runs.reduce((a, r) => a + fn(r), 0) / runs.length);

      console.log(`\n    ${model.label}:`);
      console.log(`      Latency:     ${Math.round(avg(r => r.latencyMs))}ms`);
      console.log(`      Items found: ${Math.round(avg(r => r.itemCount))}`);
      console.log(`      JSON valid:  ${runs.every(r => r.jsonValid) ? '✓' : '✗'}`);
      console.log(`      Zod valid:   ${runs.every(r => r.zodValid) ? '✓' : '✗'}`);
      console.log(`      Categories:  ${(avg(r => r.categoryAdherence) * 100).toFixed(1)}%`);
      console.log(`      Units:       ${(avg(r => r.unitNormalization) * 100).toFixed(1)}%`);
      console.log(`      Names:       ${(avg(r => r.nameAccuracy) * 100).toFixed(1)}%`);
      console.log(`      Quantities:  ${(avg(r => r.quantityAccuracy) * 100).toFixed(1)}%`);
      console.log(`      Matching:    ${(avg(r => r.matchingAccuracy) * 100).toFixed(1)}%`);

      // Show Zod errors if any
      const zodErrs = runs.flatMap(r => r.zodErrors);
      if (zodErrs.length > 0) {
        console.log(`      Zod errors:  ${[...new Set(zodErrs)].slice(0, 3).join('; ')}`);
      }
      if (runs.some(r => r.error)) {
        console.log(`      Errors:      ${runs.filter(r => r.error).map(r => r.error).join('; ')}`);
      }
    }
  }

  // Overall comparison
  console.log('\n' + '═'.repeat(80));
  console.log('  OVERALL COMPARISON');
  console.log('═'.repeat(80));

  const header = [
    'Metric'.padEnd(24),
    ...scores.map(s => s.modelLabel.padStart(22)),
  ].join('  ');
  console.log(`\n  ${header}`);
  console.log('  ' + '─'.repeat(header.length));

  const pct = (v: number) => `${(v * 100).toFixed(1)}%`.padStart(22);
  const ms = (v: number) => `${v}ms`.padStart(22);
  const num = (v: number) => v.toFixed(2).padStart(22);
  const usd = (v: number) => `$${v.toFixed(6)}`.padStart(22);

  const rows: [string, (s: AggregatedScore) => string][] = [
    ['Avg Latency', s => ms(s.avgLatencyMs)],
    ['JSON Valid Rate', s => pct(s.jsonValidRate)],
    ['Zod Schema Valid', s => pct(s.zodValidRate)],
    ['Category Adherence', s => pct(s.avgCategoryAdherence)],
    ['Unit Normalization', s => pct(s.avgUnitNormalization)],
    ['Name Accuracy', s => pct(s.avgNameAccuracy)],
    ['Quantity Accuracy', s => pct(s.avgQuantityAccuracy)],
    ['Matching Accuracy', s => pct(s.avgMatchingAccuracy)],
    ['Avg Item Count Δ', s => num(s.avgItemCountDelta)],
    ['Error Rate', s => pct(s.errorRate)],
    ['Est. Cost (total)', s => usd(s.totalEstimatedCost)],
    ['─'.repeat(24), () => '─'.repeat(22)],
    ['COMPOSITE SCORE', s => pct(s.compositeScore)],
  ];

  for (const [label, fn] of rows) {
    const vals = scores.map(fn).join('  ');
    console.log(`  ${label.padEnd(24)}  ${vals}`);
  }

  // Winner
  console.log('\n' + '═'.repeat(80));
  const sorted = [...scores].sort((a, b) => b.compositeScore - a.compositeScore);
  const winner = sorted[0];
  const runnerUp = sorted[1];
  const diff = ((winner.compositeScore - runnerUp.compositeScore) / runnerUp.compositeScore * 100).toFixed(1);

  console.log(`  🏆 WINNER: ${winner.modelLabel} (composite ${(winner.compositeScore * 100).toFixed(1)}%)`);
  console.log(`     +${diff}% over ${runnerUp.modelLabel} (${(runnerUp.compositeScore * 100).toFixed(1)}%)`);

  if (winner.avgLatencyMs > runnerUp.avgLatencyMs * 1.5) {
    console.log(`  ⚠  Note: Winner is ${((winner.avgLatencyMs / runnerUp.avgLatencyMs - 1) * 100).toFixed(0)}% slower`);
  }

  console.log('\n  Composite weights: Zod 20% | Names 20% | Quantities 20% |');
  console.log('                     Categories 15% | Matching 15% | Units 10%');
  console.log('═'.repeat(80) + '\n');
}

// ─── Main ───
async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ Set GEMINI_API_KEY environment variable');
    process.exit(1);
  }

  const client = new GoogleGenAI({ apiKey });
  const allResults: ModelResult[] = [];

  console.log(`\n🔬 Starting benchmark: ${MODELS.length} models × ${ALL_TEST_CASES.length} tests × ${NUM_RUNS} runs = ${MODELS.length * ALL_TEST_CASES.length * NUM_RUNS} total calls\n`);

  for (const model of MODELS) {
    for (const testCase of ALL_TEST_CASES) {
      for (let run = 0; run < NUM_RUNS; run++) {
        const label = `[${model.label}] ${testCase.id} run ${run + 1}/${NUM_RUNS}`;
        process.stdout.write(`  ⏳ ${label}...`);

        const result = await runSingleBenchmark(client, model, testCase, run);
        allResults.push(result);

        if (result.error) {
          console.log(` ❌ (${result.error})`);
        } else {
          console.log(` ✓ ${result.latencyMs}ms, ${result.itemCount} items, zod:${result.zodValid ? '✓' : '✗'}`);
        }

        // Small delay to avoid rate limits
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }

  // Aggregate per model
  const scores = MODELS.map(m => {
    const modelResults = allResults.filter(r => r.modelId === m.id);
    const agg = aggregate(modelResults);
    agg.modelLabel = m.label;
    return agg;
  });

  printReport(allResults, scores);

  // Save raw results
  const path = await import('path');
  const outputPath = path.join(__dirname, 'results.json');
  const fs = await import('fs');
  fs.writeFileSync(outputPath, JSON.stringify({ timestamp: new Date().toISOString(), config: { models: MODELS, runs: NUM_RUNS }, results: allResults, scores }, null, 2));
  console.log(`📄 Raw results saved to ${outputPath}\n`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

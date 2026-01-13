/**
 * Health Check Endpoint for Cloud Run
 * 
 * This endpoint is used by Cloud Run to verify the service is healthy.
 * It performs basic checks to ensure the application is functioning.
 */

import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface HealthCheckResponse {
     status: 'healthy' | 'degraded' | 'unhealthy'
     timestamp: string
     version: string
     uptime: number
     checks: {
          name: string
          status: 'pass' | 'fail'
          message?: string
     }[]
}

const startTime = Date.now()

export async function GET() {
     const checks: HealthCheckResponse['checks'] = []

     // Check 1: Application is running
     checks.push({
          name: 'app',
          status: 'pass',
          message: 'Application is running'
     })

     // Check 2: Environment variables are set
     const requiredEnvVars = [
          'NEXT_PUBLIC_SUPABASE_URL',
          'NEXT_PUBLIC_SUPABASE_ANON_KEY'
     ]

     const missingEnvVars = requiredEnvVars.filter(
          varName => !process.env[varName]
     )

     if (missingEnvVars.length === 0) {
          checks.push({
               name: 'environment',
               status: 'pass',
               message: 'All required environment variables are set'
          })
     } else {
          checks.push({
               name: 'environment',
               status: 'fail',
               message: `Missing environment variables: ${missingEnvVars.join(', ')}`
          })
     }

     // Check 3: Supabase connectivity (optional, lightweight check)
     try {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
          if (supabaseUrl) {
               const response = await fetch(`${supabaseUrl}/rest/v1/`, {
                    method: 'HEAD',
                    headers: {
                         'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
                    },
                    signal: AbortSignal.timeout(2000) // 2 second timeout
               })

               checks.push({
                    name: 'supabase',
                    status: response.ok ? 'pass' : 'fail',
                    message: response.ok ? 'Supabase is reachable' : `Supabase returned ${response.status}`
               })
          }
     } catch {
          checks.push({
               name: 'supabase',
               status: 'fail',
               message: 'Could not reach Supabase'
          })
     }

     // Determine overall status
     const failedChecks = checks.filter(c => c.status === 'fail')
     let overallStatus: HealthCheckResponse['status'] = 'healthy'

     if (failedChecks.length > 0) {
          // If only optional checks fail, mark as degraded
          const criticalFails = failedChecks.filter(c =>
               c.name === 'app' || c.name === 'environment'
          )
          overallStatus = criticalFails.length > 0 ? 'unhealthy' : 'degraded'
     }

     const response: HealthCheckResponse = {
          status: overallStatus,
          timestamp: new Date().toISOString(),
          version: process.env.npm_package_version || '0.1.0',
          uptime: Math.floor((Date.now() - startTime) / 1000),
          checks
     }

     // Return appropriate status code
     const statusCode = overallStatus === 'unhealthy' ? 503 : 200

     return NextResponse.json(response, {
          status: statusCode,
          headers: {
               'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
     })
}

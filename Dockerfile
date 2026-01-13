# ============================================
# BARMODE - Production Dockerfile for Google Cloud Run
# ============================================
# Optimized for minimal image size and fast cold starts

# Build arguments for environment variables (needed at build time)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_APP_URL
ARG STRIPE_SECRET_KEY
ARG GEMINI_API_KEY
ARG NEXT_PUBLIC_STRIPE_BAR_MONTHLY_PRICE_ID
ARG NEXT_PUBLIC_STRIPE_BAR_YEARLY_PRICE_ID
ARG NEXT_PUBLIC_STRIPE_CHAIN_PRICE_ID

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Re-declare build args for this stage
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_APP_URL
ARG STRIPE_SECRET_KEY
ARG GEMINI_API_KEY
ARG NEXT_PUBLIC_STRIPE_BAR_MONTHLY_PRICE_ID
ARG NEXT_PUBLIC_STRIPE_BAR_YEARLY_PRICE_ID
ARG NEXT_PUBLIC_STRIPE_CHAIN_PRICE_ID

RUN npm install -g pnpm

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Pass build args as environment variables for Next.js build
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY
ENV GEMINI_API_KEY=$GEMINI_API_KEY
ENV NEXT_PUBLIC_STRIPE_BAR_MONTHLY_PRICE_ID=$NEXT_PUBLIC_STRIPE_BAR_MONTHLY_PRICE_ID
ENV NEXT_PUBLIC_STRIPE_BAR_YEARLY_PRICE_ID=$NEXT_PUBLIC_STRIPE_BAR_YEARLY_PRICE_ID
ENV NEXT_PUBLIC_STRIPE_CHAIN_PRICE_ID=$NEXT_PUBLIC_STRIPE_CHAIN_PRICE_ID

# Build the application
RUN pnpm build

# Stage 3: Runner (Production)
FROM node:20-alpine AS runner
WORKDIR /app

# Add labels for container metadata
LABEL org.opencontainers.image.title="Barmode"
LABEL org.opencontainers.image.description="Inventory and POS system for bars"
LABEL org.opencontainers.image.vendor="Barmode"
LABEL org.opencontainers.image.source="https://github.com/gibrann/barmode"

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set correct permissions
USER nextjs

# Expose port (Cloud Run uses PORT env variable)
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
     CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start the application
CMD ["node", "server.js"]

# Multi-stage build for production
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files AND prisma schema
COPY package.json yarn.lock* ./
COPY prisma ./prisma

# Install dependencies (this will run "prisma generate" via postinstall)
RUN yarn install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy all project files (Railway context is already in nextjs_space/)
COPY . .

# CRITICAL: Generate Prisma Client AGAIN after copying all files
# This ensures the client is in the correct location for Next.js build
RUN yarn prisma generate

# Build the application with increased memory
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV NEXT_TELEMETRY_DISABLED=1
RUN yarn build

# DEBUG: List the standalone output structure to understand where server.js is
RUN echo "=== Listing .next/standalone structure ===" && \
    ls -la .next/standalone/ || echo "standalone directory not found" && \
    echo "=== Checking for server.js ===" && \
    find .next/standalone -name "server.js" -type f 2>/dev/null || echo "server.js not found in standalone" && \
    echo "=== End debug ==="

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# ALTERNATIVE APPROACH: Copy everything needed for 'yarn start' instead of standalone
# This bypasses the server.js issue entirely

# Copy the entire built application
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/yarn.lock ./yarn.lock
COPY --from=builder /app/prisma ./prisma

# Copy next.config.js (needed for next start)
COPY --from=builder /app/next.config.js ./next.config.js

RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Use 'yarn start' instead of 'node server.js'
# This runs 'next start' which doesn't require standalone mode
CMD ["yarn", "start"]

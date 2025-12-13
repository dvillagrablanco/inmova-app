# 1. Imagen Base (Node 20 OBLIGATORIO)
FROM node:20-alpine AS base

# 2. Etapa de Dependencias
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json yarn.lock* ./

# Instalamos dependencias ignorando conflictos de versiones
RUN yarn install --frozen-lockfile --ignore-engines

# 3. Etapa de Construcción (Builder)
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generamos Prisma Client aquí
RUN npx prisma generate

# Desactivamos telemetría y linting para asegurar el build
ENV NEXT_TELEMETRY_DISABLED 1
RUN yarn build

# 4. Etapa de Ejecución (Runner)
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiamos solo lo necesario (Standalone)
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]

# Tahap 1: Instalasi dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Tahap 2: Build aplikasi
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Set env statis saat build jika diperlukan
ENV NEXT_TELEMETRY_DISABLED 1
# Disable lint dan typecheck saat docker build agar tidak crash karena strictness Next.js
ENV NEXT_PUBLIC_API_URL http://localhost:8000/api
RUN npm run build

# Tahap 3: Server production
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
# Copy next config dan output standalone jika dikonfigurasi, jika tidak gunakan node_modules bawaan
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["npm", "start"]

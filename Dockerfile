FROM node:22-alpine AS deps

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

FROM node:22-alpine AS runner

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodeapp

COPY --from=deps /app/node_modules ./node_modules

COPY --chown=nodeapp:nodejs . .

RUN mkdir -p uploads && chown -R nodeapp:nodejs uploads

USER nodeapp

ENV NODE_ENV=production

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "src/index.js"]

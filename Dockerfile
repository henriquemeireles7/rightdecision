FROM oven/bun:1 AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

FROM base AS build
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run scripts/build-search-index.ts && bun run scripts/build-timestamps.ts && bun run scripts/build-github-stars.ts || true
RUN bun run build

FROM base AS runtime
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public
COPY --from=build /app/content ./content
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/tsconfig.json ./tsconfig.json
COPY --from=build /app/platform/scripts/migrate.ts ./platform/scripts/migrate.ts
COPY --from=build /app/platform/db ./platform/db
COPY --from=build /app/platform/env.ts ./platform/env.ts
RUN chown -R bun:bun /app
USER bun
EXPOSE 3000
CMD ["bun", "run", "dist/app.js"]

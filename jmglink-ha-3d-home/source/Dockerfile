FROM node:22-alpine@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32 AS build

WORKDIR /app

ENV NODE_ENV=development

COPY package.json package-lock.json ./
COPY apps/server/package.json apps/server/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/schema/package.json packages/schema/package.json

RUN npm ci --include=optional

COPY apps ./apps
COPY packages ./packages
COPY tests ./tests

RUN npm test && npm run build && npm prune --omit=dev

FROM node:22-alpine@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32 AS runtime

WORKDIR /app

ENV NODE_ENV=production \
    NODE_OPTIONS=--max-old-space-size=384 \
    HA3D_MODE=standalone \
    PORT=8099 \
    HA3D_DATA_DIR=/data \
    HA3D_ASSET_DIR=/assets \
    HA3D_BUILD_VERSION=reconstructed-source \
    HA3D_RESOURCE_LOG_INTERVAL_MINUTES=5

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/server ./apps/server
COPY --from=build /app/apps/web/dist ./apps/web/dist
COPY --from=build /app/packages/schema ./packages/schema

EXPOSE 8099

CMD ["node", "apps/server/src/main.js"]

ARG BUILD_FROM=node:22-alpine@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32

FROM ${BUILD_FROM} AS build

WORKDIR /
RUN rm -rf /app && mkdir -p /app
WORKDIR /app

ENV NODE_ENV=development
ARG HA3D_RELEASE_BUILD=1
ENV HA3D_RELEASE_BUILD=${HA3D_RELEASE_BUILD}

COPY source/package.json source/package-lock.json ./
COPY source/apps/server/package.json apps/server/package.json
COPY source/apps/web/package.json apps/web/package.json
COPY source/packages/schema/package.json packages/schema/package.json

RUN npm ci

COPY source/apps ./apps
COPY source/packages ./packages
COPY source/tests ./tests
COPY source/scripts ./scripts

RUN test "$HA3D_RELEASE_BUILD" = "1" && npm test && npm run build && node scripts/package-release.mjs && npm prune --omit=dev

# Runtime must never inherit the CI image's old application layers.
FROM node:22-alpine@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32 AS runtime

WORKDIR /
RUN rm -rf /app && mkdir -p /app

ARG BUILD_VERSION=0.1.5-custom.33
ARG BUILD_ARCH

LABEL \
    io.hass.version="${BUILD_VERSION}" \
    io.hass.type="addon" \
    io.hass.arch="${BUILD_ARCH}"

WORKDIR /app

ENV NODE_ENV=production \
    HA3D_MODE=addon \
    PORT=8099 \
    HA3D_DATA_DIR=/data \
    HA3D_ASSET_DIR=/config/assets \
    HA3D_BUILD_VERSION="${BUILD_VERSION}"

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.release/apps/server ./apps/server
COPY --from=build /app/.release/apps/web/dist ./apps/web/dist
COPY --from=build /app/.release/packages/schema ./packages/schema
COPY --from=build /app/.release/release-manifest.json ./release-manifest.json
COPY addon-entry.js addon-runtime-options.mjs addon-run.sh ./
RUN chmod +x /app/addon-run.sh

EXPOSE 8099

CMD ["/app/addon-run.sh"]

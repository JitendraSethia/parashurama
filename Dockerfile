# PARASHURAMA unit server: builds the web app + server, runs them as one small container.
FROM node:22-alpine AS build
WORKDIR /src
COPY package.json package-lock.json ./
COPY packages/engine/package.json packages/engine/
COPY apps/web/package.json apps/web/
COPY apps/server/package.json apps/server/
RUN npm ci
COPY . .
RUN npm run check:generated && npm run build

FROM node:22-alpine
ENV NODE_ENV=production DATA_DIR=/data WEB_DIR=/app/web PORT=8080
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/engine/package.json packages/engine/
COPY apps/web/package.json apps/web/
COPY apps/server/package.json apps/server/
RUN npm ci --omit=dev --workspace @parashurama/server --include-workspace-root=false && npm cache clean --force
COPY --from=build /src/apps/server/dist ./server
COPY --from=build /src/apps/web/dist ./web
RUN addgroup -S para && adduser -S para -G para && mkdir -p /data && chown para:para /data
USER para
VOLUME ["/data"]
EXPOSE 8080 8443
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:${PORT}/api/health || wget -qO- --no-check-certificate https://127.0.0.1:${PORT}/api/health || exit 1
CMD ["node", "--disable-warning=ExperimentalWarning", "server/server.mjs"]

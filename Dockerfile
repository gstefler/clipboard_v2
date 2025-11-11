FROM oven/bun:1 AS base
WORKDIR /usr/src/app

# Client Build Stage - install dependencies
FROM base AS client-installer
RUN mkdir -p /temp/client/prod
COPY client/package.json client/bun.lock /temp/client/prod/
RUN cd /temp/client/prod && bun install --frozen-lockfile

# Client Build Stage - build production assets to /temp/client/dist
FROM base AS client-builder
COPY --from=client-installer /temp/client/prod/node_modules /temp/client/node_modules
COPY client /temp/client
RUN cd /temp/client && bun run build

# Server Install Stage - install production dependencies
FROM base AS server-installer
RUN mkdir -p /temp/server/prod
COPY server/package.json server/bun.lock /temp/server/prod/
RUN cd /temp/server/prod && bun install --frozen-lockfile --production

FROM base AS prerelease
COPY --from=server-installer /temp/server/prod/node_modules node_modules
COPY server .
RUN mkdir -p public
COPY --from=client-builder /temp/client/dist ./public

FROM base AS release
COPY --from=server-installer /temp/server/prod/node_modules node_modules
COPY --from=prerelease /usr/src/app/index.ts .
COPY --from=prerelease /usr/src/app/package.json .
COPY --from=prerelease /usr/src/app/src ./src
COPY --from=prerelease /usr/src/app/public ./public

USER bun
EXPOSE 5555/tcp
CMD ["bun", "run", "index.ts"]
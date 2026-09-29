# syntax=docker/dockerfile:1

# ---------- Stage 1: build ----------
FROM node:22-bookworm-slim AS builder

WORKDIR /usr/src/app

# Solo package.json/lock: la capa de dependencias se cachea mientras no cambien
COPY package.json package-lock.json ./

# `npm ci` exige package-lock.json versionado (ver .gitignore)
RUN npm ci

COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src

RUN npm run build


# ---------- Stage 2: runtime ----------
FROM node:22-bookworm-slim AS runner

ENV NODE_ENV=production \
    PORT=3000

WORKDIR /usr/src/app

COPY package.json package-lock.json ./

# Solo dependencias de runtime (bcrypt trae prebuild N-API, no compila)
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /usr/src/app/dist ./dist
COPY db ./db

# El usuario `node` ya existe en la imagen oficial
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||3000)+'/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "dist/main.js"]

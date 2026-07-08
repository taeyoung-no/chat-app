FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/

RUN npm install --workspace=server

COPY shared ./shared
COPY server ./server

RUN npm run build --workspace=shared
RUN npm run build --workspace=server

FROM node:20-alpine AS production

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/shared/package.json ./shared/
COPY --from=builder /app/server/package.json ./server/

RUN npm install --workspace=server --omit=dev

COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/server/dist ./server/dist

WORKDIR /app/server

EXPOSE 3000
CMD ["node", "dist/index.js"]

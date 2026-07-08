FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/

RUN npm install --workspace=server

COPY shared ./shared
COPY server ./server

WORKDIR /app/server

EXPOSE 3000
CMD ["npx", "tsx", "index.ts"]

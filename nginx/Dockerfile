FROM node:20-alpine AS client-builder

WORKDIR /app

COPY package*.json ./
COPY shared/package.json ./shared/
COPY client/package.json ./client/

RUN npm install --workspace=client

COPY shared ./shared
COPY client ./client

ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build --workspace=shared
RUN npm run build --workspace=client

FROM nginx:alpine

COPY --from=client-builder /app/client/dist /usr/share/nginx/html
COPY nginx/nginx.prod.conf /etc/nginx/conf.d/default.conf

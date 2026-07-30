FROM node:20-alpine AS client-builder

WORKDIR /app

COPY package*.json ./
COPY shared/package.json ./shared/
COPY client/package.json ./client/

RUN npm install --workspace=client

COPY shared ./shared
COPY client ./client

RUN npm run build --workspace=shared
RUN npm run build --workspace=client

FROM nginx:alpine

COPY nginx/nginx-main.conf /etc/nginx/nginx.conf
COPY --from=client-builder /app/client/dist /usr/share/nginx/html
COPY nginx/nginx.prod.conf /etc/nginx/conf.d/default.conf

RUN chown -R nginx:nginx /usr/share/nginx/html \
    && chown -R nginx:nginx /var/cache/nginx \
    && chown -R nginx:nginx /var/log/nginx \
    && touch /tmp/nginx.pid \
    && chown nginx:nginx /tmp/nginx.pid
USER nginx

EXPOSE 8443

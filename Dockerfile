# Stage 1: Build
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

# Stage 2: Production
FROM node:18-alpine AS production

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY --from=build /app/server.js ./server.js
COPY --from=build /app/hiitboard.js ./hiitboard.js
COPY --from=build /app/client ./client
COPY --from=build /app/migrations-sqlite ./migrations-sqlite

EXPOSE 8080

CMD ["node", "server.js"]

FROM node:26-slim AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

FROM node:26-slim AS runner

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules

COPY . .

EXPOSE 4001

CMD ["npm", "start"]
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .


RUN echo "Длина Client ID при сборке:" ${#NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID}

RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app
RUN apk add --no-cache wget
ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]

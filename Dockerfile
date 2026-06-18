FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install backend dependencies (uses backend/ as the source of the app)
COPY backend/package.json backend/package-lock.json ./
COPY backend/prisma ./prisma/

RUN npm ci

# Copy the rest of the backend source
COPY backend/ ./

RUN npm run build

ENV NODE_ENV=production

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]

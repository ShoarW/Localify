# Build stage for client
FROM node:20-slim AS client-builder
WORKDIR /app/client
COPY localify-client/package*.json ./
RUN npm install
COPY localify-client/ .
RUN npm run build

# Build stage for server
FROM node:20-slim AS server-builder
WORKDIR /app/server
COPY localify-server/package*.json ./
RUN npm install
COPY localify-server/ .
# Install TypeScript globally for the build
RUN npm install -g typescript@5.7.2
# Compile TypeScript
RUN tsc --outDir ./dist

# Production stage
FROM node:20-slim
WORKDIR /app
COPY --from=server-builder /app/server/package*.json ./
COPY --from=server-builder /app/server/dist ./dist
COPY --from=server-builder /app/server/node_modules ./node_modules
COPY --from=client-builder /app/client/dist ./static

# Create directories for data and storage
RUN mkdir -p /app/data/storage /app/data/media && chown -R node:node /app/data

# Switch to non-root user
USER node

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/index.js"] 
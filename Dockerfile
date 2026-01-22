# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Dependencies installieren (all dependencies needed for build)
COPY package*.json ./
RUN npm install

# Source code kopieren
COPY . .

# Production build
RUN npm run build

# Production Stage
FROM nginx:alpine AS production

# Custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Build artifacts von builder stage kopieren
COPY --from=builder /app/dist /usr/share/nginx/html

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
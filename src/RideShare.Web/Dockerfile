# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Cache bust arg - change to force fresh build
ARG CACHE_BUST=2

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build for production
RUN npm run build -- --configuration=production

# Production stage with nginx
FROM nginx:alpine AS final

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built app from build stage
COPY --from=build /app/dist/ride-share.web/browser /usr/share/nginx/html

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

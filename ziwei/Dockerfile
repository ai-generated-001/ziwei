# Stage 1: Build the Vue application
FROM node:20-alpine AS build
WORKDIR /app

# Install pnpm package manager
RUN npm install -g pnpm

# Copy package descriptors
COPY package.json pnpm-lock.yaml* ./

# Install project dependencies
RUN pnpm install --frozen-lockfile

# Copy application files
COPY . .

# Run production build compilation
RUN pnpm run build

# Stage 2: Serve using Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

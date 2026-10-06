FROM node:20-alpine

WORKDIR /app

# Install dependencies first for better caching
COPY package.json package-lock.json* ./
RUN npm install

# Copy application source code
COPY . .

# Expose Next.js default port
EXPOSE 3000

ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Start Next.js in development mode with hot-reloading
CMD ["npm", "run", "dev"]

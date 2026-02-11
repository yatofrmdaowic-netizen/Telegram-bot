# Use lightweight Node image
FROM node:20-alpine

# Install system dependencies
RUN apk add --no-cache ffmpeg

# Create app directory
WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./

# Install dependencies (production only)
RUN npm install --omit=dev

# Copy all project files
COPY . .

# Expose (optional for webhook mode)
EXPOSE 3000

# Start bot
CMD ["node", "index.js"]

# Use Node LTS
FROM node:24-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install deps
RUN npm install --production

# Copy source
COPY src ./src
COPY .env ./

# Expose port
EXPOSE 4000

# Start server
CMD ["node", "src/server.js"]

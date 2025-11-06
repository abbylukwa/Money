FROM node:20-alpine

# Install system dependencies
RUN apk update && apk add --no-cache \
    ffmpeg \
    imagemagick \
    libwebp-tools \
    python3 \
    make \
    g++ \
    git \
    curl \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Clone the repository
RUN git clone https://github.com/abbylukwa/Money.git .

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies with legacy peer deps to resolve conflicts
RUN npm install --legacy-peer-deps

# Create necessary directories
RUN mkdir -p sessions assets lib/temp/session

EXPOSE 3000

# Set environment variables
ENV BOT_NUMBER=263777627210
ENV PORT=3000

CMD ["npm", "start"]

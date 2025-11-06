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

# Copy the corrected files
COPY config.js ./config.js
COPY client.js ./client.js
COPY index.js ./index.js
COPY print.js ./print.js
COPY handler.js ./handler.js

# Install dependencies
RUN npm install --legacy-peer-deps

# Create necessary directories
RUN mkdir -p sessions assets

EXPOSE 3000

# Set environment variables
ENV BOT_NUMBER=263777627210
ENV PORT=3000

CMD ["npm", "start"]

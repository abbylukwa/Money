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
RUN git clone https://github.com/abbylukwa/Money.git . && \
    git config --global url."https://github.com/".insteadOf ssh://git@github.com/

COPY package*.json ./

# Install dependencies
RUN npm install

# Create necessary directories
RUN mkdir -p sessions assets lib/temp/session

# Copy your custom files (if any additional files need to be added)
COPY . .

EXPOSE 3000

# Set environment variables
ENV BOT_NUMBER=263777627210
ENV PORT=3000

CMD ["npm", "start"]

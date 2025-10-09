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
    && rm -rf /var/cache/apk/*

WORKDIR /app

COPY package*.json ./

# Configure Git and install dependencies
RUN git config --global url."https://github.com/".insteadOf ssh://git@github.com/ && \
    npm install

COPY . .

RUN mkdir -p lib/temp/session

EXPOSE 8080

CMD ["npm", "start"]
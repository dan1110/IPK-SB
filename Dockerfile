FROM node:20-alpine AS base

# Install ffmpeg and build dependencies for sqlite3 natively
RUN apk add --no-cache ffmpeg python3 make g++ 

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]

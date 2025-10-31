# Use Node LTS on Alpine
FROM node:20-alpine

# Install build tools for native deps (safe even if you don't need them)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy only manifests first for better caching
# The * allows the line to succeed even if package-lock.json doesn't exist
COPY package.json package-lock.json* ./

# If package-lock.json exists -> npm ci; otherwise fallback to npm install
# --omit=dev keeps the final image small
RUN if [ -f package-lock.json ]; then \
      npm ci --omit=dev; \
    else \
      npm install --omit=dev; \
    fi

# Now copy the rest of the source
COPY . .

# (optional) If you build client assets, do it here:
# RUN npm run build

ENV PORT=5000
EXPOSE 5000

CMD ["npm", "start"]

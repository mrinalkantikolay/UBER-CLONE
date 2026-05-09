# Use Node.js 20 Alpine as the base image
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
# Install build dependencies and copy package files
COPY package*.json ./

# Install build tools needed for native modules (Prisma / bcrypt)
RUN apk add --no-cache python3 make g++ libc6-compat

# Install dependencies (including dev)
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine


# Copy package files
COPY package*.json ./

# Install only production dependencies
WORKDIR /app

# Ensure bash and compat libs are available in the runtime image
RUN apk add --no-cache bash libc6-compat \
	&& npm install --omit=dev

# Copy compiled code, prisma runtime, and schema from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

# Copy wait-entrypoint script
COPY docker/wait-for-services.sh ./docker/wait-for-services.sh
RUN chmod +x ./docker/wait-for-services.sh

# Expose port
EXPOSE 8000

# Wait for dependent services then start
ENTRYPOINT ["./docker/wait-for-services.sh"]
CMD ["node", "dist/server.js"]

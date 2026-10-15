FROM node:20-slim

WORKDIR /workspace

# Create non-root user (node is already UID 1000 in node:20-slim)
USER node

COPY --chown=node:node package*.json ./
RUN npm install

EXPOSE 8000

CMD ["npx", "nodemon", "--watch", "src", "src/index.js"]

FROM node:20-slim

WORKDIR /workspace

USER node

COPY --chown=node:node package*.json tsconfig*.json ./
RUN npm install

EXPOSE 8000

CMD ["npx", "nest", "start", "--watch"]

FROM node:20-slim

RUN id -u 1000 >/dev/null 2>&1 || useradd -m -u 1000 sandbox
RUN npm install -g nodemon tsx

WORKDIR /workspace
RUN chown -R 1000:1000 /workspace
USER 1000:1000

EXPOSE 8000
CMD ["npx", "nodemon", "--watch", ".", "--exec", "node index.js"]

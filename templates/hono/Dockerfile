FROM oven/bun:1.1

WORKDIR /workspace

# Create non-root user
USER bun

COPY --chown=bun:bun package*.json ./
RUN bun install

EXPOSE 8000

CMD ["bun", "--watch", "src/index.ts"]

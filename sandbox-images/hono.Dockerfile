FROM oven/bun:1.1

RUN useradd -m -u 1000 sandbox || true

WORKDIR /workspace
RUN chown -R 1000:1000 /workspace || true
USER 1000

EXPOSE 8000
CMD ["bun", "run", "--hot", "src/index.ts"]

FROM rust:1.77-slim as builder
WORKDIR /app
COPY . .
RUN cargo build --release

FROM debian:bookworm-slim
WORKDIR /app
COPY --from=builder /app/target/release/axum-starter ./server
ENV PORT=8000
EXPOSE 8000
CMD ["./server"]

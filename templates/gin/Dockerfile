FROM golang:1.22-alpine
WORKDIR /app
COPY . .
RUN go build -o server main.go
ENV PORT=8000
EXPOSE 8000
CMD ["./server"]

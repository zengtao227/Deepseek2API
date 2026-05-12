FROM golang:1.21-alpine AS builder

WORKDIR /build
COPY . .
RUN go mod download && go build -o Deepseek2API ./cmd/Deepseek2API

FROM alpine:latest
RUN apk add --no-cache ca-certificates tzdata
WORKDIR /app
COPY --from=builder /build/Deepseek2API .

EXPOSE 5001
ENTRYPOINT ["./Deepseek2API"]

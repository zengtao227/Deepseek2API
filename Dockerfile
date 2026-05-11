FROM golang:1.21-alpine AS builder

WORKDIR /build
COPY . .
RUN go mod download && go build -o ds2api ./cmd/ds2api

FROM alpine:latest
RUN apk add --no-cache ca-certificates tzdata
WORKDIR /app
COPY --from=builder /build/ds2api .

EXPOSE 5001
ENTRYPOINT ["./ds2api"]

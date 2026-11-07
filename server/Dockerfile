FROM golang:1.24-alpine AS build
WORKDIR /src
COPY go.mod main.go ./
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o /portfolio-ask .

FROM alpine:3.21
RUN adduser -D -u 10001 ask && apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=build /portfolio-ask /app/portfolio-ask
COPY facts.en.md examples.en.md /app/
USER ask
EXPOSE 8090
ENTRYPOINT ["/app/portfolio-ask"]

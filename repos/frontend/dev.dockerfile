FROM docker.io/oven/bun

COPY . /app
WORKDIR /app

RUN bun install --force

CMD ["sh", "-c", "bun install && bun run dev"]
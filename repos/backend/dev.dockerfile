FROM docker.io/debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    curl \
    unzip \
    procps

RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

COPY . /app
WORKDIR /app

RUN bun install --force

CMD ["sh", "-c", "bun install && bun run start:dev"]
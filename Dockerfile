FROM node:20-bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends chromium chromium-driver curl procps \
    && rm -rf /var/lib/apt/lists/*

ENV CHROME_BIN=/usr/bin/chromium \
    CHROMEDRIVER_PATH=/usr/bin/chromedriver

WORKDIR /app

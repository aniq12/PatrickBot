# Container image for Railway (or any Docker host).
# Mount a persistent volume at /app/sessions, or WhatsApp logs out on every redeploy.
FROM node:22-trixie-slim

# ImageMagick 7 comes from Debian. ffmpeg comes as a static 8.x build (Debian 13 ships 7.1, which can't
# decode animated stickers), and yt-dlp as its standalone binary (it uses node as its JS runtime).
RUN apt-get update \
 && apt-get install -y --no-install-recommends imagemagick ca-certificates curl xz-utils \
 && curl -fsSL https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux64-gpl.tar.xz \
    | tar -xJ --strip-components=2 -C /usr/local/bin --wildcards '*/bin/ffmpeg' '*/bin/ffprobe' \
 && curl -fsSL -o /usr/local/bin/yt-dlp https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux \
 && chmod +x /usr/local/bin/yt-dlp \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY . .

# Settings come from the host's environment variables (see .env.example).
# YTDLP_COOKIES, if set, is written to cookies.txt for Instagram downloads.
CMD ["sh", "-c", "[ -n \"$YTDLP_COOKIES\" ] && printf '%s\\n' \"$YTDLP_COOKIES\" > cookies.txt; exec node main.js --mongo"]

#!/bin/sh
# Auto-update: pull new commits from GitHub and restart the bot, only when something changed.
# Run it from cron on the server, e.g. every 5 minutes:
#   */5 * * * * sh /root/PatrickBot/deploy.sh >> /root/patrickbot-deploy.log 2>&1
# .env, sessions/ and the database are git-ignored, so updates never touch them.
# Don't edit tracked files on the server: local changes make the update stop instead of overwriting them.

APP=patrickbot   # pm2 process name
BRANCH=main

cd "$(dirname "$0")" || exit 1
git fetch -q origin "$BRANCH" || { echo "$(date) fetch failed"; exit 1; }
[ "$(git rev-parse HEAD)" = "$(git rev-parse "origin/$BRANCH")" ] && exit 0

old_lock=$(git rev-parse HEAD:package-lock.json)
git merge -q --ff-only "origin/$BRANCH" || { echo "$(date) update blocked by local changes (git status)"; exit 1; }
[ "$old_lock" != "$(git rev-parse HEAD:package-lock.json)" ] && npm ci --omit=dev
pm2 restart "$APP" --update-env
echo "$(date) updated to $(git log -1 --format='%h %s')"

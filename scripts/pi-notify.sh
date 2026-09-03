#!/usr/bin/env bash
# One place every Pi job reports a problem to.
#
#   pi-notify.sh <level> <subject> [body]
#
# Always appends to ~/esb-ingest/logs/alerts.log. If ~/esb-ingest/notify.env
# defines TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID it also sends a Telegram
# message — the one channel that costs nothing, needs no server, and reaches a
# phone during a power cut. Without it, a failure is a line in a file nobody is
# looking at, which is how the archive sat three days behind in August without
# anyone noticing.
set -u
LEVEL="${1:-info}"; SUBJECT="${2:-}"; BODY="${3:-}"
ROOT="$HOME/esb-ingest"
mkdir -p "$ROOT/logs"
STAMP="$(date -Is)"
printf '%s %s %s%s\n' "$STAMP" "$LEVEL" "$SUBJECT" "${BODY:+ — $BODY}" >> "$ROOT/logs/alerts.log"

[[ -f "$ROOT/notify.env" ]] && . "$ROOT/notify.env"
if [[ -n "${TELEGRAM_BOT_TOKEN:-}" && -n "${TELEGRAM_CHAT_ID:-}" ]]; then
    ICON="ℹ️"; [[ "$LEVEL" == "warn" ]] && ICON="⚠️"; [[ "$LEVEL" == "error" ]] && ICON="🛑"
    TEXT="$ICON ESB Pi · $SUBJECT"
    [[ -n "$BODY" ]] && TEXT="$TEXT"$'\n'"$BODY"
    curl -s -m 15 -o /dev/null \
        --data-urlencode "chat_id=$TELEGRAM_CHAT_ID" \
        --data-urlencode "text=$TEXT" \
        "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" || true
fi

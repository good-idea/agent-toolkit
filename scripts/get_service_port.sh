#!/usr/bin/env bash
set -euo pipefail

# Returns the port for a named service by reading .env files.
# Customize the case statement below to match your project's services.

SERVICE="${1:-}"

if [[ -z "$SERVICE" ]]; then
  echo "Usage: scripts/get_service_port.sh <service>" >&2
  echo "Available services: dev" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Load per-package .env files. Add more as your project grows.
for ENV_FILE in "${REPO_ROOT}/web/.env" "web/.env"; do
  if [[ -f "$ENV_FILE" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "$ENV_FILE"
    set +a
  fi
done

# Add your services and default ports here
case "$SERVICE" in
  dev)
    echo "${PORT:-3000}"
    ;;
  *)
    echo "Unknown service: $SERVICE" >&2
    echo "Add service names and ports to the case statement in this script." >&2
    exit 1
    ;;
esac

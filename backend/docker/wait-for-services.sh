#!/usr/bin/env bash
set -e

host_check() {
  host=$1
  port=$2
  timeout=${3:-60}
  echo "Waiting for $host:$port (timeout ${timeout}s)"
  SECONDS=0
  while ! bash -c "</dev/tcp/$host/$port" >/dev/null 2>&1; do
    if [ "$SECONDS" -ge "$timeout" ]; then
      echo "Timed out waiting for $host:$port"
      exit 1
    fi
    sleep 2
  done
  echo "$host:$port is available"
}

# Wait for commonly used services
host_check "postgres" 5432 60
host_check "redis" 6379 60
host_check "kafka" 29092 60

# Exec the passed command
exec "$@"

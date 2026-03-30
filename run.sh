#!/bin/bash

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
MAP_PATH="$ROOT_DIR/backend/map.ascii"
BOOKINGS_PATH="$ROOT_DIR/backend/bookings.json"

while [[ "$#" -gt 0 ]]; do
  case $1 in
    --map) MAP_PATH="$2"; shift ;;
    --bookings) BOOKINGS_PATH="$2"; shift ;;
    *) echo "Unknown argument: $1"; exit 1 ;;
  esac
  shift
done

echo "Starting backend..."
npm run dev --prefix backend -- --map="$MAP_PATH" --bookings="$BOOKINGS_PATH" &

echo "Starting frontend..."
npm run dev --prefix frontend

wait

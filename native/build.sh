#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Building HapticEngine..."

swiftc \
    -O \
    -framework IOKit \
    -framework CoreFoundation \
    -o HapticEngine \
    HapticEngine.swift

chmod +x HapticEngine

echo "Build complete: $SCRIPT_DIR/HapticEngine"

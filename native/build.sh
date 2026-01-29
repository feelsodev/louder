#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Building HapticEngine (universal binary)..."

swiftc \
    -O \
    -target arm64-apple-macosx12.0 \
    -framework IOKit \
    -framework CoreFoundation \
    -o HapticEngine-arm64 \
    HapticEngine.swift

swiftc \
    -O \
    -target x86_64-apple-macosx12.0 \
    -framework IOKit \
    -framework CoreFoundation \
    -o HapticEngine-x64 \
    HapticEngine.swift

lipo -create -output HapticEngine HapticEngine-arm64 HapticEngine-x64
rm HapticEngine-arm64 HapticEngine-x64

chmod +x HapticEngine

echo "Build complete: $SCRIPT_DIR/HapticEngine (universal)"
file HapticEngine

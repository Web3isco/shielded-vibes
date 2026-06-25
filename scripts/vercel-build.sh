#!/bin/bash
# Vercel build script for Shielded Vibes
# Installs Rust + Trunk, builds circuits, then builds the frontend.
# First build takes ~20-30 min. Subsequent builds are faster (cached).

set -e

echo "========================================"
echo "  Shielded Vibes - Vercel Build"
echo "========================================"

# 1. Install Rust if not present
echo ""
echo "[1/5] Checking Rust toolchain..."
if ! command -v rustc &> /dev/null; then
    echo "  Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
else
    echo "  Rust found: $(rustc --version)"
fi

# 2. Add WASM target
echo ""
echo "[2/5] Adding WASM target..."
rustup target add wasm32v1-none 2>/dev/null || true

# 3. Install Trunk
echo ""
echo "[3/5] Installing Trunk (build tool)..."
if ! command -v trunk &> /dev/null; then
    cargo install trunk --locked
else
    echo "  Trunk already installed: $(trunk --version)"
fi

# 4. Build circuits
echo ""
echo "[4/5] Building ZK circuits..."
cargo build -p circuits --release

# 5. Build frontend with Trunk
echo ""
echo "[5/5] Building frontend with Trunk..."
trunk build --release

echo ""
echo "========================================"
echo "  Build complete!"
echo "  Output in: dist/"
echo "========================================"

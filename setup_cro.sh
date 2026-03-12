#!/bin/bash
# Setup script for the CRO experiment framework.
# Run this instead of `uv sync` if you're on Mac or don't need the ML dependencies.
#
# Usage:
#   chmod +x setup_cro.sh
#   ./setup_cro.sh

set -e

echo "=== CRO Framework Setup ==="
echo ""

# 1. Create a virtual environment if it doesn't exist
if [ ! -d ".venv-cro" ]; then
    echo "Creating virtual environment (.venv-cro)..."
    python3 -m venv .venv-cro
fi

# Activate it
source .venv-cro/bin/activate
echo "Using Python: $(python3 --version) at $(which python3)"

# 2. Install Python dependencies (no torch, no CUDA)
echo ""
echo "Installing Python dependencies..."
pip install --upgrade pip
pip install 'playwright>=1.48.0' 'anthropic>=0.39.0' 'requests>=2.32.0'

# 3. Install Playwright's Chromium browser
echo ""
echo "Installing Playwright Chromium..."
playwright install chromium

# 4. Check for Node.js + Lighthouse
echo ""
if command -v npx &> /dev/null; then
    echo "Node.js found: $(node --version)"
    if npx lighthouse --version &> /dev/null; then
        echo "Lighthouse found: $(npx lighthouse --version)"
    else
        echo "Installing Lighthouse..."
        npm install -g lighthouse
    fi
else
    echo "WARNING: Node.js not found. Lighthouse evaluation will be skipped."
    echo "  Install Node.js: https://nodejs.org/ or brew install node"
fi

# 5. Check for wget
echo ""
if command -v wget &> /dev/null; then
    echo "wget found: $(wget --version | head -1)"
else
    echo "WARNING: wget not found. Install it to clone the site:"
    echo "  macOS:  brew install wget"
    echo "  Linux:  sudo apt install wget"
fi

# 6. Summary
echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "  1. Activate the environment:  source .venv-cro/bin/activate"
echo "  2. Set your API key:          export ANTHROPIC_API_KEY=sk-ant-..."
echo "  3. Clone the site:            python3 prepare_web.py"
echo "  4. Run baseline evaluation:   python3 run_cro.py > run.log 2>&1"
echo "  5. Check results:             grep '^composite_cro:' run.log"
echo ""
echo "For quick iteration (LLM-only, no Lighthouse/Playwright):"
echo "  python3 run_cro.py --quick > run.log 2>&1"
echo ""

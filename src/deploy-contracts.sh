#!/bin/bash

# Deployment script for UploadEhr contract to Ganache
# Make sure Ganache is running on http://127.0.0.1:7545 with Chain ID 1337

echo "=========================================="
echo "Deploying UploadEhr Contract to Ganache"
echo "=========================================="
echo ""
echo "Make sure:"
echo "1. Ganache is running on http://127.0.0.1:7545"
echo "2. Chain ID is set to 1337 in Ganache"
echo "3. MetaMask is connected to the same network"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."

echo ""
echo "Step 1: Compiling contracts..."
truffle compile

if [ $? -ne 0 ]; then
    echo "❌ Compilation failed!"
    exit 1
fi

echo ""
echo "Step 2: Deploying contracts to development network (Ganache)..."
truffle migrate --network development --reset

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed!"
    echo "Make sure Ganache is running and accessible."
    exit 1
fi

echo ""
echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "The UploadEhr contract has been deployed to network 1337."
echo "Check src/build/contracts/UploadEhr.json for the deployment address."
echo ""
echo "You can now use the Upload Past Records feature in the DApp."


@echo off
REM Deployment script for UploadEhr contract to Ganache (Windows)
REM Make sure Ganache is running on http://127.0.0.1:7545 with Chain ID 1337

echo ==========================================
echo Deploying UploadEhr Contract to Ganache
echo ==========================================
echo.
echo Make sure:
echo 1. Ganache is running on http://127.0.0.1:7545
echo 2. Chain ID is set to 1337 in Ganache
echo 3. MetaMask is connected to the same network
echo.
pause

echo.
echo Step 1: Compiling contracts...
call truffle compile

if errorlevel 1 (
    echo Compilation failed!
    pause
    exit /b 1
)

echo.
echo Step 2: Deploying contracts to development network (Ganache)...
call truffle migrate --network development --reset

if errorlevel 1 (
    echo Deployment failed!
    echo Make sure Ganache is running and accessible.
    pause
    exit /b 1
)

echo.
echo ==========================================
echo Deployment Complete!
echo ==========================================
echo.
echo The UploadEhr contract has been deployed to network 1337.
echo Check src/build/contracts/UploadEhr.json for the deployment address.
echo.
echo You can now use the Upload Past Records feature in the DApp.
pause


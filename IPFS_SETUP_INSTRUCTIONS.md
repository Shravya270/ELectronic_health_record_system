# IPFS Setup Instructions for Secure Electronic Health Records

This guide will help you install and run IPFS (Kubo) so that the file upload functionality works in the application.

## Installation

### Option 1: Using Package Managers

#### Windows (using Chocolatey)
```powershell
choco install ipfs
```

#### Windows (using Scoop)
```powershell
scoop install ipfs
```

#### macOS (using Homebrew)
```bash
brew install ipfs
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install ipfs
```

### Option 2: Manual Installation

1. **Download IPFS Kubo:**
   - Visit: https://dist.ipfs.tech/#kubo
   - Download the latest version for your operating system
   - Extract the archive

2. **Add to PATH:**
   - Windows: Add the extracted folder to your system PATH
   - macOS/Linux: Move the `ipfs` binary to `/usr/local/bin/`:
     ```bash
     sudo mv ipfs /usr/local/bin/
     ```

## Initial Setup

### Step 1: Initialize IPFS
Open your terminal and run:
```bash
ipfs init
```

This creates a new IPFS repository in `~/.ipfs` (or `%USERPROFILE%\.ipfs` on Windows).

### Step 2: Start the IPFS Daemon
Start the IPFS daemon (this keeps IPFS running in the background):
```bash
ipfs daemon
```

You should see output like:
```
Initializing daemon...
Swarm listening on /ip4/127.0.0.1/tcp/4001
Swarm listening on /ip6/::1/tcp/4001
API server listening on /ip4/127.0.0.1/tcp/5001
WebUI: http://127.0.0.1:5001/webui
Gateway (readonly) server listening on /ip4/127.0.0.1/tcp/8080
```

**Important:** Keep this terminal window open! The daemon needs to keep running.

### Step 3: Verify IPFS is Running
Open a **new terminal window** and test the connection:
```bash
ipfs id
```

Or check if the API is accessible:
```bash
curl http://localhost:5001/api/v0/version
```

You should see a JSON response with version information.

## Configuration for Your Application

Your React app connects to IPFS on `localhost:5001`. Make sure:

1. **API Port is 5001** (default, should be fine)
2. **CORS is enabled** (if you get CORS errors)

### Enable CORS (if needed)
If you encounter CORS errors, run this in a new terminal (while daemon is running):
```bash
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["*"]'
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["PUT", "GET", "POST"]'
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Credentials '["true"]'
```

Then restart the daemon:
- Stop the daemon (Ctrl+C in the terminal where it's running)
- Start it again: `ipfs daemon`

## Running IPFS as a Service (Optional - Recommended)

### Windows (using NSSM - Non-Sucking Service Manager)

1. Download NSSM: https://nssm.cc/download
2. Extract and open Command Prompt as Administrator
3. Install IPFS as a service:
```cmd
nssm install IPFS "C:\path\to\ipfs.exe" daemon
nssm start IPFS
```

### macOS (using LaunchAgent)

Create `~/Library/LaunchAgents/io.ipfs.daemon.plist`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>io.ipfs.daemon</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/ipfs</string>
    <string>daemon</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
</dict>
</plist>
```

Then load it:
```bash
launchctl load ~/Library/LaunchAgents/io.ipfs.daemon.plist
```

### Linux (using systemd)

Create `/etc/systemd/system/ipfs.service`:
```ini
[Unit]
Description=IPFS Daemon
After=network.target

[Service]
Type=simple
User=your-username
ExecStart=/usr/local/bin/ipfs daemon
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl daemon-reload
sudo systemctl enable ipfs
sudo systemctl start ipfs
```

## Quick Start Commands Summary

```bash
# 1. Initialize IPFS (only needed once)
ipfs init

# 2. Start IPFS daemon (run this every time you want to use IPFS)
ipfs daemon

# 3. In another terminal, verify it's running
ipfs id

# 4. Check API endpoint
curl http://localhost:5001/api/v0/version
```

## Troubleshooting

### Port 5001 already in use
If you get an error that port 5001 is in use:
```bash
# Check what's using the port
# Windows:
netstat -ano | findstr :5001

# macOS/Linux:
lsof -i :5001

# Change IPFS API port (if needed)
ipfs config Addresses.API /ip4/127.0.0.1/tcp/5002
# Then restart daemon
```

### IPFS not starting
- Make sure you've run `ipfs init` first
- Check if another IPFS instance is already running
- Check firewall settings

### Connection refused in React app
- Ensure `ipfs daemon` is running
- Verify API is on port 5001: `ipfs config Addresses.API`
- Check CORS settings if you see CORS errors in browser console

## Alternative: Using IPFS Desktop

If you prefer a GUI application:
1. Download IPFS Desktop: https://docs.ipfs.tech/install/ipfs-desktop/
2. Install and run it
3. It automatically starts the IPFS daemon
4. Your React app should connect automatically

## Testing IPFS Connection

Test if IPFS is working correctly:
```bash
# Add a test file
echo "Hello IPFS" > test.txt
ipfs add test.txt

# You should get a hash like: QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG

# View the file
ipfs cat <hash>
```

If these commands work, IPFS is properly set up and your React app should be able to upload files!


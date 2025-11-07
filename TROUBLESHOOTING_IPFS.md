# 🔧 Troubleshooting Infura IPFS Connection

## Common Issues and Solutions

### Issue 1: "Missing Infura credentials"
**Symptoms**: Error message shows "Missing Infura credentials — please check your .env configuration"

**Solutions**:
1. Verify `.env` file exists in project root (same level as `package.json`)
2. Check variable names are exactly:
   ```
   REACT_APP_PINATA_API_KEY=your_project_id
   REACT_APP_PINATA_API_SECRET=your_project_secret
   ```
3. Ensure no spaces around `=` sign
4. **Restart React server** after adding/updating `.env`:
   ```bash
   # Stop server (Ctrl+C)
   npm start
   ```
5. Check browser console for: "Project ID present: true" and "Project Secret present: true"

### Issue 2: "Infura authentication failed"
**Symptoms**: Error message shows "Infura authentication failed. Please verify your Project ID and Secret"

**Solutions**:
1. Verify credentials in Infura dashboard: https://infura.io/
2. Ensure Project ID and Secret are correct (no typos)
3. Check that your Infura project has IPFS enabled
4. Try regenerating credentials in Infura dashboard
5. Ensure no extra quotes or spaces in `.env` file

### Issue 3: "Network error connecting to Infura IPFS"
**Symptoms**: Error message shows network-related errors

**Solutions**:
1. Check internet connection
2. Verify firewall/antivirus isn't blocking HTTPS connections
3. Try accessing https://ipfs.infura.io:5001/api/v0 in browser
4. Check browser console for detailed error (CORS, network, etc.)

### Issue 4: Environment variables not loading
**Symptoms**: Console shows "Project ID present: false"

**Solutions**:
1. **Restart React development server** (required after .env changes)
2. Verify `.env` file is in project root, not in `src/` folder
3. Check `.env` file is not in `.gitignore` (should be there for security)
4. Ensure variables start with `REACT_APP_` prefix
5. Try hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
6. Clear browser cache

### Issue 5: Connection works but upload fails
**Symptoms**: "Connected to IPFS via Infura" shows, but upload fails

**Solutions**:
1. Check browser console for detailed error
2. Verify file size isn't too large (Infura has limits)
3. Check internet connection stability
4. Try smaller file first to test

## Debugging Steps

### Step 1: Check Environment Variables
Open browser console and look for:
```
🔍 Checking Infura credentials...
Project ID present: true
Project Secret present: true
```

If either shows `false`, your `.env` file isn't loading correctly.

### Step 2: Check Connection Attempt
Look for these console messages:
```
🚀 Initializing Infura IPFS connection...
🔐 Creating IPFS client with Infura authentication...
Endpoint: https://ipfs.infura.io:5001/api/v0
🔄 Testing IPFS connection...
✅ IPFS connection successful!
```

If you see `❌ IPFS connection test failed:`, check the error details logged below.

### Step 3: Verify .env File Format
Your `.env` file should look like:
```env
REACT_APP_PINATA_API_KEY=2abc123def456ghi789
REACT_APP_PINATA_API_SECRET=your_secret_key_here
```

**Important**:
- No quotes around values
- No spaces around `=`
- Each variable on its own line
- No trailing spaces

### Step 4: Test Infura Credentials
1. Go to https://infura.io/
2. Log in to your account
3. Select your project
4. Go to "Settings" → "Keys"
5. Verify Project ID matches your `.env` file
6. Click "Reveal" on Project Secret to verify it matches

## Quick Fix Checklist

- [ ] `.env` file exists in project root
- [ ] Variables named correctly with `REACT_APP_` prefix
- [ ] No spaces or quotes in `.env` values
- [ ] React server restarted after `.env` changes
- [ ] Browser console shows credentials detected
- [ ] Internet connection is working
- [ ] Infura project has IPFS enabled
- [ ] Credentials are correct (no typos)

## Still Not Working?

1. **Check browser console** for detailed error messages
2. **Verify Infura account** is active and IPFS is enabled
3. **Try regenerating** Infura credentials
4. **Test with curl** (if available):
   ```bash
   curl -X POST https://ipfs.infura.io:5001/api/v0/version \
     -u "YOUR_PROJECT_ID:YOUR_PROJECT_SECRET"
   ```

## Expected Behavior

When working correctly:
1. Page loads → Shows "Connecting to IPFS via Infura..."
2. Connection succeeds → Shows "Connected to IPFS via Infura." (green)
3. Console shows → "✅ IPFS connected successfully via Infura"
4. Upload works → File uploads and hash is recorded on blockchain

---

**Remember**: Always restart React server after changing `.env` file!


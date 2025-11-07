# 🔑 Pinata API Key + Secret Setup Guide

This guide shows you how to use **API Key + Secret** authentication with Pinata (instead of JWT).

## ✅ Quick Setup

### Step 1: Get Your API Credentials from Pinata

1. Go to [https://pinata.cloud](https://pinata.cloud) and log in
2. Navigate to **"API Keys"** in your dashboard (usually under Account Settings)
3. Click **"New Key"** or **"Create API Key"**
4. Give it a name (e.g., "Secure EHR DApp")
5. Select permissions:
   - ✅ **pinFileToIPFS** (required for file uploads)
   - ✅ **pinJSONToIPFS** (optional, for metadata)
6. Click **"Create"**
7. **Copy both values:**
   - **API Key** (starts with something like `abc123...`)
   - **Secret Key** (starts with something like `xyz789...`)

⚠️ **Important**: Copy these immediately - you won't be able to see the Secret Key again!

---

### Step 2: Add to Your .env File

Open or create `.env` file in your project root (same level as `package.json`):

```env
REACT_APP_PINATA_API_KEY=your_api_key_here
REACT_APP_PINATA_API_SECRET=your_secret_key_here
```

**Important Notes:**
- ✅ No quotes around the values
- ✅ No spaces around the `=` sign
- ✅ Each variable on its own line
- ✅ Replace `your_api_key_here` and `your_secret_key_here` with your actual values

**Example:**
```env
REACT_APP_PINATA_API_KEY=abc123def456ghi789
REACT_APP_PINATA_API_SECRET=xyz789secretkey123456
```

---

### Step 3: Restart React Server

**This is required!** React only reads `.env` file when the server starts.

```bash
# Stop your current server (Ctrl+C)
npm start
```

---

### Step 4: Verify It's Working

1. Open your browser console (F12)
2. Navigate to the "Upload Past Records" page
3. Look for these console messages:
   ```
   🔍 Checking Pinata credentials...
   API Key present: true
   API Secret present: true
   🔐 Using API Key + Secret authentication
   ```

4. You should see: **"Connected to IPFS via Pinata."** in the UI

---

## 🔍 Troubleshooting

### Issue: "Missing Pinata credentials"

**Check:**
- ✅ `.env` file is in project root (not in `src/`)
- ✅ Variable names are exactly: `REACT_APP_PINATA_API_KEY` and `REACT_APP_PINATA_API_SECRET`
- ✅ No typos in variable names
- ✅ Both values are present (not empty)
- ✅ **React server was restarted** after adding credentials

### Issue: "Pinata authentication failed"

**Check:**
- ✅ API Key is correct (no typos)
- ✅ Secret Key is correct (no typos)
- ✅ Both keys are from the same API key pair
- ✅ API key hasn't been revoked in Pinata dashboard
- ✅ API key has `pinFileToIPFS` permission enabled

### Issue: Console shows "JWT Token present: false" but "API Key present: true"

**This is normal!** The code checks for JWT first, then falls back to API Key + Secret. As long as you see:
- `API Key present: true`
- `API Secret present: true`
- `🔐 Using API Key + Secret authentication`

Then it's working correctly!

---

## 📋 Complete .env Example

Here's what your `.env` file should look like:

```env
# Pinata API Credentials (API Key + Secret method)
REACT_APP_PINATA_API_KEY=your_actual_api_key_here
REACT_APP_PINATA_API_SECRET=your_actual_secret_key_here

# Optional: You can also add JWT if you want (JWT takes priority if both are present)
# REACT_APP_PINATA_JWT=your_jwt_token_here
```

**Note:** If you add both JWT and API Key/Secret, JWT will be used (it has priority). To use API Key + Secret, make sure JWT is not set or is commented out.

---

## ✅ Verification Checklist

- [ ] Created API Key in Pinata dashboard
- [ ] Copied both API Key and Secret Key
- [ ] Added both to `.env` file with correct variable names
- [ ] No quotes or spaces around values
- [ ] Restarted React server
- [ ] Console shows "Using API Key + Secret authentication"
- [ ] UI shows "Connected to IPFS via Pinata."
- [ ] Can successfully upload a test file

---

## 🚀 You're All Set!

Once configured, the app will automatically:
- ✅ Use API Key + Secret for authentication
- ✅ Upload files to Pinata IPFS
- ✅ Record IPFS hash on blockchain
- ✅ Display success messages

**The code already supports this method - just add your credentials to `.env` and restart!** 🎉

---

## 📚 Additional Resources

- [Pinata API Documentation](https://docs.pinata.cloud/api-reference)
- [Pinata Dashboard](https://pinata.cloud)
- [Pinata API Keys Guide](https://docs.pinata.cloud/api-keys)


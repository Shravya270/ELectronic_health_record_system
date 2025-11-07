# 📌 Pinata IPFS Integration Setup

This DApp uses **Pinata** for IPFS file storage instead of Infura. Pinata provides a reliable, cloud-based IPFS pinning service with a simple REST API.

## 🔑 Getting Your Pinata Credentials

### Step 1: Create a Pinata Account
1. Go to [https://pinata.cloud](https://pinata.cloud)
2. Sign up for a free account (or log in if you already have one)

### Step 2: Generate API Credentials
1. Log in to your Pinata dashboard
2. Navigate to **API Keys** section (usually in Account Settings)
3. Click **"New Key"** or **"Create API Key"**
4. Give it a name (e.g., "Secure EHR DApp")
5. Select permissions:
   - ✅ **pinFileToIPFS** (required)
   - ✅ **pinJSONToIPFS** (optional, for metadata)
6. Click **"Create"**
7. **Copy the JWT token** immediately (you won't be able to see it again!)

### Step 3: Configure Environment Variables

Create or update your `.env` file in the project root (same level as `package.json`):

```env
REACT_APP_PINATA_JWT=your_jwt_token_here
```

**Important Notes:**
- The JWT token is the **primary authentication method** (recommended by Pinata)
- No quotes needed around the token
- No spaces around the `=` sign
- Each variable on its own line

### Optional: API Key and Secret (Alternative Method)

If you prefer to use API Key/Secret instead of JWT (not recommended), you can also add:

```env
REACT_APP_PINATA_API_KEY=your_api_key_here
REACT_APP_PINATA_API_SECRET=your_api_secret_here
```

However, the current implementation uses **JWT authentication** which is simpler and more secure.

## 🚀 Using the Integration

### How It Works

1. **File Selection**: User selects a medical record file (PDF, DOC, image, etc.)
2. **Upload to Pinata**: File is uploaded to Pinata's IPFS network via REST API
3. **Get IPFS Hash**: Pinata returns an IPFS hash (CID) for the uploaded file
4. **Record on Blockchain**: The IPFS hash is stored on the blockchain via the `UploadEhr` smart contract

### Upload Process

When a user uploads a file:
- Status: "Uploading file to IPFS via Pinata..."
- Status: "Recording file hash on blockchain..."
- Success: "✓ Upload complete! Your medical record has been securely stored."
- IPFS Hash is displayed in a teal-colored box

## 🔍 Troubleshooting

### Issue: "Missing Pinata credentials"
**Solution:**
1. Verify `.env` file exists in project root
2. Check variable name is exactly `REACT_APP_PINATA_JWT`
3. Ensure no quotes or spaces around the value
4. **Restart React server** after adding/updating `.env`

### Issue: "Pinata authentication failed"
**Solution:**
1. Verify JWT token is correct (no typos)
2. Check token hasn't expired (regenerate if needed)
3. Ensure token has `pinFileToIPFS` permission
4. Try regenerating the API key in Pinata dashboard

### Issue: "Failed to upload file to Pinata"
**Solution:**
1. Check internet connection
2. Verify Pinata service is online
3. Check file size (Pinata has limits on free tier)
4. Review browser console for detailed error messages

### Issue: Environment variables not loading
**Solution:**
1. **Restart React development server** (required!)
2. Verify `.env` file is in project root, not in `src/`
3. Check variables start with `REACT_APP_` prefix
4. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)

## 📋 Pinata API Limits

**Free Tier:**
- 1 GB storage
- 100 files per month
- Files pinned for 30 days

**Paid Tiers:**
- More storage and files
- Permanent pinning options
- Priority support

Check [Pinata Pricing](https://pinata.cloud/pricing) for current limits.

## 🔐 Security Best Practices

1. **Never commit `.env` file to Git**
   - Ensure `.env` is in `.gitignore`
   - Use `.env.example` for documentation

2. **Rotate credentials regularly**
   - Regenerate JWT tokens periodically
   - Revoke old tokens when no longer needed

3. **Use environment-specific credentials**
   - Different tokens for development/production
   - Never share credentials publicly

## 📚 Additional Resources

- [Pinata Documentation](https://docs.pinata.cloud/)
- [Pinata API Reference](https://docs.pinata.cloud/api-reference)
- [IPFS Documentation](https://docs.ipfs.io/)

## ✅ Verification

After setup, you should see:
- Console log: "✅ Pinata credentials detected — ready to upload files"
- UI shows: "Connected to IPFS via Pinata." (green message)
- Upload functionality works end-to-end

---

**Remember**: Always restart your React server after changing `.env` file!


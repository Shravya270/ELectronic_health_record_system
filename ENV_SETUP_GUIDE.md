# Environment Variables Setup Guide

This guide shows you exactly what environment variables to set up for the video consultation feature.

## ProjectEHR Environment Variables

Create a `.env` file in the `ProjectEHR/` root directory with:

```env
REACT_APP_STREAM_API_KEY=your_stream_api_key_here
REACT_APP_STREAM_API_BASE_URL=http://localhost:5001/api/ehr
```

**Important:** 
- Use `REACT_APP_` prefix (not `VITE_`) because ProjectEHR uses Create React App
- Replace `your_stream_api_key_here` with your actual Stream API key from getstream.io
- The base URL should point to the `/api/ehr` endpoint

## Streamify Backend Environment Variables

Create a `.env` file in `video_call-ehr/Streamify/backend/` with:

```env
PORT=5001
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/streamify
STREAM_API_KEY=your_stream_api_key_here
STREAM_API_SECRET=your_stream_api_secret_here
JWT_SECRET_KEY=your_jwt_secret_key_here
```

**Important:**
- `STREAM_API_KEY` should match the one in ProjectEHR's `.env`
- Never expose `STREAM_API_SECRET` in the frontend
- Generate a secure JWT secret using: `openssl rand -base64 32`

## Quick Setup Commands

### Windows (PowerShell):
```powershell
# Create ProjectEHR .env
cd ProjectEHR
@"
REACT_APP_STREAM_API_KEY=your_stream_api_key_here
REACT_APP_STREAM_API_BASE_URL=http://localhost:5001/api/ehr
"@ | Out-File -FilePath .env -Encoding utf8

# Create Streamify backend .env
cd ..\video_call-ehr\Streamify\backend
@"
PORT=5001
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/streamify
STREAM_API_KEY=your_stream_api_key_here
STREAM_API_SECRET=your_stream_api_secret_here
JWT_SECRET_KEY=your_jwt_secret_key_here
"@ | Out-File -FilePath .env -Encoding utf8
```

### Mac/Linux:
```bash
# Create ProjectEHR .env
cd ProjectEHR
cat > .env << EOF
REACT_APP_STREAM_API_KEY=your_stream_api_key_here
REACT_APP_STREAM_API_BASE_URL=http://localhost:5001/api/ehr
EOF

# Create Streamify backend .env
cd ../video_call-ehr/Streamify/backend
cat > .env << EOF
PORT=5001
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/streamify
STREAM_API_KEY=your_stream_api_key_here
STREAM_API_SECRET=your_stream_api_secret_here
JWT_SECRET_KEY=your_jwt_secret_key_here
EOF
```

Remember to replace all placeholder values with your actual credentials!


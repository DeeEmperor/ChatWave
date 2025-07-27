# Deployment Instructions

## Setup

1. **Backend on Render:**
   - Deploy backend using `render.yaml` configuration
   - Will be accessible at: `https://your-app-name.onrender.com`

2. **Frontend on Vercel:**
   - Update `vercel.json` with your Render backend URL
   - Deploy frontend separately

## Configuration Steps

### 1. Deploy Backend to Render
- Push code to GitHub
- Connect to Render
- Use the included `render.yaml` configuration
- Get your backend URL (e.g., `https://whatsapp-backend-abc123.onrender.com`)

### 2. Update Frontend Configuration
Replace URLs in these files with your actual Render backend URL:

**vercel.json:**
```json
{
  "env": {
    "VITE_API_URL": "https://your-actual-render-url.onrender.com"
  }
}
```

**server/index.ts (CORS):**
```typescript
origin: process.env.NODE_ENV === "production" 
  ? ["https://your-actual-vercel-url.vercel.app"] 
  : "*",
```

### 3. Deploy Frontend to Vercel
- Connect repository to Vercel
- Deploy using the updated configuration

## Local Development
```bash
npm run dev  # Starts both frontend and backend
```

## Production URLs
- Frontend: https://your-app.vercel.app
- Backend: https://your-app.onrender.com

## Important Notes
- QR code generation requires the backend server running
- Socket.IO connections need both services deployed
- Never visit the backend URL directly - use the frontend

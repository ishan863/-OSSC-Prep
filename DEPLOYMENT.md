# 🚀 OSSC Exam Prep - Deployment Guide

## 🔐 API Key Security (IMPORTANT!)

**This app does NOT require you to set API keys during deployment!**

Each user provides their own OpenRouter API key through the app settings. This is the most secure approach because:
- No API key in your code = No risk of key getting revoked
- Each user manages their own key in their browser
- Keys are stored locally in localStorage (never sent to your servers)

---

## Quick Setup for Users

### How Users Get Their FREE API Key
1. Go to [https://openrouter.ai](https://openrouter.ai)
2. Click "Sign up" (use Google for quick signup)
3. Go to [https://openrouter.ai/keys](https://openrouter.ai/keys)
4. Click "Create Key"
5. Copy the key (starts with `sk-or-v1-`)
6. Paste it in the app: **Profile → AI API Key → Save**

> **Note:** This app uses only FREE models - no credit card required!

### 2. Set Up Firebase (Optional - for user data)
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Add a Web App
4. Copy the config values

---

## Local Development

```bash
# 1. Clone and install
cd ossc-exam-prep
npm install

# 2. Run the app (no .env file needed!)
npm run dev

# 3. Enter your API key in the app when prompted
```

---

## Production Deployment

### Option 1: Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/your-username/ossc-exam-prep.git
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - **No API keys needed!** (Users enter their own)
   - Add Firebase variables if using Firebase
   - Click "Deploy"

### Option 2: Netlify

1. **Build the app**
   ```bash
   npm run build
   ```

2. **Deploy to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Drag the `dist` folder to deploy
   - Or connect GitHub repo

3. **Add Firebase Environment Variables (if using Firebase)**
   - Site Settings → Build & Deploy → Environment

### Option 3: GitHub Pages

1. **Install gh-pages**
   ```bash
   npm install gh-pages --save-dev
   ```

2. **Add to package.json**
   ```json
   {
     "homepage": "https://your-username.github.io/ossc-exam-prep",
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     }
   }
   ```

3. **Deploy**
   ```bash
   npm run deploy
   ```

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_FIREBASE_API_KEY` | ⚪ Optional | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | ⚪ Optional | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | ⚪ Optional | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | ⚪ Optional | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ⚪ Optional | Firebase sender ID |
| `VITE_FIREBASE_APP_ID` | ⚪ Optional | Firebase app ID |

> **Note:** OpenRouter API key is NOT set as environment variable! Each user provides their own key through the app.

---

## Security Notes

✅ **This app follows best security practices:**

1. **No API keys in code** - Users provide their own keys
2. **Keys stored in browser localStorage** - Never sent to your servers
3. **Never commit API keys** - The `.gitignore` file excludes `.env`
4. **Each user controls their own key** - Can revoke anytime from OpenRouter

---

## Troubleshooting

### "API Key Invalid" Error
- Make sure the key starts with `sk-or-v1-`
- Check if the key is correctly set in environment variables
- Verify the key is active on OpenRouter dashboard

### "Rate Limited" Error
- The free tier has limits
- Wait 1-2 minutes and try again
- The app automatically tries multiple models

### "Questions Not Generating" 
- Check browser console for errors
- Verify API key is set correctly
- Try refreshing the page

---

## Support

For issues or questions:
- Check the browser console for errors
- Review OpenRouter documentation
- Create a GitHub issue

---

Made with ❤️ for OSSC exam aspirants

# 🚀 OSSC Exam Prep - Deployment Guide

## Quick Setup

### 1. Get OpenRouter API Key (FREE)
1. Go to [https://openrouter.ai](https://openrouter.ai)
2. Click "Sign up" (use Google for quick signup)
3. Go to [https://openrouter.ai/keys](https://openrouter.ai/keys)
4. Click "Create Key"
5. Copy the key (starts with `sk-or-v1-`)

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

# 2. Create .env file
cp .env.example .env

# 3. Edit .env with your keys
# VITE_OPENROUTER_API_KEY=sk-or-v1-your-key-here

# 4. Run the app
npm run dev
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
   - Add Environment Variables:
     - `VITE_OPENROUTER_API_KEY` = your API key
     - `VITE_FIREBASE_API_KEY` = your Firebase key
     - (add all Firebase config variables)
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

3. **Add Environment Variables**
   - Site Settings → Build & Deploy → Environment
   - Add all `VITE_*` variables

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

> **Note:** For GitHub Pages, you need to set environment variables in GitHub Secrets and use GitHub Actions for the build.

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_OPENROUTER_API_KEY` | ✅ Yes | OpenRouter API key for AI features |
| `VITE_FIREBASE_API_KEY` | ⚪ Optional | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | ⚪ Optional | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | ⚪ Optional | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | ⚪ Optional | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ⚪ Optional | Firebase sender ID |
| `VITE_FIREBASE_APP_ID` | ⚪ Optional | Firebase app ID |

---

## Security Notes

⚠️ **Important Security Practices:**

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Use environment variables** in production hosting
3. **Rotate API keys** if accidentally exposed
4. **Monitor usage** on OpenRouter dashboard

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

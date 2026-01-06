# FPL Transfer Recommender

A Fantasy Premier League transfer recommendation tool that helps you make smarter transfer decisions.

## Features
- 🔮 AI-powered transfer predictions
- 📊 Comprehensive player analysis
- 📅 Fixture difficulty tracker
- 👥 Squad builder with budget management

---

## 🚀 Deploy to Render (FREE - One Click!)

### Step 1: Get the code on GitHub

1. Create a GitHub account at https://github.com if you don't have one
2. Click the green **"Use this template"** button OR:
   - Go to https://github.com/new
   - Name it `fpl-recommender`
   - Upload all these files

### Step 2: Deploy to Render

1. Go to **https://render.com**
2. Click **"Get Started for Free"** → Sign up with GitHub
3. Click **"New +"** → **"Web Service"**
4. Connect your GitHub repo
5. Fill in:
   - **Name**: `fpl-recommender` (or anything you want)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
6. Click **"Create Web Service"**
7. Wait 2-3 minutes for it to build

### Step 3: Share!

Your app will be live at: `https://fpl-recommender.onrender.com` (or similar)

Send this link to your friend! 🎉

---

## 💻 Run Locally

```bash
# Install dependencies
npm install
cd client && npm install && cd ..

# Build the frontend
npm run build

# Start the server
npm start
```

Open http://localhost:3000

---

## How It Works

The prediction model considers:
- Expected goals & assists (xG/xA)
- Fixture difficulty rating (FDR)
- Team momentum (recent form)
- Clean sheet probability
- Home/away performance
- Minutes consistency
- Set piece duties
- ICT Index

---

Built with ❤️ for FPL managers

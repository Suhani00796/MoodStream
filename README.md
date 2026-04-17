###github link
https://suhani00796.github.io/MoodStream/
```
┌─────────────────────────────────┐
│  Frontend (GitHub Pages)        │
│  • User chat interface          │
│  • Local keyword fallback       │
└──────────────┬──────────────────┘
               │
               ├─ API Healthy?
               │  YES ↓
               ├─ POST /leo-chat (Smart responses)
               ├─ POST /analyze-mood (Final vibe hub)
               │  NO ↓
               └─ Fallback to Local Detection ✅
                  (App keeps working offline!)
```

### 💡 Why API + Fallback?

| Feature | Before (Local-Only) | After (API + Fallback) |
|---------|-------------------|-------|
| **Response Quality** | Basic keyword matching | Contextual AI responses |
| **State Tracking** | Stateless | API tracks conversation flow |
| **Future AI** | Hardcoded | Ready for Gemini/OpenAI plugin |
| **Offline Support** | Limited | Works with local fallback |
| **Deployment** | GitHub Pages only | GitHub Pages + Render API |

---

## 🎯 Architecture Overview

### Frontend (`/` - GitHub Pages)
- **Technology**: Vanilla JavaScript, CSS3, Service Workers
- **Features**: 
  - Chat interface with 1:30 timer
  - WhatsApp-style login
  - Automatic API detection (localhost for dev, Render for production)
  - Graceful fallback to local keyword detection
- **File**: `app.js` with `getLeoResponseFromAPI()` + `analyzeMoodFromAPI()` 

### Backend API (`/api` - Node.js/Express)
- **Deployment**: Render (Free tier compatible)
- **Endpoints**:
  - `POST /leo-chat` → Get Leo's response
  - `POST /analyze-mood` → Final mood + vibe hub
- **Brain Logic**: Keyword-based mood detection (60+ keywords) + contextual responses
- **Files**: `api/utils/leo-brain.js`, `api/utils/mood-detector.js`

---

## ✨ Key Features

| Feature | Status | Details |
|---------|--------|---------|
| **Mood Detection** | ✅ | 6 emotions (joy, sadness, anger, fear, love, surprise) |
| **Leo Responses** | ✅ | API-powered contextual responses via Brain |
| **Vibe Hub** | ✅ | Detects mood → opens Spotify playlist + secondary apps |
| **Offline Mode** | ✅ | Falls back to local keyword detection |
| **API Fallback** | ✅ | 5-second timeout, seamless local switching |
| **PWA Support** | ✅ | Service Worker caching for offline access |
| **Bluetooth** | ✅ | Control with paired devices |
| **Future AI** | 🔄 | Scaffolding ready for Gemini/OpenAI integration |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Vanilla JS, CSS3, Service Workers |
| **Backend** | Node.js + Express |
| **Brain** | Keyword-based NLP (60+ emotion keywords) |
| **Detection** | 6-emotion classifier |
| **Deployment** | GitHub Pages (frontend) + Render (backend) |
| **Emotion Engine** | Keyword matching + future AI plugin slot |

---

## 📡 How It Works

### 1. User Sends Message
```javascript
User: "I'm feeling really sad today..."
```

### 2. Frontend Tries API First
```javascript
// app.js: getLeoResponseFromAPI()
↓
Try: POST http://localhost:5000/leo-chat (or Render API)
↓
Timeout? (5 seconds)
  YES → Use local fallback ✅
  NO  → Use API response ✅
```

### 3. API Brain Analyzes
```javascript
// api/utils/leo-brain.js
- Detect keywords in message
- Analyze conversation history
- Generate contextual Leo response
- Return mood score (0-100% confidence)
```

### 4. After 1:30 Timer
```javascript
// app.js: handleConversationEnd()
Call: POST /analyze-mood
↓
API analyzes full conversation history
↓
Returns:
  {
    "primaryMood": "sadness",
    "confidence": 85,
    "vibeHub": {
      "playlistName": "Soulful & Calming",
      "youtubeQuery": "sad emotional bollywood songs",
      "apps": [{ "name": "Amazon", "url": "..." }]
    }
  }
↓
Open Music + Launch Secondary App
```

---

## 🚀 Quick Start

### Frontend Local Development
```bash
# Terminal 1: Start frontend on port 8000
npm start
# Opens http://localhost:8000

# Terminal 2: Start API server on port 5000
cd api
npm install
npm start
# API ready at http://localhost:5000
```

### Testing the API
```bash
# Test Leo Chat endpoint
curl -X POST http://localhost:5000/leo-chat \
  -H "Content-Type: application/json" \
  -d '{"message":"I am so happy!","history":""}'

# Response:
# {
#   "reply": "OMG I'm so glad you're feeling amazing! 🌟",
#   "currentMood": "joy",
#   "confidence": 85,
#   ...
# }
```

### Deploy to Render
1. **Push to GitHub**: `git push origin main`
2. **Go to [Render.com](https://render.com/)**
3. **Click "New +" → "Web Service"**
4. **Connect GitHub repo** → Select `Suhani00796/MoodStream`
5. **Configure**:
   - Build Command: `cd api && npm install`
   - Start Command: `cd api && npm start`
   - Environment: Node
   - Plan: Free
6. **Add Environment Variables**:
   - `NODE_ENV` = `production`
   - `FRONTEND_URL` = `https://suhani00796.github.io/MoodStream`
7. **Deploy!** 🚀

**Your API URL**: `https://moodstream-api.onrender.com`

The frontend automatically detects it and uses it in production!

---

## 📊 Emotion Detection

| Emotion | Keywords | Playlist | Secondary App |
|---------|----------|----------|----------------|
| **Joy** | happy, celebrate, awesome, love, excited | "Happy & Energetic" | Pinterest |
| **Sadness** | sad, lonely, crying, depressed, hurt | "Soulful & Calming" | Amazon |
| **Anger** | angry, furious, mad, frustrated | "Stress Buster" | VS Code |
| **Fear** | afraid, scared, worried, anxious | "Peaceful Retreat" | Headspace |
| **Love** | love, romantic, adore, cherish | "Romantic Melodies" | Wattpad |
| **Surprise** | wow, shocked, amazing, unexpected | "New Discoveries" | Play Store |

---

## 🔄 Fallback Logic (Resilience)

**What if the API is down?**

✅ **App keeps working!**

```javascript
// Frontend automatically detects API health
if (apiTimeout > 5000 || apiError) {
    console.log("Using local fallback...");
    return getLeoResponseLocal(message); // Keyword-based
}
```

**Benefits**:
- Zero downtime for users
- Graceful degradation
- Seamless experience
- Offline capability

---

## 🧠 Future Enhancements

### Phase 1: AI Integration (2-3 hours)
```javascript
// Drop into api/utils/leo-brain.js
async function generateLeoResponseWithAI(message, history) {
    const response = await fetch('https://api.gemini.com/v1/generate', {
        prompt: `${message}\n${history}`
    });
    return response.json();
}
```

**Supported**: Gemini, OpenAI, Hugging Face

### Phase 2: Mood History Tracking
- Save user mood trends to database
- Visualize mood graph over time
- Personalized recommendations

### Phase 3: Real-time Updates
- WebSockets for live mood visualization
- Multi-user vibe sharing
- Collaborative playlists

---

## 🐛 Troubleshooting

### API won't start locally
```bash
# Check Node version
node --version  # Should be 18+

# Reinstall dependencies
cd api
rm -rf node_modules package-lock.json
npm install
npm start
```

### API not responding from frontend
- Check browser console (DevTools) for errors
- Verify API is running: `curl http://localhost:5000/health`
- Check CORS settings if deployed
- Falls back to local automatically if timeout

### Render deployment fails
- Check build logs in Render dashboard
- Verify GitHub repo is public
- Ensure `api/package.json` exists
- Check Node.js version in Render settings

---

## 📁 Project Structure

```
MoodStream/
├── index.html              # Chat UI
├── app.js                  # Frontend (API integration + fallback)
├── model.js                # Local emotion detection (fallback)
├── style.css               # Styling
├── manifest.json           # PWA config
├── worker.js               # Service Worker
│
├── api/                    # ← NEW Leo Brain Backend
│   ├── server.js           # Express server
│   ├── package.json        # Node.js dependencies
│   ├── routes/
│   │   ├── leo-chat.js     # POST /leo-chat endpoint
│   │   └── analyze-mood.js # POST /analyze-mood endpoint
│   ├── utils/
│   │   ├── leo-brain.js    # Response generation
│   │   └── mood-detector.js# Mood analysis
│   └── README.md           # API documentation
│
├── render.yaml             # Render deployment config
└── README.md              # This file
```

---

## 🎯 For Hackathon Judges

**What We Built**:
- ✅ Production-ready client-server architecture
- ✅ Intelligent API with mood detection Brain
- ✅ Graceful fallback for 100% uptime
- ✅ PWA with offline capability
- ✅ Deployed on GitHub Pages + Render (free tier)
- ✅ Future-proof for AI integration

**Technical Highlights**:
- Zero npm dependencies in frontend (pure JS)
- Lightweight Express backend ($0/month on Render free tier)
- 5-second timeout with automatic fallback
- 60+ emotion keywords for robust detection
- CORS-enabled for cross-origin API calls

**Live Demo**:
- **Frontend**: https://suhani00796.github.io/MoodStream
- **API**: https://moodstream-api.onrender.com/health
- **GitHub**: https://github.com/Suhani00796/MoodStream

---

## 📝 License

MIT - Feel free to fork and use!

---

## 🤝 Contributing

Have ideas? Open an issue or PR!

---

**Made with ❤️ for MoodStream 🎵**


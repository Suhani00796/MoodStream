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

**Benefits**:
- Zero downtime for users
- Graceful degradation
- Seamless experience
- Offline capability

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

**Made with ❤️ for MoodStream 🎵**


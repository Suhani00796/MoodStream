# 🧠 Leo Brain API - Architecture & Setup

> The backend "Brain" powering MoodStream's intelligent mood detection and natural conversation

## 📋 Overview

The Leo Brain API is a **Node.js + Express** server that handles:
1. **Contextual Responses** - Analyzes user messages and conversation history to generate intelligent Leo responses
2. **Mood Detection** - Detects emotions from user text and conversation patterns
3. **Vibe Hub Mapping** - Maps detected moods to Spotify playlists and secondary apps

### Architecture

```
Frontend (GitHub Pages)                Backend (Render)
    ↓                                      ↓
index.html  ─────  POST /leo-chat  ─── server.js
app.js      ─────  POST /analyze-mood
model.js         (with fallback)
```

**Key Feature**: The frontend has **intelligent fallback logic** - if the API is down, it seamlessly reverts to local keyword-based detection. Zero downtime! 

---

## 🚀 Local Setup (Development)

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### Installation

1. **Navigate to the API folder**:
   ```bash
   cd api
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create `.env` file** (optional for local dev):
   ```bash
   cp .env.example .env
   ```

4. **Start the server**:
   ```bash
   npm start
   # Or with auto-reload:
   npm run dev
   ```

5. **Verify it's running**:
   ```bash
   curl http://localhost:5000/health
   ```

Expected response:
```json
{
  "status": "healthy",
  "uptime": 12.345,
  "timestamp": "2026-04-17T10:30:00.000Z",
  "environment": "development"
}
```

---

## 📡 API Endpoints

### 1. `POST /leo-chat` - Get Leo's Response

**Purpose**: Send a user message and get Leo's contextual response

**Request**:
```json
{
  "message": "I'm feeling really happy today!",
  "history": "User: Hey Leo!\nLeo: Hey there!\nUser: How are you?"
}
```

**Response**:
```json
{
  "reply": "OMG that's amazing! ✨ Tell me exactly what happened!",
  "currentMood": "joy",
  "confidence": 85,
  "keywordMatches": 3,
  "reasoning": "detected_joy",
  "moodScores": {
    "joy": 3,
    "sadness": 0,
    "anger": 0,
    "fear": 0,
    "love": 1,
    "surprise": 0
  },
  "timestamp": "2026-04-17T10:30:00.000Z"
}
```

**Example cURL**:
```bash
curl -X POST http://localhost:5000/leo-chat \
  -H "Content-Type: application/json" \
  -d '{"message":"I am so happy!","history":""}'
```

---

### 2. `POST /analyze-mood` - Final Mood Analysis

**Purpose**: Analyze the entire conversation to get final mood + vibe hub data

**Request**:
```json
{
  "conversationHistory": "User: I'm feeling down. Leo: I'm here for you... User: Actually I'm better now. Leo: That's great!"
}
```

**Response**:
```json
{
  "primaryMood": "sadness",
  "confidence": 72,
  "moodBreakdown": {
    "sadness": 2,
    "joy": 1
  },
  "segmentsAnalyzed": 4,
  "vibeHub": {
    "playlistName": "Soulful & Calming 🎵",
    "playlistDescription": "Melodious tracks to accompany your quiet moments.",
    "playlistUrl": "https://open.spotify.com/playlist/37i9dQZF1DX7qKkEvmtpKy",
    "youtubeQuery": "sad emotional bollywood songs",
    "apps": [
      { "name": "Amazon", "url": "https://amazon.com" },
      { "name": "Wattpad", "url": "https://wattpad.com" }
    ]
  },
  "timestamp": "2026-04-17T10:30:00.000Z"
}
```

**Example cURL**:
```bash
curl -X POST http://localhost:5000/analyze-mood \
  -H "Content-Type: application/json" \
  -d '{"conversationHistory":"I am sad. I am really sad."}'
```

---

### 3. `GET /` - API Info

Returns available endpoints and documentation links.

---

### 4. `GET /health` - Health Check

Extended health information for monitoring.

---

## 🛡️ Fallback Logic (Frontend)

The frontend implements intelligent fallback:

```javascript
// In app.js

async function getLeoResponseFromAPI(userMessage) {
    // Try API first
    const result = await callLeoAPI('/leo-chat', {
        message: userMessage,
        history: userTextLog
    });

    if (result) {
        return result; // ✅ API worked
    }

    // 🔄 Fallback to local keyword detection
    return getLeoResponseLocal(userMessage);
}
```

**Benefits**:
- ✅ **No Downtime**: App works even if API is down
- ✅ **Graceful Degradation**: Seamlessly switches between API and local
- ✅ **Offline Support**: Added offline-first capability
- ✅ **5s Timeout**: If API doesn't respond in 5 seconds, uses fallback

---

## 📊 Emotion Detection

The API detects 6 emotions:

| Emotion | Keywords | Example |
|---------|----------|---------|
| **joy** | happy, great, awesome, celebrate, love | "I won the competition!" |
| **sadness** | sad, crying, lonely, depressed, hurt | "I feel so alone right now" |
| **anger** | angry, furious, mad, frustrated, hate | "I'm so pissed off!" |
| **fear** | afraid, scared, worried, anxious, panic | "I'm really nervous about this" |
| **love** | love, adore, romantic, cherish, heart | "I'm so in love with them" |
| **surprise** | wow, shocked, unexpected, amazing, crazy | "That was absolutely insane!" |

**Algorithm**:
1. Split conversation into segments
2. Count keyword matches per emotion
3. Return emotion with highest score
4. Calculate confidence (0-100%)

---

## 🎯 Playlist Mapping

Each mood maps to Spotify playlists + secondary apps:

```
Joy → "Happy & Energetic" + Pinterest
Sadness → "Soulful & Calming" + Amazon
Anger → "Stress Buster" + VS Code
Fear → "Peaceful Retreat" + Headspace
Love → "Romantic Melodies" + Wattpad
Surprise → "New Discoveries" + Play Store
```

---

## 🌐 Deploy to Render

### Step 1: Push to GitHub
```bash
git add .
git commit -m "feat: Add Leo Brain API"
git push origin main
```

### Step 2: Connect to Render

1. Go to [Render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select the repo: `Suhani00796/MoodStream`
5. Configure:
   - **Name**: `moodstream-api`
   - **Environment**: `Node`
   - **Build Command**: `cd api && npm install`
   - **Start Command**: `cd api && npm start`
   - **Plan**: Free (or Paid if you need guaranteed uptime)

### Step 3: Add Environment Variables
In Render dashboard:
- `NODE_ENV` = `production`
- `PORT` = `5000`
- `FRONTEND_URL` = `https://suhani00796.github.io/MoodStream`

### Step 4: Deploy
Click "Create Web Service" → Render automatically deploys from GitHub

**Your API URL**: `https://moodstream-api.onrender.com`

### Step 5: Update Frontend

In `app.js`, the frontend automatically detects the correct API URL:

```javascript
getApiBaseUrl() {
    // Production
    if (window.location.hostname === 'suhani00796.github.io') {
        return 'https://moodstream-api.onrender.com';
    }
    // Local dev
    return 'http://localhost:5000';
}
```

---

## 🧪 Testing

### Test Leo Chat Endpoint

```bash
# Using curl
curl -X POST http://localhost:5000/leo-chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I am feeling really happy today!",
    "history": "Previous messages here..."
  }'
```

### Test Mood Analysis

```bash
curl -X POST http://localhost:5000/analyze-mood \
  -H "Content-Type: application/json" \
  -d '{
    "conversationHistory": "I am sad today. But then I felt better. Now I am happy!"
  }'
```

### Test with Frontend

1. Open `http://localhost:8000` (frontend)
2. Send messages through the chat
3. Check browser DevTools → Network tab
4. See API calls to `/leo-chat`
5. When 1:30 timer ends, see API call to `/analyze-mood`

---

## 🔄 Future Enhancements

### Tier 1: AI Integration (Easy)
```javascript
// api/utils/leo-brain.js
async function generateLeoResponseWithAI(message, history) {
    const response = await fetch('https://api.gemini.com/v1/generate', {
        method: 'POST',
        body: JSON.stringify({
            prompt: `As Leo, a flirty mood-detecting chatbot, respond to: "${message}"`,
            conversationHistory: history
        })
    });
    return response.json();
}
```

**Effort**: 2-3 hours
**APIs to use**: Gemini, OpenAI, Hugging Face

### Tier 2: Mood Persistence
```javascript
// Save user mood history to database
const moods = {
    userId: "user123",
    date: "2026-04-17",
    moods: ["joy", "sadness", "joy"],
    sessions: [...]
};
```

**Database**: MongoDB (Render compatible), Firebase, or Supabase
**Effort**: 4-6 hours

### Tier 3: Real-time Updates
Use WebSockets for live mood tracking visualization
**Framework**: Socket.io or ws
**Effort**: 6-8 hours

---

## 🐛 Troubleshooting

### API won't start
```bash
# Check Node.js version
node --version  # Should be 18+

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm start
```

### CORS errors in frontend
- Check `corsOptions` in `server.js`
- Add your frontend URL to the whitelist
- Test with `curl` first to isolate issue

### API timeout
- Increase `timeout` in `app.js`: `timeout: 10000` (10 seconds)
- Check server logs for errors
- Verify network connectivity

### Render deployment fails
- Check build logs in Render dashboard
- Verify GitHub repository is public
- Ensure `package.json` is in the `api/` folder

---

## 📞 Support

For issues:
1. Check the console logs: `console.log()` in server.js
2. Test endpoints with curl first
3. Check Render deployment logs
4. Review the code comments in each route

---

## 📝 License

MIT - Feel free to fork and modify!

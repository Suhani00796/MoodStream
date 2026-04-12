"# 🎵 Mood Bot - Offline ML Chatbot

> **An AI-powered mood detection chatbot that runs entirely in your browser. No servers, no data collection, just pure edge AI magic.**

[![Made with Transformers.js](https://img.shields.io/badge/Made%20with-Transformers.js-yellow.svg)](https://huggingface.co/docs/transformers.js)
[![Offline First](https://img.shields.io/badge/Offline-First-green.svg)](https://github.com)
[![Privacy Focused](https://img.shields.io/badge/Privacy-100%25-blue.svg)](https://github.com)

---

## 🌟 What Makes This Special?

Most chatbots send your data to remote servers. **Mood Bot runs 100% offline in your browser** using cutting-edge ML technology. Your conversations **never leave your device**.

### Key Features
- 🧠 **Offline ML**: Uses DistilBERT emotion detection (200MB model, cached locally)
- 🎯 **6 Emotion Detection**: joy, sadness, love, anger, fear, surprise
- 🎵 **Curated Playlists**: Hindi & Global Spotify playlists for each mood
- 🔒 **Privacy First**: Zero data sent to servers - everything runs client-side
- ⚡ **Edge AI**: Inference happens on your CPU/GPU
- 🎨 **Spotify-Inspired UI**: Dark mode with minimalist design

---

## 🎬 Demo

**Try it live:** [Your GitHub Pages URL]

![Mood Bot Demo](https://via.placeholder.com/800x400?text=Add+Screenshot+Here)

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **Transformers.js** | Run Hugging Face models in the browser |
| **DistilBERT** | Emotion classification (6 emotions) |
| **Vanilla JavaScript** | Lightweight, no framework overhead |
| **HTML5 + CSS3** | Modern UI with animations |
| **GitHub Pages** | Free static hosting |

---

## 🚀 How It Works

### The Magic Behind Offline ML

```
1. First Visit
   ├─ Browser downloads HTML/CSS/JS from GitHub Pages
   ├─ model.js fetches DistilBERT model from Hugging Face CDN
   └─ Browser caches model in IndexedDB (~200MB)

2. User Input
   ├─ \"I'm feeling really happy today!\"
   └─ Text stays in browser memory

3. Local Inference
   ├─ DistilBERT processes text using WebAssembly/WebGPU
   ├─ Detects emotion: \"joy\" (95.4% confidence)
   └─ No network request needed!

4. Response
   ├─ model.js maps \"joy\" → Bollywood Dance playlist
   └─ app.js displays response + Spotify link
```

### Architecture Diagram

```
┌─────────────────────────────────────────┐
│         User's Browser (Client)         │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────┐      ┌──────────────┐ │
│  │   app.js    │◄────►│  model.js    │ │
│  │ (Controller)│      │ (ML Logic)   │ │
│  └──────┬──────┘      └──────┬───────┘ │
│         │                    │         │
│         ▼                    ▼         │
│  ┌─────────────┐      ┌──────────────┐ │
│  │   DOM/UI    │      │ Transformers │ │
│  │ (index.html)│      │   .js (CDN)  │ │
│  └─────────────┘      └──────┬───────┘ │
│                              │         │
│                              ▼         │
│                       ┌──────────────┐ │
│                       │  DistilBERT  │ │
│                       │    Model     │ │
│                       │ (Cached)     │ │
│                       └──────────────┘ │
└─────────────────────────────────────────┘
         ▲
         │ (Offline after first load)
         ▼
    IndexedDB Cache
```

---

## 📦 Project Structure

```
mood-bot-project/
│
├── index.html          # Main UI structure + chat interface
├── style.css           # Spotify-inspired dark theme
├── app.js              # Controller logic (handles user input, UI updates)
├── model.js            # ML logic (loads model, runs inference, maps playlists)
├── assets/             # Optional: icons, images
└── README.md           # You're here!
```

---

## 🎯 Local Setup

### Option 1: Direct File Opening (Simple)
1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/mood-bot-project.git
   cd mood-bot-project
   ```

2. Open `index.html` in your browser:
   - **Chrome/Edge**: Just double-click `index.html`
   - **Firefox**: Right-click → \"Open With\" → Firefox

3. Wait for the model to download (~200MB, one-time)

4. Start chatting!

### Option 2: Local Server (Recommended for Development)
```bash
# Using Python
python -m http.server 8000

# Using Node.js (http-server)
npx http-server -p 8000

# Then visit: http://localhost:8000
```

### Option 3: Deploy to GitHub Pages
1. Push your code to a GitHub repository

2. Go to **Settings** → **Pages**

3. Select **Source**: `main` branch, `/root` folder

4. Your site will be live at: `https://yourusername.github.io/mood-bot-project/`

---

## 🎨 Customization

### Change Playlist Mappings
Edit `model.js` → `playlistMap` object:

```javascript
this.playlistMap = {
    'joy': {
        name: 'Your Custom Playlist Name',
        url: 'https://open.spotify.com/playlist/YOUR_PLAYLIST_ID',
        description: 'Your description'
    },
    // ... add more emotions
};
```

### Adjust UI Theme
Edit `style.css` → `:root` variables:

```css
:root {
    --spotify-green: #1DB954;  /* Change accent color */
    --bg-primary: #000000;     /* Change background */
    /* ... modify other variables */
}
```

### Use a Different Model
Edit `model.js` → `loadModel()` function:

```javascript
// Replace with any Hugging Face text-classification model
this.classifier = await pipeline(
    'text-classification',
    'YOUR-MODEL-NAME-HERE'  // e.g., 'distilbert-base-uncased-finetuned-sst-2-english'
);
```

---

## 🧪 Technical Deep Dive

### How Transformers.js Works

**Transformers.js** is a JavaScript port of Hugging Face's `transformers` library. It uses:

1. **ONNX Runtime Web**: Converts PyTorch models to run in browsers
2. **WebAssembly (WASM)**: Executes ML operations at near-native speed
3. **WebGPU (if available)**: GPU acceleration for faster inference
4. **IndexedDB**: Caches model weights locally

### Model Details

- **Model**: `Xenova/distilbert-base-uncased-finetuned-emotion`
- **Type**: Text Classification (Emotion Detection)
- **Size**: ~200MB (downloads once, cached forever)
- **Emotions**: `joy`, `sadness`, `love`, `anger`, `fear`, `surprise`
- **Base Architecture**: DistilBERT (distilled version of BERT)
- **Training**: Fine-tuned on emotion-labeled text datasets

### Performance

- **First Load**: 30-60 seconds (downloads model)
- **Subsequent Loads**: <1 second (cached)
- **Inference Time**: 200-500ms per message (depends on CPU/GPU)

---

## 🏆 Why This Wins Hackathons

### 1. **Unique Approach**
While others use API calls (OpenAI, Gemini), you're deploying **real ML** to the edge.

### 2. **Privacy Story**
You can claim: *\"No user data ever leaves the device\"* - a major selling point for privacy-conscious users.

### 3. **Technical Depth**
Demonstrates understanding of:
- Model deployment
- Browser APIs (IndexedDB, WASM, WebGPU)
- Offline-first architecture
- Latency optimization

### 4. **Real-World Impact**
Works without internet after first load - perfect for users with poor connectivity.

### 5. **Scalability**
No backend = no server costs, infinite users.

---

## 🐛 Troubleshooting

### Model Won't Load
- **Check console**: Open DevTools (F12) → Console
- **CORS issues**: Serve via local server instead of file://
- **Slow download**: Model is 200MB - be patient on slow connections

### Inference is Slow
- **Use Chrome/Edge**: Better WebAssembly support
- **Close other tabs**: Frees up CPU/RAM
- **Check for GPU**: Some browsers support WebGPU acceleration

### Playlist Links Don't Work
- **Update URLs**: Replace placeholder links with your Spotify playlists
- **Spotify Premium**: Some playlists require a Spotify account

---

## 🚧 Future Enhancements

- [ ] **Service Worker**: True offline mode (cache app files)
- [ ] **Voice Input**: Web Speech API for voice-to-text
- [ ] **Emotion History Graph**: Visualize mood trends over time
- [ ] **Multi-language Support**: Detect Hindi, English, Spanish text
- [ ] **Custom Playlists**: Let users add their own playlist mappings
- [ ] **WebGPU Acceleration**: 5-10x faster inference on supported browsers

---

## 📚 Resources & Credits

- **Transformers.js Docs**: https://huggingface.co/docs/transformers.js
- **DistilBERT Paper**: https://arxiv.org/abs/1910.01108
- **Emotion Model**: https://huggingface.co/Xenova/distilbert-base-uncased-finetuned-emotion
- **Spotify Playlists**: https://open.spotify.com
- **Design Inspiration**: Spotify Web Player

---

## 📄 License

MIT License - feel free to use this for your hackathon, portfolio, or commercial projects!

---

## 👨‍💻 Author

**Your Name**  
- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your LinkedIn](https://linkedin.com/in/yourprofile)
- Portfolio: [yourwebsite.com](https://yourwebsite.com)

---

## 🙏 Acknowledgments

- Hugging Face team for Transformers.js
- Spotify for design inspiration
- Open-source ML community

---

**Built with 💚 for the love of offline ML and great music.**

*If this project helped you, give it a ⭐ on GitHub!*
"
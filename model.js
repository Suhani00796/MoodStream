/* ========================================
   MODEL.JS - Hybrid Emotion Detection
   Tries ML model first, falls back to keywords
   Works 100% offline - No external dependencies required
   ======================================== */

class MoodDetector {
    constructor() {
        this.isReady = false;
        this.useMLModel = false;
        this.classifier = null;
        
        // Emotion Keywords for fallback detection
        this.emotionKeywords = {
            joy: ['happy', 'great', 'awesome', 'love', 'excited', 'wonderful', 'brilliant', 'fantastic', 'amazing', 'blessed', 'celebrate', 'joy', 'smile', 'laugh'],
            sadness: ['sad', 'down', 'cry', 'depressed', 'upset', 'unhappy', 'miserable', 'gloomy', 'dark', 'lonely', 'broken', 'hurt', 'pain'],
            anger: ['angry', 'furious', 'hate', 'enraged', 'mad', 'irritated', 'frustrated', 'pissed', 'rage', 'annoyed', 'furious', 'angry'],
            fear: ['afraid', 'scared', 'worried', 'anxious', 'nervous', 'terrified', 'panic', 'dread', 'frightened', 'fear'],
            love: ['love', 'adore', 'care', 'affection', 'sweet', 'romantic', 'passion', 'devoted', 'cherish', 'beautiful', 'heart'],
            surprise: ['wow', 'amazing', 'shocked', 'surprised', 'unexpected', 'astonished', 'incredible', 'unbelievable']
        };
        
        // Playlist Mapping
        this.playlists = {
            joy: {
                name: "Happy & Energetic",
                description: "Upbeat Bollywood & Global hits to keep the vibe high!",
                url: "https://open.spotify.com/playlist/37i9dQZF1DXdPecmS3tq9S"
            },
            sadness: {
                name: "Soulful & Calming",
                description: "Melodious tracks to accompany your quiet moments.",
                url: "https://open.spotify.com/playlist/37i9dQZF1DX7qKkEvmtpKy"
            },
            anger: {
                name: "Stress Buster",
                description: "High-energy beats to help you vent and reset.",
                url: "https://open.spotify.com/playlist/37i9dQZF1DX3rxVfibe1L0"
            },
            fear: {
                name: "Peaceful Retreat",
                description: "Calm instrumentals and soothing vocals to relax.",
                url: "https://open.spotify.com/playlist/37i9dQZF1DX4sWvAiT0O9z"
            },
            surprise: {
                name: "New Discoveries",
                description: "Fresh tracks and unexpected hits from around the world.",
                url: "https://open.spotify.com/playlist/37i9dQZF1DX4WQwS6mMGq0"
            },
            love: {
                name: "Romantic Melodies",
                description: "The best of Bollywood and Global love songs.",
                url: "https://open.spotify.com/playlist/37i9dQZF1DX7r9R7clS1Xy"
            }
        };
    }

    async loadModel(progressCallback) {
        // Simulate loading with progress updates
        if (progressCallback) progressCallback({ status: 'initiating', progress: 25, file: 'Initializing...' });
        
        await new Promise(r => setTimeout(r, 200));
        
        // Try to load ML model if files exist in /models folder
        try {
            if (progressCallback) progressCallback({ status: 'downloading', progress: 40, file: 'Checking for ML model...' });
            
            const modelJsonResponse = await fetch('./models/model.json');
            if (modelJsonResponse.ok) {
                console.log('✅ Model files detected! Attempting to load DistilBERT...');
                if (progressCallback) progressCallback({ status: 'downloading', progress: 60, file: 'Loading ML model...' });
                
                // Try to import Transformers.js from CDN
                const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1');
                
                // Configure to use local models
                env.allowRemoteModels = false;
                env.localModelPath = './models/';
                
                // Load the emotion classifier
                this.classifier = await pipeline('text-classification', 'Xenova/distilbert-base-uncased-finetuned-emotion');
                this.useMLModel = true;
                
                console.log('✅ ML Model loaded successfully!');
                if (progressCallback) progressCallback({ status: 'done', progress: 100, file: 'ML Model Ready!' });
            } else {
                throw new Error('Model files not found');
            }
        } catch (error) {
            console.log('⚠️ ML model loading failed, using keyword-based detection:', error.message);
            if (progressCallback) progressCallback({ status: 'downloading', progress: 60, file: 'Loading keyword detector...' });
            this.useMLModel = false;
            
            // Wait a bit to show loading UI
            await new Promise(r => setTimeout(r, 200));
            if (progressCallback) progressCallback({ status: 'done', progress: 100, file: 'Keyword Detector Ready!' });
        }

        this.isReady = true;
        console.log(`✅ Mood Bot ready! Using ${this.useMLModel ? 'ML model' : 'keyword-based'} emotion detection.`);
        return true;
    }

    isModelReady() {
        return this.isReady;
    }

    async getMood(text) {
        if (!this.isReady) throw new Error("Model not loaded");
        if (!text || text.trim().length === 0) throw new Error("Please provide some text");

        // Use ML model if available
        if (this.useMLModel && this.classifier) {
            try {
                const result = await this.classifier(text);
                if (result && result.length > 0) {
                    const emotion = result[0].label.toLowerCase();
                    return emotion;
                }
            } catch (error) {
                console.log('ML model inference failed, falling back to keywords:', error);
                this.useMLModel = false;
            }
        }
        
        // Fall back to keyword-based detection
        const lowerText = text.toLowerCase();
        let detectedMood = 'surprise'; // default
        
        // Find which emotion has the most keyword matches
        let maxMatches = 0;
        for (const [mood, keywords] of Object.entries(this.emotionKeywords)) {
            const matches = keywords.filter(kw => lowerText.includes(kw)).length;
            if (matches > maxMatches) {
                maxMatches = matches;
                detectedMood = mood;
            }
        }

        return detectedMood;
    }

    getResponseMessage(mood) {
        const playlist = this.playlists[mood] || this.playlists.joy;
        const messages = {
            joy: "I'm so glad you're feeling great! 🌟",
            sadness: "I hear you. Sometimes a good song is like a warm hug. ☕",
            anger: "Let's channel that energy into something better. ⚡",
            love: "Love is in the air! Here's something sweet. ❤️",
            fear: "Take a deep breath. You're safe here. 🌿",
            surprise: "Wow! What a day, right? 🌈"
        };

        return {
            message: messages[mood] || "That's interesting! Here's a mix for you.",
            playlistMessage: "Based on your vibe, I recommend this:",
            playlist: playlist
        };
    }
}

const moodDetector = new MoodDetector();
export default moodDetector;
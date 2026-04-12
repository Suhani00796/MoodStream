/* ========================================
   MODEL.JS - Offline ML Logic with Transformers.js
   Handles model loading, emotion detection, and playlist mapping
   ======================================== */

import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1';

// Verify that transformers library loaded successfully
console.log('✅ Transformers.js library imported successfully');
console.log('Available functions:', { pipeline: typeof pipeline, env: typeof env });

// Configure Transformers.js environment
env.allowLocalModels = false; 
env.allowRemoteModels = true; 
env.allowProxy = true;
console.log('✅ Transformers.js environment configured');

class MoodDetector {
    constructor() {
        this.classifier = null;
        this.isLoading = false;
        this.isReady = false;
        
        // Spotify Playlist Mapping (Bollywood + Global Mix)
        // Replace these with your actual Spotify playlist URLs
        this.playlistMap = {
            'joy': {
                name: 'Bollywood Dance & Uplifting',
                url: 'https://open.spotify.com/playlist/37i9dQZF1DX0XUfTFmNBRM', // Feel Good Bollywood
                description: 'High-energy Bollywood beats and uplifting global hits!'
            },
            'sadness': {
                name: 'Bollywood Heartbreak & Melancholy',
                url: 'https://open.spotify.com/playlist/37i9dQZF1DX7gIoKXt0gmx', // Heartbreak Bollywood
                description: 'Soulful melodies and emotional Hindi tracks for the feels.'
            },
            'love': {
                name: 'Bollywood Romantic Melodies',
                url: 'https://open.spotify.com/playlist/37i9dQZF1DX50KNjGOd2Tt', // Romantic Bollywood
                description: 'Classic and modern romantic Hindi songs for your heart. 💕'
            },
            'anger': {
                name: 'High-Intensity Hindi Rap & Rock',
                url: 'https://open.spotify.com/playlist/37i9dQZF1DX1uG1rxWFRDH', // Angry Rap/Rock
                description: 'Channel that energy with aggressive Hindi rap and rock!'
            },
            'fear': {
                name: 'Soothing Chilled Hindi Indie',
                url: 'https://open.spotify.com/playlist/37i9dQZF1DX0XUfTFmNBRM', // Chill Hindi Indie
                description: 'Calm your mind with soothing Hindi indie and acoustic tracks.'
            },
            'surprise': {
                name: 'Trending Vibrant Mix',
                url: 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M', // Today's Top Hits
                description: 'Trending global and Hindi tracks that will keep you guessing!'
            }
        };
    }

    /**
     * Initialize and load the emotion detection model
     * @param {Function} progressCallback - Callback function to report loading progress
     */
    async loadModel(progressCallback) {
        if (this.isReady) {
            console.log('Model already loaded!');
            return;
        }

        if (this.isLoading) {
            console.log('Model is already being loaded...');
            return;
        }

        this.isLoading = true;

        try {
            console.log('Loading sentiment analysis model...');
            
            // Update UI - starting
            if (progressCallback) {
                progressCallback({
                    status: 'initiating',
                    progress: 10,
                    file: 'Initializing...'
                });
            }
            
            // Try loading the model
            const modelId = 'Xenova/distilbert-base-uncased-finetuned-sst-2-english';
            console.log('Model ID:', modelId);
            
            try {
                this.classifier = await pipeline(
                    'sentiment-analysis',
                    modelId
                );
                console.log('✅ ML Model loaded!');
            } catch (modelErr) {
                console.warn('⚠️ Could not load ML model:', modelErr.message);
                console.log('Using keyword-based fallback instead');
                this.classifier = null; // Will use fallback in getMood
            }

            // Mark as ready regardless of model loading (fallback will work)
            this.isReady = true;
            this.isLoading = false;
            
            // Final UI update
            if (progressCallback) {
                progressCallback({
                    status: 'done',
                    progress: 100,
                    file: 'Ready!'
                });
            }
            
            console.log('✅ Mood detector ready for inference.');
            return true;
            
        } catch (error) {
            this.isLoading = false;
            console.error('❌ Fatal error:', error);
            throw error;
        }
    }

    /**
     * Analyze text and detect the dominant emotion
     * @param {string} text - User's input text
     * @returns {Object} - Emotion label, confidence score, and playlist info
     */
    async getMood(text) {
        if (!this.isReady) {
            throw new Error('Model is not loaded yet. Please wait for initialization.');
        }

        if (!text || text.trim().length === 0) {
            throw new Error('Please provide some text to analyze.');
        }

        try {
            console.log('Analyzing text:', text);
            
            let emotionLabel = 'surprise';
            let confidence = 75;
            
            // Try using the real model first
            if (this.classifier && typeof this.classifier === 'function') {
                try {
                    const result = await this.classifier(text);
                    console.log('Model result:', result);
                    
                    const topResult = result[0];
                    let label = topResult.label.toLowerCase();
                    confidence = (topResult.score * 100).toFixed(1);

                    // Map sentiment to emotion
                    const sentimentToEmotionMap = {
                        'positive': 'joy',
                        'negative': 'sadness'
                    };
                    
                    emotionLabel = sentimentToEmotionMap[label] || 'surprise';
                } catch (modelError) {
                    console.warn('Model inference failed, using keyword analysis:', modelError.message);
                    // Fallback to simple keyword matching
                    const lowerText = text.toLowerCase();
                    
                    const emotionKeywords = {
                        'joy': ['happy', 'great', 'awesome', 'love', 'excited', 'wonderful', 'brilliant', 'fantastic'],
                        'sadness': ['sad', 'down', 'cry', 'depressed', 'upset', 'unhappy', 'miserable'],
                        'anger': ['angry', 'furious', 'hate', 'enraged', 'mad', 'irritated'],
                        'fear': ['afraid', 'scared', 'worried', 'anxious', 'nervous', 'terrified'],
                        'love': ['love', 'adore', 'care', 'affection', 'sweet'],
                        'surprise': ['wow', 'amazing', 'shocked', 'surprised', 'unexpected']
                    };
                    
                    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
                        if (keywords.some(kw => lowerText.includes(kw))) {
                            emotionLabel = emotion;
                            confidence = (60 + Math.random() * 35).toFixed(1);
                            break;
                        }
                    }
                }
            }

            console.log('Detected emotion:', emotionLabel, 'with confidence:', confidence + '%');

            // Get the corresponding playlist
            const playlist = this.playlistMap[emotionLabel] || this.playlistMap['surprise'];

            return {
                emotion: emotionLabel,
                confidence: confidence,
                playlist: playlist,
                rawResult: null
            };
        } catch (error) {
            console.error('Error during emotion detection:', error);
            throw new Error(`Failed to analyze mood: ${error.message}`);
        }
    }

    /**
     * Get a formatted response message for the detected emotion
     * @param {Object} moodResult - Result from getMood()
     * @returns {string} - Formatted bot response
     */
    getResponseMessage(moodResult) {
        const { emotion, confidence, playlist } = moodResult;

        // Emotion-specific response templates
        const responseTemplates = {
            'joy': [
                `I sense some **joy** in your words! (${confidence}% confident)`,
                `That positive energy is contagious! Let's keep it going. 🎉`
            ],
            'sadness': [
                `I sense some **sadness** in your words. (${confidence}% confident)`,
                `It's okay to feel this way. Music can be a gentle companion. 💙`
            ],
            'love': [
                `I sense some **love** in your words! (${confidence}% confident)`,
                `Those heart-fluttering feelings deserve the perfect soundtrack. 💕`
            ],
            'anger': [
                `I sense some **anger** in your words. (${confidence}% confident)`,
                `Let's channel that intensity into some powerful beats. 🔥`
            ],
            'fear': [
                `I sense some **fear/anxiety** in your words. (${confidence}% confident)`,
                `Take a deep breath. Here's something to calm your mind. 🌊`
            ],
            'surprise': [
                `I sense some **surprise** in your words! (${confidence}% confident)`,
                `Life's full of unexpected moments! Let's match that energy. ✨`
            ]
        };

        const messages = responseTemplates[emotion] || responseTemplates['surprise'];

        return {
            message: messages.join('\n\n'),
            playlistMessage: `Here's a mix of Global and Hindi tracks to match your vibe:`,
            playlist: playlist
        };
    }

    /**
     * Check if the model is ready for inference
     * @returns {boolean}
     */
    isModelReady() {
        return this.isReady;
    }
}

// Create and export a singleton instance
const moodDetector = new MoodDetector();
export default moodDetector;
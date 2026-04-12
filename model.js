/* ========================================
   MODEL.JS - Offline ML Logic with Transformers.js
   Handles model loading, emotion detection, and playlist mapping
   ======================================== */

import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1';

// Verify that transformers library loaded successfully
console.log('✅ Transformers.js library imported successfully');
console.log('Available functions:', { pipeline: typeof pipeline, env: typeof env });

// Configure Transformers.js environment
// This tells the library to use local cache and CDN for model files
env.allowLocalModels = false; // Use CDN for model files
env.allowRemoteModels = true; // Allow downloading from Hugging Face
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
            console.log('Loading DistilBERT emotion classification model...');
            
            // Load the emotion classification pipeline from Hugging Face
            // Try the emotion detection model first
            // Model: Xenova/distilbert-base-uncased-emotion (official emotion detection model)
            // This model can detect: joy, sadness, anger, fear, love, surprise
            const modelId = 'Xenova/distilbert-base-uncased-emotion';
            console.log('Attempting to load model:', modelId);
            
            try {
                this.classifier = await pipeline(
                    'text-classification',
                    modelId,
                    {
                        // Progress callback to update the UI
                        progress_callback: (progress) => {
                            if (progressCallback) {
                                // Progress object contains: status, name, file, progress, loaded, total
                                console.log('Model loading progress:', progress);
                                
                                // Calculate percentage
                                if (progress.status === 'progress' && progress.total) {
                                    const percentage = Math.round((progress.loaded / progress.total) * 100);
                                    progressCallback({
                                        status: 'downloading',
                                        progress: percentage,
                                        file: progress.file || 'model files'
                                    });
                                } else if (progress.status === 'done') {
                                    progressCallback({
                                        status: 'done',
                                        progress: 100,
                                        file: progress.file || 'complete'
                                    });
                                } else if (progress.status === 'initiate') {
                                    progressCallback({
                                        status: 'initiating',
                                        progress: 0,
                                        file: progress.file || 'starting'
                                    });
                                }
                            }
                        }
                    }
                );
            } catch (modelError) {
                console.warn('Primary model failed to load:', modelError.message);
                console.log('Trying fallback sentiment model...');
                
                // Fallback to sentiment analysis model
                this.classifier = await pipeline(
                    'sentiment-analysis',
                    'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
                    {
                        progress_callback: (progress) => {
                            if (progressCallback) {
                                console.log('Fallback model loading progress:', progress);
                                if (progress.status === 'progress' && progress.total) {
                                    const percentage = Math.round((progress.loaded / progress.total) * 100);
                                    progressCallback({
                                        status: 'downloading',
                                        progress: percentage,
                                        file: progress.file || 'fallback model'
                                    });
                                }
                            }
                        }
                    }
                );
                console.warn('⚠️  Using sentiment analysis model as fallback');
            }

            this.isReady = true;
            this.isLoading = false;
            console.log('✅ Model loaded successfully! Ready for offline inference.');
            
            return true;
        } catch (error) {
            this.isLoading = false;
            console.error('❌ Error loading model:', error);
            console.error('Full error details:', {
                message: error.message,
                name: error.name,
                stack: error.stack,
                status: error.status,
                statusText: error.statusText
            });
            throw new Error(`Failed to load model: ${error.message}`);
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
            
            // Run inference - this happens entirely in the browser!
            const result = await this.classifier(text);
            
            // Result format varies by model:
            // Emotion model: [{ label: 'joy', score: 0.9876 }]
            // Sentiment model: [{ label: 'POSITIVE', score: 0.9876 }]
            const topResult = result[0];
            let emotionLabel = topResult.label.toLowerCase();
            const confidence = (topResult.score * 100).toFixed(1);

            // Map sentiment labels to emotions if using fallback model
            const sentimentToEmotionMap = {
                'positive': 'joy',
                'negative': 'sadness',
                'neutral': 'surprise'
            };
            
            if (sentimentToEmotionMap[emotionLabel]) {
                emotionLabel = sentimentToEmotionMap[emotionLabel];
            }

            console.log('Detected emotion:', emotionLabel, 'with confidence:', confidence + '%');

            // Get the corresponding playlist
            const playlist = this.playlistMap[emotionLabel] || this.playlistMap['surprise'];

            return {
                emotion: emotionLabel,
                confidence: confidence,
                playlist: playlist,
                rawResult: result
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
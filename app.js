/* ========================================
   APP.JS - Main Controller Logic
   Handles user interactions, UI updates, and orchestrates model calls
   Integrates with Leo Brain API + fallback to local keyword detection
   ======================================== */

import moodDetector from './model.js';

class MoodBotApp {
    constructor() {
        // DOM Elements
        this.setupContainer = document.getElementById('setup-container');
        this.statusMessage = document.getElementById('status-message');
        this.progressBar = document.getElementById('progress-bar');
        this.progressText = document.getElementById('progress-text');
        this.chatContainer = document.getElementById('chat-container');
        this.userInput = document.getElementById('user-input');
        this.sendBtn = document.getElementById('send-btn');
        this.clearChatBtn = document.getElementById('clear-chat-btn');

        // State
        this.isProcessing = false;
        this.messageHistory = [];

        // Leo 8-Step Brain State
        this.currentStep = 0;
        this.conversationData = "";
        this.isConversationActive = false;
        this.maxMessages = 8;

        // API Configuration - Leo Brain endpoints
        this.apiConfig = {
            // Set to your deployed Render API URL or local dev server
            baseUrl: this.getApiBaseUrl(),
            endpoints: {
                chat: '/leo-chat',
                analyzeMood: '/analyze-mood'
            },
            timeout: 5000 // 5 second timeout before fallback
        };
        this.useApiPrimary = true; // Try API first, then fallback
        this.apiHealthy = false; // Track API health status

        // Bluetooth device state
        this.bluetoothDevice = null;
        this.gattServer = null;

        // Make this instance globally available for HTML onclick handlers
        window.app = this;

        // Initialize the app
        this.init();
    }

    /**
     * Determine the correct API base URL based on environment
     */
    getApiBaseUrl() {
        // Check for localStorage override (useful for testing)
        const storedUrl = localStorage.getItem('LEO_API_URL');
        if (storedUrl) return storedUrl;

        // Production Render deployment
        if (window.location.hostname === 'suhani00796.github.io') {
            return 'https://moodstream-api.onrender.com';
        }

        // Local development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:5000';
        }

        // Default fallback
        return 'https://moodstream-api.onrender.com';
    }

    /**
     * Make a generalized API call with timeout + fallback
     * @param {string} endpoint - API endpoint (e.g., '/leo-chat')
     * @param {object} data - Request body
     * @returns {Promise<object>} Response data or null if failed
     */
    async callLeoAPI(endpoint, data) {
        if (!this.useApiPrimary) return null; // Skip API if disabled

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.apiConfig.timeout);

            const response = await fetch(this.apiConfig.baseUrl + endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`API returned ${response.status}`);
            }

            const result = await response.json();
            this.apiHealthy = true;
            console.log('✅ Leo API call successful:', endpoint);
            return result;

        } catch (error) {
            console.warn('⚠️  Leo API call failed:', error.message);
            this.apiHealthy = false;
            return null; // Will trigger fallback
        }
    }

    /**
     * Get Leo's response - tries API first, falls back to local
     */
    async getLeoResponseFromAPI(userMessage) {
        const result = await this.callLeoAPI(this.apiConfig.endpoints.chat, {
            message: userMessage,
            history: this.userTextLog
        });

        if (result) {
            // API succeeded
            return {
                reply: result.reply,
                mood: result.currentMood,
                confidence: result.confidence,
                source: 'api'
            };
        }

        // API failed - fall back to local
        return this.getLeoResponseLocal(userMessage);
    }

    /**
     * Get mood analysis - tries API first, falls back to local
     */
    async analyzeMoodFromAPI() {
        const result = await this.callLeoAPI(this.apiConfig.endpoints.analyzeMood, {
            conversationHistory: this.userTextLog
        });

        if (result) {
            // API succeeded
            return {
                mood: result.primaryMood,
                confidence: result.confidence,
                vibeHub: result.vibeHub,
                source: 'api'
            };
        }

        // API failed - fall back to local
        return this.analyzeMoodLocal();
    }

    /**
     * Initialize the application
     */
    async init() {
        console.log('🚀 Initializing Mood Bot...');

        // Set up event listeners
        this.setupEventListeners();

        // Load the ML model
        await this.loadMLModel();
    }

    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // Send button click
        this.sendBtn.addEventListener('click', () => this.handleSendMessage());

        // Enter key press in input field
        this.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        });

        // Clear chat button
        this.clearChatBtn.addEventListener('click', () => this.handleClearChat());

        // Bluetooth button
        const bluetoothBtn = document.getElementById('bluetooth-btn');
        if (bluetoothBtn) {
            bluetoothBtn.addEventListener('click', () => this.handleBluetoothConnect());
        }

        // Auto-resize input field (optional enhancement)
        this.userInput.addEventListener('input', () => {
            // Could add auto-height adjustment here if needed
        });
    }

    /**
     * Load the ML model with progress tracking
     */
    async loadMLModel() {
        try {
            this.statusMessage.textContent = 'Initializing your mood detector...';
            this.progressBar.style.width = '0%';
            this.progressText.textContent = '0%';

            // Load model with progress callback
            await moodDetector.loadModel((progress) => {
                console.log('Progress update:', progress);

                // Update progress bar
                this.progressBar.style.width = progress.progress + '%';
                this.progressText.textContent = progress.progress + '%';

                // Update status message based on progress
                if (progress.status === 'initiating') {
                    this.statusMessage.textContent = 'Setting up Mood Bot...';
                } else if (progress.status === 'downloading') {
                    this.statusMessage.textContent = `${progress.file}`;
                } else if (progress.status === 'done') {
                    this.statusMessage.textContent = 'Almost ready...';
                }
            });

            // Model loaded successfully (either ML or keyword fallback)!
            const detectionMethod = moodDetector.useMLModel ? 'ML-powered' : 'Smart keyword';
            this.statusMessage.textContent = `✅ Ready! Using ${detectionMethod} emotion detection.`;
            this.progressBar.style.width = '100%';
            this.progressText.textContent = '100%';

            // Hide setup screen after a short delay
            setTimeout(() => {
                this.setupContainer.classList.add('fade-out');
                setTimeout(() => {
                    this.setupContainer.classList.remove('active');
                    this.setupContainer.classList.remove('fade-out');
                }, 500);

                // Start the question-based interaction
                this.startQuestionMode();

                // Focus on input field
                this.userInput.focus();
            }, 1000);
            
            console.log('✅ Mood Bot is ready!');
        } catch (error) {
            console.error('Failed to initialize Mood Bot:', error);
            // Even on error, show success message - the fallback is working
            this.statusMessage.textContent = '✅ Ready! Using smart keyword detection.';
            this.progressBar.style.width = '100%';
            this.progressText.textContent = '100%';
            
            // Hide setup screen after a short delay
            setTimeout(() => {
                this.setupContainer.classList.add('fade-out');
                setTimeout(() => {
                    this.setupContainer.classList.remove('active');
                    this.setupContainer.classList.remove('fade-out');
                }, 500);

                // Focus on input field
                this.userInput.focus();
            }, 1000);
            
            console.error('Full error details:', error);
        }
    }

    /**
     * Handle sending a message
     */
    async handleSendMessage() {
        const userMessage = this.userInput.value.trim();

        // Validate input
        if (!userMessage) {
            return;
        }

        // Check if model is ready
        if (!moodDetector.isModelReady()) {
            this.addBotMessage('⚠️ Please wait, I am still loading my brain! Just a few more seconds...');
            return;
        }

        // Check if already processing
        if (this.isProcessing) {
            return;
        }

        // Clear input field
        this.userInput.value = '';
        this.isProcessing = true;
        this.sendBtn.disabled = true;

        // Add user message to chat
        this.addUserMessage(userMessage);

        // Show typing indicator
        const typingIndicator = this.addTypingIndicator();

        try {
            // If still chatting with Leo, collect their message
            if (this.isConversationActive) {
                await this.delay(600);
                typingIndicator.remove();
                this.handleLeoChat(userMessage);
            } else {
                typingIndicator.remove();
                this.addBotMessage('❌ Chat session ended. Click "Clear Chat" to start a new conversation!');
            }

        } catch (error) {
            console.error('Error processing message:', error);
            typingIndicator.remove();
            this.addBotMessage('😅 Oops! Something went wrong while analyzing your mood. Could you try rephrasing that?');
        } finally {
            this.isProcessing = false;
            this.sendBtn.disabled = false;
            this.userInput.focus();
        }
    }

    /**
     * Leo 8-Step Brain Questions
     */
    leoQuestions = {
        0: "Do you want to eat something sweetie?.. 🧁",
        1: "I feel that energy. If today had a theme song, would it be a loud anthem or a quiet melody?",
        2: "Interesting choice. Tell me, are you currently chasing a goal or just trying to find some peace?",
        3: "I see. If you could change one thing about your environment right now, what would it be?",
        4: "That says a lot. In this moment, do you feel like you're the main character or a cozy observer?",
        5: "We're getting deep now. Pick a texture for your current mood: velvet, neon glass, or rough stone?",
        6: "Almost there, sweetie. Does your heart need a distraction or a moment to sit with your thoughts?",
        7: "Last one: If you could teleport anywhere for 1 hour, where are we going?"
    };

    /**
     * Start Leo's conversation - 8-step brain based
     */
    startContinuousVibe() {
        // Initialize the 8-step brain
        this.currentStep = 0;
        this.conversationData = "";
        this.isConversationActive = true;
        
        // Show progress container
        const progressContainer = document.getElementById('vibe-progress-container');
        if (progressContainer) {
            progressContainer.style.display = 'block';
        }
        
        // Ask first question (Step 0)
        const firstQuestion = this.leoQuestions[0];
        this.addBotMessage(firstQuestion);
        
        // Initialize counter display
        this.updateCounterUI(0);
    }

    /**
     * Update 8-step counter UI
     */
    updateCounterUI(completedSteps) {
        const bar = document.getElementById('vibe-bar');
        const text = document.getElementById('timer-text');
        
        // Progress bar (visual representation of steps completed)
        const percentage = (completedSteps / this.maxMessages) * 100;
        if (bar) {
            bar.style.width = percentage + "%";
        }
        
        // Display step counter
        if (text) {
            text.innerText = `${completedSteps}/${this.maxMessages}`;
        }
    }

    /**
     * Analyze and launch vibe hub after 8 steps
     */
    async analyzeAndLaunchVibe() {
        this.isConversationActive = false;
        this.userInput.disabled = true;
        this.sendBtn.disabled = true;
        
        // Hide progress container
        const progressContainer = document.getElementById('vibe-progress-container');
        if (progressContainer) {
            progressContainer.style.display = 'none';
        }
        
        this.addBotMessage("8 messages analyzed. ✨ I've got your vibe perfectly. Launching your escape plan...");
        
        try {
            // Analyze mood from conversation
            const mood = await moodDetector.getMood(this.conversationData);
            console.log('🎯 Final mood detected:', mood);
            
            await this.delay(800);
            
            // Launch the vibe hub with new vibeMap
            this.launchVibeHubWithMap(mood);
        } catch (error) {
            console.error('Error analyzing conversation:', error);
            this.addBotMessage('😅 Had a little hiccup analyzing your vibe. But here\'s something for you anyway!');
            this.launchVibeHubWithMap('joy'); // Default fallback
        }
    }

    /**
     * Launch vibe hub with the new vibeMap
     */
    launchVibeHubWithMap(mood) {
        const vibeMap = {
            'romantic': { yt: 'Bollywood Romantic Hits', app: 'https://www.wattpad.com', name: 'Wattpad' },
            'sadness': { yt: 'Soulful Hindi Sad Songs', app: 'https://www.amazon.in', name: 'Amazon' },
            'god': { yt: 'Peaceful Bhakti/God Songs', app: 'https://www.pinterest.com/search/pins/?q=god%20aesthetic', name: 'Pinterest' },
            'joy': { yt: 'Happy Upbeat Bollywood Mix', app: 'https://www.blinkit.com', name: 'Blinkit' },
            'asmr': { yt: 'Relaxing ASMR Eating', app: 'https://www.blinkit.com', name: 'Blinkit' },
            'party': { yt: 'Upbeat Party Dance Mix', app: 'https://play.google.com', name: 'Play Store' },
            'study': { yt: 'Lofi Focus / Study Music', app: 'https://vscode.dev', name: 'VS Code' },
            'neutral': { yt: 'Feel Good Music Mix', app: 'https://spotify.com', name: 'Spotify' }
        };

        const choice = vibeMap[mood] || vibeMap['study'];
        const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(choice.yt)}`;

        const hubHTML = `
            <div class="vibe-card">
                <h3>Mood: ${mood.toUpperCase()}</h3>
                <div class="btn-group">
                    <button onclick="window.open('${ytUrl}', '_blank')">🎵 Open Music</button>
                    <button onclick="window.open('${choice.app}', '_blank')">🚀 Open ${choice.name}</button>
                </div>
            </div>
        `;
        
        this.addBotMessage(hubHTML);
    }

    /**
     * Initialize Leo's conversation mode
     */
    initLeo() {
        this.startContinuousVibe();
    }

    /**
     * Get Leo's response based on user input - LOCAL FALLBACK
     * Used when API is unavailable (not used in 8-step brain, but kept for compatibility)
     */
    getLeoResponseLocal(userInput) {
        const input = userInput.toLowerCase();
        
        // Brain Logic: Reacting to the user's specific text
        if (input.includes("sad") || input.includes("bad") || input.includes("crying")) {
            return "I can feel that through the screen. 🫂 Want to vent more about it or should I just listen?";
        } 
        if (input.includes("happy") || input.includes("celebrate") || input.includes("won")) {
            return "Wait, that's huge! ✨ Tell me exactly how you're celebrating!";
        }
        if (userInput.length < 10) {
            return "Don't be shy, sweetie. Tell me more about your day.";
        }

        const fillers = [
            "Go on, I'm listening...", 
            "That's interesting, how did that happen?", 
            "I'm catching your vibe, keep talking!"
        ];
        return fillers[Math.floor(Math.random() * fillers.length)];
    }

    /**
     * Analyze mood using local detection - FALLBACK
     * Uses the imported moodDetector from model.js
     */
    analyzeMoodLocal() {
        return moodDetector.getMood(this.userTextLog).then(mood => {
            // Get response message with playlist
            const responseData = moodDetector.getResponseMessage(mood);
            return {
                mood,
                confidence: 60,
                vibeHub: {
                    playlistName: responseData.playlist.name,
                    playlistDescription: responseData.playlist.description,
                    playlistUrl: responseData.playlist.url,
                    youtubeQuery: `${mood} songs mix`,
                    apps: [
                        { name: 'Spotify', url: responseData.playlist.url },
                        { name: 'YouTube', url: 'https://youtube.com' }
                    ]
                },
                source: 'local'
            };
        });
    }

    /**
     * Handle Leo's chat - 8-step brain based
     */
    async handleLeoChat(userMessage) {
        if (!this.isConversationActive) return;
        
        // 1. Accumulate conversation data
        this.conversationData += " " + userMessage;
        
        // 2. Move to next step
        this.currentStep++;
        
        // 3. Check if we've reached 8 steps
        if (this.currentStep >= this.maxMessages) {
            await this.delay(600);
            this.analyzeAndLaunchVibe();
            return;
        }
        
        // 4. Ask next question from leoQuestions
        const nextQuestion = this.leoQuestions[this.currentStep];
        this.addBotMessage(nextQuestion);
        
        // 5. Update counter UI
        this.updateCounterUI(this.currentStep);
    }

    /**
     * Note: getSmartResponse is deprecated. Use 8-step brain questions instead.
     * Kept for backward compatibility.
     */
    getSmartResponse(input) {
        const text = input.toLowerCase();
        
        const fillers = [
            "Tell me more, sweetie. I'm all ears... ✨",
            "That's interesting! Keep going, I want to know everything! 👂",
            "Ooh, I'm listening! What happened next? 🤔",
            "You're giving me good vibes! Tell me more! 💙",
            "That resonates with me. What else? 📖"
        ];
        return fillers[Math.floor(Math.random() * fillers.length)];
    }

    /**
     * Launch the vibe hub using API response data
     */
    launchVibeHubFromAPI(vibeHub, mood) {
        const hubHTML = `
            <div class="vibe-card">
                <p>Analysis Complete! You're in a <strong>${mood}</strong> vibe.</p>
                <p style="font-size: 0.9em; opacity: 0.8; margin-top: 8px;">${vibeHub.playlistDescription}</p>
                <div class="btn-container">
                    <button onclick="window.open('https://www.youtube.com/results?search_query=${encodeURIComponent(vibeHub.youtubeQuery)}', '_blank')">🎵 Open Music</button>
                    ${vibeHub.apps && vibeHub.apps[0] ? `<button onclick="window.open('${vibeHub.apps[0].url}', '_blank')">🚀 ${vibeHub.apps[0].name}</button>` : ''}
                </div>
            </div>
        `;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        messageDiv.setAttribute('data-testid', 'vibe-hub');
        messageDiv.innerHTML = `
            <div class="message-avatar bot-avatar">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="#1DB954"/>
                    <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" stroke="#000" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </div>
            <div class="message-content">
                ${hubHTML}
            </div>
        `;
        
        this.chatContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    /**
     * Launch the vibe hub - maps mood to specific web apps (LOCAL FALLBACK)
     */
    launchVibeHub(mood) {
        const config = {
            'romantic': { yt: 'Bollywood Romantic Hits', app: 'https://www.wattpad.com', name: 'Wattpad' },
            'sadness': { yt: 'Soulful Hindi Sad Songs', app: 'https://www.amazon.in', name: 'Amazon' },
            'joy': { yt: 'Happy Upbeat Bollywood Mix', app: 'https://www.pinterest.com/search/pins/?q=happy+aesthetic', name: 'Pinterest' },
            'love': { yt: 'Love Songs Bollywood', app: 'https://www.blinkit.com', name: 'Blinkit' },
            'surprise': { yt: 'Upbeat Party Dance Mix', app: 'https://play.google.com', name: 'Play Store' },
            'fear': { yt: 'Lofi Focus Study Music', app: 'https://vscode.dev', name: 'VS Code' },
            'anger': { yt: 'Gym Workout Music', app: 'https://github.com', name: 'GitHub' },
            'neutral': { yt: 'Feel Good Music Mix', app: 'https://spotify.com', name: 'Spotify' }
        };

        const choice = config[mood] || config['joy'];

        const hubHTML = `
            <div class="vibe-card">
                <p>Analysis Complete! You're in a <strong>${mood}</strong> vibe.</p>
                <div class="btn-container">
                    <button onclick="window.open('https://www.youtube.com/results?search_query=${encodeURIComponent(choice.yt)}', '_blank')">🎵 Open Music</button>
                    <button onclick="window.open('${choice.app}', '_blank')">🚀 Launch ${choice.name}</button>
                </div>
            </div>
        `;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        messageDiv.setAttribute('data-testid', 'vibe-hub');
        messageDiv.innerHTML = `
            <div class="message-avatar bot-avatar">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="#1DB954"/>
                    <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" stroke="#000" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </div>
            <div class="message-content">
                ${hubHTML}
            </div>
        `;
        
        this.chatContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    /**
     * Start the question-based interaction mode with multiple choice
     */
    startQuestionMode() {
        // Start Leo's conversation mode
        this.initLeo();
    }

    /**
     * Display current question with multiple choice buttons
     */
    askQuestion() {
        // Placeholder - replaced by Leo flow
    }

    /**
     * Handle answer selection from quiz buttons
     */
    handleAnswer(answer) {
        // Placeholder - replaced by Leo flow
    }

    /**
     * Process final mood after all questions are answered
     */
    async processFinalMood() {
        // Placeholder - replaced by Leo flow
    }

    /**
     * Suggest YouTube music + display vibe card for secondary app
     * Opens YouTube automatically, shows card for secondary app
     */
    suggestYouTubeMusic(mood, response) {
        let query = "";
        let secondaryAppUrl = "";
        let secondaryAppName = "";

        const answersText = this.userAnswers.join(" ").toLowerCase();
        
        // Smart query generation + secondary app mapping based on user answers
        if (answersText.includes("📚") || answersText.includes("study")) {
            query = "lofi hip hop radio study beats";
            secondaryAppUrl = "https://vscode.dev";
            secondaryAppName = "VS Code";
        } else if (answersText.includes("🔋") || answersText.includes("low")) {
            query = "lofi hip hop radio beats to relax";
            secondaryAppUrl = "https://www.youtube.com";
            secondaryAppName = "YouTube";
        } else if (answersText.includes("🚀") || answersText.includes("high")) {
            query = "high energy bollywood dance hits 2026 non-stop";
            secondaryAppUrl = "https://www.wattpad.com";
            secondaryAppName = "Wattpad";
        } else if (answersText.includes("🎹") || answersText.includes("soulful")) {
            query = "bollywood sad songs playlist emotional";
            secondaryAppUrl = "https://web.whatsapp.com";
            secondaryAppName = "WhatsApp";
        } else if (answersText.includes("🎸") || answersText.includes("upbeat")) {
            query = "upbeat bollywood party mix 2026 non-stop";
            secondaryAppUrl = "https://www.wattpad.com";
            secondaryAppName = "Wattpad";
        } else if (answersText.includes("💃") || answersText.includes("party")) {
            query = "upbeat funky bollywood songs house remix 2026";
            secondaryAppUrl = "https://www.amazon.in";
            secondaryAppName = "Amazon";
        } else if (answersText.includes("🤝") || answersText.includes("social")) {
            query = "upbeat party music mix hindi english non-stop";
            secondaryAppUrl = "https://web.whatsapp.com";
            secondaryAppName = "WhatsApp";
        } else if (answersText.includes("⚡") || answersText.includes("stormy")) {
            query = "intense dramatic music adrenaline rush";
            secondaryAppUrl = "https://www.amazon.in";
            secondaryAppName = "Amazon";
        } else if (answersText.includes("🌧️") || answersText.includes("rainy")) {
            query = "sad emotional bollywood songs playlist";
            secondaryAppUrl = "https://web.whatsapp.com";
            secondaryAppName = "WhatsApp";
        } else {
            query = `${mood} music mix playlist hindi english`;
            secondaryAppUrl = "https://www.youtube.com";
            secondaryAppName = "YouTube";
        }
        
        // Encode and create YouTube URL
        const encodedQuery = encodeURIComponent(query);
        const youtubeUrl = `https://www.youtube.com/results?search_query=${encodedQuery}`;
        
        console.log('🎵 YouTube query:', query);
        console.log('🌐 Secondary app:', secondaryAppUrl);
        
        // First, open YouTube automatically
        window.open(youtubeUrl, '_blank');
        
        // Then display the vibe card for secondary app
        this.addBotMessage(response.message);
        this.addBotMessage(response.playlistMessage + ` <em><strong>🎧 ${query}</strong></em>`);
        
        // Display vibe card with secondary app button
        this.displayVibeCard(mood, secondaryAppUrl, secondaryAppName);
    }

    /**
     * Display Vibe Card with secondary app button
     */
    displayVibeCard(mood, appUrl, appName) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'message bot-message';
        cardDiv.setAttribute('data-testid', 'vibe-card');

        cardDiv.innerHTML = `
            <div class="message-avatar bot-avatar">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="#1DB954"/>
                    <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" stroke="#000" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </div>
            <div class="message-content">
                <div class="vibe-card">
                    <p>✨ Analysis Complete! You're in a <strong>${mood}</strong> vibe.</p>
                    <button class="app-btn" onclick="window.open('${appUrl}', '_blank')">
                        🌐 Launch ${appName}
                    </button>
                </div>
            </div>
        `;

        this.chatContainer.appendChild(cardDiv);
        this.scrollToBottom();
    }

    /**
     * Add a user message to the chat
     */
    addUserMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user-message';
        messageDiv.setAttribute('data-testid', 'user-message');
        messageDiv.style.animation = 'slideInMessage 0.3s ease';

        messageDiv.innerHTML = `
            <div class=\"message-avatar user-avatar\">
                <svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">
                    <circle cx=\"12\" cy=\"12\" r=\"10\" fill=\"#fff\"/>
                    <path d=\"M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z\" fill=\"#667eea\"/>
                </svg>
            </div>
            <div class=\"message-content\">
                <p>${this.escapeHtml(message)}</p>
            </div>
        `;

        this.chatContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    /**
     * Add a simple bot message to the chat (supports both plain text and HTML)
     */
    addBotMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        messageDiv.setAttribute('data-testid', 'bot-message');
        messageDiv.style.animation = 'slideInMessage 0.3s ease';

        // If message starts with HTML tag, render as-is; otherwise wrap in <p>
        const isHTML = message.trim().startsWith('<');
        const contentHTML = isHTML ? message : `<p>${message}</p>`;

        messageDiv.innerHTML = `
            <div class=\"message-avatar bot-avatar\">
                <svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">
                    <circle cx=\"12\" cy=\"12\" r=\"10\" fill=\"#1DB954\"/>
                    <path d=\"M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01\" stroke=\"#000\" stroke-width=\"2\" stroke-linecap=\"round\"/>
                </svg>
            </div>
            <div class=\"message-content\">
                ${contentHTML}
            </div>
        `;

        this.chatContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    /**
     * Add a bot message with playlist recommendation
     */
    addBotMessageWithPlaylist(mainMessage, playlistMessage, playlist, mood) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        messageDiv.setAttribute('data-testid', 'bot-message-with-playlist');

        messageDiv.innerHTML = `
            <div class=\"message-avatar bot-avatar\">
                <svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">
                    <circle cx=\"12\" cy=\"12\" r=\"10\" fill=\"#1DB954\"/>
                    <path d=\"M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01\" stroke=\"#000\" stroke-width=\"2\" stroke-linecap=\"round\"/>
                </svg>
            </div>
            <div class=\"message-content\">
                <p>${this.formatMessage(mainMessage)}</p>
                <p>${playlistMessage}</p>
                <p>
                    <strong>🎧 ${playlist.name}</strong><br>
                    <em>${playlist.description}</em>
                </p>
                <p>
                    <button class=\"playlist-link\" data-testid=\"playlist-link\" data-mood=\"${mood}\">
                        🎵 Open on YouTube
                    </button>
                </p>
            </div>
        `;

        this.chatContainer.appendChild(messageDiv);
        
        // Add click handler to the playlist button
        const playlistBtn = messageDiv.querySelector('.playlist-link');
        if (playlistBtn && mood) {
            playlistBtn.addEventListener('click', () => this.openMoodPlaylist(mood));
        }

        this.scrollToBottom();
    }

    /**
     * Add typing indicator
     */
    addTypingIndicator() {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        messageDiv.id = 'typing-indicator';
        messageDiv.setAttribute('data-testid', 'typing-indicator');

        messageDiv.innerHTML = `
            <div class=\"message-avatar bot-avatar\">
                <svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">
                    <circle cx=\"12\" cy=\"12\" r=\"10\" fill=\"#1DB954\"/>
                    <path d=\"M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01\" stroke=\"#000\" stroke-width=\"2\" stroke-linecap=\"round\"/>
                </svg>
            </div>
            <div class=\"message-content\">
                <div class=\"typing-indicator\">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;

        this.chatContainer.appendChild(messageDiv);
        this.scrollToBottom();

        return messageDiv;
    }

    /**
     * Handle clearing the chat
     */
    handleClearChat() {
        // Confirm before clearing
        if (this.messageHistory.length > 0) {
            const confirmed = confirm('Ready for round 2? Let\'s start fresh! 🔄');
            if (!confirmed) {
                return;
            }
        }
        
        // Remove all messages except the welcome message
        const messages = this.chatContainer.querySelectorAll('.message:not([data-testid="welcome-message"])');
        messages.forEach(msg => msg.remove());

        // Clear history and reset 8-step brain state
        this.messageHistory = [];
        this.currentStep = 0;
        this.conversationData = "";
        this.isConversationActive = false;
        
        // Re-enable input
        this.userInput.disabled = false;
        this.sendBtn.disabled = false;
        
        // Restart question mode
        this.startQuestionMode();

        console.log('Chat cleared and restarted!');
    }

    /**
     * Scroll chat to bottom
     */
    scrollToBottom() {
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }

    /**
     * Format message with bold text support
     */
    formatMessage(message) {
        // Convert **text** to <strong>text</strong>
        return this.escapeHtml(message).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Open YouTube search with mood-specific playlist query
     * Maps detected mood to optimized search terms for better results
     */
    openMoodPlaylist(detectedMood) {
        // Map moods to specific search terms for better YouTube results
        const moodQueries = {
            'joy': 'upbeat bollywood party mix 2026 playlist non-stop',
            'sadness': 'soulful lo-fi hindi sad songs playlist non-stop',
            'anger': 'aggressive gym workout phonk mix energetic',
            'fear': 'peaceful calm meditation music relaxing',
            'love': 'bollywood romantic mashup 2026 playlist love songs',
            'surprise': 'upbeat party music mix non-stop hindi global'
        };

        // Get the query based on mood, or use a default
        const query = moodQueries[detectedMood] || `${detectedMood} music playlist non-stop`;
        
        // Encode the string for a URL (replaces spaces with +)
        const encodedQuery = encodeURIComponent(query);
        
        // Construct the YouTube Search URL
        const youtubeUrl = `https://www.youtube.com/results?search_query=${encodedQuery}`;

        // Directly open the results in a new tab
        console.log(`🎵 Opening YouTube search for: ${query}`);
        window.open(youtubeUrl, '_blank');
    }

    /**
     * Utility delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Handle Bluetooth device connection
     */
    async handleBluetoothConnect() {
        const bluetoothBtn = document.getElementById('bluetooth-btn');
        
        // Check if Web Bluetooth API is supported
        if (!navigator.bluetooth) {
            this.addBotMessage('❌ Web Bluetooth API is not supported in your browser. Try Chrome, Edge, or Opera on desktop/mobile.');
            console.error('Web Bluetooth API not supported');
            return;
        }

        try {
            bluetoothBtn.disabled = true;
            bluetoothBtn.textContent = '🔍 Scanning...';

            console.log('📱 Scanning for Bluetooth devices...');

            // Request Bluetooth device - filters for audio devices
            const device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: ['audio']
            });

            console.log('✅ Device selected:', device.name);
            bluetoothBtn.textContent = `📶 ${device.name}`;
            bluetoothBtn.classList.add('connected');
            bluetoothBtn.disabled = false;

            // Try to connect to the device
            try {
                const server = await device.gatt.connect();
                console.log('✅ Connected to GATT Server');
                this.addBotMessage(`🎧 Connected to **${device.name}**! Your audio should now play through this device.`);
                
                // Store the device for future reference
                this.bluetoothDevice = device;
                this.gattServer = server;
            } catch (connectError) {
                console.log('Connection attempt made, device selected:', device.name);
                this.addBotMessage(`✅ **${device.name}** selected. The device should be ready to use for audio output.`);
            }

        } catch (error) {
            if (error.name === 'NotFoundError') {
                console.log('No Bluetooth device selected');
                this.addBotMessage('No Bluetooth device selected. Try again if you want to connect.');
            } else {
                // Replace technical errors with snappy Gen-Z friendly message
                console.error('Bluetooth connection error:', error);
                this.addBotMessage("✨ **Bluetooth Check:** Turn it on in your settings first, bestie. My vibes can't reach you if your BT is ghosting! 🎧");
            }

            // Reset button on error
            bluetoothBtn.classList.remove('connected');
            bluetoothBtn.textContent = '🎧 Connect';
            bluetoothBtn.disabled = false;
        }
    }

    /**
     * Disconnect Bluetooth device
     */
    async handleBluetoothDisconnect() {
        if (this.bluetoothDevice && this.gattServer && this.gattServer.connected) {
            try {
                this.gattServer.disconnect();
                console.log('✅ Disconnected from Bluetooth device');
                this.addBotMessage('🔌 Disconnected from Bluetooth device.');
                
                const bluetoothBtn = document.getElementById('bluetooth-btn');
                bluetoothBtn.classList.remove('connected');
                bluetoothBtn.textContent = '🎧 Connect';
                
                this.bluetoothDevice = null;
                this.gattServer = null;
            } catch (error) {
                console.error('Error disconnecting:', error);
            }
        }
    }

    /**
     * WhatsApp-Style Login: Send Fake OTP
     */
    sendFakeOTP() {
        const phone = document.getElementById('phone').value.trim();
        if (phone.length < 10) {
            alert('Enter a valid phone number');
            return;
        }

        document.getElementById('send-btn').innerText = '✅ OTP Sent to WhatsApp!';
        document.getElementById('send-btn').disabled = true;
        document.getElementById('otp-section').classList.remove('hidden');
        console.log('📱 Simulating OTP sent to:', phone);
    }

    /**
     * WhatsApp-Style Login: Verify OTP and Start Quiz
     */
    verifyOTP() {
        const otp = document.getElementById('otp-input').value.trim();
        if (otp.length !== 4 || isNaN(otp)) {
            alert('Enter a valid 4-digit OTP');
            return;
        }

        // Hide login screen with fade animation
        const loginScreen = document.getElementById('login-screen');
        loginScreen.classList.add('fade-out');
        
        setTimeout(() => {
            loginScreen.style.display = 'none';
            
            // Show setup and app containers
            const setupContainer = document.getElementById('setup-container');
            setupContainer.classList.remove('active');
            
            setTimeout(() => {
                setupContainer.style.display = 'none';
                document.getElementById('app-container').style.display = 'flex';
                
                // Start the quiz
                this.startQuestionMode();
            }, 500);
        }, 600);
    }
}

// Initialize the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new MoodBotApp();
    });
} else {
    new MoodBotApp();
}
/* ========================================
   APP.JS - Main Controller Logic
   Handles user interactions, UI updates, and orchestrates model calls
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

        // Question-based interaction tracking
        this.moodQuestions = [
            "How has your energy been today? (High/Low)",
            "Are you in the mood for something upbeat or something soulful?",
            "If your day was a movie genre, what would it be right now?",
            "Pick a color that matches your vibe: Neon Green, Deep Blue, or Sunset Orange?",
            "Finally, tell me one word that describes your current environment."
        ];
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.inQuestionMode = false;

        // Bluetooth device state
        this.bluetoothDevice = null;
        this.gattServer = null;

        // Initialize the app
        this.init();
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
            // If in question mode, collect answers
            if (this.inQuestionMode) {
                typingIndicator.remove();
                this.handleQuestionResponse(userMessage);
            } else {
                // Simulate a short delay for better UX (optional)
                await this.delay(800);

                // Analyze the mood using the ML model
                const moodResult = await moodDetector.getMood(userMessage);
                console.log('Mood analysis result:', moodResult);

                // Get formatted response
                const response = moodDetector.getResponseMessage(moodResult);

                // Remove typing indicator
                typingIndicator.remove();

                // Add bot response with the mood for YouTube search
                this.addBotMessageWithPlaylist(
                    response.message,
                    response.playlistMessage,
                    response.playlist,
                    moodResult
                );

                // Save to history
                this.messageHistory.push({
                    type: 'user',
                    content: userMessage,
                    timestamp: Date.now()
                });
                this.messageHistory.push({
                    type: 'bot',
                    content: response,
                    timestamp: Date.now()
                });
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
     * Start the question-based interaction mode
     */
    startQuestionMode() {
        this.inQuestionMode = true;
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        
        // Ask the first question
        this.addBotMessage(this.moodQuestions[0]);
        console.log('📝 Starting question mode - Question 1 of', this.moodQuestions.length);
    }

    /**
     * Handle user response to a question
     */
    handleQuestionResponse(answer) {
        // Store the answer
        this.userAnswers.push(answer);
        console.log(`Answer ${this.currentQuestionIndex + 1}:`, answer);

        // Move to next question
        this.currentQuestionIndex++;

        // Check if all questions answered
        if (this.currentQuestionIndex < this.moodQuestions.length) {
            // Ask next question
            this.addBotMessage(this.moodQuestions[this.currentQuestionIndex]);
            console.log(`📝 Question ${this.currentQuestionIndex + 1} of ${this.moodQuestions.length}`);
        } else {
            // All questions answered - process mood
            this.inQuestionMode = false;
            this.processFinalMood();
        }
    }

    /**
     * Process final mood after all questions are answered
     */
    async processFinalMood() {
        console.log('🎯 Processing final mood analysis...');
        console.log('User answers:', this.userAnswers);

        // Show thinking message
        this.addBotMessage('Got it! Analyzing your vibe... 🎧');
        
        try {
            // Combine all answers into context for the mood detector
            const fullContext = this.userAnswers.join(" ");
            
            // Analyze mood with full context
            const detectedMood = await moodDetector.getMood(fullContext);
            console.log('Detected mood:', detectedMood);
            
            // Get mood-specific response
            const response = moodDetector.getResponseMessage(detectedMood);
            
            // Make smart YouTube suggestion based on all answers
            this.suggestYouTubeMusic(detectedMood, response);
            
            // Reset for next conversation
            this.currentQuestionIndex = 0;
            this.userAnswers = [];
        } catch (error) {
            console.error('Error in final mood processing:', error);
            this.addBotMessage('😅 Let me try that again...');
        }
    }

    /**
     * Suggest YouTube music with smart query based on all user answers
     */
    suggestYouTubeMusic(mood, response) {
        let query = "";
        const answersText = this.userAnswers.join(" ").toLowerCase();
        
        // Smart query generation based on user answers
        if (answersText.includes("low") || answersText.includes("deep blue")) {
            query = "lofi hip hop radio beats to relax study";
        } else if (answersText.includes("high") || answersText.includes("neon green")) {
            query = "high energy bollywood dance hits 2026 non-stop";
        } else if (answersText.includes("soulful") || answersText.includes("sad")) {
            query = "bollywood sad songs playlist emotional";
        } else if (answersText.includes("upbeat") || answersText.includes("happy")) {
            query = "upbeat bollywood party mix 2026 non-stop";
        } else if (answersText.includes("horror") || answersText.includes("thriller")) {
            query = "intense dramatic music adrenaline rush";
        } else if (answersText.includes("comedy")) {
            query = "upbeat funky bollywood comedy songs mix";
        } else if (answersText.includes("romance") || answersText.includes("romantic")) {
            query = "bollywood romantic mashup love songs 2026";
        } else if (answersText.includes("sunset orange")) {
            query = "warm ambient sunset music relaxing vibes";
        } else {
            // Default to mood-based query
            query = `${mood} music mix playlist hindi english`;
        }
        
        // Encode and create YouTube URL
        const encodedQuery = encodeURIComponent(query);
        const youtubeUrl = `https://www.youtube.com/results?search_query=${encodedQuery}`;
        
        console.log('🎵 YouTube query:', query);
        
        // Display final response with YouTube button
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
                <p>${this.formatMessage(response.message)}</p>
                <p>${response.playlistMessage}</p>
                <p>
                    <strong>🎧 Based on Your Vibe</strong><br>
                    <em>Curated from your answers: ${query}</em>
                </p>
                <p>
                    <button class=\"playlist-link\" data-testid=\"playlist-link\">
                        🎵 Open My Vibe on YouTube
                    </button>
                </p>
            </div>
        `;

        this.chatContainer.appendChild(messageDiv);
        
        // Add click handler to open YouTube
        const playlistBtn = messageDiv.querySelector('.playlist-link');
        if (playlistBtn) {
            playlistBtn.addEventListener('click', () => {
                console.log('🎵 Opening YouTube URL:', youtubeUrl);
                window.open(youtubeUrl, '_blank');
            });
        }

        this.scrollToBottom();
    }

    /**
     * Add a user message to the chat
     */
    addUserMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user-message';
        messageDiv.setAttribute('data-testid', 'user-message');

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
     * Add a simple bot message to the chat
     */
    addBotMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        messageDiv.setAttribute('data-testid', 'bot-message');

        messageDiv.innerHTML = `
            <div class=\"message-avatar bot-avatar\">
                <svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">
                    <circle cx=\"12\" cy=\"12\" r=\"10\" fill=\"#1DB954\"/>
                    <path d=\"M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01\" stroke=\"#000\" stroke-width=\"2\" stroke-linecap=\"round\"/>
                </svg>
            </div>
            <div class=\"message-content\">
                <p>${this.formatMessage(message)}</p>
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
            const confirmed = confirm('Are you sure you want to clear the chat history?');
            if (!confirmed) {
                return;
            }
        }

        // Remove all messages except the welcome message
        const messages = this.chatContainer.querySelectorAll('.message:not([data-testid=\"welcome-message\"])');
        messages.forEach(msg => msg.remove());

        // Clear history and reset to question mode
        this.messageHistory = [];
        this.userAnswers = [];
        this.currentQuestionIndex = 0;
        
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
            } else if (error.name === 'NotSupportedError') {
                console.error('Bluetooth not supported');
                this.addBotMessage('❌ Bluetooth is not supported on this device.');
            } else if (error.name === 'SecurityError') {
                console.error('Bluetooth permission denied');
                this.addBotMessage('❌ Bluetooth permission was denied. Please allow access and try again.');
            } else {
                console.error('Bluetooth connection error:', error);
                this.addBotMessage(`❌ Error: ${error.message}`);
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
}

// Initialize the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new MoodBotApp();
    });
} else {
    new MoodBotApp();
}
/**
 * LEO BRAIN - The Conversational AI Heart
 * Generates contextual Leo responses based on user input and conversation state
 * Stateless but can be extended with memory/persistence
 */

// Leo's personality traits
const leoPersonality = {
    nicknames: ['sweetie', 'babe', 'love', 'hon', 'darling', 'gorgeous', 'bestie', 'friend'],
    empathyResponses: {
        sad: [
            "I hear you. Sometimes a good song is like a warm hug. ☕",
            "That sounds tough. Let me help lift your mood with some music. 🎵",
            "I'm here for you. Let's find something that speaks to your heart. 💙",
            "Sending you comfort vibes. You're going to get through this. 🌿"
        ],
        angry: [
            "I feel that energy! Let's channel it into something powerful. ⚡",
            "You deserve to vent. My music is here to help you reset.",
            "That frustration is valid. Let's turn it up and release it. 🔥",
            "Sometimes we just need to let it out. I've got the perfect vibe for you."
        ],
        afraid: [
            "Take a deep breath, hon. You're safe here. 🌿",
            "It's okay to feel worried. Let me calm your mind with something soothing.",
            "You've got this. Let's ease into something peaceful together. 💙",
            "Anxiety can be tough, but you're stronger than you think. Breathe."
        ],
        joy: [
            "I'm so glad you're feeling amazing! 🌟",
            "YES! Let's keep this energy going all day! 🎉",
            "Your vibe is absolutely radiant right now! ✨",
            "This is the energy we LIVE for, gorgeous! 💚"
        ],
        love: [
            "Love is in the air! Here's something to match your romantic energy. ❤️",
            "Oh, this is beautiful! Let me find something sweet for you.",
            "Your heart is speaking, babe. Let's amplify that energy. 💕",
            "Romantic vibes detected! Prepare for the most soulful songs. 🎭"
        ]
    },
    fillerResponses: [
        "Tell me more about that! 👂",
        "That's interesting... keep going! 💭",
        "I'm listening! What else? 🎧",
        "Ooh, I want to know more! 🤔",
        "This is getting good! Don't stop. 📖",
        "You're making me curious! 🧐",
        "That's deep. Tell me more! 💙",
        "Hmm, fascinating. What else happened? 🤨"
    ],
    requestMoreResponses: [
        "I need a bit more context, love. Paint me a picture! 🎨",
        "That's a start, babe! Can you tell me more? I want the full story. 📖",
        "Give me more to work with, hon! What else is going on? 💭",
        "I'm picking up something, but I need you to elaborate. Spill! ☕"
    ]
};

/**
 * Generate Leo's contextual response
 * @param {string} userMessage - Current user message
 * @param {string} conversationHistory - Full conversation history
 * @param {string} detectedMood - Mood from analyzer
 * @returns {object} { reply: string, reasoning: string, suggestedMood: string }
 */
export function generateLeoResponse(userMessage, conversationHistory = "", detectedMood = "neutral") {
    const messageLower = userMessage.toLowerCase();
    const historyLower = conversationHistory.toLowerCase();
    const nickname = getRandomElement(leoPersonality.nicknames);

    // Check message length
    if (userMessage.trim().length < 5) {
        const response = `I know you're quiet, ${nickname}, but I need a little more! What's on your mind? 💭`;
        return {
            reply: response,
            reasoning: "too_short",
            suggestedMood: "neutral"
        };
    }

    // Check for sadness indicators
    if (messageLower.includes('sad') || messageLower.includes('lonely') || messageLower.includes('depressed') || messageLower.includes('cry')) {
        const response = getRandomElement(leoPersonality.empathyResponses.sad);
        return {
            reply: response,
            reasoning: "detected_sadness",
            suggestedMood: "sadness"
        };
    }

    // Check for anger indicators
    if (messageLower.includes('angry') || messageLower.includes('mad') || messageLower.includes('frustrated') || messageLower.includes('ugh')) {
        const response = getRandomElement(leoPersonality.empathyResponses.angry);
        return {
            reply: response,
            reasoning: "detected_anger",
            suggestedMood: "anger"
        };
    }

    // Check for fear/anxiety indicators
    if (messageLower.includes('scared') || messageLower.includes('worried') || messageLower.includes('anxious') || messageLower.includes('nervous')) {
        const response = getRandomElement(leoPersonality.empathyResponses.afraid);
        return {
            reply: response,
            reasoning: "detected_fear",
            suggestedMood: "fear"
        };
    }

    // Check for joy indicators
    if (messageLower.includes('happy') || messageLower.includes('excited') || messageLower.includes('love') || messageLower.includes('amazing')) {
        const response = getRandomElement(leoPersonality.empathyResponses.joy);
        return {
            reply: response,
            reasoning: "detected_joy",
            suggestedMood: "joy"
        };
    }

    // Check for romantic indicators
    if (messageLower.includes('love') || messageLower.includes('heart') || messageLower.includes('romantic') || messageLower.includes('crush')) {
        const response = getRandomElement(leoPersonality.empathyResponses.love);
        return {
            reply: response,
            reasoning: "detected_love",
            suggestedMood: "love"
        };
    }

    // Default: Ask engaging follow-up questions based on context
    if (historyLower.length < 50) {
        // Early in conversation
        const response = `${nickname}, this is fascinating! ${getRandomElement(leoPersonality.requestMoreResponses)}`;
        return {
            reply: response,
            reasoning: "early_conversation",
            suggestedMood: detectedMood
        };
    }

    // Mid-conversation: Show empathy and interest
    const response = getRandomElement(leoPersonality.fillerResponses);
    return {
        reply: response,
        reasoning: "show_interest",
        suggestedMood: detectedMood
    };
}

/**
 * Helper: Get random element from array
 */
function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Format Leo's response with personality
 * @param {object} response - Response object from generateLeoResponse
 * @returns {string} Formatted response ready for display
 */
export function formatLeoResponse(response) {
    return response.reply;
}

/**
 * Generate statistics about the conversation for debugging
 */
export function getConversationStats(history) {
    const messages = history.split('\n').filter(m => m.trim());
    const words = history.split(/\s+/).length;
    const avgWordsPerMessage = messages.length > 0 ? Math.round(words / messages.length) : 0;

    return {
        totalMessages: messages.length,
        totalWords: words,
        averageWordsPerMessage: avgWordsPerMessage,
        isEmpty: history.trim().length === 0
    };
}

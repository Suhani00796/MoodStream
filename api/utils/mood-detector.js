/**
 * MOOD DETECTOR - Brain Logic
 * Analyzes text and conversation history to detect emotion
 * Supports keyword-based detection + future AI model integration
 */

const emotionKeywords = {
    joy: ['happy', 'great', 'awesome', 'love', 'excited', 'wonderful', 'brilliant', 'fantastic', 'amazing', 'blessed', 'celebrate', 'joy', 'smile', 'laugh', 'yay', 'woo', 'perfect', 'excellent'],
    sadness: ['sad', 'down', 'cry', 'depressed', 'upset', 'unhappy', 'miserable', 'gloomy', 'dark', 'lonely', 'broken', 'hurt', 'pain', 'tears', 'blue', 'struggling', 'lost'],
    anger: ['angry', 'furious', 'hate', 'enraged', 'mad', 'irritated', 'frustrated', 'pissed', 'rage', 'annoyed', 'fed up', 'sick of', 'over it'],
    fear: ['afraid', 'scared', 'worried', 'anxious', 'nervous', 'terrified', 'panic', 'dread', 'frightened', 'fear', 'stressed', 'overwhelmed', 'anxious'],
    love: ['love', 'adore', 'care', 'affection', 'sweet', 'romantic', 'passion', 'devoted', 'cherish', 'beautiful', 'heart', 'darling', 'dear', 'crush'],
    surprise: ['wow', 'shocked', 'surprised', 'unexpected', 'astonished', 'incredible', 'unbelievable', 'amazing', 'whoa', 'woah', 'crazy', 'wild']
};

/**
 * Analyze text and detect primary emotion
 * @param {string} text - The user message
 * @returns {object} { mood: string, confidence: number (0-100) }
 */
export function analyzeMood(text) {
    if (!text || text.trim().length === 0) {
        return { mood: 'neutral', confidence: 0, reason: 'empty_text' };
    }

    const lowerText = text.toLowerCase();
    let moodScores = {};
    let maxMatches = 0;
    let detectedMood = 'neutral';

    // Count keyword matches for each emotion
    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
        const matches = keywords.filter(kw => lowerText.includes(kw)).length;
        moodScores[emotion] = matches;
        
        if (matches > maxMatches) {
            maxMatches = matches;
            detectedMood = emotion;
        }
    }

    // Calculate confidence (percentage of keywords matched)
    const totalKeywords = Object.values(emotionKeywords).reduce((sum, arr) => sum + arr.length, 0);
    const confidence = Math.min((maxMatches / totalKeywords) * 100, 100);

    return {
        mood: maxMatches > 0 ? detectedMood : 'neutral',
        confidence: Math.round(confidence),
        scores: moodScores,
        keywordMatches: maxMatches
    };
}

/**
 * Analyze full conversation history to get overall mood
 * @param {string} history - Accumulated conversation text
 * @returns {object} { primaryMood: string, allMoods: object }
 */
export function analyzeFinalMood(history) {
    if (!history || history.trim().length === 0) {
        return { primaryMood: 'neutral', allMoods: {} };
    }

    const segments = history.split(/[\n.!?;]+/).filter(s => s.trim().length > 10);
    
    let moodFrequency = {};
    let totalScores = {};

    // Analyze each message segment
    segments.forEach(segment => {
        const result = analyzeMood(segment);
        moodFrequency[result.mood] = (moodFrequency[result.mood] || 0) + 1;
        totalScores[result.mood] = (totalScores[result.mood] || 0) + result.confidence;
    });

    // Get primary mood by average confidence
    let primaryMood = 'neutral';
    let highestAverage = 0;

    for (const [mood, total] of Object.entries(totalScores)) {
        const average = total / moodFrequency[mood];
        if (average > highestAverage) {
            highestAverage = average;
            primaryMood = mood;
        }
    }

    return {
        primaryMood,
        allMoods: moodFrequency,
        averageConfidence: Math.round(highestAverage),
        segmentsAnalyzed: segments.length
    };
}

/**
 * Get playlist recommendation based on mood
 * @param {string} mood - The detected emotion
 * @returns {object} Playlist metadata
 */
export function getPlaylistForMood(mood) {
    const playlists = {
        joy: {
            name: "Happy & Energetic 🌟",
            description: "Upbeat Bollywood & Global hits to keep the vibe high!",
            url: "https://open.spotify.com/playlist/37i9dQZF1DXdPecmS3tq9S",
            youtubeQuery: "happy upbeat bollywood songs mix",
            apps: [
                { name: "Pinterest", url: "https://pinterest.com/search/?q=happy+vibes+decor" },
                { name: "Play Store", url: "https://play.google.com/store" }
            ]
        },
        sadness: {
            name: "Soulful & Calming 🎵",
            description: "Melodious tracks to accompany your quiet moments.",
            url: "https://open.spotify.com/playlist/37i9dQZF1DX7qKkEvmtpKy",
            youtubeQuery: "sad emotional bollywood songs",
            apps: [
                { name: "Amazon", url: "https://amazon.com" },
                { name: "Wattpad", url: "https://wattpad.com" }
            ]
        },
        anger: {
            name: "Stress Buster ⚡",
            description: "High-energy beats to help you vent and reset.",
            url: "https://open.spotify.com/playlist/37i9dQZF1DX3rxVfibe1L0",
            youtubeQuery: "high energy rock metal workout songs",
            apps: [
                { name: "VS Code", url: "https://code.visualstudio.com" },
                { name: "GitHub", url: "https://github.com" }
            ]
        },
        fear: {
            name: "Peaceful Retreat 🌿",
            description: "Calm instrumentals and soothing vocals to relax.",
            url: "https://open.spotify.com/playlist/37i9dQZF1DX4sWvAiT0O9z",
            youtubeQuery: "calm relaxing meditation music",
            apps: [
                { name: "Headspace", url: "https://headspace.com" },
                { name: "Calm", url: "https://calm.com" }
            ]
        },
        surprise: {
            name: "New Discoveries 🌈",
            description: "Fresh tracks and unexpected hits from around the world.",
            url: "https://open.spotify.com/playlist/37i9dQZF1DX4WQwS6mMGq0",
            youtubeQuery: "trending new music discovery",
            apps: [
                { name: "Play Store", url: "https://play.google.com/store" },
                { name: "App Store", url: "https://www.apple.com/app-store/" }
            ]
        },
        love: {
            name: "Romantic Melodies ❤️",
            description: "The best of Bollywood and Global love songs.",
            url: "https://open.spotify.com/playlist/37i9dQZF1DX7r9R7clS1Xy",
            youtubeQuery: "romantic bollywood love songs",
            apps: [
                { name: "Wattpad", url: "https://wattpad.com" },
                { name: "Blinkit", url: "https://blinkit.com" }
            ]
        },
        neutral: {
            name: "Daily Mix 🎶",
            description: "A mix of everything for your daily mood.",
            url: "https://open.spotify.com/playlist/37i9dQZF1DXcBWFJsLS0Gj",
            youtubeQuery: "feel good music mix",
            apps: [
                { name: "Spotify", url: "https://spotify.com" },
                { name: "YouTube Music", url: "https://music.youtube.com" }
            ]
        }
    };

    return playlists[mood] || playlists.neutral;
}

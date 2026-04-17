/**
 * /leo-chat - Main Leo Brain Endpoint
 * Receives user message + conversation history
 * Returns Leo's contextual response + current mood detection
 */

import express from 'express';
import { generateLeoResponse } from '../utils/leo-brain.js';
import { analyzeMood } from '../utils/mood-detector.js';

const router = express.Router();

/**
 * POST /leo-chat
 * Request body:
 * {
 *   "message": "string - current user message",
 *   "history": "string - full conversation history (optional)",
 *   "forceMode": "string - 'empathy' | 'question' (optional)"
 * }
 * 
 * Response:
 * {
 *   "reply": "Leo's contextual response",
 *   "currentMood": "detected emotion",
 *   "confidence": 0-100,
 *   "reasoning": "why this response was chosen",
 *   "timestamp": "ISO string"
 * }
 */
router.post('/', (req, res) => {
    try {
        const { message, history = "", forceMode = null } = req.body;

        // Validate input
        if (!message || typeof message !== 'string') {
            return res.status(400).json({
                error: 'Invalid request',
                details: 'message field is required and must be a string'
            });
        }

        // Analyze mood
        const moodAnalysis = analyzeMood(message);
        
        // Generate Leo response
        const leoResponse = generateLeoResponse(message, history, moodAnalysis.mood);

        // Return structured response
        return res.json({
            reply: leoResponse.reply,
            currentMood: leoResponse.suggestedMood,
            confidence: moodAnalysis.confidence,
            keywordMatches: moodAnalysis.keywordMatches,
            reasoning: leoResponse.reasoning,
            moodScores: moodAnalysis.scores,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error in /leo-chat:', error);
        return res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
});

export default router;

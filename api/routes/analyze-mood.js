/**
 * /analyze-mood - Final Mood Analysis Endpoint
 * Called when the 1:30 timer completes
 * Takes full conversation history and returns final mood + vibe hub data
 */

import express from 'express';
import { analyzeFinalMood, getPlaylistForMood } from '../utils/mood-detector.js';

const router = express.Router();

/**
 * POST /analyze-mood
 * Request body:
 * {
 *   "conversationHistory": "string - full accumulated conversation",
 *   "userMessages": ["array of strings - all user messages (optional)"]
 * }
 * 
 * Response:
 * {
 *   "primaryMood": "joy | sadness | anger | fear | love | surprise | neutral",
 *   "confidence": 0-100,
 *   "moodBreakdown": { joy: 3, sadness: 1, ... },
 *   "vibeHub": {
 *     "playlistName": "...",
 *     "playlistUrl": "...",
 *     "youtubeQuery": "...",
 *     "apps": [{ name: "...", url: "..." }]
 *   },
 *   "timestamp": "ISO string"
 * }
 */
router.post('/', (req, res) => {
    try {
        const { conversationHistory = "", userMessages = [] } = req.body;

        // Validate input
        if (typeof conversationHistory !== 'string') {
            return res.status(400).json({
                error: 'Invalid request',
                details: 'conversationHistory must be a string'
            });
        }

        // If empty, default to joy (user at least tried!)
        if (!conversationHistory.trim()) {
            const defaultPlaylist = getPlaylistForMood('joy');
            return res.json({
                primaryMood: 'joy',
                confidence: 0,
                moodBreakdown: {},
                reason: 'empty_history_default',
                vibeHub: {
                    playlistName: defaultPlaylist.name,
                    playlistDescription: defaultPlaylist.description,
                    playlistUrl: defaultPlaylist.url,
                    youtubeQuery: defaultPlaylist.youtubeQuery,
                    apps: defaultPlaylist.apps
                },
                segmentsAnalyzed: 0,
                timestamp: new Date().toISOString()
            });
        }

        // Analyze overall mood
        const moodAnalysis = analyzeFinalMood(conversationHistory);
        
        // Get playlist for final mood
        const playlist = getPlaylistForMood(moodAnalysis.primaryMood);

        // Return final vibe hub data
        return res.json({
            primaryMood: moodAnalysis.primaryMood,
            confidence: moodAnalysis.averageConfidence,
            moodBreakdown: moodAnalysis.allMoods,
            segmentsAnalyzed: moodAnalysis.segmentsAnalyzed,
            vibeHub: {
                playlistName: playlist.name,
                playlistDescription: playlist.description,
                playlistUrl: playlist.url,
                youtubeQuery: playlist.youtubeQuery,
                apps: playlist.apps
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error in /analyze-mood:', error);
        return res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
});

export default router;

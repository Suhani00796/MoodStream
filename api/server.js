/**
 * MOODSTREAM API SERVER - The Leo Brain
 * This is the backend that powers MoodStream's conversational AI
 * Receives user messages and returns intelligent responses + mood detection
 * 
 * Environment:
 * - Local: http://localhost:5000
 * - Render: https://moodstream-api.onrender.com (after deployment)
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import leoChatRouter from './routes/leo-chat.js';
import analyzeMoodRouter from './routes/analyze-mood.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// MIDDLEWARE
// ============================================

// CORS Configuration - Allow requests from GitHub Pages and local dev
const corsOptions = {
    origin: [
        'http://localhost:3000',
        'http://localhost:8000',
        'http://127.0.0.1:8000',
        'http://127.0.0.1:3000',
        'https://suhani00796.github.io',
        'https://moodstream-frontend.vercel.app',
        process.env.FRONTEND_URL || 'http://localhost:3000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// ============================================
// ROUTES
// ============================================

/**
 * GET /
 * Health check endpoint
 */
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        service: 'MoodStream Leo Brain API',
        version: '1.0.0',
        endpoints: {
            'POST /leo-chat': 'Send user message, get Leo response + mood',
            'POST /analyze-mood': 'Analyze full conversation, get final mood + vibe hub',
            'GET /health': 'Health check'
        },
        docs: 'https://github.com/Suhani00796/MoodStream#api-documentation'
    });
});

/**
 * GET /health
 * Extended health check
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Mount API routes
app.use('/leo-chat', leoChatRouter);
app.use('/analyze-mood', analyzeMoodRouter);

// ============================================
// ERROR HANDLING
// ============================================

/**
 * 404 Not Found
 */
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        path: req.path,
        method: req.method,
        availableEndpoints: [
            'GET /',
            'GET /health',
            'POST /leo-chat',
            'POST /analyze-mood'
        ]
    });
});

/**
 * Global error handler
 */
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        status: err.status || 500,
        timestamp: new Date().toISOString()
    });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════╗
║   🎵 MoodStream Leo Brain API Started      ║
╚════════════════════════════════════════════╝

📍 Server: http://localhost:${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
🔗 Endpoints:
   • POST /leo-chat → Get Leo's response
   • POST /analyze-mood → Final mood analysis
   • GET /health → Server status

🎯 Ready to receive mood data!
    `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

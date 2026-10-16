import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import chatRoutes from './routes/chatRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5005;

// Middleware
app.use(cors({
  origin: '*', // Allow frontend requests from local dev and production
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api', chatRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'White Matrix AI & Chatbot Server',
    status: 'running',
    endpoints: {
      health: 'GET /api/health',
      chat: 'POST /api/chat',
      lead: 'POST /api/lead'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// Start server when executed directly as main script
const currentFile = fileURLToPath(import.meta.url);
const executedFile = process.argv[1] ? path.resolve(process.argv[1]) : '';
const isDirectEntry = currentFile === executedFile;

if (isDirectEntry && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 White Matrix backend server is running on http://localhost:${PORT}`);
    console.log(`🔗 Health check available at: http://localhost:${PORT}/api/health`);
  });
}

export default app;

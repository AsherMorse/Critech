import express from 'express';
import cors from 'cors';
import reviewsRouter from './routes/reviews';
import videosRouter from './routes/videos';
import openaiRouter from './routes/openai';
import topicsRouter from './routes/topics';
import { errorHandler } from './middleware/error-handler';
import { initializeCloudinary } from './config/cloudinary';

const app = express();
const port = process.env.PORT || 3000;

// Only update presets when explicitly requested via flag
const shouldUpdatePresets = process.argv.includes('--update-presets');

// Enable CORS with more comprehensive options
const corsOptions = {
  origin: function (origin: any, callback: any) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'https://critech.ashermorse.org',
      'http://localhost:5173',
      'https://critechapi.ashermorse.org',
      'https://critechpwa.ashermorse.org'
    ];

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Configure body size limits
app.use(express.json({ limit: '4.4mb' }));
app.use(express.urlencoded({ limit: '4.4mb', extended: true }));

// Initialize server
const startServer = async () => {
  try {
    // Log environment and preset update status
    console.log(`Starting server in ${process.env.NODE_ENV || 'development'} mode`);
    if (shouldUpdatePresets) {
      console.log('Will update Cloudinary presets (--update-presets flag detected)');
    }

    // Initialize Cloudinary with the flag value
    await initializeCloudinary(shouldUpdatePresets);

    // Mount routes
    app.use('/api/reviews', reviewsRouter);
    app.use('/api/videos', videosRouter);
    app.use('/api/openai', openaiRouter);
    app.use('/api/topics', topicsRouter);

    app.get('/', (req, res) => {
      res.json({ message: 'Welcome to Critech API' });
    });

    // Error handling middleware should be last
    app.use(errorHandler);

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer(); 
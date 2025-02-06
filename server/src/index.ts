import express from 'express';
import cors from 'cors';
import reviewsRouter from './routes/reviews';
import videosRouter from './routes/videos';
import { errorHandler } from './middleware/error-handler';
import { initializeCloudinary } from './config/cloudinary';

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS with proper preflight handling
app.use(cors({
  origin: ['https://critech.ashermorse.org', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Accept',
    'Authorization',
    'Origin',
    'X-Requested-With',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: true,
  maxAge: 86400, // 24 hours in seconds
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());

// Initialize server
const startServer = async () => {
  try {
    await initializeCloudinary();

    // Mount routes
    app.use('/api/reviews', reviewsRouter);
    app.use('/api/videos', videosRouter);

    app.get('/', (req, res) => {
      res.json({ message: 'Welcome to Critech API' });
    });

    // Error handling middleware should be last
    app.use(errorHandler);

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    process.exit(1);
  }
};

// Start the server
startServer(); 
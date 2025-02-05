import express from 'express';
import cors from 'cors';
import reviewsRouter from './routes/reviews';
import videosRouter from './routes/videos';
import { errorHandler } from './middleware/error-handler';
import { initializeCloudinary } from './config/cloudinary';

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS
app.use(cors({
  origin: ['https://critech.ashermorse.org', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept'],
  credentials: true
}));

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

    app.listen(port, () => {});
  } catch (error) {
    process.exit(1);
  }
};

// Start the server
startServer(); 
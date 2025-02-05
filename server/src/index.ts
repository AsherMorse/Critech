import express from 'express';
import reviewsRouter from './routes/reviews';
import videosRouter from './routes/videos';
import { errorHandler } from './middleware/error-handler';
import { initializeCloudinary } from './config/cloudinary';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Initialize server
const startServer = async () => {
  try {
    // Initialize Cloudinary first
    await initializeCloudinary();
    console.log('Cloudinary initialized successfully');

    // Mount routes
    app.use('/api/reviews', reviewsRouter);
    app.use('/api/videos', videosRouter);

    app.get('/', (req, res) => {
      res.json({ message: 'Welcome to Critech API' });
    });

    // Error handling middleware should be last
    app.use(errorHandler);

    // Start listening
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
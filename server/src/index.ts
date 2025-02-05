import express from 'express';
import reviewsRouter from './routes/reviews';
import videosRouter from './routes/videos';
import { errorHandler } from './middleware/error-handler';
import { initializeCloudinary } from './config/cloudinary';

const app = express();
const port = process.env.PORT || 3000;

// Request logging middleware
app.use((req, res, next) => {
  console.error('🔥 INCOMING REQUEST 🔥')
  console.error('URL:', req.url)
  console.error('Method:', req.method)
  console.error('Headers:', JSON.stringify(req.headers, null, 2))
  next()
})

app.use(express.json());

// Initialize server
const startServer = async () => {
  try {
    console.error('🚀 SERVER STARTING 🚀')
    
    // Initialize Cloudinary first
    await initializeCloudinary();
    console.error('✅ Cloudinary initialized')

    // Mount routes
    app.use('/api/reviews', reviewsRouter);
    app.use('/api/videos', videosRouter);
    console.error('✅ Routes mounted')

    app.get('/', (req, res) => {
      res.json({ message: 'Welcome to Critech API' });
    });

    // Error handling middleware should be last
    app.use(errorHandler);

    // Start listening
    app.listen(port, () => {
      console.error('==================================')
      console.error('🌍 SERVER IS RUNNING')
      console.error(`Port: ${port}`)
      console.error(`Environment: ${process.env.NODE_ENV || 'development'}`)
      console.error(`Server URL: ${process.env.SERVER_URL || 'not set'}`)
      console.error('==================================')
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer(); 
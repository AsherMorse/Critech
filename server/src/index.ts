import express from 'express';
import reviewsRouter from './routes/reviews';
import videosRouter from './routes/videos';
import { errorHandler } from './middleware/error-handler';
import { initializeCloudinary } from './config/cloudinary';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Initialize Cloudinary
initializeCloudinary().catch(console.error);

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
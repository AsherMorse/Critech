import express from 'express';
import reviewsRouter from './routes/reviews';
import { errorHandler } from './middleware/error-handler';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Mount reviews module
app.use('/api/reviews', reviewsRouter);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Critech API' });
});

// Error handling middleware should be last
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 
import express from 'express';
import cors from 'cors';
import reviewsRouter from './routes/reviews';
import videosRouter from './routes/videos';
import { errorHandler } from './middleware/error-handler';
import { initializeCloudinary } from './config/cloudinary';

const app = express();
const port = process.env.PORT || 3000;

// Catch-all logging middleware (before anything else)
app.use((req, res, next) => {
  console.error('\n\n💥💥💥 INCOMING REQUEST 💥💥💥')
  console.error('Time:', new Date().toISOString())
  console.error('Method:', req.method)
  console.error('URL:', req.url)
  console.error('Headers:', req.headers)
  console.error('💥💥💥 END REQUEST LOG 💥💥💥\n\n')
  next()
});

// Enable CORS with logging
app.use(cors({
  origin: ['https://critech.ashermorse.org', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept'],
  credentials: true
}));

// Log CORS preflight requests
app.options('*', (req, res, next) => {
  console.error('\n\n⚡️⚡️⚡️ CORS PREFLIGHT REQUEST ⚡️⚡️⚡️')
  console.error('Method:', req.method)
  console.error('URL:', req.url)
  console.error('Headers:', JSON.stringify(req.headers, null, 2))
  console.error('⚡️⚡️⚡️ END CORS PREFLIGHT ⚡️⚡️⚡️\n\n')
  next()
});

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

    // Response logging middleware
    app.use((req, res, next) => {
      const oldSend = res.send;
      res.send = function(data: any) {
        if (req.url.includes('/api/videos/upload')) {
          console.error('\n\n🌟🌟🌟 UPLOAD RESPONSE 🌟🌟🌟')
          console.error('Status:', res.statusCode)
          console.error('Headers:', JSON.stringify(res.getHeaders(), null, 2))
          console.error('Body:', data)
          console.error('🌟🌟🌟 END UPLOAD RESPONSE 🌟🌟🌟\n\n')
        }
        return oldSend.call(res, data);
      };
      next();
    });

    // Error handling middleware should be last
    app.use(errorHandler);

    app.listen(port, () => {
      console.error(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

// Log that the file was loaded
console.error('\n\n')
console.error('🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀')
console.error('SERVER FILE LOADED AND EXECUTED')
console.error('TIME:', new Date().toISOString())
console.error('NODE_ENV:', process.env.NODE_ENV)
console.error('🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀')
console.error('\n\n') 
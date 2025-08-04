// ============================================================================
// HANSEI BACKEND - PRODUCTION READY WITH FIXED CORS
// ============================================================================
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================================
// FIXED CORS CONFIGURATION
// ============================================================================
const allowedOrigins = [
  'http://localhost',
  'http://127.0.0.1', 
  'null', // For local file testing
  'https://chennai-fe.vercel.app', // FIXED: Corrected URL without trailing slash
  'https://chennai-frontend.vercel.app', // Keep both variants just in case
  'https://daikin-n9wy.onrender.com' // Your backend URL
];

const corsOptions = {
  origin: function (origin, callback, req) {
    console.log('🔍 CORS Check - Origin:', origin);
    console.log('🔍 CORS Check - Request Headers:', req.headers);
    console.log('🔍 CORS Check - Request Method:', req.method);
    console.log('🔍 CORS Check - Request URL:', req.url);
    
    // Allow requests with no origin (mobile apps, curl, Postman, etc.)
    if (!origin) {
      console.log('✅ No origin - allowing request');
      return callback(null, true);
    }

    // Check if origin matches any allowed origin
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      // Handle 'null' origin for local file testing
      if (allowedOrigin === 'null' && origin === 'null') {
        return true;
      }
      
      // Remove trailing slash from both for comparison
      const cleanOrigin = origin.replace(/\/$/, '');
      const cleanAllowed = allowedOrigin.replace(/\/$/, '');
      
      // Check exact match or startsWith for localhost/127.0.0.1 with different ports
      const exactMatch = cleanOrigin === cleanAllowed;
      const portVariantMatch = (allowedOrigin === 'http://localhost' || allowedOrigin === 'http://127.0.0.1') 
        && cleanOrigin.startsWith(cleanAllowed);
      
      return exactMatch || portVariantMatch;
    });

    if (isAllowed) {
      console.log('✅ CORS: Origin allowed -', origin);
      callback(null, true);
    } else {
      console.error('❌ CORS: Origin not allowed -', origin);
      console.error('📝 Allowed origins:', allowedOrigins);
      callback(new Error(`CORS: Origin ${origin} not allowed`));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
};

// Apply CORS middleware FIRST
app.use(cors(corsOptions));

// Add explicit OPTIONS handling for preflight requests
app.options('*', cors(corsOptions));

// ============================================================================
// BASIC MIDDLEWARE
// ============================================================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add request logging for debugging
app.use((req, res, next) => {
  console.log(`📝 ${req.method} ${req.path} - Origin: ${req.get('Origin') || 'null'}`);
  next();
});

// ============================================================================
// HEALTH CHECK ROUTES (MOVED UP FOR PRIORITY)
// ============================================================================
app.get('/', (req, res) => {
  res.json({ 
    message: 'Hansei Backend is WORKING!',
    cors: 'ENABLED - Fixed Configuration',
    timestamp: new Date().toISOString(),
    origin: req.get('Origin') || 'null'
  });
});

app.get('/api/health', (req, res) => {
  console.log('🏥 Health check requested from origin:', req.get('Origin'));
  res.json({ 
    status: 'healthy',
    cors: 'WORKING',
    backend: 'Chennai Backend Connected',
    timestamp: new Date().toISOString(),
    origin: req.get('Origin') || 'null'
  });
});

// ============================================================================
// LOAD EXISTING ROUTES WITH BETTER ERROR HANDLING
// ============================================================================
try {
  const authRoutes = require('./routes/auth');
  const salesRoutes = require('./routes/sales');
  const analyticsRoutes = require('./routes/analytics');
  const uploadRoutes = require('./routes/upload');
  const chatbotRoutes = require('./routes/chatbot');
  
  app.use('/api/auth', authRoutes);
  app.use('/api/sales', salesRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/chatbot', chatbotRoutes);

  console.log('✅ All routes loaded successfully');

} catch (error) {
  console.log('⚠️ Warning: Some routes failed to load. Basic functionality will work.');
  console.log('Error details:', error.message);
  
  // Create fallback routes if modules don't exist
  app.use('/api/auth', (req, res) => {
    res.status(503).json({ error: 'Auth service temporarily unavailable' });
  });
  
  app.use('/api/sales', (req, res) => {
    res.status(503).json({ error: 'Sales service temporarily unavailable' });
  });
  
  app.use('/api/analytics', (req, res) => {
    res.status(503).json({ error: 'Analytics service temporarily unavailable' });
  });
  
  app.use('/api/upload', (req, res) => {
    res.status(503).json({ error: 'Upload service temporarily unavailable' });
  });
  
  app.use('/api/chatbot', (req, res) => {
    res.status(503).json({ error: 'Chatbot service temporarily unavailable' });
  });
}

// ============================================================================
// GLOBAL ERROR HANDLING
// ============================================================================
app.use((err, req, res, next) => {
  console.error('❌ Global Error Handler:', err.message);
  
  // Handle CORS errors specifically
  if (err.message.includes('CORS')) {
    return res.status(403).json({ 
      error: 'CORS policy violation', 
      details: err.message,
      allowedOrigins: allowedOrigins 
    });
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  console.log('❌ 404 - Route not found:', req.path);
  res.status(404).json({ 
    error: 'Endpoint not found', 
    path: req.path,
    availableEndpoints: ['/api/health', '/api/auth', '/api/sales', '/api/analytics', '/api/upload', '/api/chatbot']
  });
});

// ============================================================================
// START SERVER
// ============================================================================
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 ==========================================');
  console.log('🚀 HANSEI BACKEND STARTED SUCCESSFULLY!');
  console.log('🚀 ==========================================');
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🌐 Public URL: https://daikin-n9wy.onrender.com`);
  console.log(`🔥 CORS: FIXED & ENABLED`);
  console.log(`✅ Allowed Origins:`);
  allowedOrigins.forEach(origin => console.log(`   - ${origin}`));
  console.log(`🧪 Test: https://daikin-n9wy.onrender.com/api/health`);
  console.log('🚀 ==========================================');
});

// Enhanced error handling
server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

  switch (error.code) {
    case 'EACCES':
      console.error(`❌ ${bind} requires elevated privileges.`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`❌ ${bind} is already in use.`);
      console.error('💡 Try: kill -9 $(lsof -ti:3000) or change PORT in .env');
      process.exit(1);
      break;
    default:
      console.error(`❌ Server error:`, error);
      throw error;
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed.');
    process.exit(0);
  });
});

console.log('🔄 Starting Hansei Backend Server...');

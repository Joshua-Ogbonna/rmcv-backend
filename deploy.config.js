module.exports = {
  // Memory optimization settings for Render deployment
  memory: {
    maxOldSpaceSize: 512,
    optimizeForSize: true,
    gcInterval: 30000, // 30 seconds
  },
  
  // Environment variables for production
  env: {
    NODE_ENV: 'production',
    GENERATE_SWAGGER: 'false',
    PORT: '3001',
  },
  
  // Database connection settings
  database: {
    maxPoolSize: 10,
    minPoolSize: 1,
    maxIdleTimeMS: 30000,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  },
  
  // Cache settings
  cache: {
    maxSize: 1000,
    cleanupInterval: 5 * 60 * 1000, // 5 minutes
    ttl: 5 * 60 * 1000, // 5 minutes
  },
  
  // Health check settings
  health: {
    checkInterval: 5 * 60 * 1000, // 5 minutes
    memoryThreshold: 400, // MB
  }
}; 
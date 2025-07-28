# Backend Deployment Guide

## Memory Optimization for Render Deployment

This guide addresses the JavaScript heap out of memory error when deploying to Render.

### Environment Variables

Set these environment variables in your Render dashboard:

```bash
NODE_ENV=production
GENERATE_SWAGGER=false
PORT=3001
NODE_OPTIONS=--max-old-space-size=512 --optimize-for-size
```

### Build Command

```bash
npm run build
```

### Start Command

```bash
npm start
```

### Memory Optimizations Implemented

1. **Node.js Memory Limits**: Set to 512MB with optimization flags
2. **Mongoose Connection Pool**: Limited to 10 connections with timeouts
3. **Swagger Generation**: Disabled in production by default
4. **Cache Management**: Limited cache size and automatic cleanup
5. **Memory Monitoring**: Built-in health checks and garbage collection

### Health Check Endpoint

Monitor your application's memory usage:

```
GET /health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "memory": {
    "heapUsed": 150,
    "heapTotal": 200,
    "external": 50,
    "rss": 300
  },
  "uptime": 3600
}
```

### Troubleshooting

1. **Memory Issues**: Check the `/health` endpoint for memory usage
2. **Database Connection**: Ensure MongoDB URI is properly configured
3. **Redis Connection**: Verify Redis host and port settings
4. **Environment Variables**: Confirm all required env vars are set

### Performance Monitoring

The application automatically:
- Logs memory usage every 5 minutes
- Triggers garbage collection when memory usage > 400MB
- Cleans up verification cache every 5 minutes
- Limits database connection pool size

### Render-Specific Settings

- **Auto-Deploy**: Enable for automatic deployments
- **Health Check Path**: `/health`
- **Environment**: Node.js
- **Build Command**: `npm run build`
- **Start Command**: `npm start` 
import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class AppService implements OnModuleInit {
  onModuleInit() {
    // Set up memory monitoring
    this.setupMemoryMonitoring();
  }

  getHello(): string {
    return 'Right My CV API is running!';
  }

  private setupMemoryMonitoring() {
    // Monitor memory usage and log warnings
    setInterval(() => {
      const memUsage = process.memoryUsage();
      const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
      
      // Log memory usage every 5 minutes
      console.log(`Memory usage: ${heapUsedMB}MB / ${heapTotalMB}MB`);
      
      // Warn if memory usage is high
      if (heapUsedMB > 400) {
        console.warn(`High memory usage detected: ${heapUsedMB}MB`);
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
          console.log('Garbage collection triggered');
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  getHealth() {
    const memUsage = process.memoryUsage();
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
        rss: Math.round(memUsage.rss / 1024 / 1024),
      },
      uptime: process.uptime(),
    };
  }
}

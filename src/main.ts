import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  // Create app with reduced memory footprint
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
    bufferLogs: true,
  });

  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'https://right-my-p65d70fk5-careerbuddy.vercel.app',
    credentials: true,
  });

  // Global validation pipe with memory optimization
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: false,
    },
  }));

  // Only generate Swagger docs in development or when explicitly requested
  if (process.env.NODE_ENV !== 'production' || process.env.GENERATE_SWAGGER === 'true') {
    const config = new DocumentBuilder()
      .setTitle('Right My CV API')
      .setDescription('Backend API for the Right My CV resume builder application')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  
  if (process.env.NODE_ENV !== 'production' || process.env.GENERATE_SWAGGER === 'true') {
    console.log(`📚 API Documentation: http://localhost:${port}/api`);
  }
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});

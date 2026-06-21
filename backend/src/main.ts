import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import * as Sentry from '@sentry/node';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  // Custom body parser with increased limits and rawBody support (needed for webhooks)
  const rawBodyBuffer = (req: any, res: any, buf: Buffer, encoding: BufferEncoding) => {
    if (buf && buf.length) {
      req.rawBody = buf;
    }
  };

  app.use(json({ verify: rawBodyBuffer, limit: '10mb' }));
  app.use(urlencoded({ verify: rawBodyBuffer, extended: true, limit: '10mb' }));

  const configService = app.get(ConfigService);

  // Sentry
  const sentryDsn = configService.get<string>('SENTRY_DSN');
  if (sentryDsn) {
    Sentry.init({
      dsn: sentryDsn,
      environment: configService.get('NODE_ENV', 'production'),
      tracesSampleRate: 0.1,
    });
    console.log('📡 Sentry initialized');
  }
  
  // Enable CORS
  const rawCorsOrigin = configService.get('CORS_ORIGIN');
  let corsOrigin: any = '*';
  if (rawCorsOrigin) {
    corsOrigin = rawCorsOrigin.split(',');
  } else {
    corsOrigin = [
      'http://localhost:5173',
      'https://q-emplois-d9qo.vercel.app',
      'https://www.quebec-emplois.ca',
      'https://quebec-emplois.ca',
      'https://www.q-emplois.com',
      'https://q-emplois.com',
      /\.vercel\.app$/ // Allows all Vercel preview branches dynamically
    ];
  }

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  // Global validation pipe with French error messages
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors) => {
      const messages = errors.map(error => {
        const constraints = error.constraints;
        const firstConstraint = constraints ? Object.values(constraints)[0] : 'Validation échouée';
        return {
          field: error.property,
          message: firstConstraint,
        };
      });
      return new (require('@nestjs/common').BadRequestException)({
        statusCode: 400,
        message: 'Erreur de validation',
        errors: messages,
      });
    },
  }));

  // API prefix
  app.setGlobalPrefix('api/v1');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Q-Emplois API')
    .setDescription('API de la plateforme Q-Emplois - Services à domicile au Québec')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentification')
    .addTag('users', 'Gestion des utilisateurs')
    .addTag('services', 'Catégories de services')
    .addTag('bookings', 'Réservations')
    .addTag('providers', 'Prestataires de services')
    .addTag('payments', 'Paiements Stripe')
    .addTag('chat', 'Intégration Telegram/WhatsApp')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get('PORT') || 3000;
  await app.listen(port, '0.0.0.0');
  
  console.log(`🚀 Q-Emplois API running on port ${port}`);
  console.log(`📚 Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
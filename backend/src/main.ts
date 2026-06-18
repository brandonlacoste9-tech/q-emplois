import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  
  const configService = app.get(ConfigService);
  
  // Enable CORS
  app.enableCors({
    origin: configService.get('CORS_ORIGIN') || '*',
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
  await app.listen(port);
  
  console.log(`🚀 Q-Emplois API running on port ${port}`);
  console.log(`📚 Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
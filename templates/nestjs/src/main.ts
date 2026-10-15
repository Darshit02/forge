import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Forge NestJS Backend')
    .setDescription('Auto-generated backend scaffolded by Forge AI IDE')
    .setVersion('1.0.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Expose JSON endpoint for Forge spec extractor
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/api-json', (req: any, res: any) => {
    res.json(document);
  });
  httpAdapter.get('/openapi.json', (req: any, res: any) => {
    res.json(document);
  });

  // Mount Swagger UI
  SwaggerModule.setup('docs', app, document);

  await app.listen(8000, '0.0.0.0');
  console.log('NestJS application running on http://0.0.0.0:8000');
}
bootstrap();

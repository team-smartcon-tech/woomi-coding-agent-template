import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('endpoints', () => {
    it('should return welcome message', () => {
      expect(appController.getHello()).toBe('NestJS on Cloudflare Workers');
    });

    it('should return health payload', () => {
      expect(appController.getHealth()).toEqual({
        status: 'ok',
        runtime: 'cloudflare-workers',
      });
    });

    it('should return news categories', () => {
      expect(appController.getNewsCategories()).toEqual({
        categories: ['politics', 'economy', 'tech', 'sports'],
      });
    });

    it('should return build info', () => {
      expect(appController.getBuildInfo()).toEqual({
        app: 'nestjs-cf-test',
        version: '0.0.1',
        mode: 'dev',
      });
    });
  });
});

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

  describe('root', () => {
    it('should return the running banner', () => {
      expect(appController.getHello()).toBe(
        '\u{1F680} Auth Service is running correctly',
      );
    });
  });

  describe('health', () => {
    it('should report status ok', () => {
      expect(appController.getHealth()).toMatchObject({
        status: 'ok',
        service: 'auth-service',
      });
    });

    it('should include an ISO timestamp', () => {
      expect(appController.getHealth()).toHaveProperty('timestamp');
    });
  });
});

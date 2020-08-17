import { Test, TestingModule } from '@nestjs/testing';
import { ResultController } from './result.controller';

describe('Result Controller', () => {
  let controller: ResultController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResultController],
    }).compile();

    controller = module.get<ResultController>(ResultController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

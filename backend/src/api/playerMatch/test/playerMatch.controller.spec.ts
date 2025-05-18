import { Test, TestingModule } from '@nestjs/testing';
import { PlayerMatchController } from '../playerMatch.controller';
import { PlayerMatchService } from '../playerMatch.service';
import { HttpModule } from '@nestjs/axios';

describe('PlayerMatchController', () => {
  let controller: PlayerMatchController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      controllers: [PlayerMatchController],
      providers: [PlayerMatchService],
    }).compile();

    controller = module.get<PlayerMatchController>(PlayerMatchController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

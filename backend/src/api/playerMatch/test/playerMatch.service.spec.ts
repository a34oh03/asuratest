import { Test, TestingModule } from '@nestjs/testing';
import { PlayerMatchService } from '../playerMatch.service';
import { HttpModule } from '@nestjs/axios';

describe('PlayerMatchService', () => {
  let service: PlayerMatchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [PlayerMatchService],
    }).compile();

    service = module.get<PlayerMatchService>(PlayerMatchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

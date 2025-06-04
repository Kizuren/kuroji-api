import { Test, TestingModule } from '@nestjs/testing';
import { TvdbService } from './tvdb.service';
import { SharedModule } from '../../../../shared/shared.module';

describe('TvdbService', () => {
  let service: TvdbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [SharedModule],
    }).compile();

    service = module.get<TvdbService>(TvdbService);
  });

  it('fetch info', async () => {
    try {
      const id = 21;
      const data = await service.getTvdbByAnilist(id);
      expect(data).toBeDefined();
    } catch (err) {
      throw new Error(`TVDB API failed info test: ${err.message}`);
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

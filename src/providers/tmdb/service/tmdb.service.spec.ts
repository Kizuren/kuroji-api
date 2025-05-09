import { Test, TestingModule } from '@nestjs/testing';
import { TmdbService } from './tmdb.service';
import { HttpModule } from '@nestjs/axios'
import { SharedModule } from '../../../shared/shared.module'

describe('TmdbService', () => {
  let service: TmdbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule, SharedModule],
    }).compile();

    service = module.get<TmdbService>(TmdbService);
  });

  it('fetch info', async () => {
    try {
      const id = 21
      const data = await service.getTmdbByAnilist(id)
      expect(data).toBeDefined()
    } catch (err) {
      throw new Error(`TMDB API failed info test: ${err.message}`)
    }
  })

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

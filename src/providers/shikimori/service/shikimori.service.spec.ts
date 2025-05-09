import { Test, TestingModule } from '@nestjs/testing';
import { ShikimoriService } from './shikimori.service';
import { SharedModule } from '../../../shared/shared.module'

describe('ShikimoriService', () => {
  let service: ShikimoriService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [SharedModule],
    }).compile();

    service = module.get<ShikimoriService>(ShikimoriService);
  });

  it('fetch info', async () => {
    try {
      const id = '21'
      const data = await service.getShikimori(id)
      expect(data).toBeDefined()
    } catch (err) {
      throw new Error(`Shikimori API failed info test: ${err.message}`)
    }
  })

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

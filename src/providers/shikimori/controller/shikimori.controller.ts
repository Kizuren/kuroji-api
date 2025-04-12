import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ShikimoriService } from '../service/shikimori.service';

@Controller('shikimori')
export class ShikimoriController {
  constructor(private readonly service: ShikimoriService) {}

  @Get('info/:id')
  async getShikimori(@Param('id') id: string) {
    return this.service.getShikimori(id);
  }

  @Get('info/:id/update')
  async updateShikimori(@Param('id') id: string) {
    return this.service.update(id);
  }

  @Get('franchise/:franchise')
  async getFranchise(@Param("franchise") franchise: string) {
    return this.service.getFranchise(franchise);
  }

  @Get('franchiseId/:franchise')
  async getFranchiseId(@Param("franchise") franchise: string) {
    return this.service.getFranchiseIds(franchise)
  }
}

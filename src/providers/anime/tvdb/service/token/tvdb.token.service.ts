import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma.service.js';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TvdbHelper } from '../../utils/tvdb-helper.js';
import { TvdbLogin } from '@prisma/client';
import { TVDB } from '../../../../../configs/tvdb.config.js';
import { Client } from '../../../../model/client.js';
import { UrlConfig } from '../../../../../configs/url.config.js';

export interface LoginResponse {
  status: string;
  data: {
    token: string;
  };
}

@Injectable()
export class TvdbTokenService extends Client {
  constructor(
    private readonly prisma: PrismaService,
    private readonly helper: TvdbHelper,
  ) {
    super(UrlConfig.TVDB);
  }

  async getToken(): Promise<string> {
    const login = await this.prisma.tvdbLogin.findFirst({
      where: { expired: false },
      orderBy: { createDate: 'desc' },
    });

    if (!login) {
      await this.check();
      const newLogin = await this.prisma.tvdbLogin.findFirst({
        where: { expired: false },
        orderBy: { createDate: 'desc' },
      });
      if (!newLogin) {
        throw new Error('No token available');
      }
      return newLogin.token;
    }

    return login.token;
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  public async check(): Promise<void> {
    const count = await this.prisma.tvdbLogin.count();
    if (count === 0) {
      console.log('No tokens found');
      await this.createToken();
      return;
    }

    const login = await this.prisma.tvdbLogin.findFirst({
      where: { expired: false },
      orderBy: { createDate: 'desc' },
    });

    if (login) {
      const expiryDate = new Date(login.createDate);
      expiryDate.setMonth(expiryDate.getMonth() + 1);
      if (new Date() > expiryDate) {
        await this.prisma.tvdbLogin.update({
          where: { id: login.id },
          data: { expired: true },
        });
        console.log('Token expired');
        await this.createToken();
      } else {
        console.log(`Token valid until: ${expiryDate.toISOString()}`);
      }
    } else {
      await this.createToken();
    }
  }

  async createToken(): Promise<void> {
    const { data } = await this.client.post<LoginResponse>(TVDB.getLoginUrl(), {
      json: { apikey: TVDB.API_KEY || this.getRandomKey() },
    });

    if (!data) {
      throw new Error('No data');
    }

    const token = data.data.token;

    const tokenData = this.helper.getTvdbLoginData({
      token,
      createDate: new Date(),
      expired: false,
    } as TvdbLogin);

    const existingLogin = await this.prisma.tvdbLogin.findFirst({
      where: { token },
    });

    if (existingLogin) {
      await this.prisma.tvdbLogin.update({
        where: { id: existingLogin.id },
        data: tokenData,
      });
    } else {
      await this.prisma.tvdbLogin.create({
        data: tokenData,
      });
    }
  }

  private getRandomKey() {
    const keys = [
      'f5744a13-9203-4d02-b951-fbd7352c1657',
      '8f406bec-6ddb-45e7-8f4b-e1861e10f1bb',
      '5476e702-85aa-45fd-a8da-e74df3840baf',
      '51020266-18f7-4382-81fc-75a4014fa59f',
    ];

    return keys[Math.floor(Math.random() * keys.length)];
  }
}

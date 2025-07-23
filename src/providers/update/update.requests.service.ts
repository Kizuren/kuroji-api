import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service.js';
import { QueueItem } from './update.service.js';
import { DateUtils } from '../../shared/date.utils.js';

const POPULARITY_THRESHOLDS = {
  HIGH: 100 * 1000, // 100k
  MEDIUM: 30 * 1000, // 30k
  LOW: 10 * 1000, // 10k
  TRASH: 3 * 1000, // 3k
};

@Injectable()
export class UpdateRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  getPopularityPriority(popularity: number | null): QueueItem['priority'] {
    if (!popularity || popularity < 0) return 'low';

    if (popularity >= POPULARITY_THRESHOLDS.HIGH) return 'high';
    if (popularity >= POPULARITY_THRESHOLDS.MEDIUM) return 'medium';
    return 'low';
  }

  shouldUpdateBasedOnPopularity(popularity: number | null): boolean {
    if (!popularity || popularity < 0) return false;
    return popularity >= POPULARITY_THRESHOLDS.TRASH;
  }

  private validateOffset(offset: number): number {
    if (offset < 0) {
      console.warn(
        `[UpdateRequestsService] Invalid offset: ${offset}, using default: 0`,
      );
      return 0;
    }
    return offset;
  }

  private validateHoursBack(hoursBack: number): number {
    if (hoursBack < 0 || hoursBack > 24) {
      console.warn(
        `[UpdateRequestsService] Invalid hoursBack: ${hoursBack}, using default: 2`,
      );
      return 2;
    }
    return hoursBack;
  }

  private validateLimit(
    limit: number,
    defaultLimit: number,
    maxLimit: number = 1000,
  ): number {
    if (limit < 1 || limit > maxLimit) {
      console.warn(
        `[UpdateRequestsService] Invalid limit: ${limit}, using default: ${defaultLimit}`,
      );
      return defaultLimit;
    }
    return limit;
  }

  async getRecentAiredAnime(hoursBack: number = 2) {
    const validatedHoursBack = this.validateHoursBack(hoursBack);

    try {
      const { start: startTimestamp, end: endTimestamp } =
        DateUtils.getHourSpanRange(validatedHoursBack);

      if (
        !DateUtils.isValidTimestamp(startTimestamp) ||
        !DateUtils.isValidTimestamp(endTimestamp)
      ) {
        throw new Error('Invalid timestamp range calculated');
      }

      const recentAired = await this.prisma.anilist.findMany({
        where: {
          airingSchedule: {
            some: {
              airingAt: {
                gte: startTimestamp,
                lte: endTimestamp,
              },
            },
          },
        },
        select: {
          id: true,
          idMal: true,
          popularity: true,
          airingSchedule: {
            select: {
              airingAt: true,
              episode: true,
            },
            where: {
              airingAt: {
                gte: startTimestamp,
                lte: endTimestamp,
              },
            },
          },
        },
        orderBy: {
          trending: 'desc',
        },
      });

      console.log(
        `[UpdateRequestsService] Found ${recentAired.length} anime aired (${DateUtils.formatTimestamp(startTimestamp)} - ${DateUtils.formatTimestamp(endTimestamp)})`,
      );

      return recentAired;
    } catch (error) {
      console.error(
        '[UpdateRequestsService] Error fetching recent aired anime:',
        error,
      );
      return [];
    }
  }

  async getTodayAiredAnime() {
    try {
      const { start: startTimestamp, end: endTimestamp } =
        DateUtils.getTodayRange();

      const { start: bufferedStart, end: bufferedEnd } =
        DateUtils.getBufferedTimeRange(startTimestamp, endTimestamp, 1);

      if (
        !DateUtils.isValidTimestamp(bufferedStart) ||
        !DateUtils.isValidTimestamp(bufferedEnd)
      ) {
        throw new Error('Invalid timestamp range for today');
      }

      const todayAired = await this.prisma.anilist.findMany({
        where: {
          airingSchedule: {
            some: {
              airingAt: {
                gte: bufferedStart,
                lte: bufferedEnd,
              },
            },
          },
        },
        select: {
          id: true,
          idMal: true,
          popularity: true,
          airingSchedule: {
            select: {
              airingAt: true,
              episode: true,
            },
            where: {
              airingAt: {
                gte: bufferedStart,
                lte: bufferedEnd,
              },
            },
          },
        },
        orderBy: {
          trending: 'desc',
        },
      });

      console.log(
        `[UpdateRequestsService] Found ${todayAired.length} anime aired today (${DateUtils.formatTimestamp(startTimestamp)} - ${DateUtils.formatTimestamp(endTimestamp)})`,
      );

      return todayAired;
    } catch (error) {
      console.error(
        '[UpdateRequestsService] Error fetching today aired anime:',
        error,
      );
      return [];
    }
  }

  async getLastWeekAiredAnime() {
    try {
      const { start: startTimestamp, end: endTimestamp } =
        DateUtils.getWeekSpanRange(7);

      const { start: bufferedStart, end: bufferedEnd } =
        DateUtils.getBufferedTimeRange(startTimestamp, endTimestamp, 2);

      if (
        !DateUtils.isValidTimestamp(bufferedStart) ||
        !DateUtils.isValidTimestamp(bufferedEnd)
      ) {
        throw new Error('Invalid timestamp range for week ago');
      }

      const weekAgoAired = await this.prisma.anilist.findMany({
        where: {
          airingSchedule: {
            some: {
              airingAt: {
                gte: bufferedStart,
                lte: bufferedEnd,
              },
            },
          },
        },
        select: {
          id: true,
          idMal: true,
          popularity: true,
          airingSchedule: {
            select: {
              airingAt: true,
              episode: true,
            },
            where: {
              airingAt: {
                gte: bufferedStart,
                lte: bufferedEnd,
              },
            },
          },
        },
        orderBy: {
          trending: 'desc',
        },
      });

      console.log(
        `[UpdateRequestsService] Found ${weekAgoAired.length} anime aired in the last 7 days (${DateUtils.formatTimestamp(startTimestamp)} - ${DateUtils.formatTimestamp(endTimestamp)})`,
      );

      return weekAgoAired;
    } catch (error) {
      console.error(
        '[UpdateRequestsService] Error fetching last week aired anime:',
        error,
      );
      return [];
    }
  }

  async getFinishedAnime(limit: number = 100, offset: number = 0) {
    const validatedLimit = this.validateLimit(limit, 100);
    const validatedOffset = this.validateOffset(offset);

    try {
      const finishedAnime = await this.prisma.anilist.findMany({
        where: {
          status: 'FINISHED',
          popularity: {
            gte: POPULARITY_THRESHOLDS.TRASH,
          },
        },
        select: {
          id: true,
          idMal: true,
          popularity: true,
          averageScore: true,
        },
        orderBy: [{ popularity: 'desc' }, { averageScore: 'desc' }],
        take: validatedLimit,
        skip: validatedOffset,
      });

      console.log(
        `[UpdateRequestsService] Found ${finishedAnime.length} finished anime (offset: ${validatedOffset})`,
      );

      return finishedAnime;
    } catch (error) {
      console.error(
        '[UpdateRequestsService] Error fetching finished anime:',
        error,
      );
      return [];
    }
  }

  async getUpcomingAnime(limit: number = 50, offset: number = 0) {
    const validatedLimit = this.validateLimit(limit, 50);
    const validatedOffset = this.validateOffset(offset);

    try {
      const now = DateUtils.getCurrentTimestamp();
      const futureDate = DateUtils.getFutureTimestamp(30);

      if (
        !DateUtils.isValidTimestamp(now) ||
        !DateUtils.isValidTimestamp(futureDate)
      ) {
        throw new Error('Invalid timestamp range for upcoming anime');
      }

      const upcomingAnime = await this.prisma.anilist.findMany({
        where: {
          status: 'NOT_YET_RELEASED',
          popularity: {
            gte: POPULARITY_THRESHOLDS.TRASH,
          },
          startDate: {
            year: { gte: DateUtils.getCurrentDate().getFullYear() },
          },
        },
        select: {
          id: true,
          idMal: true,
          popularity: true,
          startDate: true,
          status: true,
          airingSchedule: {
            select: {
              airingAt: true,
              episode: true,
            },
            where: {
              airingAt: {
                gte: now,
                lte: futureDate,
              },
            },
            orderBy: {
              airingAt: 'asc',
            },
            take: 3,
          },
        },
        orderBy: [{ popularity: 'desc' }, { startDate: { year: 'asc' } }],
        take: validatedLimit,
        skip: validatedOffset,
      });

      console.log(
        `[UpdateRequestsService] Found ${upcomingAnime.length} upcoming anime (offset: ${validatedOffset})`,
      );

      return upcomingAnime;
    } catch (error) {
      console.error(
        '[UpdateRequestsService] Error fetching upcoming anime:',
        error,
      );
      return [];
    }
  }

  async getDaysAgoAiredAnime(range: number) {
    try {
      const { start: startTimestamp, end: endTimestamp } =
        DateUtils.getDaysAgoRange(range);

      const { start: bufferedStart, end: bufferedEnd } =
        DateUtils.getBufferedTimeRange(startTimestamp, endTimestamp, 2);

      if (
        !DateUtils.isValidTimestamp(bufferedStart) ||
        !DateUtils.isValidTimestamp(bufferedEnd)
      ) {
        throw new Error('Invalid timestamp range for two days ago');
      }

      const twoDaysAgoAired = await this.prisma.anilist.findMany({
        where: {
          airingSchedule: {
            some: {
              airingAt: {
                gte: bufferedStart,
                lte: bufferedEnd,
              },
            },
          },
        },
        select: {
          id: true,
          idMal: true,
          popularity: true,
          airingSchedule: {
            select: {
              airingAt: true,
              episode: true,
            },
            where: {
              airingAt: {
                gte: bufferedStart,
                lte: bufferedEnd,
              },
            },
          },
        },
        orderBy: {
          trending: 'desc',
        },
      });

      console.log(
        `[UpdateRequestsService] Found ${twoDaysAgoAired.length} anime aired two days ago (${DateUtils.formatTimestamp(startTimestamp)} - ${DateUtils.formatTimestamp(endTimestamp)})`,
      );

      return twoDaysAgoAired;
    } catch (error) {
      console.error(
        '[UpdateRequestsService] Error fetching two days ago aired anime:',
        error,
      );
      return [];
    }
  }

  async getTotalFinishedAnimeCount(): Promise<number> {
    try {
      return await this.prisma.anilist.count({
        where: {
          status: 'FINISHED',
          popularity: {
            gte: POPULARITY_THRESHOLDS.TRASH,
          },
        },
      });
    } catch (error) {
      console.error(
        '[UpdateRequestsService] Error counting finished anime:',
        error,
      );
      return 0;
    }
  }

  async getTotalUpcomingAnimeCount(): Promise<number> {
    try {
      return await this.prisma.anilist.count({
        where: {
          status: 'NOT_YET_RELEASED',
          popularity: {
            gte: POPULARITY_THRESHOLDS.TRASH,
          },
          startDate: {
            year: { gte: DateUtils.getCurrentDate().getFullYear() },
          },
        },
      });
    } catch (error) {
      console.error(
        '[UpdateRequestsService] Error counting upcoming anime:',
        error,
      );
      return 0;
    }
  }
}

import { AnilistAiringSchedule, DateDetails, Prisma } from '@prisma/client';
import { basicSelect } from '../types/types.js';
import { MediaStatus } from '../filter/Filter.js';
import { DateUtils } from '../../../../shared/date.utils.js';
import {
  createParamDecorator,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';

export function findNextAiringInSchedule(
  data: AnilistAiringSchedule[] | null,
): AnilistAiringSchedule | undefined {
  if (!data) {
    throw new Error('No airing schedule');
  }

  const now = new Date().getTime();
  const nowUnix = Math.floor(now / 1000);

  let nextAiring: AnilistAiringSchedule | undefined = undefined;
  let smallestFutureAiringTime = Infinity;

  for (const schedule of data) {
    if (schedule.airingAt && schedule.airingAt > nowUnix) {
      if (schedule.airingAt < smallestFutureAiringTime) {
        smallestFutureAiringTime = schedule.airingAt;
        nextAiring = schedule;
      }
    }
  }

  return nextAiring;
}

export function getDateStringFromAnilist(date: DateDetails): string | null {
  const { year, month, day } = date;

  let anilistStartDateString: string | null = null;

  if (year && month && day) {
    anilistStartDateString = `${year.toString().padStart(4, '0')}-${month
      .toString()
      .padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  }

  return anilistStartDateString;
}

export function findEpisodeCount<
  T extends {
    episodes?: number | null;
    airingSchedule?: AnilistAiringSchedule[] | null;
    shikimori?: {
      episodes?: number | null;
      episodesAired?: number | null;
    } | null;
    kitsu?: {
      episodeCount?: number | null;
    } | null;
    status?: string | null;
  },
>(data: T, options?: { preferAired?: boolean }): number | undefined {
  const airedSchedule =
    data.airingSchedule
      ?.filter(
        (schedule) =>
          schedule.airingAt != null && DateUtils.isPast(schedule.airingAt),
      )
      .sort((a, b) => (b.airingAt ?? 0) - (a.airingAt ?? 0)) ?? [];

  const totalEpisodes: (number | null | undefined)[] = [
    data.episodes,
    data.shikimori?.episodes,
    data.kitsu?.episodeCount,
  ];

  const airedEpisodes: (number | null | undefined)[] = [
    data.shikimori?.episodesAired,
    airedSchedule?.length,
  ];

  const total = totalEpisodes.find((v) => typeof v === 'number' && v > 0);
  const aired = airedEpisodes.find((v) => typeof v === 'number' && v > 0);

  const isAiring = data.status === MediaStatus.RELEASING;

  if (options?.preferAired ?? isAiring) {
    if (aired) return aired;
  }

  if (total) return total;
  if (aired) return aired;

  return undefined;
}

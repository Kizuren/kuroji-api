import { Injectable } from '@nestjs/common';
import { subDays, startOfWeek, addDays } from 'date-fns'
import { PrismaService } from '../../../../prisma.service'
import { AnilistHelper } from '../../utils/anilist-helper'
import { BasicAnilistSmall } from '../../model/BasicAnilist'
import { Schedule, Weekday } from '../../model/AnilistModels'

@Injectable()
export class AnilistScheduleService {
  constructor(private readonly prisma: PrismaService, private readonly helper: AnilistHelper) {}

  async getWithCurrentWeek(): Promise<BasicAnilistSmall[]> {
    const now = new Date()
    const weekStart = startOfWeek(now, { weekStartsOn: 1 })
    const weekEnd = addDays(weekStart, 7)

    const startTimestamp = Math.floor(weekStart.getTime() / 1000)
    const endTimestamp = Math.floor(weekEnd.getTime() / 1000)

    const releases = await this.prisma.anilist.findMany({
      where: {
        OR: [
          {
            nextAiringEpisode: {
              airingAt: {
                gte: startTimestamp,
                lt: endTimestamp,
              },
            },
          },
          {
            airingSchedule: {
              some: {
                airingAt: {
                  gte: startTimestamp,
                  lt: endTimestamp,
                },
              },
            },
          },
        ],
      },
      include: this.helper.getInclude(),
    });

    return releases.map(r => this.helper.convertBasicToBasicSmall(r));
  }

  async getSchedule(): Promise<Schedule> {
    const now = new Date()
    const currentDay = now.getDay()
    const weekStart = startOfWeek(now, { weekStartsOn: 1 })
    const weekEnd = addDays(weekStart, 7)

    const startTimestamp = Math.floor(weekStart.getTime() / 1000)
    const endTimestamp = Math.floor(weekEnd.getTime() / 1000)

    const releases = await this.prisma.anilist.findMany({
      where: {
        OR: [
          {
            nextAiringEpisode: {
              airingAt: {
                gte: startTimestamp,
                lt: endTimestamp,
              },
            },
          },
          {
            airingSchedule: {
              some: {
                airingAt: {
                  gte: startTimestamp,
                  lt: endTimestamp,
                },
              },
            },
          },
        ],
      },
      include: this.helper.getInclude(),
    })

    const releasesByDay: Partial<Record<Weekday, BasicAnilistSmall[]>> = {}

    for (const release of releases) {
      const small = this.helper.convertBasicToBasicSmall(release)
      const airingAt = small.nextAiringEpisode?.airingAt

      if (airingAt) {
        const date = new Date(airingAt * 1000)
        const weekdayIndex = date.getDay()
        const weekday = this.getWeekdayName(weekdayIndex)

        if (!releasesByDay[weekday]) {
          releasesByDay[weekday] = []
        }
        releasesByDay[weekday]!.push(small)
      }
    }

    const schedule: Schedule = {
      monday: this.helper.createScheduleData(releasesByDay['monday'], currentDay === 1),
      tuesday: this.helper.createScheduleData(releasesByDay['tuesday'], currentDay === 2),
      wednesday: this.helper.createScheduleData(releasesByDay['wednesday'], currentDay === 3),
      thursday: this.helper.createScheduleData(releasesByDay['thursday'], currentDay === 4),
      friday: this.helper.createScheduleData(releasesByDay['friday'], currentDay === 5),
      saturday: this.helper.createScheduleData(releasesByDay['saturday'], currentDay === 6),
      sunday: this.helper.createScheduleData(releasesByDay['sunday'], currentDay === 0),
    }

    return schedule
  }

  private getWeekdayName(index: number): Weekday {
    const days: Weekday[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    return days[index]
  }
}

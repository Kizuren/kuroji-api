import { Injectable } from '@nestjs/common'
import { Anilist } from '@prisma/client'
import { ApiResponse } from '../../../../api/ApiResponse'
import { UpdateType } from '../../../../shared/UpdateType'
import { FilterDto } from '../../model/FilterDto'
import { PrismaService } from '../../../../prisma.service'
import { AnilistHelper } from '../../utils/anilist-helper'

@Injectable()
export class AnilistFilterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly helper: AnilistHelper,
  ) { }

  async getAnilistByFilter(
    filter: FilterDto,
  ): Promise<ApiResponse<Anilist[]>> {
    const shikimori = await this.prisma.shikimori.findMany({
      where: {
        OR: [
          { russian: { contains: filter.query, mode: 'insensitive' } },
          { licenseNameRu: { contains: filter.query, mode: 'insensitive' } },
        ],
      },
    })

    const malIdsFromShikimori = shikimori
      .map((s) => +s.malId!)
      .filter((id) => !!id)

    const conditions: any[] = []

    // ========== Basic Filters ==========
    const basicFields = [
      ['id', filter.id],
      ['idMal', filter.idMal],
      ['type', filter.type],
      ['format', filter.format],
      ['status', filter.status],
      ['season', filter.season],
      ['isAdult', filter.isAdult],
      ['isLicensed', filter.isLicensed],
      ['countryOfOrigin', filter.countryOfOrigin],
    ]
    for (const [key, value] of basicFields) {
      if (value !== undefined) conditions.push({ [key as any]: value })
    }

    // ========== Array Filters ==========
    if (filter.genreIn) conditions.push({ genres: { hasEvery: filter.genreIn } })
    if (filter.genreNotIn) conditions.push({ genres: { hasNone: filter.genreNotIn } })
    if (filter.idIn) conditions.push({ id: { in: filter.idIn } })
    if (filter.idNotIn) conditions.push({ id: { notIn: filter.idNotIn } })
    if (filter.idNot != null) conditions.push({ id: { not: filter.idNot } })
    if (filter.idMalIn) conditions.push({ idMal: { in: filter.idMalIn } })
    if (filter.idMalNotIn) conditions.push({ idMal: { notIn: filter.idMalNotIn } })
    if (filter.idMalNot != null) conditions.push({ idMal: { not: filter.idMalNot } })

    if (filter.studioIn) {
      conditions.push({
        studios: {
          some: {
            studio: {
              name: { in: filter.studioIn },
            },
          },
        },
      })
    }

    if (filter.characterIn) {
      conditions.push({
        characters: {
          some: {
            character: {
              name: {
                full: { in: filter.voiceActorIn },
              },
            },
          },
        },
      })
    }

    if (filter.voiceActorIn) {
      conditions.push({
        characters: {
          some: {
            voiceActors: {
              some: {
                name: {
                  full: { in: filter.voiceActorIn },
                },
              },
            },
          },
        },
      })
    }

    // ========== Numeric Filters ==========
    const numericFields = [
      ['duration', 'gt', filter.durationGreater],
      ['duration', 'lt', filter.durationLesser],
      ['episodes', 'gt', filter.episodesGreater],
      ['episodes', 'lt', filter.episodesLesser],
      ['popularity', 'gt', filter.popularityGreater],
      ['popularity', 'lt', filter.popularityLesser],
      ['score', 'gt', filter.scoreGreater],
      ['score', 'lt', filter.scoreLesser],
    ]
    for (const [field, op, val] of numericFields) {
      if (val != null) conditions.push({ [field as any]: { [op as any]: val } })
    }

    // ========== Enum Filters ==========
    const enumFilters = [
      ['format', 'in', filter.formatIn],
      ['format', 'notIn', filter.formatNotIn],
      ['format', 'not', filter.formatNot],
      ['status', 'in', filter.statusIn],
      ['status', 'notIn', filter.statusNotIn],
      ['status', 'not', filter.statusNot],
    ]
    for (const [field, op, val] of enumFilters) {
      if (val) conditions.push({ [field as any]: { [op as any]: val } })
    }

    // ========== Tags Filters ==========
    if (filter.tagsIn) {
      conditions.push({
        tags: { some: { name: { in: filter.tagsIn } } },
      })
    }
    if (filter.tagsNotIn) {
      conditions.push({
        NOT: {
          tags: { some: { name: { in: filter.tagsNotIn } } },
        },
      } as any)
    }

    // ========== Date Filters ==========
    const handleDate = (
      field: string,
      value?: string,
      onlyYear: boolean = false,
      operator: 'gt' | 'lt' = 'gt',
    ) => {
      if (!value) return null

      const comp = operator === 'gt' ? 'gt' : 'lt'
      const eq = 'equals'

      if (onlyYear) {
        return {
          OR: [{ [field]: { year: { [comp]: +value } } }],
        }
      }

      const [year, month, day] = value.split('.').map(Number)
      return {
        OR: [
          { [field]: { year: { [comp]: year } } },
          {
            AND: [
              { [field]: { year: { [eq]: year } } },
              { [field]: { month: { [comp]: month } } },
            ],
          },
          {
            AND: [
              { [field]: { year: { [eq]: year } } },
              { [field]: { month: { [eq]: month } } },
              { [field]: { day: { [comp]: day } } },
            ],
          },
        ],
      }
    }

    const startDateCond = handleDate('startDate', filter.startDateGreater)
    if (startDateCond) conditions.push(startDateCond)

    const endDateCond = handleDate('endDate', filter.endDateGreater)
    if (endDateCond) conditions.push(endDateCond)

    const startDateLesserCond = handleDate('startDate', filter.startDateLesser, false, 'lt')
    if (startDateLesserCond) conditions.push(startDateLesserCond)

    const endDateLesserCond = handleDate('endDate', filter.endDateLesser, false, 'lt')
    if (endDateLesserCond) conditions.push(endDateLesserCond)

    const startDateLikeCond = handleDate('startDate', filter.startDateLike, true)
    if (startDateLikeCond) conditions.push(startDateLikeCond)

    const endDateLikeCond = handleDate('endDate', filter.endDateLike, true)
    if (endDateLikeCond) conditions.push(endDateLikeCond)   

    // ========== Query Search ==========
    const searchOr: any[] = []

    if (filter.query) {
      const q = filter.query
      searchOr.push(
        { title: { romaji: { contains: q, mode: 'insensitive' } } },
        { title: { english: { contains: q, mode: 'insensitive' } } },
        { title: { native: { contains: q, mode: 'insensitive' } } },
        { synonyms: { hasSome: [q] } },
      )
    }

    if (malIdsFromShikimori.length) {
      searchOr.push({ idMal: { in: malIdsFromShikimori } })
    }

    if (searchOr.length) {
      conditions.push({ OR: searchOr })
    }

    const whereCondition = { AND: conditions }

    // ========== Pagination ==========
    const perPage = filter.perPage || 25
    const currentPage = filter.page || 1
    const skip = (currentPage - 1) * perPage

    // ========== Sorting ==========
    const orderBy = await this.getSortOrder(filter.sort)

    // ========== Query DB ==========
    const [data, total] = await Promise.all([
      this.prisma.anilist.findMany({
        where: whereCondition,
        include: this.helper.getInclude(),
        take: perPage,
        skip,
        orderBy,
      }),
      this.prisma.anilist.count({ where: whereCondition }),
    ])

    // ========== Pagination Info ==========
    const lastPage = Math.ceil(total / perPage)
    const pageInfo = {
      total,
      perPage,
      currentPage,
      lastPage,
      hasNextPage: currentPage < lastPage,
    }

    return { pageInfo, data }
  }

  private async getSortOrder(sort?: string[]) {
    if (!sort) return []

    const sortFields = sort.map(async (sortField) => {
      const parts = sortField.split('_')
      let direction = 'asc'

      const lastPart = parts[parts.length - 1].toLowerCase()
      if (lastPart === 'asc' || lastPart === 'desc') {
        direction = lastPart
        parts.pop()
      }

      const field = parts.join('_')

      if (field === 'start_date') {
        return [
          { startDate: { year: direction } },
          { startDate: { month: direction } },
          { startDate: { day: direction } },
        ]
      }

      if (field === 'end_date') {
        return [
          { endDate: { year: direction } },
          { endDate: { month: direction } },
          { endDate: { day: direction } },
        ]
      }

      if (field === 'updated_at') return { updatedAt: direction }

      if (parts.length > 1) {
        let nested: any = { [parts.pop()!]: direction }
        while (parts.length) nested = { [parts.pop()!]: nested }
        return nested
      }

      return { [parts[0]]: direction }
    })

    const resolved = await Promise.all(sortFields)
    return resolved.flat()
  }
}
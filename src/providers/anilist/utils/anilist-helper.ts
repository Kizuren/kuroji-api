import { Injectable } from '@nestjs/common'
import { Anilist, Poster, Prisma, Shikimori } from '@prisma/client'
import { BasicAnilist, BasicAnilistSmall, BasicShikimori } from '../model/BasicAnilist'
import { PrismaService } from '../../../prisma.service'
import { ScheduleData } from '../model/AnilistModels'

@Injectable()
export class AnilistHelper {
  constructor(private readonly prisma: PrismaService) {}

  public getDataForPrisma(anime: any): Prisma.AnilistCreateInput {
    return {
      id: anime.id,
      idMal: anime.idMal,
      siteUrl: anime.siteUrl,
      title: {
        connectOrCreate: {
          where: { anilistId: anime.id },
          create: {
            romaji: anime.title?.romaji ?? null,
            english: anime.title?.english ?? null,
            native: anime.title?.native ?? null,
          }
        }
      },
      coverImage: {
        connectOrCreate: {
          where: { anilistId: anime.id },
          create: {
            color: anime.coverImage?.color ?? null,
            large: anime.coverImage?.large ?? null,
            medium: anime.coverImage?.medium ?? null,
            extraLarge: anime.coverImage?.extraLarge ?? null
          }
        }
      },
      bannerImage: anime.bannerImage,
      status: anime.status,
      type: anime.type,
      format: anime.format,
      updatedAt: anime.updatedAt,
      description: anime.description,
      startDate: {
        connectOrCreate: {
          where: { anilistId: anime.id },
          create: {
            day: anime.startDate?.day ?? null,
            month: anime.startDate?.month ?? null,
            year: anime.startDate?.year ?? null
          }
        }
      },
      endDate: {
        connectOrCreate: {
          where: { anilistId: anime.id },
          create: {
            day: anime.endDate?.day ?? null,
            month: anime.endDate?.month ?? null,
            year: anime.endDate?.year ?? null
          }
        }
      },
      season: anime.season,
      seasonYear: anime.seasonYear,
      episodes: anime.episodes,
      duration: anime.duration,
      countryOfOrigin: anime.countryOfOrigin,
      isLicensed: anime.isLicensed,
      source: anime.source,
      hashtag: anime.hashtag,
      moreInfo: anime.moreInfo,
      trailer: anime.trailer ? {
        connectOrCreate: {
          where: { id: anime.trailer?.id },
          create: {
            id: anime.trailer?.id ?? undefined,
            site: anime.trailer?.site ?? null,
            thumbnail: anime.trailer?.thumbnail ?? null
          }
        }
      } : undefined,
      isLocked: anime.isLocked,
      isAdult: anime.isAdult,
      averageScore: anime.averageScore,
      meanScore: anime.meanScore,
      score: ((anime.meanScore ?? 0) + (anime.averageScore ?? 0)) / 2,
      popularity: anime.popularity,
      trending: anime.trending,
      favourites: anime.favourites,
      genres: anime.genres,
      synonyms: anime.synonyms,
      recommendations: {
        connectOrCreate: anime.recommendations?.edges?.map((edge: any) => ({
          where: { id: edge?.node?.mediaRecommendation.id },
          create: {
            id: edge?.node?.mediaRecommendation.id ?? null,
            idMal: edge?.node?.mediaRecommendation.idMal ?? null
          }
        })) ?? []
      },
      characters: {
        connectOrCreate: anime.characters?.edges?.map((edge: any) => ({
          where: { id: edge?.node?.id },
          create: {
            id: edge?.node?.id ?? null,
            role: edge?.role ?? null,

            name: {
              create: {
                full: edge?.node?.name?.full ?? null,
                native: edge?.node?.name?.native ?? null,
                alternative: edge?.node?.name?.alternative ?? null,
              }
            },
            image: {
              create: {
                large: edge?.node?.image?.large ?? null,
                medium: edge?.node?.image?.medium ?? null,
              }
            },

            voiceActors: {
              connectOrCreate: edge?.voiceActors?.map((va: any) => ({
                where: { id: va.id },
                create: {
                  id: va.id,
                  language: va.languageV2 ?? null,

                  name: {
                    create: {
                      full: va.name?.full ?? null,
                      native: va.name?.native ?? null,
                      alternative: va.name?.alternative ?? null,
                    }
                  },
                  image: {
                    create: {
                      large: va.image?.large ?? null,
                      medium: va.image?.medium ?? null,
                    }
                  }
                }
              })) ?? []
            }
          }
        })) ?? []
      },
      studios: {
        connectOrCreate: anime.studios?.edges?.map((edge: any) => ({
          where: { id: edge?.node?.id },
          create: {
            id: edge?.node?.id ?? null,
            name: edge?.node?.name ?? null,
            isMain: edge?.isMain ?? false
          }
        })) ?? []
      },
      airingSchedule: {
        connectOrCreate: anime.airingSchedule?.edges?.map((edge: any) => ({
          where: { id: edge?.node?.id },
          create: {
            id: edge?.node?.id ?? null,
            episode: edge?.node?.episode ?? null,
            airingAt: edge?.node?.airingAt ?? null,
            timeUntilAiring: edge?.node?.timeUntilAiring ?? null
          }
        })) ?? []
      },
      nextAiringEpisode: anime.nextAiringEpisode ? {
        connectOrCreate: {
          where: { id: anime.nextAiringEpisode?.id },
          create: {
            id: anime.nextAiringEpisode?.id,
            episode: anime.nextAiringEpisode?.episode ?? null,
            airingAt: anime.nextAiringEpisode?.airingAt ?? null,
            timeUntilAiring: anime.nextAiringEpisode?.timeUntilAiring ?? null
          }
        }
      } : undefined,
      tags: {
        connectOrCreate: anime.tags?.map((tag: any) => ({
          where: { name: tag.name },
          create: {
            id: tag.id,
            name: tag.name,
            description: tag.description ?? null,
            category: tag.category ?? null,
            rank: tag.rank ?? null,
            isGeneralSpoiler: tag.isGeneralSpoiler ?? false,
            isMediaSpoiler: tag.isMediaSpoiler ?? false,
            isAdult: tag.isAdult ?? false,
            userId: tag.userId ?? null,
          }
        }))
      },
      rankings: {
        connectOrCreate: anime.rankings?.map((ranking: any) => ({
          where: { id: ranking.id },
          create: {
            id: ranking.id,
            rank: ranking.rank ?? null,
            type: ranking.type ?? null,
            format: ranking.format ?? null,
            year: ranking.year ?? null,
            season: ranking.season ?? null,
            allTime: ranking.allTime ?? false,
            context: ranking.context ?? null,
          }
        }))
      },
      externalLinks: {
        connectOrCreate: anime.externalLinks?.map((link: any) => ({
          where: { id: link.id },
          create: {
            id: link.id,
            url: link.url ?? null,
            site: link.site ?? null,
            siteId: link.siteId ?? null,
            type: link.type ?? null,
            language: link.language ?? null,
            color: link.color ?? null,
            icon: link.icon ?? null,
            notes: link.notes ?? null,
            isDisabled: link.isDisabled ?? false
          }
        })) ?? []
      },
      streamingEpisodes: {
        create: anime.streamingEpisodes?.map((episode: any) => ({
          title: episode.title ?? null,
          thumbnail: episode.thumbnail ?? null,
          url: episode.url ?? null,
          site: episode.site ?? null
        })) ?? []
      },
      scoreDistribution: {
        create: anime.stats.scoreDistribution?.map((score: any) => ({
          score: score.score ?? null,
          amount: score.amount ?? null,
        })) ?? []
      },
      statusDistribution: {
        create: anime.stats.statusDistribution?.map((status: any) => ({
          status: status.status ?? null,
          amount: status.amount ?? null,
        })) ?? []
      }
    }
  }

  private async safeConnectOrCreate<T>(model: any, where: any, create: T): Promise<any> {
    const exists = await model.findUnique({ where })
    if (exists) {
      return { connect: where }
    } else {
      return { create }
    }
  }

  public convertAnilistToBasic(anilist: any): BasicAnilist {
    return {
      id: anilist.id,
      idMal: anilist.idMal ?? undefined,
      siteUrl: anilist.siteUrl ?? undefined,
      title: anilist.title ?? undefined,
      synonyms: anilist.synonyms ?? undefined,
      bannerImage: anilist.bannerImage ?? undefined,
      coverImage: anilist.coverImage ?? undefined,
      type: anilist.type ?? undefined,
      format: anilist.format ?? undefined,
      status: anilist.status ?? undefined,
      description: anilist.description ?? undefined,
      moreInfo: anilist.moreInfo ?? undefined,
      startDate: anilist.startDate ?? undefined,
      season: anilist.season ?? undefined,
      seasonYear: anilist.seasonYear ?? undefined,
      episodes: anilist.episodes ?? undefined,
      episodesAired: (anilist as any).episodesAired ?? undefined,
      duration: anilist.duration ?? undefined,
      countryOfOrigin: anilist.countryOfOrigin ?? undefined,
      popularity: anilist.popularity ?? undefined,
      favourites: anilist.favourites ?? undefined,
      score: anilist.score ?? undefined,
      isLocked: anilist.isLocked ?? undefined,
      isAdult: anilist.isAdult ?? undefined,
      genres: anilist.genres ?? undefined,
      nextAiringEpisode: anilist.nextAiringEpisode ?? undefined,
      shikimori: this.convertShikimoriToBasic(anilist.shikimori)
    }
  }

  public convertBasicToBasicSmall(anilist: any): BasicAnilistSmall {
    return {
      id: anilist.id,
      idMal: anilist.idMal ?? undefined,
      siteUrl: anilist.siteUrl ?? undefined,
      title: anilist.title ?? undefined,
      coverImage: anilist.coverImage ?? undefined,
      type: anilist.type ?? undefined,
      format: anilist.format ?? undefined,
      status: anilist.status ?? undefined,
      startDate: anilist.startDate ?? undefined,
      season: anilist.season ?? undefined,
      seasonYear: anilist.seasonYear ?? undefined,
      episodes: anilist.episodes ?? undefined,
      episodesAired: (anilist as any).episodesAired ?? undefined,
      duration: anilist.duration ?? undefined,
      score: anilist.score ?? undefined,
      isLocked: anilist.isLocked ?? undefined,
      isAdult: anilist.isAdult ?? undefined,
      nextAiringEpisode: anilist.nextAiringEpisode ?? undefined,
      shikimori: this.convertShikimoriToBasic(anilist.shikimori)
    }
  }

  public convertShikimoriToBasic(shikimori?: Shikimori): BasicShikimori | undefined {
    if (!shikimori) {
      return undefined
    }
    return {
      id: shikimori.id,
      malId: shikimori.malId ?? undefined,
      russian: shikimori.russian ?? undefined,
      licenseNameRu: shikimori.licenseNameRu ?? undefined,
      url: shikimori.url ?? undefined,
      franchise: shikimori.franchise ?? undefined,
      poster: shikimori.poster as Poster ?? undefined
    }
  }

  public getFindUnique(id: number): any {
    const findUnique = {
      omit: {
        recommendations: true,
      },
      where: { id },
      include: this.getInclude(),
    }

    return findUnique;
  }

  public getInclude(): any {
    const include = {
      title: {
        omit: {
          id: true,
          anilistId: true,
        }
      },
      coverImage: {
        omit: {
          id: true,
          anilistId: true,
        }
      },
      startDate: {
        omit: {
          id: true,
          anilistId: true,
        }
      },
      endDate: {
        omit: {
          id: true,
          anilistId: true,
        }
      },
      trailer: {
        omit: {
          anilistId: true,
        }
      },
      // characters: {
      //   omit: {
      //     anilistId: true,
      //   },
      //   include: {
      //     image: {
      //       omit: {
      //         id: true,
      //         characterId: true
      //       }
      //     },
      //     name: {
      //       omit: {
      //         id: true,
      //         characterId: true
      //       }
      //     },
      //     voiceActors: {
      //       include: {
      //         image: {
      //           omit: {
      //             id: true,
      //             voiceActorId: true
      //           }
      //         },
      //         name: {
      //           omit: {
      //             id: true,
      //             voiceActorId: true
      //           }
      //         },
      //       }
      //     }
      //   }
      // },
      studios: {
        omit: {
          anilistId: true,
        }
      },
      airingSchedule: {
        omit: {
          anilistId: true,
        }
      },
      nextAiringEpisode: {
        omit: {
          anilistId: true,
        }
      },
      tags: {
        omit: {
          anilistId: true,
        }
      },
      rankings: {
        omit: {
          anilistId: true,
        }
      },
      externalLinks: {
        omit: {
          anilistId: true,
        }
      },
      streamingEpisodes: {
        omit: {
          id: true,
          anilistId: true,
        }
      },
      scoreDistribution: {
        omit: {
          id: true,
          anilistId: true,
        }
      },
      statusDistribution: {
        omit: {
          id: true,
          anilistId: true,
        }
      },
    }

    return include;
  }

  public createScheduleData(data: BasicAnilistSmall[] = [], current: boolean): ScheduleData {
    return {
      current,
      data: data.sort((a, b) => a.nextAiringEpisode?.airingAt!! - b.nextAiringEpisode?.airingAt!!),
    }
  }

  public reorderItems(raw: any) {
    if (!raw) return null

    return {
      id: raw.id,
      idMal: raw.idMal,
      siteUrl: raw.siteUrl,
      title: raw.title,
      bannerImage: raw.bannerImage,
      status: raw.status,
      type: raw.type,
      format: raw.format,
      coverImage: raw.coverImage,
      updatedAt: raw.updatedAt,
      description: raw.description,
      startDate: raw.startDate,
      endDate: raw.endDate,
      season: raw.season,
      seasonYear: raw.seasonYear,
      episodes: raw.episodes,
      duration: raw.duration,
      countryOfOrigin: raw.countryOfOrigin,
      isLicensed: raw.isLicensed,
      source: raw.source,
      hashtag: raw.hashtag,
      moreInfo: raw.moreInfo,
      isLocked: raw.isLocked,
      isAdult: raw.isAdult,
      averageScore: raw.averageScore,
      meanScore: raw.meanScore,
      score: raw.score,
      popularity: raw.popularity,
      trending: raw.trending,
      favourites: raw.favourites,
      genres: raw.genres,
      synonyms: raw.synonyms,

      trailer: raw.trailer,
      nextAiringEpisode: raw.nextAiringEpisode,

      characters: raw.characters,
      studios: raw.studios,
      airingSchedule: raw.airingSchedule,
      tags: raw.tags,
      rankings: raw.rankings,
      externalLinks: raw.externalLinks,
      streamingEpisodes: raw.streamingEpisodes,
      scoreDistribution: raw.scoreDistribution,
      statusDistribution: raw.statusDistribution,
      recommendations: raw.recommendations,
      chronology: raw.chronology,
      shikimori: raw.shikimori,
    };
  }
}
import Config from './Config'

function withTrailingSlash(url: string): string {
  return url.endsWith('/') ? url : url + '/'
}

export class UrlConfig {
  // 🔧 Base values
  public static readonly BASE = withTrailingSlash(Config.BASE || 'http://localhost:3000');

  // 🌐 API Base URLs
  public static readonly SHIKIMORI = withTrailingSlash(Config.SHIKIMORI || 'https://shikimori.one');
  public static readonly JIKAN = withTrailingSlash(Config.JIKAN || 'https://api.jikan.moe/v4');
  public static readonly ANILIST_GRAPHQL = Config.ANILIST || 'https://graphql.anilist.co';
  public static readonly TMDB: string = withTrailingSlash(Config.TMDB || 'https://api.themoviedb.org/3/');
  public static readonly TVDB: string = withTrailingSlash(Config.TVDB || 'https://api4.thetvdb.com/v4/');
  public static readonly KITSU: string = withTrailingSlash(Config.KITSU || 'https://kitsu.io/api/edge/');

  // 📡 External Links
  public static readonly MAL = 'https://myanimelist.net/anime/';
  public static readonly ANILIST = 'https://anilist.co/anime/';

  // 🔁 SHIKIMORI Sub Routes
  public static readonly SHIKIMORI_API = UrlConfig.SHIKIMORI + 'api/';
  public static readonly SHIKIMORI_GRAPHQL = UrlConfig.SHIKIMORI_API + 'graphql';
}
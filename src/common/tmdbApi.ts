import type { TMDBMovieDetails, TMDBTVDetails, TMDBData, TMDBCollectionDetails, TMDBCollectionPart } from './tmdbTypes';

const STORAGE_KEY = 'stremio_tmdb_api_key';
const API_BASE_URL = 'https://api.themoviedb.org/3';

export const getTMDBApiKey = (): string | null => {
    try {
        return window.localStorage.getItem(STORAGE_KEY);
    } catch (error) {
        console.error('Failed to get TMDB API key:', error);
        return null;
    }
};

export const setTMDBApiKey = (key: string): void => {
    try {
        window.localStorage.setItem(STORAGE_KEY, key);
    } catch (error) {
        console.error('Failed to set TMDB API key:', error);
    }
};

type TMDBFindResponse = {
    movie_results: Array<{ id: number }>;
    tv_results: Array<{ id: number }>;
};

const fetchTMDBId = async (imdbId: string, apiKey: string, type: 'movie' | 'tv'): Promise<number | null> => {
    const findUrl = `${API_BASE_URL}/find/${imdbId}?api_key=${apiKey}&external_source=imdb_id`;
    const response = await fetch(findUrl, {
        method: 'GET',
        headers: { 'accept': 'application/json' }
    });

    if (!response.ok) {
        return null;
    }

    const data: TMDBFindResponse = await response.json();
    const results = type === 'movie' ? data.movie_results : data.tv_results;
    return results && results.length > 0 ? results[0].id : null;
};

const fetchTMDBDetails = async (tmdbId: number, apiKey: string, type: 'movie' | 'tv'): Promise<TMDBMovieDetails | TMDBTVDetails | null> => {
    const appendParams = type === 'movie' 
        ? 'credits,release_dates,similar,recommendations,collection'
        : 'credits,content_ratings,similar,recommendations';
    
    const url = `${API_BASE_URL}/${type}/${tmdbId}?api_key=${apiKey}&append_to_response=${appendParams}&language=en-US`;
    const response = await fetch(url, {
        method: 'GET',
        headers: { 'accept': 'application/json' }
    });

    if (!response.ok) {
        return null;
    }

    return await response.json();
};

const fetchTMDBCollection = async (collectionId: number, apiKey: string): Promise<TMDBCollectionDetails | null> => {
    const url = `${API_BASE_URL}/collection/${collectionId}?api_key=${apiKey}&language=en-US`;
    const response = await fetch(url, {
        method: 'GET',
        headers: { 'accept': 'application/json' }
    });

    if (!response.ok) {
        return null;
    }

    return await response.json();
};

export const getTMDBMovieImdbId = async (tmdbMovieId: number, apiKey: string): Promise<string | null> => {
    const url = `${API_BASE_URL}/movie/${tmdbMovieId}/external_ids?api_key=${apiKey}`;
    const response = await fetch(url, {
        method: 'GET',
        headers: { 'accept': 'application/json' }
    });

    if (!response.ok) {
        return null;
    }

    const data: { imdb_id?: string | null } = await response.json();
    return typeof data.imdb_id === 'string' && data.imdb_id.length > 0 ? data.imdb_id : null;
};

export const getTMDBExternalImdbId = async (tmdbId: number, type: 'movie' | 'tv', apiKey: string): Promise<string | null> => {
    const url = `${API_BASE_URL}/${type}/${tmdbId}/external_ids?api_key=${apiKey}`;
    const response = await fetch(url, {
        method: 'GET',
        headers: { 'accept': 'application/json' }
    });

    if (!response.ok) {
        return null;
    }

    const data: { imdb_id?: string | null } = await response.json();
    return typeof data.imdb_id === 'string' && data.imdb_id.length > 0 ? data.imdb_id : null;
};

const transformTMDBData = (data: TMDBMovieDetails | TMDBTVDetails, collectionParts: TMDBCollectionPart[]): TMDBData => {
    let maturityRating: string | null = null;
    
    if ('release_dates' in data && data.release_dates?.results) {
        const usRelease = data.release_dates.results.find(r => r.iso_3166_1 === 'US');
        if (usRelease?.release_dates) {
            const theatrical = usRelease.release_dates.find(rd => rd.type === 3 && rd.certification && rd.certification.length > 0);
            if (theatrical) {
                maturityRating = theatrical.certification;
            } else {
                const anyWithCert = usRelease.release_dates.find(rd => rd.certification && rd.certification.length > 0);
                maturityRating = anyWithCert?.certification || null;
            }
        }
    } else if ('content_ratings' in data && data.content_ratings?.results) {
        const usRating = data.content_ratings.results.find(r => r.iso_3166_1 === 'US');
        maturityRating = usRating?.rating || null;
    }
    
    return {
        cast: data.credits?.cast?.slice(0, 20) || [],
        maturityRating,
        collection: 'belongs_to_collection' in data ? data.belongs_to_collection : null,
        collectionParts,
        similar: data.similar?.results || [],
        recommendations: data.recommendations?.results || [],
        overview: typeof data.overview === 'string' && data.overview.length > 0 ? data.overview : null,
    };
};

export const getTMDBData = async (
    imdbId: string,
    apiKey: string,
    type: 'movie' | 'tv' = 'movie',
    options: { includeCollectionParts?: boolean } = {}
): Promise<TMDBData | null> => {
    if (!imdbId || !apiKey) {
        return null;
    }

    try {
        const tmdbId = await fetchTMDBId(imdbId, apiKey, type);
        if (!tmdbId) {
            return null;
        }

        const details = await fetchTMDBDetails(tmdbId, apiKey, type);
        if (!details) {
            return null;
        }

        let collectionParts: TMDBCollectionPart[] = [];
        const includeCollectionParts = options.includeCollectionParts !== false;
        if (includeCollectionParts && type === 'movie' && 'belongs_to_collection' in details && details.belongs_to_collection?.id) {
            const collection = await fetchTMDBCollection(details.belongs_to_collection.id, apiKey);
            if (collection?.parts) {
                collectionParts = collection.parts;
            }
        }

        return transformTMDBData(details, collectionParts);
    } catch (error) {
        console.error('Failed to fetch TMDB data:', error);
        return null;
    }
};


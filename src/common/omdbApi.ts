const STORAGE_KEY = 'stremio_omdb_api_key';
const API_BASE_URL = 'https://www.omdbapi.com';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

type OMDBResponse = {
    Response: string;
    Ratings?: Array<{
        Source: string;
        Value: string;
    }>;
    Error?: string;
};

type OMDBData = {
    rottenTomatoes: string | null;
    metacritic: string | null;
};

type CachedData = {
    data: OMDBData;
    timestamp: number;
};

const cache = new Map<string, CachedData>();

export const getOMDBApiKey = (): string | null => {
    try {
        return window.localStorage.getItem(STORAGE_KEY);
    } catch (error) {
        console.error('Failed to get OMDB API key:', error);
        return null;
    }
};

export const setOMDBApiKey = (key: string): void => {
    try {
        window.localStorage.setItem(STORAGE_KEY, key);
    } catch (error) {
        console.error('Failed to set OMDB API key:', error);
    }
};

const getCachedData = (key: string): OMDBData | null => {
    const cached = cache.get(key);
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > CACHE_DURATION) {
        cache.delete(key);
        return null;
    }
    
    return cached.data;
};

const setCachedData = (key: string, data: OMDBData): void => {
    cache.set(key, { data, timestamp: Date.now() });
};

const parseRating = (value: string): string | null => {
    if (!value || typeof value !== 'string') return null;
    return value.trim();
};

export const getOMDBData = async (
    imdbId: string,
    apiKey: string
): Promise<OMDBData | null> => {
    if (!imdbId || !apiKey) {
        return null;
    }

    // Check cache
    const cacheKey = `omdb_${imdbId}`;
    const cached = getCachedData(cacheKey);
    if (cached) {
        return cached;
    }

    try {
        const url = `${API_BASE_URL}/?apikey=${encodeURIComponent(apiKey)}&i=${encodeURIComponent(imdbId)}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'accept': 'application/json' }
        });

        if (!response.ok) {
            return null;
        }

        const data: OMDBResponse = await response.json();
        
        if (data.Response === 'False' || data.Error) {
            return null;
        }

        let rottenTomatoes: string | null = null;
        let metacritic: string | null = null;

        if (Array.isArray(data.Ratings)) {
            for (const rating of data.Ratings) {
                if (rating.Source === 'Rotten Tomatoes') {
                    rottenTomatoes = parseRating(rating.Value);
                } else if (rating.Source === 'Metacritic') {
                    metacritic = parseRating(rating.Value);
                }
            }
        }

        const result: OMDBData = {
            rottenTomatoes,
            metacritic
        };

        // Cache the result
        setCachedData(cacheKey, result);

        return result;
    } catch (error) {
        console.error('Failed to fetch OMDB data:', error);
        return null;
    }
};


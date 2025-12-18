import { useState, useEffect, useMemo } from 'react';
import { extractIMDbId } from './extractIMDbId';
import { getOMDBApiKey, getOMDBData } from './omdbApi';

export type UseOMDBDataResult = {
    data: {
        rottenTomatoes: string | null;
        metacritic: string | null;
    } | null;
    loading: boolean;
    error: string | null;
};

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

type CachedData = {
    data: {
        rottenTomatoes: string | null;
        metacritic: string | null;
    };
    timestamp: number;
};

const cache = new Map<string, CachedData>();

const getCachedData = (key: string): { rottenTomatoes: string | null; metacritic: string | null } | null => {
    const cached = cache.get(key);
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > CACHE_DURATION) {
        cache.delete(key);
        return null;
    }
    
    return cached.data;
};

const setCachedData = (key: string, data: { rottenTomatoes: string | null; metacritic: string | null }): void => {
    cache.set(key, { data, timestamp: Date.now() });
};

export const useOMDBData = (metaItem: any): UseOMDBDataResult => {
    const [data, setData] = useState<{ rottenTomatoes: string | null; metacritic: string | null } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const imdbId = useMemo(() => extractIMDbId(metaItem), [metaItem]);
    const apiKey = useMemo(() => getOMDBApiKey(), []);

    useEffect(() => {
        if (!imdbId || !apiKey) {
            setData(null);
            setLoading(false);
            setError(null);
            return;
        }

        const cacheKey = `omdb_${imdbId}`;
        const cached = getCachedData(cacheKey);
        if (cached) {
            setData(cached);
            setLoading(false);
            setError(null);
            return;
        }

        setLoading(true);
        setError(null);

        getOMDBData(imdbId, apiKey)
            .then((result) => {
                if (result) {
                    setCachedData(cacheKey, result);
                    setData(result);
                } else {
                    setData(null);
                }
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message || 'Failed to fetch OMDB data');
                setLoading(false);
                setData(null);
            });
    }, [imdbId, apiKey, metaItem]);

    return { data, loading, error };
};


import { useCallback, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY_SHOW_TMDB_CAST = 'stremio_show_tmdb_cast';
const STORAGE_KEY_SHOW_POSTER_RATINGS = 'stremio_show_poster_ratings';
const STORAGE_KEY_SHOW_TMDB_DESCRIPTION = 'stremio_show_tmdb_description';
const STORAGE_KEY_SHOW_MATURITY_RATING = 'stremio_show_maturity_rating';
const STORAGE_KEY_SHOW_SIMILAR_TITLES = 'stremio_show_similar_titles';
const STORAGE_KEY_SHOW_OMDB_RATINGS = 'stremio_show_omdb_ratings';
const EVENT_NAME = 'stremio-data-enrichment-prefs-changed';

const parseBool = (value: string | null, defaultValue: boolean): boolean => {
    if (value === null) return defaultValue;
    return value === 'true';
};

export const getShowTmdbCast = (): boolean => {
    try {
        return parseBool(window.localStorage.getItem(STORAGE_KEY_SHOW_TMDB_CAST), true);
    } catch {
        return true;
    }
};

export const setShowTmdbCast = (value: boolean): void => {
    try {
        window.localStorage.setItem(STORAGE_KEY_SHOW_TMDB_CAST, value ? 'true' : 'false');
    } catch {
        // ignore
    }
    window.dispatchEvent(new Event(EVENT_NAME));
};

export const getShowPosterRatings = (): boolean => {
    try {
        return parseBool(window.localStorage.getItem(STORAGE_KEY_SHOW_POSTER_RATINGS), true);
    } catch {
        return true;
    }
};

export const setShowPosterRatings = (value: boolean): void => {
    try {
        window.localStorage.setItem(STORAGE_KEY_SHOW_POSTER_RATINGS, value ? 'true' : 'false');
    } catch {
        // ignore
    }
    window.dispatchEvent(new Event(EVENT_NAME));
};

export const getShowTmdbDescription = (): boolean => {
    try {
        return parseBool(window.localStorage.getItem(STORAGE_KEY_SHOW_TMDB_DESCRIPTION), false);
    } catch {
        return false;
    }
};

export const setShowTmdbDescription = (value: boolean): void => {
    try {
        window.localStorage.setItem(STORAGE_KEY_SHOW_TMDB_DESCRIPTION, value ? 'true' : 'false');
    } catch {
        // ignore
    }
    window.dispatchEvent(new Event(EVENT_NAME));
};

export const getShowMaturityRating = (): boolean => {
    try {
        return parseBool(window.localStorage.getItem(STORAGE_KEY_SHOW_MATURITY_RATING), false);
    } catch {
        return false;
    }
};

export const setShowMaturityRating = (value: boolean): void => {
    try {
        window.localStorage.setItem(STORAGE_KEY_SHOW_MATURITY_RATING, value ? 'true' : 'false');
    } catch {
        // ignore
    }
    window.dispatchEvent(new Event(EVENT_NAME));
};

export const getShowSimilarTitles = (): boolean => {
    try {
        return parseBool(window.localStorage.getItem(STORAGE_KEY_SHOW_SIMILAR_TITLES), true);
    } catch {
        return true;
    }
};

export const setShowSimilarTitles = (value: boolean): void => {
    try {
        window.localStorage.setItem(STORAGE_KEY_SHOW_SIMILAR_TITLES, value ? 'true' : 'false');
    } catch {
        // ignore
    }
    window.dispatchEvent(new Event(EVENT_NAME));
};

export const getShowOmdbRatings = (): boolean => {
    try {
        return parseBool(window.localStorage.getItem(STORAGE_KEY_SHOW_OMDB_RATINGS), false);
    } catch {
        return false;
    }
};

export const setShowOmdbRatings = (value: boolean): void => {
    try {
        window.localStorage.setItem(STORAGE_KEY_SHOW_OMDB_RATINGS, value ? 'true' : 'false');
    } catch {
        // ignore
    }
    window.dispatchEvent(new Event(EVENT_NAME));
};

export const useDataEnrichmentPrefs = () => {
    const [version, setVersion] = useState(0);

    useEffect(() => {
        const onChange = () => setVersion((v) => v + 1);
        window.addEventListener('storage', onChange);
        window.addEventListener(EVENT_NAME, onChange);
        return () => {
            window.removeEventListener('storage', onChange);
            window.removeEventListener(EVENT_NAME, onChange);
        };
    }, []);

    const showTmdbCast = useMemo(() => getShowTmdbCast(), [version]);
    const showPosterRatings = useMemo(() => getShowPosterRatings(), [version]);
    const showTmdbDescription = useMemo(() => getShowTmdbDescription(), [version]);
    const showMaturityRating = useMemo(() => getShowMaturityRating(), [version]);
    const showSimilarTitles = useMemo(() => getShowSimilarTitles(), [version]);
    const showOmdbRatings = useMemo(() => getShowOmdbRatings(), [version]);

    const updateShowTmdbCast = useCallback((value: boolean) => setShowTmdbCast(value), []);
    const updateShowPosterRatings = useCallback((value: boolean) => setShowPosterRatings(value), []);
    const updateShowTmdbDescription = useCallback((value: boolean) => setShowTmdbDescription(value), []);
    const updateShowMaturityRating = useCallback((value: boolean) => setShowMaturityRating(value), []);
    const updateShowSimilarTitles = useCallback((value: boolean) => setShowSimilarTitles(value), []);
    const updateShowOmdbRatings = useCallback((value: boolean) => setShowOmdbRatings(value), []);

    return {
        showTmdbCast,
        showPosterRatings,
        showTmdbDescription,
        showMaturityRating,
        showSimilarTitles,
        showOmdbRatings,
        setShowTmdbCast: updateShowTmdbCast,
        setShowPosterRatings: updateShowPosterRatings,
        setShowTmdbDescription: updateShowTmdbDescription,
        setShowMaturityRating: updateShowMaturityRating,
        setShowSimilarTitles: updateShowSimilarTitles,
        setShowOmdbRatings: updateShowOmdbRatings,
    };
};



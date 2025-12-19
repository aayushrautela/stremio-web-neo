// Copyright (C) 2017-2025 Smart code 203358507

const React = require('react');

/**
 * Parse year from releaseInfo string
 * @param {string} releaseInfo - e.g., "2023 • Action, Drama" or "2023"
 * @returns {number|null}
 */
const parseYear = (releaseInfo) => {
    if (typeof releaseInfo !== 'string') return null;
    const match = releaseInfo.match(/\b(19|20)\d{2}\b/);
    return match ? parseInt(match[0], 10) : null;
};

/**
 * Parse IMDB rating from links array
 * @param {Array} links - Item links array
 * @returns {number|null}
 */
const parseRating = (links) => {
    if (!Array.isArray(links)) return null;
    const imdbLink = links.find((l) => l && l.category === 'imdb' && typeof l.name === 'string');
    if (!imdbLink) return null;
    const ratingMatch = imdbLink.name.match(/(\d+\.?\d*)/);
    return ratingMatch ? parseFloat(ratingMatch[1]) : null;
};

/**
 * Parse runtime to minutes
 * @param {string} runtime - e.g., "2h 15min", "135 min", "2:15:00"
 * @returns {number|null}
 */
const parseRuntime = (runtime) => {
    if (typeof runtime !== 'string') return null;

    // Handle "Xh Ymin" or "Xh" or "Ymin" format
    const hoursMatch = runtime.match(/(\d+)\s*h/i);
    const minsMatch = runtime.match(/(\d+)\s*min/i);

    if (hoursMatch || minsMatch) {
        const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
        const mins = minsMatch ? parseInt(minsMatch[1], 10) : 0;
        return hours * 60 + mins;
    }

    // Handle "X:XX:XX" or "X:XX" format
    const timeMatch = runtime.match(/(\d+):(\d+)(?::(\d+))?/);
    if (timeMatch) {
        const hours = parseInt(timeMatch[1], 10);
        const mins = parseInt(timeMatch[2], 10);
        return hours * 60 + mins;
    }

    // Handle plain number (assume minutes)
    const plainMins = runtime.match(/^(\d+)$/);
    if (plainMins) {
        return parseInt(plainMins[1], 10);
    }

    return null;
};

/**
 * Hook to manage client-side filters for Discover page
 * Filters items by year, rating, and runtime after they're loaded from catalog
 */
const useClientFilters = () => {
    const [filters, setFilters] = React.useState({
        yearFrom: null,
        yearTo: null,
        ratingMin: null,
        runtimeMax: null,
    });

    const updateFilter = React.useCallback((key, value) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
        }));
    }, []);

    const clearFilters = React.useCallback(() => {
        setFilters({
            yearFrom: null,
            yearTo: null,
            ratingMin: null,
            runtimeMax: null,
        });
    }, []);

    const hasActiveFilters = React.useMemo(() => {
        return filters.yearFrom !== null ||
            filters.yearTo !== null ||
            filters.ratingMin !== null ||
            filters.runtimeMax !== null;
    }, [filters]);

    const activeFilterCount = React.useMemo(() => {
        let count = 0;
        if (filters.yearFrom !== null || filters.yearTo !== null) count++;
        if (filters.ratingMin !== null) count++;
        if (filters.runtimeMax !== null) count++;
        return count;
    }, [filters]);

    const filterItems = React.useCallback((items) => {
        if (!Array.isArray(items)) return [];
        if (!hasActiveFilters) return items;

        return items.filter((item) => {
            // Parse item data
            const year = parseYear(item.releaseInfo);
            const rating = parseRating(item.links);
            const runtime = parseRuntime(item.runtime);

            // Year range filter - items without year data pass through
            if (filters.yearFrom !== null && year !== null && year < filters.yearFrom) {
                return false;
            }
            if (filters.yearTo !== null && year !== null && year > filters.yearTo) {
                return false;
            }

            // Minimum rating filter - items without rating data pass through
            if (filters.ratingMin !== null && rating !== null && rating < filters.ratingMin) {
                return false;
            }

            // Maximum runtime filter - items without runtime data pass through
            if (filters.runtimeMax !== null && runtime !== null && runtime > filters.runtimeMax) {
                return false;
            }

            return true;
        });
    }, [filters, hasActiveFilters]);

    return {
        filters,
        setFilters,
        updateFilter,
        clearFilters,
        filterItems,
        hasActiveFilters,
        activeFilterCount,
    };
};

module.exports = useClientFilters;

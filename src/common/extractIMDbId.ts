export const extractIMDbId = (metaItem: any): string | null => {
    if (!metaItem) {
        return null;
    }

    // First, check if the meta item's ID is already an IMDb ID (format: tt#######)
    if (typeof metaItem.id === 'string') {
        const imdbIdMatch = metaItem.id.match(/^tt\d+$/);
        if (imdbIdMatch) {
            return imdbIdMatch[0];
        }
    }

    // Then, check links array for IMDb link
    if (!Array.isArray(metaItem.links)) {
        return null;
    }

    const imdbLink = metaItem.links.find((link: any) => 
        link && 
        link.category === 'imdb' && 
        typeof link.url === 'string' &&
        link.url.includes('imdb.com')
    );

    if (!imdbLink?.url) {
        return null;
    }

    const match = imdbLink.url.match(/tt\d+/);
    return match ? match[0] : null;
};


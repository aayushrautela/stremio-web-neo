// Copyright (C) 2017-2023 Smart code 203358507

const React = require('react');
const { useServices } = require('stremio/services');
const { useModelState } = require('stremio/common');

/**
 * Extracts type and id from an item's deepLinks URL or properties
 * @param {Object} item - Item with deepLinks or type/id properties
 * @returns {{type: string, id: string} | null}
 */
const extractMetaPath = (item) => {
    if (!item) return null;
    
    let type = item.type;
    let id = null;
    
    // Try to extract from deepLinks URL
    const metaUrl = item.deepLinks?.metaDetailsVideos || item.deepLinks?.metaDetailsStreams;
    if (typeof metaUrl === 'string') {
        // URL format: /metadetails/{type}/{id} or /detail/{type}/{id}
        const match = metaUrl.match(/\/(?:metadetails|detail)\/([^/]+)\/([^/]+)/);
        if (match) {
            type = match[1];
            id = match[2];
        }
    }
    
    // Fallback: use id property if available
    if (!id && (item.id || item._id)) {
        id = item.id || item._id;
    }
    
    // If we still don't have both, return null
    if (!type || !id) {
        return null;
    }
    
    return { type, id };
};

/**
 * Hook to fetch meta details for a single item
 * @param {Object} item - Item to fetch meta details for
 * @returns {Object} Meta details state with background and logo
 */
const useMetaDetailsForItem = (item) => {
    const metaPath = React.useMemo(() => extractMetaPath(item), [item]);
    
    const action = React.useMemo(() => {
        if (metaPath) {
            return {
                action: 'Load',
                args: {
                    model: 'MetaDetails',
                    args: {
                        metaPath: {
                            resource: 'meta',
                            type: metaPath.type,
                            id: metaPath.id,
                            extra: []
                        },
                        streamPath: null,
                        guessStream: false,
                    }
                }
            };
        } else {
            return {
                action: 'Unload'
            };
        }
    }, [metaPath]);
    
    const metaDetails = useModelState({ 
        model: 'meta_details', 
        action
    });
    
    return React.useMemo(() => {
        if (metaDetails?.metaItem?.content?.type === 'Ready') {
            const metaItem = metaDetails.metaItem.content.content;
            return {
                background: metaItem.background || null,
                logo: metaItem.logo || null,
                loading: false,
                error: null
            };
        } else if (metaDetails?.metaItem?.content?.type === 'Loading') {
            return {
                background: null,
                logo: null,
                loading: true,
                error: null
            };
        } else if (metaDetails?.metaItem?.content?.type === 'Err') {
            return {
                background: null,
                logo: null,
                loading: false,
                error: metaDetails.metaItem.content.content
            };
        }
        return {
            background: null,
            logo: null,
            loading: false,
            error: null
        };
    }, [metaDetails]);
};

/**
 * Hook to fetch meta details for multiple items (up to maxItems)
 * Uses a single model state with multiple dispatches to avoid hooks rule violations
 * @param {Array} items - Array of items to fetch meta details for
 * @param {number} maxItems - Maximum number of items to fetch (default: 5)
 * @returns {{metaDataMap: Map, isLoading: boolean}} Map of item keys to meta data (background, logo) and loading state
 */
const useMetaDetailsForItems = (items, maxItems = 5) => {
    const { core } = useServices();
    // Use ref to maintain persistent cache across item changes
    const metadataCacheRef = React.useRef(new Map());
    const [metaDataMap, setMetaDataMap] = React.useState(new Map());
    const [isLoading, setIsLoading] = React.useState(false);
    
    const itemsToFetch = React.useMemo(() => {
        if (!Array.isArray(items) || items.length === 0) {
            return [];
        }
        
        return items.slice(0, maxItems).map((item, index) => {
            const metaPath = extractMetaPath(item);
            // Use _id first (library items use _id), then id, then fallback
            const key = item._id || item.id || `item-${index}`;
            return {
                item,
                metaPath,
                key,
                originalItem: item // Keep reference to original item for key matching
            };
        }).filter(({ metaPath }) => metaPath !== null);
    }, [items, maxItems]);
    
    React.useEffect(() => {
        // Start with cached metadata for items we already have
        const cache = metadataCacheRef.current;
        const initialMap = new Map();
        
        // Populate initial map with cached data for current items
        itemsToFetch.forEach(({ key, originalItem }) => {
            const cached = cache.get(key) || cache.get(originalItem._id) || cache.get(originalItem.id);
            if (cached) {
                initialMap.set(key, cached);
                if (originalItem._id) {
                    initialMap.set(originalItem._id, cached);
                }
                if (originalItem.id && originalItem.id !== originalItem._id) {
                    initialMap.set(originalItem.id, cached);
                }
            }
        });
        
        // Update state with cached data immediately
        if (initialMap.size > 0) {
            setMetaDataMap(new Map(initialMap));
        }
        
        // Filter out items we already have metadata for
        const itemsToFetchNew = itemsToFetch.filter(({ key }) => !cache.has(key));
        
        if (itemsToFetchNew.length === 0) {
            setIsLoading(false);
            return;
        }
        
        setIsLoading(true);
        let isCancelled = false;
        const newMap = new Map(initialMap); // Start with cached data
        const listeners = [];
        
        // Fetch items sequentially to avoid conflicts with single meta_details model
        const fetchSequentially = async (index) => {
            if (isCancelled || index >= itemsToFetchNew.length) {
                if (!isCancelled) {
                    // Update cache with all fetched data
                    newMap.forEach((value, key) => {
                        cache.set(key, value);
                    });
                    if (newMap.size > 0) {
                        setMetaDataMap(new Map(newMap));
                    }
                    setIsLoading(false);
                }
                return;
            }
            
            const { metaPath, key } = itemsToFetchNew[index];
            
            // Dispatch load action
            core.transport.dispatch({
                action: 'Load',
                args: {
                    model: 'MetaDetails',
                    args: {
                        metaPath: {
                            resource: 'meta',
                            type: metaPath.type,
                            id: metaPath.id,
                            extra: []
                        },
                        streamPath: null,
                        guessStream: false,
                    }
                }
            });
            
            // Wait for the state to be ready
            const waitForReady = () => {
                return new Promise((resolve) => {
                    let resolved = false;
                    
                    const checkState = async () => {
                        if (resolved || isCancelled) return;
                        
                        try {
                            const state = await core.transport.getState('meta_details');
                            const currentMetaPath = state?.selected?.metaPath;
                            
                            if (state?.metaItem?.content?.type === 'Ready' &&
                                currentMetaPath &&
                                currentMetaPath.type === metaPath.type &&
                                currentMetaPath.id === metaPath.id) {
                                const metaItem = state.metaItem.content.content;
                                resolve({
                                    background: metaItem.background || null,
                                    logo: metaItem.logo || null,
                                    releaseInfo: metaItem.releaseInfo || null,
                                    runtime: metaItem.runtime || null,
                                    description: metaItem.description || null,
                                    links: Array.isArray(metaItem.links) ? metaItem.links : null,
                                    trailerStreams: Array.isArray(metaItem.trailerStreams) ? metaItem.trailerStreams : null
                                });
                                resolved = true;
                                return;
                            } else if (state?.metaItem?.content?.type === 'Loading') {
                                // Still loading, check again after a delay
                                setTimeout(checkState, 200);
                                return;
                            } else if (state?.metaItem?.content?.type === 'Err') {
                                // Error, resolve with null
                                resolve(null);
                                resolved = true;
                                return;
                            }
                        } catch (err) {
                            resolve(null);
                            resolved = true;
                            return;
                        }
                    };
                    
                    // Set up listener for state updates
                    const onNewState = async (models) => {
                        if (models.indexOf('meta_details') === -1 || resolved || isCancelled) {
                            return;
                        }
                        checkState();
                    };
                    
                    core.transport.on('NewState', onNewState);
                    listeners.push(onNewState);
                    
                    // Initial check
                    checkState();
                    
                    // Timeout after 5 seconds
                    setTimeout(() => {
                        if (!resolved) {
                            resolve(null);
                            resolved = true;
                        }
                    }, 5000);
                });
            };
            
            const metaData = await waitForReady();
            if (metaData && !isCancelled) {
                // Store with multiple keys for easier lookup
                newMap.set(key, metaData);
                const originalItem = itemsToFetchNew[index].originalItem;
                if (originalItem._id) {
                    newMap.set(originalItem._id, metaData);
                }
                if (originalItem.id && originalItem.id !== originalItem._id) {
                    newMap.set(originalItem.id, metaData);
                }
                
                // Update cache immediately
                cache.set(key, metaData);
                if (originalItem._id) {
                    cache.set(originalItem._id, metaData);
                }
                if (originalItem.id && originalItem.id !== originalItem._id) {
                    cache.set(originalItem.id, metaData);
                }
                
                // Update map incrementally so UI can show progress
                setMetaDataMap(new Map(newMap));
            }
            
            // Fetch next item
            await fetchSequentially(index + 1);
        };
        
        // Start fetching from first item
        fetchSequentially(0).then(() => {
            if (!isCancelled) {
                setIsLoading(false);
            }
        });
        
        // Cleanup function
        return () => {
            isCancelled = true;
            setIsLoading(false);
            listeners.forEach((listener) => {
                core.transport.off('NewState', listener);
            });
            // Don't unload meta_details here as it might be used by other components
            // Only unload if we're the last one using it (would need ref counting for that)
        };
    }, [itemsToFetch, core]);
    
    return { metaDataMap, isLoading };
};

module.exports = {
    extractMetaPath,
    useMetaDetailsForItem,
    useMetaDetailsForItems
};


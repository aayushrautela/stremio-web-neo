// Copyright (C) 2017-2023 Smart code 203358507

const React = require('react');
const classnames = require('classnames');
const debounce = require('lodash.debounce');
const useTranslate = require('stremio/common/useTranslate');
const { useStreamingServer, useNotifications, withCoreSuspender, getVisibleChildrenRange, useProfile, useMetaDetailsForItems } = require('stremio/common');
const { ContinueWatchingItem, EventModal, MainNavBars, MetaItem, MetaRow } = require('stremio/components');
const useBoard = require('./useBoard');
const useContinueWatchingPreview = require('./useContinueWatchingPreview');
const applyCatalogPreferences = require('./applyCatalogPreferences').default;
const useCatalogPreferences = require('stremio/common/useCatalogPreferences').default;
const styles = require('./styles');
const { default: StreamingServerWarning } = require('./StreamingServerWarning');
const HeroShelf = require('./HeroShelf');

const THRESHOLD = 5;

const Board = () => {
    const t = useTranslate();
    const streamingServer = useStreamingServer();
    const continueWatchingPreview = useContinueWatchingPreview();
    const [board, loadBoardRows] = useBoard();
    const notifications = useNotifications();
    const profile = useProfile();
    const boardCatalogsOffset = (continueWatchingPreview?.items?.length > 0 || (continueWatchingPreview?.content?.content && Array.isArray(continueWatchingPreview.content.content) && continueWatchingPreview.content.content.length > 0)) ? 1 : 0;
    const scrollContainerRef = React.useRef();
    const showStreamingServerWarning = React.useMemo(() => {
        return streamingServer.settings !== null && streamingServer.settings.type === 'Err' && (
            isNaN(profile.settings.streamingServerWarningDismissed.getTime()) ||
            profile.settings.streamingServerWarningDismissed.getTime() < Date.now());
    }, [profile.settings, streamingServer.settings]);
    const onVisibleRangeChange = React.useCallback(() => {
        const range = getVisibleChildrenRange(scrollContainerRef.current);
        if (range === null) {
            return;
        }

        const start = Math.max(0, range.start - boardCatalogsOffset - THRESHOLD);
        const end = range.end - boardCatalogsOffset + THRESHOLD;
        if (end < start) {
            return;
        }

        loadBoardRows({ start, end });
    }, [boardCatalogsOffset]);
    const onScroll = React.useCallback(debounce(onVisibleRangeChange, 250), [onVisibleRangeChange]);
    const catalogPrefs = useCatalogPreferences();
    const preferencesResult = React.useMemo(() => {
        return applyCatalogPreferences(board.catalogs, catalogPrefs.preferences);
    }, [board.catalogs, catalogPrefs.preferences]);
    const heroItems = React.useMemo(() => {
        return preferencesResult.heroItems;
    }, [preferencesResult.heroItems]);
    const filteredCatalogs = React.useMemo(() => {
        return preferencesResult.filteredCatalogs;
    }, [preferencesResult.filteredCatalogs]);

    const sourceItems = React.useMemo(() => {
        return continueWatchingPreview?.items ?? continueWatchingPreview?.content?.content ?? [];
    }, [continueWatchingPreview]);

    // Identify hero items that are missing background or logo
    const heroItemsNeedingMetadata = React.useMemo(() => {
        if (!Array.isArray(heroItems) || heroItems.length === 0) {
            return [];
        }
        return heroItems.filter((item) => {
            if (!item) return false;
            const hasBackground = typeof item.background === 'string' && item.background.length > 0;
            const hasLogo = typeof item.logo === 'string' && item.logo.length > 0;
            return !hasBackground || !hasLogo;
        });
    }, [heroItems]);

    // Start with 1 hero card, then load more after delay
    const [heroMaxItems, setHeroMaxItems] = React.useState(1);

    // Fetch meta details for hero items - start with 1, then load rest sequentially
    const { metaDataMap: heroMetaDataMap, isLoading: isLoadingHeroMetaDetails } = useMetaDetailsForItems(
        heroItemsNeedingMetadata, 
        Math.min(heroItemsNeedingMetadata.length, heroMaxItems)
    );

    // After 3 seconds, start loading more hero items (gives continue watching time to start)
    React.useEffect(() => {
        if (heroItemsNeedingMetadata.length > 1 && heroMaxItems === 1) {
            const timer = setTimeout(() => {
                setHeroMaxItems(Math.min(heroItemsNeedingMetadata.length, 15));
            }, 3000); // 3 second delay
            
            return () => clearTimeout(timer);
        }
    }, [heroItemsNeedingMetadata.length, heroMaxItems]);

    // Fetch meta details for first 10 items to get background and logo
    const { metaDataMap, isLoading: isLoadingMetaDetails } = useMetaDetailsForItems(sourceItems, 10);

    // Enhance hero items with fetched metadata
    const enhancedHeroItems = React.useMemo(() => {
        if (!Array.isArray(heroItems) || heroItems.length === 0) {
            return heroItems;
        }

        return heroItems.map((item) => {
            const itemKey = item._id || item.id;
            const metaData = heroMetaDataMap.get(itemKey) || heroMetaDataMap.get(item._id) || heroMetaDataMap.get(item.id);

            // Helper to get valid string value (non-empty)
            const getValidString = (...values) => {
                for (const val of values) {
                    if (typeof val === 'string' && val.length > 0) {
                        return val;
                    }
                }
                return undefined;
            };

            const finalBackground = getValidString(
                metaData?.background,
                item.background,
                item.backdrop,
                item.fanart,
                item?.behaviorHints?.background
            );
            const finalLogo = getValidString(
                metaData?.logo,
                item.logo,
                item.logo_url,
                item?.behaviorHints?.logo
            );

            return {
                ...item,
                background: finalBackground,
                logo: finalLogo,
                // Merge additional metadata if available from fetched meta details
                releaseInfo: metaData?.releaseInfo || item.releaseInfo,
                runtime: metaData?.runtime || item.runtime,
                description: metaData?.description || item.description,
                links: metaData?.links || item.links,
                trailerStreams: metaData?.trailerStreams || item.trailerStreams
            };
        });
    }, [heroItems, heroMetaDataMap]);

    const continueWatchingCatalog = React.useMemo(() => {
        if (!continueWatchingPreview) {
            return continueWatchingPreview;
        }

        if (!Array.isArray(sourceItems) || sourceItems.length === 0) {
            return continueWatchingPreview;
        }

        const items = sourceItems.map((item) => {
            const itemKey = item._id || item.id;
            const metaData = metaDataMap.get(itemKey) || metaDataMap.get(item._id) || metaDataMap.get(item.id);

            const finalBackground = metaData?.background || item.background || item.backdrop || item.fanart || item?.behaviorHints?.background;
            const finalLogo = metaData?.logo || item.logo || item.logo_url || item?.behaviorHints?.logo;

            return {
                ...item,
                posterShape: 'landscape',
                background: finalBackground,
                logo: finalLogo
            };
        });

        if (continueWatchingPreview.items) {
            return {
                ...continueWatchingPreview,
                items
            };
        } else {
            return {
                ...continueWatchingPreview,
                content: {
                    ...continueWatchingPreview.content,
                    content: items
                }
            };
        }
    }, [continueWatchingPreview, sourceItems, metaDataMap]);

    React.useLayoutEffect(() => {
        onVisibleRangeChange();
    }, [board.catalogs, onVisibleRangeChange]);
    return (
        <div className={styles['board-container']}>
            <EventModal />
            <MainNavBars className={styles['board-content-container']} route={'board'}>
                <div ref={scrollContainerRef} className={styles['board-content']} onScroll={onScroll}>
                    {preferencesResult.heroSectionEnabled && (
                        <HeroShelf items={enhancedHeroItems.length > 0 ? enhancedHeroItems : undefined} isLoading={isLoadingHeroMetaDetails} />
                    )}
                    {
                        (continueWatchingPreview?.items?.length > 0 || (continueWatchingPreview?.content?.content && Array.isArray(continueWatchingPreview.content.content) && continueWatchingPreview.content.content.length > 0)) ?
                            isLoadingMetaDetails ?
                                <MetaRow.Placeholder
                                    className={classnames(styles['board-row'], styles['continue-watching-row'], 'animation-fade-in')}
                                    title={t.string('BOARD_CONTINUE_WATCHING')}
                                    deepLinks={continueWatchingPreview?.deepLinks}
                                    previewSize={10}
                                    posterShape="landscape"
                                />
                                :
                                <MetaRow
                                    className={classnames(styles['board-row'], styles['continue-watching-row'], 'animation-fade-in')}
                                    title={t.string('BOARD_CONTINUE_WATCHING')}
                                    catalog={continueWatchingCatalog}
                                    itemComponent={ContinueWatchingItem}
                                    notifications={notifications}
                                />
                            :
                            null
                    }
                    {filteredCatalogs.map((catalog, index) => {
                        switch (catalog.content?.type) {
                            case 'Ready': {
                                return (
                                    <MetaRow
                                        key={index}
                                        className={classnames(styles['board-row'], styles[`board-row-${catalog.content.content[0].posterShape}`], 'animation-fade-in')}
                                        catalog={catalog}
                                        itemComponent={MetaItem}
                                    />
                                );
                            }
                            case 'Err': {
                                if (catalog.content.content !== 'EmptyContent') {
                                    return (
                                        <MetaRow
                                            key={index}
                                            className={classnames(styles['board-row'], 'animation-fade-in')}
                                            catalog={catalog}
                                            message={catalog.content.content}
                                        />
                                    );
                                }
                                return null;
                            }
                            default: {
                                return (
                                    <MetaRow.Placeholder
                                        key={index}
                                        className={classnames(styles['board-row'], styles['board-row-poster'], 'animation-fade-in')}
                                        catalog={catalog}
                                        title={t.catalogTitle(catalog)}
                                    />
                                );
                            }
                        }
                    })}
                </div>
            </MainNavBars>
            {
                showStreamingServerWarning ?
                    <StreamingServerWarning className={styles['board-warning-container']} />
                    :
                    null
            }
        </div>
    );
};

const BoardFallback = () => (
    <div className={styles['board-container']}>
        <MainNavBars className={styles['board-content-container']} route={'board'} />
    </div>
);

module.exports = withCoreSuspender(Board, BoardFallback);

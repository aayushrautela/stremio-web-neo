// Copyright (C) 2017-2023 Smart code 203358507

const React = require('react');
const classnames = require('classnames');
const { default: Image } = require('stremio/components/Image');
const { Button } = require('stremio/components');
const { useInterval } = require('stremio/common');
const { default: Icon } = require('@stremio/stremio-icons/react');
const styles = require('./styles');
const { t } = require('i18next');

const HeroShelf = ({ items, isLoading }) => {
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const interval = useInterval(15000); // 15 seconds

    const heroItems = React.useMemo(() => {
        if (!Array.isArray(items) || items.length === 0) {
            return [];
        }
        // Filter items that have both background and logo
        // If loading, wait for metadata to be fetched before filtering
        const filtered = items.filter((item) =>
            item &&
            typeof item.background === 'string' &&
            item.background.length > 0 &&
            typeof item.logo === 'string' &&
            item.logo.length > 0
        );
        // If we're loading and have no items yet, return empty array to show placeholder
        // Otherwise return filtered items (which may be empty if still loading)
        return filtered;
    }, [items, isLoading]);

    const nextSlide = React.useCallback(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % heroItems.length);
    }, [heroItems.length]);

    const prevSlide = React.useCallback(() => {
        setCurrentIndex((prevIndex) => (prevIndex - 1 + heroItems.length) % heroItems.length);
    }, [heroItems.length]);

    // Reset currentIndex when heroItems changes (e.g., when metadata loads)
    React.useEffect(() => {
        if (heroItems.length > 0 && currentIndex >= heroItems.length) {
            setCurrentIndex(0);
        }
    }, [heroItems.length, currentIndex]);

    React.useEffect(() => {
        if (heroItems.length > 1) {
            interval.start(nextSlide);
        } else {
            interval.cancel();
        }
        return () => {
            interval.cancel();
        };
    }, [heroItems.length, nextSlide, interval]);

    const onNext = React.useCallback(() => {
        nextSlide();
        interval.start(nextSlide);
    }, [nextSlide, interval]);

    const onPrev = React.useCallback(() => {
        prevSlide();
        interval.start(nextSlide);
    }, [prevSlide, nextSlide, interval]);

    const currentItem = heroItems.length > 0 ? heroItems[currentIndex] : null;

    const renderLogoFallback = React.useCallback(() => {
        if (!currentItem) return null;
        return <div className={styles['logo-placeholder']}>{currentItem.name || ''}</div>;
    }, [currentItem]);

    if (items === undefined || items === null) {
        return (
            <div className={styles['hero-shelf-container']}>
                <div className={styles['hero-shelf-wrapper']}>
                    <div className={styles['hero-placeholder']}>
                        <div className={styles['placeholder-background']} />
                        <div className={styles['placeholder-content']}>
                            <div className={styles['placeholder-logo']} />
                            <div className={styles['placeholder-metadata']}>
                                <div className={styles['placeholder-badge']} />
                                <div className={styles['placeholder-text']} />
                            </div>
                            <div className={styles['placeholder-description']}>
                                <div className={styles['placeholder-line']} />
                                <div className={styles['placeholder-line']} />
                                <div className={styles['placeholder-line']} />
                            </div>
                            <div className={styles['placeholder-buttons']}>
                                <div className={styles['placeholder-button']} />
                                <div className={styles['placeholder-button']} />
                                <div className={styles['placeholder-button']} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (heroItems.length === 0) {
        // No hero items found - show placeholder if loading, otherwise return null
        if (isLoading && Array.isArray(items) && items.length > 0) {
            return (
                <div className={styles['hero-shelf-container']}>
                    <div className={styles['hero-shelf-wrapper']}>
                        <div className={styles['hero-placeholder']}>
                            <div className={styles['placeholder-background']} />
                            <div className={styles['placeholder-content']}>
                                <div className={styles['placeholder-logo']} />
                                <div className={styles['placeholder-metadata']}>
                                    <div className={styles['placeholder-badge']} />
                                    <div className={styles['placeholder-text']} />
                                </div>
                                <div className={styles['placeholder-description']}>
                                    <div className={styles['placeholder-line']} />
                                    <div className={styles['placeholder-line']} />
                                    <div className={styles['placeholder-line']} />
                                </div>
                                <div className={styles['placeholder-buttons']}>
                                    <div className={styles['placeholder-button']} />
                                    <div className={styles['placeholder-button']} />
                                    <div className={styles['placeholder-button']} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    }

    return (
        <div className={styles['hero-shelf-container']}>
            <div className={styles['hero-shelf-wrapper']}>
                {heroItems.length > 1 && (
                    <>
                        <div className={classnames(styles['nav-button'], styles['prev'])} onClick={onPrev}>
                            <Icon className={styles['nav-icon']} name="chevron-back" />
                        </div>
                        <div className={classnames(styles['nav-button'], styles['next'])} onClick={onNext}>
                            <Icon className={styles['nav-icon']} name="chevron-forward" />
                        </div>
                    </>
                )}
                {heroItems.map((item, index) => {
                    const isActive = index === currentIndex;
                    const imdbLinkData = item.links?.find(l => l.category === 'imdb');
                    const imdbRating = imdbLinkData?.name;
                    const imdbHref = imdbLinkData?.url ? `https://www.stremio.com/warning#${encodeURIComponent(imdbLinkData.url)}` : null;
                    const year = item.releaseInfo;
                    const runtime = item.runtime;
                    const description = item.description;
                    const trailerHref = Array.isArray(item.trailerStreams) && item.trailerStreams.length > 0
                        ? item.trailerStreams[0].deepLinks?.player ?? null
                        : null;

                    const len = heroItems.length;
                    const offset = (index - currentIndex + len) % len;
                    const isLeft = offset > len / 2;
                    const isRight = offset > 0 && offset <= len / 2;

                    return (
                        <div
                            key={index}
                            className={classnames(styles['hero-item'], {
                                [styles['active']]: isActive,
                                [styles['prev']]: index === (currentIndex - 1 + heroItems.length) % heroItems.length,
                                [styles['next']]: index === (currentIndex + 1) % heroItems.length,
                                [styles['left']]: isLeft,
                                [styles['right']]: isRight
                            })}
                        >
                            <div className={styles['background-layer']}>
                                <Image
                                    className={styles['background-image']}
                                    src={item.background}
                                    alt={item.name || ''}
                                />
                                <div className={styles['background-overlay']} />
                            </div>
                            <div className={styles['content-layer']}>
                                <div className={styles['logo-container']}>
                                    <Image
                                        className={styles['logo-image']}
                                        src={item.logo}
                                        alt={item.name || ''}
                                        renderFallback={renderLogoFallback}
                                    />
                                </div>
                                <div className={styles['metadata-row']}>
                                    {imdbRating && (
                                        <Button
                                            className={styles['badge-imdb']}
                                            href={imdbHref}
                                            target="_blank"
                                            title={t('IMDB')}
                                        >
                                            <span className={styles['imdb-label']}>{t('IMDB')}</span>
                                            <span className={styles['imdb-rating']}>{imdbRating}</span>
                                        </Button>
                                    )}
                                    {year && <div className={styles['metadata-item']}>{year}</div>}
                                    {runtime && (
                                        <>
                                            <div className={styles['metadata-separator']}>•</div>
                                            <div className={styles['metadata-item']}>{runtime}</div>
                                        </>
                                    )}
                                </div>
                                {(year || runtime) && (
                                    <div className={styles['year-row']}>
                                        {year && <div className={styles['year-item']}>{year}</div>}
                                        {runtime && (
                                            <>
                                                <div className={styles['metadata-separator']}>•</div>
                                                <div className={styles['year-item']}>{runtime}</div>
                                            </>
                                        )}
                                    </div>
                                )}
                                {imdbRating && (
                                    <div className={styles['rating-row']}>
                                        <div className={styles['badge-imdb']}>
                                            <span className={styles['imdb-label']}>{t('IMDB')}</span>
                                            <span className={styles['imdb-rating']}>{imdbRating}</span>
                                        </div>
                                    </div>
                                )}
                                {description && (
                                    <div className={styles['description']}>
                                        {description}
                                    </div>
                                )}
                                <div className={styles['buttons-row']}>
                                    <Button
                                        className={classnames(styles['action-button'], styles['primary'])}
                                        href={item.deepLinks?.metaDetailsVideos ?? item.deepLinks?.metaDetailsStreams ?? null}
                                        title={t('WATCH_NOW')}
                                    >
                                        <Icon className={styles['icon']} name={'play'} />
                                        <span className={styles['label']}>{t('WATCH_NOW')}</span>
                                    </Button>
                                    {trailerHref && (
                                        <Button
                                            className={classnames(styles['action-button'], styles['secondary'], styles['trailer-button'])}
                                            href={trailerHref}
                                            title={t('TRAILER')}
                                        >
                                            <Icon className={styles['icon']} name={'trailer'} />
                                            <span className={styles['label']}>{t('TRAILER')}</span>
                                        </Button>
                                    )}
                                    <Button
                                        className={classnames(styles['action-button'], styles['secondary'])}
                                        title={t('MY_LIST')}
                                    >
                                        <Icon className={styles['icon']} name={'add'} />
                                        <span className={styles['label']}>{t('MY_LIST')}</span>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

module.exports = HeroShelf;


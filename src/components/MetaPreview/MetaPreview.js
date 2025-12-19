// Copyright (C) 2017-2023 Smart code 203358507

const React = require('react');
const PropTypes = require('prop-types');
const classnames = require('classnames');
const UrlUtils = require('url');
const { useTranslation } = require('react-i18next');
const { default: Icon } = require('@stremio/stremio-icons/react');
const { default: Button } = require('stremio/components/Button');
const { default: Image } = require('stremio/components/Image');
const ModalDialog = require('stremio/components/ModalDialog');
const SharePrompt = require('stremio/components/SharePrompt');
const CONSTANTS = require('stremio/common/CONSTANTS');
const routesRegexp = require('stremio/common/routesRegexp');
const useBinaryState = require('stremio/common/useBinaryState');
const useProfile = require('stremio/common/useProfile');
const { useDataEnrichmentPrefs } = require('stremio/common/dataEnrichmentPrefs');
const ActionButton = require('./ActionButton');
const MetaLinks = require('./MetaLinks');
const MetaPreviewPlaceholder = require('./MetaPreviewPlaceholder');
const { Cast } = require('./Cast');
const styles = require('./styles');
const { Ratings } = require('./Ratings');

const ALLOWED_LINK_REDIRECTS = [
    routesRegexp.search.regexp,
    routesRegexp.discover.regexp,
    routesRegexp.metadetails.regexp
];

const MetaPreview = React.forwardRef(({ className, compact, name, logo, background, runtime, releaseInfo, released, description, deepLinks, links, trailerStreams, inLibrary, toggleInLibrary, ratingInfo, tmdbCast }, ref) => {
    const { t } = useTranslation();
    const profile = useProfile();
    const [shareModalOpen, openShareModal, closeShareModal] = useBinaryState(false);
    const { showTmdbCast } = useDataEnrichmentPrefs();
    const linksGroups = React.useMemo(() => {
        return Array.isArray(links) ?
            links
                .filter((link) => link && typeof link.category === 'string' && typeof link.url === 'string')
                .reduce((linksGroups, { category, name, url }) => {
                    const { protocol, path, pathname, hostname } = UrlUtils.parse(url);
                    if (category === CONSTANTS.IMDB_LINK_CATEGORY) {
                        if (hostname === 'imdb.com' || hostname === 'www.imdb.com') {
                            linksGroups.set(category, {
                                label: name,
                                href: `https://www.stremio.com/warning#${encodeURIComponent(url)}`
                            });
                        }
                    } else if (category === CONSTANTS.SHARE_LINK_CATEGORY) {
                        linksGroups.set(category, {
                            label: name,
                            href: url
                        });
                    } else {
                        if (protocol === 'stremio:') {
                            if (pathname !== null && ALLOWED_LINK_REDIRECTS.some((regexp) => pathname.match(regexp))) {
                                if (!linksGroups.has(category)) {
                                    linksGroups.set(category, []);
                                }
                                linksGroups.get(category).push({
                                    label: name,
                                    href: `#${path}`
                                });
                            }
                        } else if (typeof hostname === 'string' && hostname.length > 0) {
                            if (!linksGroups.has(category)) {
                                linksGroups.set(category, []);
                            }
                            linksGroups.get(category).push({
                                label: name,
                                href: `https://www.stremio.com/warning#${encodeURIComponent(url)}`
                            });
                        }
                    }

                    return linksGroups;
                }, new Map())
            :
            new Map();
    }, [links]);
    
    // Extract director and cast from links
    const directorLinks = React.useMemo(() => {
        const directors = linksGroups.get('Director') || linksGroups.get('Directors') || [];
        return Array.isArray(directors) ? directors : [];
    }, [linksGroups]);
    
    const castLinks = React.useMemo(() => {
        const cast = linksGroups.get('Cast') || linksGroups.get('Actors') || linksGroups.get('Starring') || [];
        return Array.isArray(cast) ? cast : [];
    }, [linksGroups]);
    
    // Extract genres from releaseInfo or links (max 3, space-separated)
    const genres = React.useMemo(() => {
        let genreList = [];
        // Try to extract from releaseInfo (format: "2024 • Sci-Fi, Adventure" or just "Sci-Fi, Adventure")
        if (typeof releaseInfo === 'string') {
            const parts = releaseInfo.split('•');
            if (parts.length > 1) {
                const genrePart = parts.slice(1).join('•').trim();
                if (genrePart.length > 0) {
                    genreList = genrePart.split(',').map(g => g.trim()).filter(g => g.length > 0);
                }
            } else if (releaseInfo.includes(',')) {
                genreList = releaseInfo.split(',').map(g => g.trim()).filter(g => g.length > 0);
            }
        }
        // Try from links if not found in releaseInfo
        if (genreList.length === 0) {
            const genreLinks = linksGroups.get('Genre') || linksGroups.get('Genres') || [];
            if (Array.isArray(genreLinks) && genreLinks.length > 0) {
                genreList = genreLinks.map(link => link.label);
            }
        }
        // Limit to max 3 and join with space
        return genreList.length > 0 ? genreList.slice(0, 3).join(' ') : null;
    }, [releaseInfo, linksGroups]);
    
    // Extract year from releaseInfo or released date
    const year = React.useMemo(() => {
        if (typeof releaseInfo === 'string') {
            const parts = releaseInfo.split('•');
            if (parts.length > 0) {
                const yearMatch = parts[0].trim().match(/\d{4}/);
                if (yearMatch) {
                    return yearMatch[0];
                }
            }
            // If no bullet, try to find year anywhere in releaseInfo
            const yearMatch = releaseInfo.match(/\b(19|20)\d{2}\b/);
            if (yearMatch) {
                return yearMatch[0];
            }
        }
        if (released instanceof Date && !isNaN(released.getTime())) {
            return released.getFullYear().toString();
        }
        return null;
    }, [releaseInfo, released]);
    
    // Extract IMDb link info (rating and href)
    const imdbLink = React.useMemo(() => {
        if (linksGroups.has(CONSTANTS.IMDB_LINK_CATEGORY)) {
            const link = linksGroups.get(CONSTANTS.IMDB_LINK_CATEGORY);
            // Extract rating from label (e.g., "8.8" from "IMDb 8.8" or just "8.8")
            const ratingMatch = link.label.match(/(\d+\.?\d*)/);
            return {
                rating: ratingMatch ? ratingMatch[1] : null,
                href: link.href
            };
        }
        return null;
    }, [linksGroups]);
    
    const showHref = React.useMemo(() => {
        return deepLinks ?
            typeof deepLinks.player === 'string' ?
                deepLinks.player
                :
                typeof deepLinks.metaDetailsStreams === 'string' ?
                    deepLinks.metaDetailsStreams
                    :
                    typeof deepLinks.metaDetailsVideos === 'string' ?
                        deepLinks.metaDetailsVideos
                        :
                        null
            :
            null;
    }, [deepLinks]);
    
    const trailerHref = React.useMemo(() => {
        if (!Array.isArray(trailerStreams) || trailerStreams.length === 0) {
            return null;
        }

        return trailerStreams[0].deepLinks.player;
    }, [trailerStreams]);
    const renderLogoFallback = React.useCallback(() => (
        <div className={styles['logo-placeholder']}>{name}</div>
    ), [name]);
    
    return (
        <div className={classnames(className, styles['meta-preview-container'], { [styles['compact']]: compact })} ref={ref}>
            {
                typeof background === 'string' && background.length > 0 ?
                    <div className={styles['background-image-layer']}>
                        <Image className={styles['background-image']} src={background} alt={' '} />
                    </div>
                    :
                    null
            }
            <div className={styles['meta-info-container']}>
                {/* Logo */}
                {typeof logo === 'string' && logo.length > 0 ? (
                    <Image
                        className={styles['logo']}
                        src={logo}
                        alt={name || ''}
                        title={name}
                        renderFallback={renderLogoFallback}
                    />
                ) : (
                    <div className={styles['logo-placeholder']}>{name}</div>
                )}
                
                {/* Metadata Row */}
                <div className={styles['metadata-row']}>
                    {year && <div className={styles['metadata-item']}>{year}</div>}
                    {genres && (
                        <>
                            <div className={styles['metadata-separator']}>•</div>
                            <div className={styles['metadata-item']}>{genres}</div>
                        </>
                    )}
                    {runtime && (
                        <>
                            <div className={styles['metadata-separator']}>•</div>
                            <div className={styles['metadata-item']}>{runtime}</div>
                        </>
                    )}
                </div>
                
                {/* IMDb Rating on its own line */}
                {imdbLink?.rating && (
                    <div className={styles['imdb-rating-row']}>
                        <Button
                            className={styles['badge-imdb']}
                            href={imdbLink.href}
                            target="_blank"
                            title={t('IMDB')}
                        >
                            <span className={styles['imdb-label']}>{t('IMDB')}</span>
                            <span className={styles['imdb-rating']}>{imdbLink.rating}</span>
                        </Button>
                    </div>
                )}
                
                {/* Action Buttons */}
                <div className={styles['action-buttons-row']}>
                    {typeof trailerHref === 'string' && (
                        <Button
                            className={classnames(styles['action-button'], styles['primary-button'])}
                            href={trailerHref}
                            title={t('TRAILER')}
                        >
                            <Icon className={styles['button-icon']} name={'play'} />
                            <span className={styles['button-label']}>{t('TRAILER')}</span>
                        </Button>
                    )}
                    {typeof toggleInLibrary === 'function' && (
                        <Button
                            className={classnames(styles['action-button'], styles['secondary-button'])}
                            onClick={toggleInLibrary}
                            title={inLibrary ? t('REMOVE_FROM_LIB') : t('ADD_TO_LIB')}
                        >
                            <Icon className={styles['button-icon']} name={inLibrary ? 'remove-from-library' : 'add-to-library'} />
                            <span className={styles['button-label']}>{inLibrary ? t('REMOVE_FROM_LIB') : t('ADD_TO_LIB')}</span>
                        </Button>
                    )}
                    {!compact && ratingInfo !== null && (
                        <Ratings
                            ratingInfo={ratingInfo}
                            className={styles['ratings']}
                        />
                    )}
                    {linksGroups.has(CONSTANTS.SHARE_LINK_CATEGORY) && (
                        <React.Fragment>
                            <Button
                                className={classnames(styles['action-button'], styles['share-button'])}
                                onClick={openShareModal}
                                title={t('CTX_SHARE')}
                            >
                                <Icon className={styles['button-icon']} name={'share'} />
                            </Button>
                            {
                                shareModalOpen ?
                                    <ModalDialog title={t('CTX_SHARE')} onCloseRequest={closeShareModal}>
                                        <SharePrompt
                                            className={styles['share-prompt']}
                                            url={linksGroups.get(CONSTANTS.SHARE_LINK_CATEGORY).href}
                                        />
                                    </ModalDialog>
                                    :
                                    null
                            }
                        </React.Fragment>
                    )}
                </div>
                
                {/* Synopsis */}
                {typeof description === 'string' && description.length > 0 && (
                    <div className={styles['synopsis']}>
                        {description}
                    </div>
                )}
                
                {/* Director */}
                {directorLinks.length > 0 && (
                    <div className={styles['crew-section']}>
                        <div className={styles['crew-label']}>{t('DIRECTOR')}</div>
                        <div className={styles['crew-pills']}>
                            {directorLinks.map((link, index) => (
                                link.href ? (
                                    <Button
                                        key={index}
                                        className={styles['crew-pill']}
                                        href={link.href}
                                        title={link.label}
                                    >
                                        {link.label}
                                    </Button>
                                ) : (
                                    <span key={index} className={styles['crew-pill']}>
                                        {link.label}
                                    </span>
                                )
                            ))}
                        </div>
                    </div>
                )}
                
                {/* Cast */}
                {showTmdbCast && (
                    tmdbCast && tmdbCast.length > 0 ? (
                        <Cast cast={tmdbCast} />
                    ) : (
                        castLinks.length > 0 && (
                            <div className={styles['crew-section']}>
                                <div className={styles['crew-label']}>{t('CAST')}</div>
                                <div className={styles['crew-pills']}>
                                    {castLinks.slice(0, 10).map((link, index) => (
                                        link.href ? (
                                            <Button
                                                key={index}
                                                className={styles['crew-pill']}
                                                href={link.href}
                                                title={link.label}
                                            >
                                                {link.label}
                                            </Button>
                                        ) : (
                                            <span key={index} className={styles['crew-pill']}>
                                                {link.label}
                                            </span>
                                        )
                                    ))}
                                </div>
                            </div>
                        )
                    )
                )}
                
                {/* Other Links (excluding already displayed categories) */}
                {Array.from(linksGroups.keys())
                    .filter((category) => {
                        return category !== CONSTANTS.IMDB_LINK_CATEGORY &&
                            category !== CONSTANTS.SHARE_LINK_CATEGORY &&
                            category !== CONSTANTS.WRITERS_LINK_CATEGORY &&
                            category !== 'Director' &&
                            category !== 'Directors' &&
                            category !== 'Cast' &&
                            category !== 'Actors' &&
                            category !== 'Starring' &&
                            category !== 'Genre' &&
                            category !== 'Genres';
                    })
                    .map((category, index) => (
                        <MetaLinks
                            key={index}
                            className={styles['meta-links']}
                            label={category}
                            links={linksGroups.get(category)}
                        />
                    ))}
                
            </div>
        </div>
    );
});

MetaPreview.Placeholder = MetaPreviewPlaceholder;

MetaPreview.propTypes = {
    className: PropTypes.string,
    compact: PropTypes.bool,
    name: PropTypes.string,
    logo: PropTypes.string,
    background: PropTypes.string,
    runtime: PropTypes.string,
    releaseInfo: PropTypes.string,
    released: PropTypes.instanceOf(Date),
    description: PropTypes.string,
    deepLinks: PropTypes.shape({
        metaDetailsVideos: PropTypes.string,
        metaDetailsStreams: PropTypes.string,
        player: PropTypes.string
    }),
    links: PropTypes.arrayOf(PropTypes.shape({
        category: PropTypes.string,
        name: PropTypes.string,
        url: PropTypes.string
    })),
    trailerStreams: PropTypes.array,
    inLibrary: PropTypes.bool,
    toggleInLibrary: PropTypes.func,
    ratingInfo: PropTypes.object,
    tmdbCast: PropTypes.array,
};

module.exports = MetaPreview;

// Copyright (C) 2017-2025 Smart code 203358507

const React = require('react');
const PropTypes = require('prop-types');
const classnames = require('classnames');
const UrlUtils = require('url');
const { useTranslation } = require('react-i18next');
const { default: Icon } = require('@stremio/stremio-icons/react');
const { default: Button } = require('stremio/components/Button');
const { default: Image } = require('stremio/components/Image');
const routesRegexp = require('stremio/common/routesRegexp');
const styles = require('./styles');

const ALLOWED_LINK_REDIRECTS = [
    routesRegexp.search.regexp,
    routesRegexp.discover.regexp,
    routesRegexp.metadetails.regexp
];

const safeHref = (url) => {
    if (typeof url !== 'string' || url.length === 0) return null;
    const { protocol, path, pathname } = UrlUtils.parse(url);
    if (protocol === 'stremio:' && pathname !== null && ALLOWED_LINK_REDIRECTS.some((regexp) => pathname.match(regexp))) {
        return `#${path}`;
    }
    return url;
};

const getShowHref = (deepLinks) => {
    if (!deepLinks) return null;
    return typeof deepLinks.player === 'string' ? deepLinks.player
        : typeof deepLinks.metaDetailsStreams === 'string' ? deepLinks.metaDetailsStreams
        : typeof deepLinks.metaDetailsVideos === 'string' ? deepLinks.metaDetailsVideos
        : null;
};

const ExpandedMetaCard = React.forwardRef(({ className, item, open, rect, posterWidth, onClose, toggleInLibrary }, ref) => {
    const { t } = useTranslation();

    const showHref = React.useMemo(() => getShowHref(item?.deepLinks), [item?.deepLinks]);
    const trailerHref = React.useMemo(() => {
        const trailer = item?.trailerStreams?.[0]?.deepLinks?.player;
        return typeof trailer === 'string' ? trailer : null;
    }, [item?.trailerStreams]);

    const imdbRating = React.useMemo(() => {
        if (!Array.isArray(item?.links)) return null;
        const imdbLink = item.links.find((l) => l && l.category === 'imdb' && typeof l.name === 'string');
        if (!imdbLink) return null;
        const ratingMatch = imdbLink.name.match(/(\d+\.?\d*)/);
        return ratingMatch ? ratingMatch[1] : null;
    }, [item?.links]);

    const director = React.useMemo(() => {
        const links = Array.isArray(item?.links) ? item.links : [];
        const directorLinks = links.filter((l) => l && (l.category === 'Director' || l.category === 'Directors') && typeof l.name === 'string' && l.name.length > 0);
        if (directorLinks.length === 0) return null;
        const first = directorLinks[0];
        return {
            label: first.name,
            href: typeof first.url === 'string' ? safeHref(first.url) : null
        };
    }, [item?.links]);

    const year = React.useMemo(() => {
        const releaseInfo = item?.releaseInfo;
        if (typeof releaseInfo === 'string') {
            const parts = releaseInfo.split('•');
            if (parts.length > 0) {
                const yearMatch = parts[0].trim().match(/\d{4}/);
                if (yearMatch) return yearMatch[0];
            }
            const yearMatch = releaseInfo.match(/\b(19|20)\d{2}\b/);
            if (yearMatch) return yearMatch[0];
        }
        return null;
    }, [item?.releaseInfo]);

    const genres = React.useMemo(() => {
        const releaseInfo = item?.releaseInfo;
        if (typeof releaseInfo !== 'string') return null;
        const parts = releaseInfo.split('•');
        if (parts.length > 1) {
            const genrePart = parts.slice(1).join('•').trim();
            const genreList = genrePart.split(',').map((g) => g.trim()).filter((g) => g.length > 0);
            return genreList.length > 0 ? genreList.slice(0, 3).join(' ') : null;
        }
        return null;
    }, [item?.releaseInfo]);

    const style = React.useMemo(() => {
        if (!rect) return undefined;
        return {
            position: 'absolute',
            top: `${rect.top}px`,
            left: `${rect.left}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
            '--poster-width': posterWidth !== null && posterWidth !== undefined ? `${posterWidth}px` : undefined,
        };
    }, [rect, posterWidth]);

    if (!item || !rect) return null;

    return (
        <div
            ref={ref}
            data-expanded-meta-card="1"
            className={classnames(className, styles['expanded-meta-card'], { [styles['open']]: open })}
            style={style}
        >
            <div className={styles['poster-pane']}>
                <Image className={styles['poster']} src={item.poster} alt={' '} />
            </div>
            <div className={styles['info-pane']}>
                <div className={styles['top-row']}>
                    <div className={styles['title-block']}>
                        <div className={styles['title']} title={item.name}>{item.name}</div>
                        <div className={styles['subtitle']}>
                            {year ? <span className={styles['meta']}>{year}</span> : null}
                            {genres ? <span className={styles['meta']}>{genres}</span> : null}
                            {item.runtime ? <span className={styles['meta']}>{item.runtime}</span> : null}
                        {imdbRating ? (
                            <span className={styles['rating']} title={imdbRating}>
                                <Icon className={styles['rating-icon']} name={'star'} />
                                <span className={styles['rating-value']}>{imdbRating}</span>
                            </span>
                        ) : null}
                        </div>
                        {director ? (
                            <div className={styles['director']}>
                            <span className={styles['director-label']}>{t('DIRECTOR')}:</span>
                                {director.href ? (
                                    <Button className={styles['director-link']} href={director.href} title={director.label}>
                                        {director.label}
                                    </Button>
                                ) : (
                                    <span className={styles['director-text']}>{director.label}</span>
                                )}
                            </div>
                        ) : null}
                    </div>
                    <Button className={styles['close']} title={t('BUTTON_CLOSE')} onClick={onClose}>
                        <Icon className={styles['close-icon']} name={'close'} />
                    </Button>
                </div>

                {typeof item.description === 'string' && item.description.length > 0 ? (
                    <div className={styles['synopsis']}>{item.description}</div>
                ) : null}

                <div className={styles['actions-row']}>
                    {typeof showHref === 'string' ? (
                        <Button className={classnames(styles['action-button'], styles['primary-button'], styles['play-button'])} href={showHref} title={t('CTX_PLAY')}>
                            <Icon className={styles['button-icon']} name={'play'} />
                            <span className={styles['button-label']}>{t('CTX_PLAY')}</span>
                        </Button>
                    ) : null}
                    {typeof trailerHref === 'string' ? (
                        <Button className={classnames(styles['action-button'], styles['secondary-button'], styles['trailer-button'])} href={trailerHref} title={t('TRAILER')}>
                            <Icon className={styles['button-icon']} name={'play'} />
                            <span className={styles['button-label']}>{t('TRAILER')}</span>
                        </Button>
                    ) : null}
                    {typeof toggleInLibrary === 'function' ? (
                        <Button
                            className={classnames(styles['action-button'], styles['secondary-button'])}
                            onClick={toggleInLibrary}
                            title={item.inLibrary ? t('REMOVE_FROM_LIB') : t('ADD_TO_LIB')}
                        >
                            <Icon className={styles['button-icon']} name={item.inLibrary ? 'remove-from-library' : 'add-to-library'} />
                            <span className={styles['button-label']}>{item.inLibrary ? t('REMOVE_FROM_LIB') : t('ADD_TO_LIB')}</span>
                        </Button>
                    ) : null}
                </div>
            </div>
        </div>
    );
});

ExpandedMetaCard.propTypes = {
    className: PropTypes.string,
    item: PropTypes.object,
    open: PropTypes.bool,
    rect: PropTypes.shape({
        top: PropTypes.number,
        left: PropTypes.number,
        width: PropTypes.number,
        height: PropTypes.number,
    }),
    posterWidth: PropTypes.number,
    onClose: PropTypes.func,
    toggleInLibrary: PropTypes.func,
};

module.exports = ExpandedMetaCard;



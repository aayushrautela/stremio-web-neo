// Copyright (C) 2017-2023 Smart code 203358507

const React = require('react');
const PropTypes = require('prop-types');
const classnames = require('classnames');
const { useTranslation } = require('react-i18next');
const filterInvalidDOMProps = require('filter-invalid-dom-props').default;
const { default: Icon } = require('@stremio/stremio-icons/react');
const { default: Button } = require('stremio/components/Button');
const { default: Image } = require('stremio/components/Image');
const Multiselect = require('stremio/components/Multiselect');
const useBinaryState = require('stremio/common/useBinaryState');
const useProfile = require('stremio/common/useProfile');
const { useDataEnrichmentPrefs } = require('stremio/common/dataEnrichmentPrefs');
const { ICON_FOR_TYPE } = require('stremio/common/CONSTANTS');
const styles = require('./styles');

const MetaItem = React.memo(({ className, type, name, poster, posterShape, posterChangeCursor, progress, newVideos, options, deepLinks, dataset, optionOnSelect, onDismissClick, onPlayClick, watched, background, logo, links, menuDirection, ...props }) => {
    const { t } = useTranslation();
    const profile = useProfile();
    const [menuOpen, onMenuOpen, onMenuClose] = useBinaryState(false);
    const { showPosterRatings } = useDataEnrichmentPrefs();
    const imdbRating = React.useMemo(() => {
        if (!Array.isArray(links)) return null;
        const imdbLink = links.find(l => l.category === 'imdb');
        if (!imdbLink || !imdbLink.name) return null;
        const ratingMatch = imdbLink.name.match(/(\d+\.?\d*)/);
        return ratingMatch ? ratingMatch[1] : null;
    }, [links]);
    const href = React.useMemo(() => {
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
    const metaItemOnClick = React.useCallback((event) => {
        if (event.nativeEvent.selectPrevented) {
            event.preventDefault();
        } else if (typeof props.onClick === 'function') {
            props.onClick(event);
        }
    }, [props.onClick]);
    const menuOnClick = React.useCallback((event) => {
        event.nativeEvent.selectPrevented = true;
    }, []);
    const menuOnSelect = React.useCallback((event) => {
        if (typeof optionOnSelect === 'function') {
            optionOnSelect({
                type: 'select-option',
                value: event.value,
                dataset: dataset,
                reactEvent: event.reactEvent,
                nativeEvent: event.nativeEvent
            });
        }
    }, [dataset, optionOnSelect]);
    const renderPosterFallback = React.useCallback(() => (
        <Icon
            className={styles['placeholder-icon']}
            name={ICON_FOR_TYPE.has(type) ? ICON_FOR_TYPE.get(type) : ICON_FOR_TYPE.get('other')}
        />
    ), [type]);
    const renderLogoFallback = React.useCallback(() => (
        <div className={styles['logo-placeholder']}>{name || ''}</div>
    ), [name]);
    const useBackdropLogo = React.useMemo(() => {
        return posterShape === 'landscape' && 
               typeof background === 'string' && 
               background.length > 0;
    }, [posterShape, background]);
    
    const usePosterWithTitle = React.useMemo(() => {
        return posterShape === 'landscape' && 
               (!background || background.length === 0) &&
               typeof poster === 'string' && 
               poster.length > 0 &&
               typeof name === 'string' && 
               name.length > 0;
    }, [posterShape, background, poster, name]);
    const renderMenuLabelContent = React.useCallback(() => (
        <Icon className={styles['icon']} name={'more-vertical'} />
    ), []);
    return (
        <Button title={name} href={href} {...filterInvalidDOMProps(props)} className={classnames(className, styles['meta-item-container'], styles[`poster-shape-${posterShape || 'poster'}`], { 'active': menuOpen })} onClick={metaItemOnClick}>
            <div className={classnames(styles['poster-container'], { 'poster-change-cursor': posterChangeCursor })}>
                {
                    onDismissClick ?
                        <div title={t('LIBRARY_RESUME_DISMISS')} className={styles['dismiss-icon-layer']} onClick={onDismissClick}>
                            <Icon className={styles['dismiss-icon']} name={'close'} />
                            <div className={styles['dismiss-icon-backdrop']} />
                        </div>
                        :
                        null
                }
                {
                    watched ?
                        <div className={styles['watched-icon-layer']}>
                            <Icon className={styles['watched-icon']} name={'checkmark'} />
                        </div>
                        :
                        null
                }
                {useBackdropLogo ? (
                    <>
                        <div className={styles['background-image-layer']}>
                            <Image
                                className={styles['background-image']}
                                src={background}
                                alt={' '}
                                renderFallback={renderPosterFallback}
                            />
                            <div className={styles['background-overlay']} />
                        </div>
                        {(typeof logo === 'string' && logo.length > 0) ? (
                        <div className={styles['logo-image-layer']}>
                            <Image
                                className={styles['logo-image']}
                                src={logo}
                                alt={name || ''}
                                renderFallback={renderLogoFallback}
                            />
                            </div>
                        ) : null}
                    </>
                ) : usePosterWithTitle ? (
                    <>
                        <div className={styles['poster-image-layer']}>
                            <Image
                                className={styles['poster-image']}
                                src={poster}
                                alt={' '}
                                renderFallback={renderPosterFallback}
                            />
                        </div>
                        <div className={styles['title-overlay-layer']}>
                            <div className={styles['title-overlay']}>
                                {name}
                            </div>
                        </div>
                    </>
                ) : (
                <div className={styles['poster-image-layer']}>
                    <Image
                        className={styles['poster-image']}
                        src={poster}
                        alt={' '}
                        renderFallback={renderPosterFallback}
                    />
                </div>
                )}
                {
                    onPlayClick ?
                        <div title={t('CONTINUE_WATCHING')} className={styles['play-icon-layer']} onClick={onPlayClick}>
                            <Icon className={styles['play-icon']} name={'play'} />
                            <div className={styles['play-icon-outer']} />
                            <div className={styles['play-icon-background']} />
                        </div>
                        :
                        null
                }
                {
                    progress > 0 ?
                        <div className={styles['progress-bar-layer']}>
                            <div className={styles['progress-bar']} style={{ width: `${progress}%` }} />
                            <div className={styles['progress-bar-background']} />
                        </div>
                        :
                        null
                }
                {
                    newVideos > 0 ?
                        <div className={styles['new-videos']}>
                            <div className={styles['layer']} />
                            <div className={styles['layer']} />
                            <div className={styles['layer']}>
                                <Icon className={styles['icon']} name={'add'} />
                                <div className={styles['label']}>
                                    {newVideos}
                                </div>
                            </div>
                        </div>
                        :
                        null
                }
                {
                    showPosterRatings && imdbRating ?
                        <div className={styles['rating-badge']}>
                            <Icon className={styles['rating-icon']} name={'star'} />
                            <div className={styles['rating-value']}>{imdbRating}</div>
                        </div>
                        :
                        null
                }
            </div>
            {
                (typeof name === 'string' && name.length > 0) || (Array.isArray(options) && options.length > 0) ?
                    <div className={styles['title-bar-container']}>
                        <div className={styles['title-label']}>
                            {typeof name === 'string' && name.length > 0 ? name : ''}
                        </div>
                        {
                            Array.isArray(options) && options.length > 0 ?
                                <Multiselect
                                    className={styles['menu-label-container']}
                                    renderLabelContent={renderMenuLabelContent}
                                    options={options}
                                    direction={menuDirection}
                                    onOpen={onMenuOpen}
                                    onClose={onMenuClose}
                                    onSelect={menuOnSelect}
                                    tabIndex={-1}
                                    onClick={menuOnClick}
                                />
                                :
                                null
                        }
                    </div>
                    :
                    null
            }
        </Button>
    );
});

MetaItem.displayName = 'MetaItem';

MetaItem.propTypes = {
    className: PropTypes.string,
    type: PropTypes.string,
    name: PropTypes.string,
    poster: PropTypes.string,
    posterShape: PropTypes.oneOf(['poster', 'landscape', 'square']),
    posterChangeCursor: PropTypes.bool,
    progress: PropTypes.number,
    newVideos: PropTypes.number,
    options: PropTypes.array,
    deepLinks: PropTypes.shape({
        metaDetailsVideos: PropTypes.string,
        metaDetailsStreams: PropTypes.string,
        player: PropTypes.string
    }),
    dataset: PropTypes.object,
    optionOnSelect: PropTypes.func,
    onDismissClick: PropTypes.func,
    onPlayClick: PropTypes.func,
    onClick: PropTypes.func,
    watched: PropTypes.bool,
    background: PropTypes.string,
    logo: PropTypes.string,
    links: PropTypes.array,
    menuDirection: PropTypes.oneOf(['top-left', 'bottom-left', 'top-right', 'bottom-right'])
};

module.exports = MetaItem;

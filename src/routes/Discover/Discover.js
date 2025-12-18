// Copyright (C) 2017-2023 Smart code 203358507

const React = require('react');
const { useTranslation } = require('react-i18next');
const PropTypes = require('prop-types');
const classnames = require('classnames');
const { default: Icon } = require('@stremio/stremio-icons/react');
const { useServices } = require('stremio/services');
const { CONSTANTS, useBinaryState, useOnScrollToBottom, withCoreSuspender } = require('stremio/common');
const { AddonDetailsModal, Button, DelayedRenderer, Image, MainNavBars, MetaItem, ModalDialog, MultiselectMenu } = require('stremio/components');
const useDiscover = require('./useDiscover');
const useSelectableInputs = require('./useSelectableInputs');
const ExpandedMetaCard = require('./ExpandedMetaCard/ExpandedMetaCard');
const styles = require('./styles');

const SCROLL_TO_BOTTOM_THRESHOLD = 400;

const Discover = ({ urlParams, queryParams }) => {
    const { t } = useTranslation();
    const { core } = useServices();
    const [discover, loadNextPage] = useDiscover(urlParams, queryParams);
    const [selectInputs, hasNextPage] = useSelectableInputs(discover);
    const [inputsModalOpen, openInputsModal, closeInputsModal] = useBinaryState(false);
    const [addonModalOpen, openAddonModal, closeAddonModal] = useBinaryState(false);
    const [selectedMetaItemIndex, setSelectedMetaItemIndex] = React.useState(0);
    const [expandedIndex, setExpandedIndex] = React.useState(null);
    const [expandedLayout, setExpandedLayout] = React.useState(null);
    const [overlayFromRect, setOverlayFromRect] = React.useState(null);
    const [overlayRect, setOverlayRect] = React.useState(null);
    const [overlayOpen, setOverlayOpen] = React.useState(false);
    const [overlayPosterWidth, setOverlayPosterWidth] = React.useState(null);

    const metasContainerRef = React.useRef();
    const expandedCardRef = React.useRef(null);

    React.useEffect(() => {
        if (discover.catalog?.content.type === 'Loading') {
            metasContainerRef.current.scrollTop = 0;
        }
    }, [discover.catalog]);
    React.useEffect(() => {
        if (hasNextPage && metasContainerRef.current) {
            const containerHeight = metasContainerRef.current.scrollHeight;
            const viewportHeight = metasContainerRef.current.clientHeight;
            if (containerHeight <= viewportHeight + SCROLL_TO_BOTTOM_THRESHOLD) {
                loadNextPage();
            }
        }
    }, [hasNextPage, loadNextPage]);
    const selectedMetaItem = React.useMemo(() => {
        return discover.catalog !== null &&
            discover.catalog.content.type === 'Ready' &&
            discover.catalog.content.content[selectedMetaItemIndex] ?
            discover.catalog.content.content[selectedMetaItemIndex]
            :
            null;
    }, [discover.catalog, selectedMetaItemIndex]);
    const addToLibrary = React.useCallback(() => {
        if (selectedMetaItem === null) {
            return;
        }

        core.transport.dispatch({
            action: 'Ctx',
            args: {
                action: 'AddToLibrary',
                args: selectedMetaItem
            }
        });
    }, [selectedMetaItem]);
    const removeFromLibrary = React.useCallback(() => {
        if (selectedMetaItem === null) {
            return;
        }

        core.transport.dispatch({
            action: 'Ctx',
            args: {
                action: 'RemoveFromLibrary',
                args: selectedMetaItem.id
            }
        });
    }, [selectedMetaItem]);
    const metaItemsOnFocusCapture = React.useCallback((event) => {
        if (event.target.dataset.index !== null && !isNaN(event.target.dataset.index)) {
            setSelectedMetaItemIndex(parseInt(event.target.dataset.index, 10));
        }
    }, []);

    const computeOverlayForIndex = React.useCallback((index) => {
        const container = metasContainerRef.current;
        if (!container) return null;
        const el = container.querySelector(`[data-index="${index}"]`);
        if (!el) return null;
        const posterEl = el.querySelector('[class*="poster-container"]');
        if (!posterEl) return null;

        const rowTop = el.offsetTop;
        const getEl = (i) => container.querySelector(`[data-index="${i}"]`);

        let rowStart = index;
        while (rowStart > 0) {
            const prev = getEl(rowStart - 1);
            if (!prev || prev.offsetTop !== rowTop) break;
            rowStart -= 1;
        }

        let rowEnd = index;
        while (true) {
            const next = getEl(rowEnd + 1);
            if (!next || next.offsetTop !== rowTop) break;
            rowEnd += 1;
        }

        const rowLen = rowEnd - rowStart + 1;
        const span = Math.min(3, rowLen);
        const rightAvailable = rowEnd - index;
        const shiftLeft = Math.max(0, (span - 1) - rightAvailable);
        const maxStart = rowEnd - (span - 1);
        const startIndex = Math.min(Math.max(index - shiftLeft, rowStart), maxStart);

        const startEl = getEl(startIndex);
        const endEl = getEl(startIndex + (span - 1));
        if (!startEl || !endEl) return null;
        const startPosterEl = startEl.querySelector('[class*="poster-container"]');
        const endPosterEl = endEl.querySelector('[class*="poster-container"]');
        if (!startPosterEl || !endPosterEl) return null;

        const containerRect = container.getBoundingClientRect();
        const scrollTop = container.scrollTop;
        const scrollLeft = container.scrollLeft;

        const posterRect = posterEl.getBoundingClientRect();
        const startPosterRect = startPosterEl.getBoundingClientRect();
        const endPosterRect = endPosterEl.getBoundingClientRect();

        const from = {
            top: (posterRect.top - containerRect.top) + scrollTop,
            left: (posterRect.left - containerRect.left) + scrollLeft,
            width: posterRect.width,
            height: posterRect.height,
        };

        const to = {
            top: (startPosterRect.top - containerRect.top) + scrollTop,
            left: (startPosterRect.left - containerRect.left) + scrollLeft,
            width: (endPosterRect.right - startPosterRect.left),
            height: startPosterRect.height,
        };

        return { from, to, startIndex, span };
    }, []);

    const openExpanded = React.useCallback((index) => {
        setSelectedMetaItemIndex(index);
        setExpandedIndex(index);
        const layout = computeOverlayForIndex(index);
        if (!layout) {
            setOverlayRect(null);
            setOverlayFromRect(null);
            setExpandedLayout(null);
            setOverlayOpen(false);
            return;
        }
        setExpandedLayout({ startIndex: layout.startIndex, span: layout.span });
        setOverlayFromRect(layout.from);
        setOverlayRect(layout.from);
        setOverlayPosterWidth(layout.from.width);
        setOverlayOpen(false);
        requestAnimationFrame(() => {
            const nextLayout = computeOverlayForIndex(index);
            if (!nextLayout) return;
            setExpandedLayout({ startIndex: nextLayout.startIndex, span: nextLayout.span });
            setOverlayFromRect(nextLayout.from);
            setOverlayRect(nextLayout.to);
            setOverlayPosterWidth(nextLayout.from.width);
            setOverlayOpen(true);
        });
    }, [computeOverlayForIndex]);

    const closeExpanded = React.useCallback(() => {
        if (overlayFromRect !== null) {
            setOverlayRect(overlayFromRect);
        }
        setOverlayOpen(false);
        setTimeout(() => {
            setExpandedIndex(null);
            setOverlayRect(null);
            setOverlayFromRect(null);
            setExpandedLayout(null);
            setOverlayPosterWidth(null);
        }, 240);
    }, [overlayFromRect]);

    const metaItemOnClick = React.useCallback((event) => {
        event.preventDefault();
        event.nativeEvent.selectPrevented = true;
        const target = event.currentTarget;
        const idx = parseInt(event.currentTarget.dataset.index, 10);
        if (!isNaN(idx)) {
            openExpanded(idx);
        }
        if (target && typeof target.blur === 'function') {
            target.blur();
        }
    }, [openExpanded]);
    const onScrollToBottom = React.useCallback(() => {
        if (hasNextPage) {
            loadNextPage();
        }
    }, [hasNextPage, loadNextPage]);
    const onScroll = useOnScrollToBottom(onScrollToBottom, SCROLL_TO_BOTTOM_THRESHOLD);
    React.useEffect(() => {
        closeInputsModal();
        closeAddonModal();
        setSelectedMetaItemIndex(0);
        closeExpanded();
    }, [discover.selected]);

    React.useEffect(() => {
        if (expandedIndex === null) return;
        const onPointerDown = (event) => {
            if (expandedCardRef.current && expandedCardRef.current.contains(event.target)) {
                return;
            }
            const target = event.target;
            const metaEl = target && typeof target.closest === 'function' ? target.closest('[data-index]') : null;
            if (metaEl && metasContainerRef.current && metasContainerRef.current.contains(metaEl)) {
                const idx = parseInt(metaEl.dataset.index, 10);
                if (!isNaN(idx)) {
                    openExpanded(idx);
                }
                return;
            }
            closeExpanded();
        };
        document.addEventListener('pointerdown', onPointerDown, true);
        return () => document.removeEventListener('pointerdown', onPointerDown, true);
    }, [expandedIndex, closeExpanded, openExpanded]);

    React.useEffect(() => {
        if (expandedIndex === null) return;
        const onResize = () => {
            const layout = computeOverlayForIndex(expandedIndex);
            if (layout) {
                setOverlayRect(layout.to);
                setExpandedLayout({ startIndex: layout.startIndex, span: layout.span });
                setOverlayPosterWidth(layout.from.width);
            }
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [expandedIndex, computeOverlayForIndex]);
    return (
        <MainNavBars className={styles['discover-container']} route={'discover'}>
            <div className={styles['discover-content']}>
                <div className={styles['catalog-container']}>
                    <div className={styles['selectable-inputs-container']}>
                        {selectInputs.map(({ title, options, value, onSelect }, index) => (
                            <MultiselectMenu
                                key={index}
                                className={styles['select-input']}
                                title={title}
                                options={options}
                                value={value}
                                onSelect={onSelect}
                            />
                        ))}
                        <div className={styles['filter-container']}>
                            <Button className={styles['filter-button']} title={t('ALL_FILTERS')} onClick={openInputsModal}>
                                <Icon className={styles['filter-icon']} name={'filters'} />
                            </Button>
                        </div>
                    </div>
                    {
                        discover.catalog !== null && !discover.catalog.installed ?
                            <div className={styles['missing-addon-warning-container']}>
                                <div className={styles['warning-label']}>{t('ERR_ADDON_NOT_INSTALLED')}</div>
                                <Button className={styles['install-button']} title={t('INSTALL_ADDON')} onClick={openAddonModal}>
                                    <div className={styles['label']}>{t('ADDON_INSTALL')}</div>
                                </Button>
                            </div>
                            :
                            null
                    }
                    {
                        discover.catalog === null ?
                            <DelayedRenderer delay={500}>
                                <div className={styles['message-container']}>
                                    <Image className={styles['image']} src={require('/images/empty.png')} alt={' '} />
                                    <div className={styles['message-label']}>{t('NO_CATALOG_SELECTED')}</div>
                                </div>
                            </DelayedRenderer>
                            :
                            discover.catalog.content.type === 'Err' ?
                                <div className={styles['message-container']}>
                                    <Image className={styles['image']} src={require('/images/empty.png')} alt={' '} />
                                    <div className={styles['message-label']}>{discover.catalog.content.content}</div>
                                </div>
                                :
                                discover.catalog.content.type === 'Loading' ?
                                    <div ref={metasContainerRef} className={classnames(styles['meta-items-container'], 'animation-fade-in')}>
                                        {Array(CONSTANTS.CATALOG_PAGE_SIZE).fill(null).map((_, index) => (
                                            <div key={index} className={styles['meta-item-placeholder']}>
                                                <div className={styles['poster-container']} />
                                                <div className={styles['title-bar-container']}>
                                                    <div className={styles['title-label']} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    :
                                    <div ref={metasContainerRef} className={classnames(styles['meta-items-container'], { [styles['has-expanded']]: expandedIndex !== null }, 'animation-fade-in')} onScroll={onScroll} onFocusCapture={metaItemsOnFocusCapture}>
                                        {
                                            expandedIndex !== null && selectedMetaItem !== null && overlayRect !== null ?
                                                <ExpandedMetaCard
                                                    ref={expandedCardRef}
                                                    item={selectedMetaItem}
                                                    rect={overlayRect}
                                                    open={overlayOpen}
                                                    posterWidth={overlayPosterWidth}
                                                    onClose={closeExpanded}
                                                    toggleInLibrary={selectedMetaItem.inLibrary ? removeFromLibrary : addToLibrary}
                                                />
                                                :
                                                null
                                        }
                                        {discover.catalog.content.content.map((metaItem, index) => (
                                            <MetaItem
                                                key={index}
                                                className={classnames(
                                                    { 'selected': selectedMetaItemIndex === index },
                                                    expandedIndex !== null && expandedLayout !== null ? (
                                                        index >= expandedLayout.startIndex && index < expandedLayout.startIndex + expandedLayout.span ?
                                                            (overlayOpen ? styles['covered'] : null)
                                                            :
                                                            styles['dimmed']
                                                    ) : null
                                                )}
                                                type={metaItem.type}
                                                name={metaItem.name}
                                                poster={metaItem.poster}
                                                posterShape={metaItem.posterShape}
                                                playname={selectedMetaItemIndex === index}
                                                deepLinks={metaItem.deepLinks}
                                                watched={metaItem.watched}
                                                links={metaItem.links}
                                                data-index={index}
                                                onClick={metaItemOnClick}
                                            />
                                        ))}
                                    </div>
                    }
                </div>
            </div>
            {
                inputsModalOpen ?
                    <ModalDialog title={t('CATALOG_FILTERS')} className={styles['selectable-inputs-modal']} onCloseRequest={closeInputsModal}>
                        {selectInputs.map(({ title, options, value, onSelect }, index) => (
                            <MultiselectMenu
                                key={index}
                                className={styles['select-input']}
                                title={title}
                                options={options}
                                value={value}
                                onSelect={onSelect}
                            />
                        ))}
                    </ModalDialog>
                    :
                    null
            }
            {
                addonModalOpen && discover.selected !== null ?
                    <AddonDetailsModal transportUrl={discover.selected.request.base} onCloseRequest={closeAddonModal} />
                    :
                    null
            }
        </MainNavBars>
    );
};

Discover.propTypes = {
    urlParams: PropTypes.shape({
        transportUrl: PropTypes.string,
        type: PropTypes.string,
        catalogId: PropTypes.string
    }),
    queryParams: PropTypes.instanceOf(URLSearchParams)
};

const DiscoverFallback = () => (
    <MainNavBars className={styles['discover-container']} route={'discover'} />
);

module.exports = withCoreSuspender(Discover, DiscoverFallback);

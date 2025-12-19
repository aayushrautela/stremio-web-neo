// Copyright (C) 2017-2025 Smart code 203358507

const React = require('react');
const PropTypes = require('prop-types');
const { useTranslation } = require('react-i18next');
const { default: Button } = require('stremio/components/Button');
const { default: Icon } = require('@stremio/stremio-icons/react');
const { ModalDialog, MultiselectMenu } = require('stremio/components');
const Multiselect = require('stremio/components/Multiselect');
const styles = require('./styles.less');

// Year options from 1970 to current year
const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = [
    { value: null, label: 'Any' },
    ...Array.from({ length: currentYear - 1969 }, (_, i) => ({
        value: String(currentYear - i),
        label: String(currentYear - i),
    })),
];

// Rating options
const RATING_OPTIONS = [
    { value: null, label: 'Any' },
    { value: '9', label: '9+' },
    { value: '8', label: '8+' },
    { value: '7', label: '7+' },
    { value: '6', label: '6+' },
    { value: '5', label: '5+' },
];

// Runtime options (in minutes)
const RUNTIME_OPTIONS = [
    { value: null, label: 'Any' },
    { value: '60', label: '< 1h' },
    { value: '90', label: '< 1.5h' },
    { value: '120', label: '< 2h' },
    { value: '180', label: '< 3h' },
];

const FiltersModal = ({ selectInputs, filters, setFilters, onClose }) => {
    const { t } = useTranslation();

    // Pending state for catalog filters (URLs)
    const [pendingSelections, setPendingSelections] = React.useState(() => {
        return selectInputs.map(input => input.value);
    });

    // Pending state for advanced filters
    const [pendingFilters, setPendingFilters] = React.useState(filters);

    // Reset pending state when modal opens
    React.useEffect(() => {
        setPendingSelections(selectInputs.map(input => input.value));
        setPendingFilters(filters);
    }, []);

    const updatePendingSelection = React.useCallback((index, value) => {
        setPendingSelections(prev => {
            const next = [...prev];
            next[index] = value;
            return next;
        });
    }, []);

    const updatePendingFilter = React.useCallback((key, value) => {
        setPendingFilters(prev => ({
            ...prev,
            [key]: value,
        }));
    }, []);

    const clearPendingFilters = React.useCallback(() => {
        setPendingFilters({
            yearFrom: null,
            yearTo: null,
            ratingMin: null,
            runtimeMax: null,
        });
    }, []);

    const hasPendingActiveFilters = React.useMemo(() => {
        return pendingFilters.yearFrom !== null ||
            pendingFilters.yearTo !== null ||
            pendingFilters.ratingMin !== null ||
            pendingFilters.runtimeMax !== null;
    }, [pendingFilters]);

    const handleApply = React.useCallback(() => {
        // Apply advanced filters
        setFilters(pendingFilters);

        // Find if any catalog selection changed and navigate
        for (let i = 0; i < selectInputs.length; i++) {
            if (pendingSelections[i] !== selectInputs[i].value) {
                // Parse the JSON value to extract the href for navigation
                try {
                    const parsed = JSON.parse(pendingSelections[i]);
                    if (parsed && parsed.href) {
                        window.location = parsed.href;
                        return;
                    }
                } catch (e) {
                    // If not JSON, use the value directly (for type/catalog selects)
                    window.location = pendingSelections[i];
                    return;
                }
            }
        }

        // If no catalog changes, just close
        onClose();
    }, [pendingFilters, pendingSelections, selectInputs, setFilters, onClose]);

    const handleClose = React.useCallback(() => {
        onClose();
    }, [onClose]);

    return (
        <ModalDialog title={t('CATALOG_FILTERS')} className={styles['filters-modal']} onCloseRequest={handleClose}>
            <div className={styles['filters-content']}>
                {/* Catalog filters */}
                {selectInputs.map(({ title, options }, index) => {
                    // Compute title based on pending selection
                    const pendingValue = pendingSelections[index];
                    const selectedOption = options.find(opt => opt.value === pendingValue);
                    const displayTitle = selectedOption?.label || (typeof title === 'function' ? title() : title);

                    return (
                        <MultiselectMenu
                            key={index}
                            className={styles['select-input']}
                            title={displayTitle}
                            options={options}
                            value={pendingValue}
                            onSelect={(value) => updatePendingSelection(index, value)}
                        />
                    );
                })}

                {/* Advanced filters section */}
                <div className={styles['advanced-filters']}>
                    <div className={styles['filters-header']}>
                        <span className={styles['section-title']}>Advanced Filters</span>
                        {hasPendingActiveFilters && (
                            <Button
                                className={styles['clear-button']}
                                title={'Clear all filters'}
                                onClick={clearPendingFilters}
                            >
                                <Icon className={styles['clear-icon']} name={'close'} />
                                <span>Clear</span>
                            </Button>
                        )}
                    </div>

                    <div className={styles['filters-grid']}>
                        <Multiselect
                            className={styles['modal-multiselect']}
                            title="Year From"
                            options={pendingFilters.yearTo !== null
                                ? YEAR_OPTIONS.filter(opt => opt.value === null || Number(opt.value) <= pendingFilters.yearTo)
                                : YEAR_OPTIONS}
                            selected={pendingFilters.yearFrom !== null ? [String(pendingFilters.yearFrom)] : []}
                            onSelect={(e) => updatePendingFilter('yearFrom', e.value === '' || e.value === null ? null : Number(e.value))}
                        />
                        <Multiselect
                            className={styles['modal-multiselect']}
                            title="Year To"
                            options={pendingFilters.yearFrom !== null
                                ? YEAR_OPTIONS.filter(opt => opt.value === null || Number(opt.value) >= pendingFilters.yearFrom)
                                : YEAR_OPTIONS}
                            selected={pendingFilters.yearTo !== null ? [String(pendingFilters.yearTo)] : []}
                            onSelect={(e) => updatePendingFilter('yearTo', e.value === '' || e.value === null ? null : Number(e.value))}
                        />
                        <Multiselect
                            className={styles['modal-multiselect']}
                            title="Min Rating"
                            options={RATING_OPTIONS}
                            selected={pendingFilters.ratingMin !== null ? [String(pendingFilters.ratingMin)] : []}
                            onSelect={(e) => updatePendingFilter('ratingMin', e.value === '' || e.value === null ? null : Number(e.value))}
                        />
                        <Multiselect
                            className={styles['modal-multiselect']}
                            title="Max Runtime"
                            options={RUNTIME_OPTIONS}
                            selected={pendingFilters.runtimeMax !== null ? [String(pendingFilters.runtimeMax)] : []}
                            onSelect={(e) => updatePendingFilter('runtimeMax', e.value === '' || e.value === null ? null : Number(e.value))}
                        />
                    </div>
                </div>

                {/* Action buttons */}
                <div className={styles['modal-actions']}>
                    <Button
                        className={styles['cancel-button']}
                        title={'Cancel'}
                        onClick={handleClose}
                    >
                        <span>Cancel</span>
                    </Button>
                    <Button
                        className={styles['apply-button']}
                        title={'Apply filters'}
                        onClick={handleApply}
                    >
                        <span>Apply</span>
                    </Button>
                </div>
            </div>
        </ModalDialog>
    );
};

FiltersModal.propTypes = {
    selectInputs: PropTypes.arrayOf(PropTypes.shape({
        title: PropTypes.oneOfType([PropTypes.string, PropTypes.func]).isRequired,
        options: PropTypes.array.isRequired,
        value: PropTypes.any,
        onSelect: PropTypes.func.isRequired,
    })).isRequired,
    filters: PropTypes.shape({
        yearFrom: PropTypes.number,
        yearTo: PropTypes.number,
        ratingMin: PropTypes.number,
        runtimeMax: PropTypes.number,
    }).isRequired,
    setFilters: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
};

module.exports = FiltersModal;

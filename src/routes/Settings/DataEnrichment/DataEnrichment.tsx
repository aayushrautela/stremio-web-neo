import React, { forwardRef } from 'react';
import { Toggle } from 'stremio/components';
import { Section, Category, Option } from '../components';
import useDataEnrichmentOptions from './useDataEnrichmentOptions';
import APIKeyManager from './APIKeyManager';

type Props = {
    profile: Profile,
};

const DataEnrichment = forwardRef<HTMLDivElement, Props>(({ profile }: Props, ref) => {
    const {
        showTmdbCastToggle,
        showPosterRatingsToggle,
        showTmdbDescriptionToggle,
        showMaturityRatingToggle,
        showSimilarTitlesToggle,
        refreshApiKey,
    } = useDataEnrichmentOptions({ profile });

    return (
        <Section ref={ref} label={'SETTINGS_NAV_DATA_ENRICHMENT'}>
            <Category icon={'image'} label={'SETTINGS_SECTION_TMDB'}>
                <APIKeyManager onKeySavedChange={refreshApiKey} />
                <Option label={'SETTINGS_DATA_ENRICHMENT_SHOW_CAST'}>
                    <Toggle
                        tabIndex={-1}
                        {...showTmdbCastToggle}
                    />
                </Option>
                <Option label={'SETTINGS_DATA_ENRICHMENT_SHOW_DESCRIPTION'}>
                    <Toggle
                        tabIndex={-1}
                        {...showTmdbDescriptionToggle}
                    />
                </Option>
                <Option label={'SETTINGS_DATA_ENRICHMENT_SHOW_MATURITY_RATING'}>
                    <Toggle
                        tabIndex={-1}
                        {...showMaturityRatingToggle}
                    />
                </Option>
                <Option label={'SETTINGS_DATA_ENRICHMENT_SHOW_SIMILAR_TITLES'}>
                    <Toggle
                        tabIndex={-1}
                        {...showSimilarTitlesToggle}
                    />
                </Option>
            </Category>
            <Category icon={'star'} label={'SETTINGS_SECTION_RATING'}>
                <Option label={'SETTINGS_DATA_ENRICHMENT_SHOW_POSTER_RATINGS'}>
                    <Toggle
                        tabIndex={-1}
                        {...showPosterRatingsToggle}
                    />
                </Option>
            </Category>
        </Section>
    );
});

export default DataEnrichment;


import { useState, useEffect, useMemo, useCallback } from 'react';
import { useServices } from 'stremio/services';
import { getTMDBApiKey, setTMDBApiKey } from 'stremio/common/tmdbApi';
import { getOMDBApiKey } from 'stremio/common/omdbApi';
import { useDataEnrichmentPrefs } from 'stremio/common/dataEnrichmentPrefs';

type Props = {
    profile: Profile,
};

const useDataEnrichmentOptions = ({ profile }: Props) => {
    const { core } = useServices();
    const [apiKey, setApiKeyState] = useState(() => getTMDBApiKey() || '');
    const [omdbApiKey, setOmdbApiKeyState] = useState(() => getOMDBApiKey() || '');
    const { showTmdbCast, showPosterRatings, showTmdbDescription, showMaturityRating, showSimilarTitles, showOmdbRatings, setShowTmdbCast, setShowPosterRatings, setShowTmdbDescription, setShowMaturityRating, setShowSimilarTitles, setShowOmdbRatings } = useDataEnrichmentPrefs();

    useEffect(() => {
        const handleStorageChange = () => {
            setApiKeyState(getTMDBApiKey() || '');
            setOmdbApiKeyState(getOMDBApiKey() || '');
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const refreshApiKey = useCallback(() => {
        setApiKeyState(getTMDBApiKey() || '');
    }, []);

    const refreshOmdbApiKey = useCallback(() => {
        setOmdbApiKeyState(getOMDBApiKey() || '');
    }, []);

    const showTmdbCastToggle = useMemo(() => {
        const hasApiKey = apiKey && apiKey.trim().length > 0;
        return {
            checked: showTmdbCast,
            disabled: !hasApiKey,
            onClick: () => {
                if (hasApiKey) {
                    setShowTmdbCast(!showTmdbCast);
        core.transport.dispatch({
            action: 'Ctx',
            args: {
                action: 'UpdateSettings',
                args: {
                    ...profile.settings,
                                showTmdbCast: !showTmdbCast,
                }
            }
        });
                }
            }
        };
    }, [profile.settings, apiKey, showTmdbCast, setShowTmdbCast, core]);

    const showPosterRatingsToggle = useMemo(() => {
        return {
            checked: showPosterRatings,
            onClick: () => {
                setShowPosterRatings(!showPosterRatings);
        core.transport.dispatch({
            action: 'Ctx',
            args: {
                action: 'UpdateSettings',
                args: {
                    ...profile.settings,
                            showPosterRatings: !showPosterRatings,
                }
            }
        });
            }
        };
    }, [profile.settings, showPosterRatings, setShowPosterRatings, core]);

    const showTmdbDescriptionToggle = useMemo(() => {
        const hasApiKey = apiKey && apiKey.trim().length > 0;
        return {
            checked: showTmdbDescription,
            disabled: !hasApiKey,
            onClick: () => {
                if (hasApiKey) {
                    setShowTmdbDescription(!showTmdbDescription);
        core.transport.dispatch({
            action: 'Ctx',
            args: {
                action: 'UpdateSettings',
                args: {
                    ...profile.settings,
                                showTmdbDescription: !showTmdbDescription,
                }
            }
        });
                }
            }
        };
    }, [profile.settings, apiKey, showTmdbDescription, setShowTmdbDescription, core]);

    const showMaturityRatingToggle = useMemo(() => {
        const hasApiKey = apiKey && apiKey.trim().length > 0;
        return {
            checked: showMaturityRating,
            disabled: !hasApiKey,
            onClick: () => {
                if (hasApiKey) {
                    setShowMaturityRating(!showMaturityRating);
        core.transport.dispatch({
            action: 'Ctx',
            args: {
                action: 'UpdateSettings',
                args: {
                    ...profile.settings,
                                showMaturityRating: !showMaturityRating,
                }
            }
        });
                }
            }
        };
    }, [profile.settings, apiKey, showMaturityRating, setShowMaturityRating, core]);

    const showSimilarTitlesToggle = useMemo(() => {
        const hasApiKey = apiKey && apiKey.trim().length > 0;
        return {
            checked: showSimilarTitles,
            disabled: !hasApiKey,
            onClick: () => {
                if (hasApiKey) {
                    setShowSimilarTitles(!showSimilarTitles);
                    core.transport.dispatch({
                        action: 'Ctx',
                        args: {
                            action: 'UpdateSettings',
                            args: {
                                ...profile.settings,
                                showSimilarTitles: !showSimilarTitles,
                            }
                        }
                    });
                }
            }
        };
    }, [profile.settings, apiKey, showSimilarTitles, setShowSimilarTitles, core]);

    const showOmdbRatingsToggle = useMemo(() => {
        const hasApiKey = omdbApiKey && omdbApiKey.trim().length > 0;
        return {
            checked: showOmdbRatings,
            disabled: !hasApiKey,
            onClick: () => {
                if (hasApiKey) {
                    setShowOmdbRatings(!showOmdbRatings);
                    core.transport.dispatch({
                        action: 'Ctx',
                        args: {
                            action: 'UpdateSettings',
                            args: {
                                ...profile.settings,
                                showOmdbRatings: !showOmdbRatings,
                            }
                        }
                    });
                }
            }
        };
    }, [profile.settings, omdbApiKey, showOmdbRatings, setShowOmdbRatings, core]);

    return {
        showTmdbCastToggle,
        showPosterRatingsToggle,
        showTmdbDescriptionToggle,
        showMaturityRatingToggle,
        showSimilarTitlesToggle,
        showOmdbRatingsToggle,
        refreshApiKey,
        refreshOmdbApiKey,
    };
};

export default useDataEnrichmentOptions;


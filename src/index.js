// Copyright (C) 2017-2023 Smart code 203358507

if (typeof process.env.SENTRY_DSN === 'string') {
    const Sentry = require('@sentry/browser');
    Sentry.init({ dsn: process.env.SENTRY_DSN });
}

const Bowser = require('bowser');
const browser = Bowser.parse(window.navigator?.userAgent || '');
if (browser?.platform?.type === 'desktop') {
    document.querySelector('meta[name="viewport"]')?.setAttribute('content', '');
}

const React = require('react');
const ReactDOM = require('react-dom/client');
const i18n = require('i18next');
const { initReactI18next } = require('react-i18next');
const stremioTranslations = require('stremio-translations');
const App = require('./App');

const translations = Object.fromEntries(Object.entries(stremioTranslations()).map(([key, value]) => [key, {
    translation: value
}]));

// Add Home Screen settings translations
if (translations['en-US']) {
    Object.assign(translations['en-US'].translation, {
        'SETTINGS_NAV_HOME_SCREEN': 'Home Screen',
        'SETTINGS_HOME_SCREEN_ENABLE_HERO': 'Enable Hero Section',
        'SETTINGS_HOME_SCREEN_CATALOGS': 'Catalogs',
        'SETTINGS_HOME_SCREEN_ENABLE_CATALOG': 'Enable',
        'SETTINGS_HOME_SCREEN_SHOW_IN_HERO': 'Show in Hero',
        'SETTINGS_HOME_SCREEN_NO_CATALOGS': 'No catalogs available',
        'SETTINGS_HOME_SCREEN_MOVE_UP': 'Move Up',
        'SETTINGS_HOME_SCREEN_MOVE_DOWN': 'Move Down',
        'SETTINGS_HOME_SCREEN_DRAG_HANDLE': 'Drag to reorder',
        'SETTINGS_NAV_DATA_ENRICHMENT': 'Data Enrichment',
        'SETTINGS_DATA_ENRICHMENT_TMDB_API_KEY': 'TMDB API Key',
        'SETTINGS_SECTION_TMDB': 'TMDB',
        'SETTINGS_SECTION_RATING': 'Rating',
        'SETTINGS_DATA_ENRICHMENT_SHOW_CAST': 'Enhanced Cast Section',
        'SETTINGS_DATA_ENRICHMENT_SHOW_DESCRIPTION': 'Description',
        'SETTINGS_DATA_ENRICHMENT_SHOW_MATURITY_RATING': 'Maturity Rating',
        'SETTINGS_DATA_ENRICHMENT_SHOW_SIMILAR_TITLES': 'Similar Titles',
        'SETTINGS_DATA_ENRICHMENT_SHOW_POSTER_RATINGS': 'Show Ratings on Posters',
        'SETTINGS_DATA_ENRICHMENT_ADD_KEY': 'Add Key',
        'COLLECTION': 'Collection',
        'SIMILAR_TITLES': 'More like this',
        'IMDB': 'IMDb',
        'DIRECTOR': 'Director',
        'CAST': 'Cast',
        'BACK_TO_BROWSE': 'Back to Browse',
        'WATCH_NOW': 'Watch Now',
        'MY_LIST': 'My List',
        'HERO': 'Hero',
    });
}

i18n
    .use(initReactI18next)
    .init({
        resources: translations,
        lng: 'en-US',
        fallbackLng: 'en-US',
        interpolation: {
            escapeValue: false
        }
    });

const root = ReactDOM.createRoot(document.getElementById('app'));
root.render(
    <App />
);

if (process.env.NODE_ENV === 'production' && process.env.SERVICE_WORKER_DISABLED !== 'true' && process.env.SERVICE_WORKER_DISABLED !== true && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .catch((registrationError) => {
                console.error('SW registration failed: ', registrationError);
            });
    });
}

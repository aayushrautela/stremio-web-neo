// Copyright (C) 2017-2025 Smart code 203358507

import { getCatalogId } from 'stremio/common/useCatalogPreferences';
import type { StoredPreferences } from 'stremio/common/useCatalogPreferences';

type Catalog = any;

type ApplyPreferencesResult = {
    filteredCatalogs: Catalog[];
    heroItems: any[];
    heroSectionEnabled: boolean;
};

const applyCatalogPreferences = (
    catalogs: Catalog[] | null,
    preferences: StoredPreferences
): ApplyPreferencesResult => {
    if (!catalogs || catalogs.length === 0) {
        return {
            filteredCatalogs: [],
            heroItems: [],
            heroSectionEnabled: preferences.heroSectionEnabled ?? true,
        };
    }

    // Get catalog IDs and their preferences
    const catalogMap = new Map<string, { catalog: Catalog; index: number }>();
    catalogs.forEach((catalog, index) => {
        const id = getCatalogId(catalog);
        if (id) {
            catalogMap.set(id, { catalog, index });
        }
    });

    // Apply preferences: filter enabled, apply order
    const enabledCatalogs: Array<{ catalog: Catalog; order: number; id: string }> = [];
    const catalogOrder = preferences.catalogOrder || [];
    const catalogPreferences = preferences.catalogPreferences || {};

    catalogMap.forEach(({ catalog, index }, id) => {
        const pref = catalogPreferences[id] || { enabled: true, order: -1, showInHero: true };
        if (pref.enabled !== false) {
            // Use explicit order from catalogOrder array if present, otherwise use original index
            const order = catalogOrder.indexOf(id) >= 0 ? catalogOrder.indexOf(id) : index;
            enabledCatalogs.push({ catalog, order, id });
        }
    });

    // Sort by order
    enabledCatalogs.sort((a, b) => {
        return a.order - b.order;
    });

    const filteredCatalogs = enabledCatalogs.map(({ catalog }) => catalog);

    // Collect hero items from catalogs with showInHero enabled
    // Limit to first 20 items to avoid performance issues
    const heroItems: any[] = [];
    const MAX_HERO_ITEMS = 20;
    if (preferences.heroSectionEnabled !== false) {
        filteredCatalogs.forEach((catalog) => {
            if (heroItems.length >= MAX_HERO_ITEMS) return;
            
            const id = getCatalogId(catalog);
            if (id) {
                const originalIndex = catalogMap.get(id)?.index ?? -1;
                const pref = catalogPreferences[id];
                const showInHero = pref?.showInHero ?? (originalIndex === 0);
                
                if (showInHero !== false) {
                    if (catalog.content?.type === 'Ready' && Array.isArray(catalog.content.content)) {
                        catalog.content.content.forEach((item: any) => {
                            // Include all items from hero-enabled catalogs
                            // Missing background/logo will be fetched by Board component
                            if (item && heroItems.length < MAX_HERO_ITEMS) {
                                heroItems.push(item);
                            }
                        });
                    }
                }
            }
        });
    }

    return {
        filteredCatalogs,
        heroItems,
        heroSectionEnabled: preferences.heroSectionEnabled ?? true,
    };
};

export default applyCatalogPreferences;
export type { ApplyPreferencesResult };


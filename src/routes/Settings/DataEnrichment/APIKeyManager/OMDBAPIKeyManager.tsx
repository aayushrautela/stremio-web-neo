// Copyright (C) 2017-2024 Smart code 203358507

import React, { useCallback, useEffect, useState } from 'react';
import styles from './APIKeyManager.less';
import AddKeyItem from './AddKeyItem';
import { getOMDBApiKey, setOMDBApiKey } from 'stremio/common/omdbApi';

type Props = {
    onKeySavedChange?: (key: string) => void;
};

const OMDBAPIKeyManager = ({ onKeySavedChange }: Props) => {
    const [draft, setDraft] = useState('');

    useEffect(() => {
        const current = getOMDBApiKey() || '';
        setDraft(current);
    }, []);

    useEffect(() => {
        const onChange = () => {
            const current = getOMDBApiKey() || '';
            setDraft(current);
        };
        window.addEventListener('storage', onChange);
        return () => window.removeEventListener('storage', onChange);
    }, []);

    const onSubmit = useCallback(() => {
        const next = draft.trim();
        setOMDBApiKey(next);
        onKeySavedChange?.(next);
    }, [draft, onKeySavedChange]);

    const onClear = useCallback(() => {
        setOMDBApiKey('');
        setDraft('');
        onKeySavedChange?.('');
    }, [onKeySavedChange]);

    return (
        <div className={styles['wrapper']}>
            <div className={styles['content']}>
                <AddKeyItem 
                    value={draft} 
                    onChange={setDraft} 
                    onSubmit={onSubmit} 
                    onClear={onClear}
                    placeholder="Enter OMDB API Key"
                />
            </div>
        </div>
    );
};

export default OMDBAPIKeyManager;


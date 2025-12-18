// Copyright (C) 2017-2024 Smart code 203358507

import React, { ChangeEvent, useCallback } from 'react';
import Icon from '@stremio/stremio-icons/react';
import { Button, TextInput } from 'stremio/components';
import styles from './AddKeyItem.less';

type Props = {
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    onClear: () => void;
    placeholder?: string;
};

const AddKeyItem = ({ value, onChange, onSubmit, onClear, placeholder = 'Enter TMDB API Key' }: Props) => {
    const handleValueChange = useCallback(({ target }: ChangeEvent<HTMLInputElement>) => {
        onChange(target.value);
    }, [onChange]);

    return (
        <div className={styles['add-item']}>
            <TextInput
                className={styles['input']}
                value={value}
                onChange={handleValueChange}
                onSubmit={onSubmit}
                placeholder={placeholder}
                type={'password'}
            />
            <div className={styles['actions']}>
                <Button className={styles['add']} onClick={onSubmit}>
                    <Icon name={'checkmark'} className={styles['icon']} />
                </Button>
                <Button className={styles['cancel']} onClick={onClear}>
                    <Icon name={'close'} className={styles['icon']} />
                </Button>
            </div>
        </div>
    );
};

export default AddKeyItem;


// Copyright (C) 2017-2024 Smart code 203358507

import React, { useRef, useEffect, useState } from 'react';
import classNames from 'classnames';
import styles from './HorizontalScroll.less';

const SCROLL_THRESHOLD = 1;

type Props = {
    className: string,
    children: React.ReactNode,
};

const HorizontalScroll = ({ className, children }: Props) => {
    const ref = useRef<HTMLDivElement>(null);
    const [scrollPosition, setScrollPosition] = useState('left');

    useEffect(() => {
        const onScroll = ({ target }: Event) => {
            const { scrollLeft, scrollWidth, offsetWidth } = target as HTMLDivElement;

            setScrollPosition(() => (
                (scrollLeft - SCROLL_THRESHOLD) <= 0 ? 'left' :
                    (scrollLeft + offsetWidth + SCROLL_THRESHOLD) >= scrollWidth ? 'right' :
                        'center'
            ));
        };

        const el = ref.current;
        if (!el) return;

        const onFocusIn = (event: Event) => {
            const target = event.target as HTMLElement | null;
            if (!target) return;
            if (!el.contains(target)) return;
            requestAnimationFrame(() => {
                target.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
            });
        };

        el.addEventListener('scroll', onScroll);
        el.addEventListener('focusin', onFocusIn);
        return () => {
            el.removeEventListener('scroll', onScroll);
            el.removeEventListener('focusin', onFocusIn);
        };
    }, []);

    return (
        <div ref={ref} className={classNames(styles['horizontal-scroll'], className, [styles[scrollPosition]])}>
            {children}
        </div>
    );
};

export default HorizontalScroll;

import React from 'react';
import classnames from 'classnames';
import { useTranslation } from 'react-i18next';
import { Image } from 'stremio/components';
import type { TMDBCast } from 'stremio/common/tmdbTypes';
import styles from './styles.less';

type Props = {
    className?: string;
    cast: TMDBCast[];
};

const Cast: React.FC<Props> = ({ className, cast }) => {
    const { t } = useTranslation();
    if (!cast || cast.length === 0) {
        return null;
    }

    const displayCast = cast.slice(0, 5);

    return (
        <div className={classnames(className, styles['cast-section'])}>
            <div className={styles['cast-label']}>{t('CAST')}</div>
            <div className={styles['cast-list']}>
                {displayCast.map((member) => (
                    <div
                        key={member.id}
                        className={styles['cast-button']}
                        onClick={() => {
                            window.location.hash = `/search?search=${encodeURIComponent(member.name)}`;
                        }}
                    >
                        <div className={styles['cast-image-container']}>
                            {member.profile_path ? (
                                <Image
                                    className={styles['cast-image']}
                                    src={`https://image.tmdb.org/t/p/w185${member.profile_path}`}
                                    alt={member.name}
                                />
                            ) : (
                                <div className={styles['cast-image-placeholder']} />
                            )}
                        </div>
                        <div className={styles['cast-info']}>
                            <div className={styles['cast-name']}>{member.name}</div>
                            <div className={styles['cast-character']}>{member.character}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Cast;


import { Flexbox } from '@lobehub/ui';
import { memo } from 'react';

import { ProductLogo } from '@/components/Branding';

import CircleLoading from '../CircleLoading';
import styles from './index.module.css';

interface BrandTextLoadingProps {
  debugId: string;
}

const BrandTextLoading = memo<BrandTextLoadingProps>(({ debugId }) => {
  const showDebug = process.env.NODE_ENV === 'development' && debugId;

  return (
    <div className={styles.container}>
      <Flexbox align={'center'} gap={16} justify={'center'}>
        <ProductLogo size={48} type={'combine'} />
        <CircleLoading />
      </Flexbox>
      {showDebug && (
        <div className={styles.debug}>
          <div className={styles.debugRow}>
            <code>Debug ID:</code>
            <span className={styles.debugTag}>
              <code>{debugId}</code>
            </span>
          </div>
          <div className={styles.debugHint}>only visible in development</div>
        </div>
      )}
    </div>
  );
});

export default BrandTextLoading;

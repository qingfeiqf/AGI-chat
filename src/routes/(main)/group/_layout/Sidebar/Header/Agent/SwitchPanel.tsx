import { Flexbox, Popover } from '@lobehub/ui';
import { type PropsWithChildren } from 'react';
import React, { memo, Suspense } from 'react';

import SkeletonList from '@/features/NavPanel/components/SkeletonList';
import List from '@/routes/(main)/home/_layout/Body/Agent/List';
import { AgentModalProvider } from '@/routes/(main)/home/_layout/Body/Agent/ModalProvider';

const SwitchPanel = memo<PropsWithChildren>(({ children }) => {
  return (
    <Popover
      placement="bottomLeft"
      trigger="click"
      content={
        <Suspense fallback={<SkeletonList rows={6} />}>
          <AgentModalProvider>
            <Flexbox
              gap={4}
              padding={8}
              style={{
                maxHeight: '50vh',
                overflowY: 'auto',
              }}
            >
              <List />
            </Flexbox>
          </AgentModalProvider>
        </Suspense>
      }
      styles={{
        content: {
          padding: 0,
          width: 240,
        },
      }}
    >
      {children}
    </Popover>
  );
});

export default SwitchPanel;

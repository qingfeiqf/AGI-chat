'use client';

import { memo, useMemo } from 'react';

import SkeletonList from '@/features/NavPanel/components/SkeletonList';
import { useFetchAgentList } from '@/hooks/useFetchAgentList';
import { useHomeStore } from '@/store/home';
import { homeAgentListSelectors } from '@/store/home/selectors';

import Group from './Group';
import InboxItem from './InboxItem';
import SessionList from './List';
import { useAgentList } from './useAgentList';

// Keep this drawer-free so compact switchers can reuse the list without coupling to Home drawer state.
const AgentListContent = memo(() => {
  const isInit = useHomeStore(homeAgentListSelectors.isAgentListInit);
  const { customList, pinnedList, defaultList } = useAgentList();

  useFetchAgentList();

  // Memoize computed visibility flags to prevent unnecessary recalculations
  const { showPinned, showCustom } = useMemo(() => {
    const hasPinned = Boolean(pinnedList?.length);
    const hasCustom = Boolean(customList?.length);

    return {
      showCustom: hasCustom,
      showPinned: hasPinned,
    };
  }, [pinnedList?.length, customList?.length]);

  if (!isInit) return <SkeletonList rows={6} />;

  return (
    <>
      <InboxItem style={{ minHeight: 36 }} />
      {showPinned && <SessionList dataSource={pinnedList!} />}
      {showCustom && <Group dataSource={customList!} />}
      <SessionList dataSource={defaultList ?? []} />
    </>
  );
});

AgentListContent.displayName = 'AgentListContent';

export default AgentListContent;

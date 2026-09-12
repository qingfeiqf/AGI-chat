'use client';

import { memo, useMemo } from 'react';

import SkeletonList from '@/features/NavPanel/components/SkeletonList';
import { useHomeStore } from '@/store/home';
import { homeAgentListSelectors } from '@/store/home/selectors';

import Group from './Group';
import InboxItem from './InboxItem';
import SessionList from './List';
import { useAgentList } from './useAgentList';

interface AgentListContentProps {
  hideInbox?: boolean;
  // Kept for upstream call-site compatibility; the list itself scrolls
  // infinitely (batched via IntersectionObserver), so no "More" entry.
  onMoreClick?: () => void;
}

// Keep this drawer-free so compact switchers can reuse the list without
// coupling to Home drawer state. Renders only workspace-public content;
// private items live in the sibling `Private` accordion section so
// workspace-shared and personal agents stay visually distinct.
//
// SWR subscription is owned by the enclosing accordion (Body/Agent/index.tsx)
// or by a standalone caller (e.g. SwitchPanel). Subscribing here too would
// re-fetch the list every time the accordion is expanded, animating the
// spinner on both Public and Private headers for no good reason.
const AgentListContent = memo<AgentListContentProps>(({ hideInbox }) => {
  const isInit = useHomeStore(homeAgentListSelectors.isAgentListInit);
  const { customList, pinnedList, defaultList } = useAgentList();

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
      {!hideInbox && <InboxItem style={{ minHeight: 36 }} />}
      {showPinned && <SessionList dataSource={pinnedList!} />}
      {showCustom && <Group dataSource={customList!} />}
      <SessionList dataSource={defaultList ?? []} />
    </>
  );
});

AgentListContent.displayName = 'AgentListContent';

export default AgentListContent;

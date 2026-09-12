'use client';

import { Flexbox } from '@lobehub/ui';
import isEqual from 'fast-deep-equal';
import { memo } from 'react';

import SkeletonList from '@/features/NavPanel/components/SkeletonList';
import { useHomeStore } from '@/store/home';
import { homeAgentListSelectors } from '@/store/home/selectors';

import CreateAgentButton from '../Agent/CreateAgentButton';
import Group from '../Agent/List/Group';
import SessionList from '../Agent/List/List';

interface PrivateListProps {
  hideCreateButton?: boolean;
  // Kept for upstream call-site compatibility; the list scrolls infinitely
  // (batched via IntersectionObserver inside SessionList), no "More" entry.
  onMoreClick?: () => void;
}

// Renders only the workspace-private bucket: private folders followed by
// private ungrouped agents/chat groups. The server already filters out
// items the viewer can't see (other members' private rows), so this list
// is always the viewer's own.
const PrivateList = memo<PrivateListProps>(({ hideCreateButton }) => {
  const isInit = useHomeStore(homeAgentListSelectors.isAgentListInit);
  const privateGroups = useHomeStore(homeAgentListSelectors.privateAgentGroups, isEqual);
  const privateUngrouped = useHomeStore(homeAgentListSelectors.privateUngroupedAgents, isEqual);

  if (!isInit) return <SkeletonList rows={2} />;

  const hasGroups = privateGroups.length > 0;
  const hasUngrouped = privateUngrouped.length > 0;

  // Empty state still surfaces the create-button so a fresh user has an
  // obvious affordance for their first private agent.
  if (!hasGroups && !hasUngrouped) {
    if (hideCreateButton) return null;
    return (
      <Flexbox gap={1} paddingBlock={1}>
        <CreateAgentButton visibility={'private'} />
      </Flexbox>
    );
  }

  return (
    <Flexbox gap={1} paddingBlock={1}>
      {hasGroups && <Group dataSource={privateGroups} />}
      {hasUngrouped && <SessionList dataSource={privateUngrouped} />}
      {!hideCreateButton && <CreateAgentButton visibility={'private'} />}
    </Flexbox>
  );
});

PrivateList.displayName = 'PrivateList';

export default PrivateList;

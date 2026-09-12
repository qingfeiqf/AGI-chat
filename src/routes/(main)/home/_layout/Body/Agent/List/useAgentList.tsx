'use client';

import isEqual from 'fast-deep-equal';
import { useMemo } from 'react';

import { useHomeStore } from '@/store/home';
import { homeAgentListSelectors } from '@/store/home/selectors';

// SWR subscription is owned by the caller of AgentListContent (Body/Agent
// accordion, or the standalone SwitchPanel). Subscribing here would re-fetch
// on every accordion expand and flash spinners across the sidebar.
//
// No page limit here: the list component batches rendering with an
// IntersectionObserver (infinite scroll), so the store must provide the
// full ungrouped list.
export const useAgentList = () => {
  const ungroupedAgents = useHomeStore(homeAgentListSelectors.ungroupedAgents, isEqual);
  const agentGroups = useHomeStore(homeAgentListSelectors.agentGroups, isEqual);
  const pinnedAgents = useHomeStore(homeAgentListSelectors.pinnedAgents, isEqual);
  const privateAgentGroups = useHomeStore(homeAgentListSelectors.privateAgentGroups, isEqual);
  const privateUngroupedAgents = useHomeStore(
    homeAgentListSelectors.privateUngroupedAgents,
    isEqual,
  );

  return useMemo(() => {
    return {
      customList: agentGroups,
      defaultList: ungroupedAgents,
      pinnedList: pinnedAgents,
      privateGroupList: privateAgentGroups,
      privateUngroupedList: privateUngroupedAgents,
    };
  }, [agentGroups, pinnedAgents, ungroupedAgents, privateAgentGroups, privateUngroupedAgents]);
};

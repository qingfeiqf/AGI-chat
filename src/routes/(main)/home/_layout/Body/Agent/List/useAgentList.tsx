'use client';

import isEqual from 'fast-deep-equal';
import { useMemo } from 'react';

import { useFetchAgentList } from '@/hooks/useFetchAgentList';
import { useHomeStore } from '@/store/home';
import { homeAgentListSelectors } from '@/store/home/selectors';

export const useAgentList = () => {
  useFetchAgentList();

  const ungroupedAgents = useHomeStore(homeAgentListSelectors.ungroupedAgents, isEqual);
  const agentGroups = useHomeStore(homeAgentListSelectors.agentGroups, isEqual);
  const pinnedAgents = useHomeStore(homeAgentListSelectors.pinnedAgents, isEqual);

  return useMemo(() => {
    return {
      customList: agentGroups,
      defaultList: ungroupedAgents,
      pinnedList: pinnedAgents,
    };
  }, [agentGroups, pinnedAgents, ungroupedAgents]);
};

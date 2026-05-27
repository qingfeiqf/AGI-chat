'use client';

import { memo } from 'react';

import { useHomeStore } from '@/store/home';

import AllAgentsDrawer from '../AllAgentsDrawer';
import AgentListContent from './AgentListContent';

// The Home sidebar owns the all-agents drawer; other surfaces should import AgentListContent directly.
const AgentList = memo(() => {
  const [allAgentsDrawerOpen, closeAllAgentsDrawer] = useHomeStore((s) => [
    s.allAgentsDrawerOpen,
    s.closeAllAgentsDrawer,
  ]);

  return (
    <>
      <AgentListContent />
      <AllAgentsDrawer open={allAgentsDrawerOpen} onClose={closeAllAgentsDrawer} />
    </>
  );
});

export default AgentList;

import React, { memo } from 'react';

import { NavPanelPortal } from '@/features/NavPanel';
import SideBarLayout from '@/features/NavPanel/SideBarLayout';
import HomeBody from '@/routes/(main)/home/_layout/Body';
import { AgentModalProvider } from '@/routes/(main)/home/_layout/Body/Agent/ModalProvider';
import CompactSidebar from '@/routes/(main)/home/_layout/CompactSidebar';
import HomeHeader from '@/routes/(main)/home/_layout/Header';
import { useGlobalStore } from '@/store/global';
import { systemStatusSelectors } from '@/store/global/selectors';

const Sidebar = memo(() => {
  const expand = useGlobalStore(systemStatusSelectors.showLeftPanel);

  return (
    <NavPanelPortal navKey="agent">
      <AgentModalProvider>
        {expand ? (
          // Expanded: show the home assistant list with inline topic lists,
          // so new topics appear under the agent card without drill-down navigation.
          <SideBarLayout body={<HomeBody />} header={<HomeHeader />} />
        ) : (
          // Collapsed: compact 64px avatar list
          <CompactSidebar />
        )}
      </AgentModalProvider>
    </NavPanelPortal>
  );
});

Sidebar.displayName = 'ChatSidebar';

export default Sidebar;

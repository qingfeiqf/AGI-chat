import { memo } from 'react';

import SideBarLayout from '@/features/NavPanel/SideBarLayout';
import { useGlobalStore } from '@/store/global';
import { systemStatusSelectors } from '@/store/global/selectors';

import Body from './Body';
import { AgentModalProvider } from './Body/Agent/ModalProvider';
import CompactSidebar from './CompactSidebar';
import Header from './Header';

const Sidebar = memo(() => {
  const expand = useGlobalStore(systemStatusSelectors.showLeftPanel);

  return (
    <AgentModalProvider>
      {expand ? <SideBarLayout body={<Body />} header={<Header />} /> : <CompactSidebar />}
    </AgentModalProvider>
  );
});

export default Sidebar;

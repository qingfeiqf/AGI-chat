'use client';

import { type PropsWithChildren, type ReactNode } from 'react';
import { memo, useEffect, useLayoutEffect, useRef, useSyncExternalStore } from 'react';
import { useLocation } from 'react-router-dom';

import CompactSidebar from '@/routes/(main)/home/_layout/CompactSidebar';
import SidebarContent from '@/routes/(main)/home/_layout/SidebarContent';
import { useGlobalStore } from '@/store/global';
import { systemStatusSelectors } from '@/store/global/selectors';

import { NavPanelDraggable } from './components/NavPanelDraggable';

export const NAV_PANEL_RIGHT_DRAWER_ID = 'nav-panel-drawer';

type NavPanelSnapshot = {
  key: string;
  node: ReactNode;
  order: number;
} | null;

let currentSnapshot: NavPanelSnapshot = null;
const listeners = new Set<() => void>();

// Monotonic mount-order counter — the last NavPanelPortal to mount wins.
// This prevents a hidden-but-alive portal (e.g. Home behind <Activity mode="hidden">)
// from overwriting the snapshot when its children reference changes on re-render.
let portalMountOrder = 0;

const subscribeNavPanel = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getNavPanelSnapshot = () => currentSnapshot;
const setNavPanelSnapshot = (snapshot: NavPanelSnapshot) => {
  currentSnapshot = snapshot;
  listeners.forEach((listener) => listener());
};

export const resetNavPanel = () => {
  if (!currentSnapshot) return;

  setNavPanelSnapshot(null);
};

const FALLBACK_NAV_KEY = 'home';

const getActiveNavKey = () => currentSnapshot?.key ?? FALLBACK_NAV_KEY;

export const useActiveNavKey = () =>
  useSyncExternalStore(subscribeNavPanel, getActiveNavKey, getActiveNavKey);

const NavPanel = memo(() => {
  const { pathname } = useLocation();
  const panelContent = useSyncExternalStore(
    subscribeNavPanel,
    getNavPanelSnapshot,
    getNavPanelSnapshot,
  );

  const expand = useGlobalStore(systemStatusSelectors.showLeftPanel);

  // When navigating back to "/" from a sub-page, the sub-page's portal has already
  // unmounted but left a stale snapshot. Detect this and reset so the Home portal
  // (which is still alive inside <Activity mode="hidden">) can re-register.
  // The reset is deferred via rAF to avoid triggering a synchronous useSyncExternalStore
  // re-render during React's commit phase.
  useEffect(() => {
    if (pathname === '/' && panelContent && panelContent.key !== FALLBACK_NAV_KEY) {
      requestAnimationFrame(() => {
        const current = getNavPanelSnapshot();
        if (current && current.key !== FALLBACK_NAV_KEY) {
          setNavPanelSnapshot(null);
        }
      });
    }
  }, [pathname, panelContent?.key]);

  // Use home Content as fallback when no portal content is provided.
  // The fallback intentionally does NOT include NavPanelPortal — rendering one here
  // would create a duplicate portal whose cleanup effect would clear the snapshot
  // and re-trigger this same stale-detection path in an infinite loop.
  const activeContent = panelContent || { key: FALLBACK_NAV_KEY, node: <SidebarContent /> };

  // If collapsed, ignore page-specific portal content and fallback to CompactSidebar directly
  const finalContent = expand ? activeContent : { key: 'compact', node: <CompactSidebar /> };

  return (
    <>
      <NavPanelDraggable activeContent={finalContent} />
      <div
        id={NAV_PANEL_RIGHT_DRAWER_ID}
        style={{
          height: '100%',
          position: 'relative',
          width: 0,
          zIndex: 10,
        }}
      />
    </>
  );
});

export default NavPanel;

interface NavPanelPortalProps extends PropsWithChildren {
  /**
   * Unique key to trigger transition animation when content changes
   * @example <NavPanelPortal navKey="chat">...</NavPanelPortal>
   */
  navKey?: string;
}

export const NavPanelPortal = memo<NavPanelPortalProps>(({ children, navKey = 'default' }) => {
  // Each portal instance gets a stable mount order (monotonic increasing).
  // A later-mounted portal always has higher priority than an earlier one.
  const orderRef = useRef(0);
  if (orderRef.current === 0) {
    portalMountOrder += 1;
    orderRef.current = portalMountOrder;
  }

  useLayoutEffect(() => {
    if (!children) return;

    const current = getNavPanelSnapshot();
    // Only overwrite if no snapshot exists or this portal mounted more recently.
    // This prevents a hidden-but-alive portal (Home inside <Activity mode="hidden">)
    // from overwriting the active route's sidebar when its children reference changes.
    if (!current || current.order < orderRef.current) {
      setNavPanelSnapshot({ key: navKey, node: children, order: orderRef.current });
    }
  }, [children, navKey]);

  return null;
});

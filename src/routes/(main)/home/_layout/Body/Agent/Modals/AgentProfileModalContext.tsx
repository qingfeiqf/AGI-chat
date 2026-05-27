'use client';

import { createContext, use } from 'react';

/**
 * Context that provides the .ant-modal-wrap DOM element as a portal container
 * for dropdown menus inside the AgentProfileModal. Portaling to the modal wrap
 * ensures dropdowns render within the modal's stacking context (z-index)
 * without being clipped by overflow:hidden on ant-modal-body.
 */
export const AgentProfileModalContainerContext = createContext<HTMLElement | null>(null);

export const useAgentProfileModalContainer = () => {
  return use(AgentProfileModalContainerContext);
};

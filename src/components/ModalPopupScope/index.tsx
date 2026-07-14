'use client';

import AppElementContext from '@lobehub/ui/es/ThemeProvider/AppElementContext';
import { ConfigProvider } from 'antd';
import { memo, type ReactNode, useCallback, useState } from 'react';

interface ModalPopupScopeProps {
  children: ReactNode;
}

/**
 * Reusable scope for content rendered inside an antd `Modal`: locates the nearest
 * `.ant-modal-wrap` ancestor and uses it as the portal container for BOTH:
 *  - antd popups (via `ConfigProvider getPopupContainer`) — Dropdown/Popover/Select
 *  - base-ui popups (via `AppElementContext` → `usePortalContainer` → `useAppElement`)
 *    — base-ui `Select` / `DropdownMenu` / `Popover`.
 *
 * Why: by default those popups portal to the global app element (or document.body),
 * which sits in a lower stacking context than an antd modal wrap (z-index 1000) and
 * therefore renders *behind* the modal. Portaling into the modal wrap puts them
 * inside the modal's stacking context so they appear above the modal content.
 *
 * This does NOT touch the modal's own `getContainer` — modals should still render to
 * `document.body` (the default) so antd's incremental z-index stacks multiple modals
 * correctly (each new modal above the previous; closing returns to the lower one).
 *
 * `display: contents` keeps the ref element out of layout (it only exists to find
 * the `.ant-modal-wrap` ancestor via `closest`).
 */
const ModalPopupScope = memo<ModalPopupScopeProps>(({ children }) => {
  const [modalWrapElement, setModalWrapElement] = useState<HTMLElement | null>(null);

  const refCallback = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      const modalWrap = node.closest('.ant-modal-wrap');
      setModalWrapElement(modalWrap as HTMLElement | null);
    }
  }, []);

  return (
    <ConfigProvider getPopupContainer={() => modalWrapElement ?? document.body}>
      <AppElementContext value={modalWrapElement}>
        <div ref={refCallback} style={{ display: 'contents' }}>
          {children}
        </div>
      </AppElementContext>
    </ConfigProvider>
  );
});

ModalPopupScope.displayName = 'ModalPopupScope';

export default ModalPopupScope;

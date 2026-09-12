'use client';

import { Modal } from '@lobehub/ui/base-ui';
// Base UI popups (Select, DropdownMenu, Popover) read AppElementContext to pick a
// portal container (via usePortalContainer -> useAppElement). Override it with the
// modal wrap so popups render inside the modal's stacking context (above the antd
// modal) instead of the global app element, which sits behind the antd modal's
// z-index and causes the model-switcher / +集成技能 popups to appear behind the modal.
import AppElementContext from '@lobehub/ui/es/ThemeProvider/AppElementContext';
import { ConfigProvider } from 'antd';
import { createStaticStyles } from 'antd-style';
import { memo, useCallback, useEffect, useState } from 'react';

import Loading from '@/components/Loading/BrandTextLoading';
import { isDesktop } from '@/const/version';
import { useInitAgentConfig } from '@/hooks/useInitAgentConfig';
import { MarketAuthProvider } from '@/layout/AuthProvider/MarketAuth';
import AgentProfile from '@/routes/(main)/agent/profile';
import { useAgentStore } from '@/store/agent';
import { agentSelectors } from '@/store/agent/selectors';

import { AgentProfileModalContainerContext } from './AgentProfileModalContext';

const styles = createStaticStyles(({ css }) => ({
  modal: css`
    .ant-modal-content {
      overflow: hidden;
      padding: 0 !important;
    }

    .ant-modal-header {
      margin-block-end: 0 !important;
      padding-block: 16px !important;
      padding-inline: 24px !important;
      border-block-end: 1px solid rgb(0 0 0 / 6%);
    }

    .ant-modal-title {
      font-weight: 600;
      text-align: center;
    }

    .ant-modal-body {
      overflow: auto !important;
      padding: 0 !important;
    }
  `,
  wrapper: css`
    position: relative;

    display: flex;
    flex-direction: column;

    height: min(85vh, 900px);
    min-height: min(500px, 85vh);
    padding-block-end: 16px;
    padding-inline: 16px;

    .ant-tag:has(.lucide-cloud),
    .ant-tag:has(.lucide-loader2) {
      display: none !important;
    }
  `,
}));

interface AgentProfileModalProps {
  agentId: string;
  onCancel: () => void;
  open: boolean;
}

const AgentProfileModalContent = memo(({ agentId }: { agentId: string }) => {
  const setActiveAgentId = useAgentStore((s) => s.setActiveAgentId);
  const activeAgentId = useAgentStore((s) => s.activeAgentId);

  useEffect(() => {
    if (agentId) {
      setActiveAgentId(agentId);
    }
  }, [agentId, setActiveAgentId]);

  useInitAgentConfig(agentId);

  // setActiveAgentId runs in an effect (after first paint), so without this gate
  // the previously-active agent's avatar/name/header would flash before the effect
  // runs and then get swapped out for the loading state — "闪一下又隐藏". Wait
  // until the store's active agent actually matches the one we're opening.
  const isReady = activeAgentId === agentId;

  return (
    <MarketAuthProvider isDesktop={isDesktop}>
      {isReady ? <AgentProfile /> : <Loading debugId="AgentProfileModalContent" />}
    </MarketAuthProvider>
  );
});

AgentProfileModalContent.displayName = 'AgentProfileModalContent';

const AgentProfileModal = memo<AgentProfileModalProps>(({ agentId, open, onCancel }) => {
  const [modalWrapElement, setModalWrapElement] = useState<HTMLElement | null>(null);

  // Get agent details
  const agentMeta = useAgentStore(agentSelectors.getAgentMetaById(agentId));
  const agentTitle = agentMeta?.title || '助手';

  // Find the .ant-modal-wrap element when the modal opens, so we can
  // use it as the portal container for DropdownMenu.
  // This ensures dropdown portals render within the modal's stacking context
  // (inheriting its z-index) without being clipped by overflow:hidden on ant-modal-body.
  const wrapperRefCallback = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      const modalWrap = node.closest('.ant-modal-wrap');
      setModalWrapElement(modalWrap as HTMLElement | null);
    }
  }, []);

  // Automatically scroll editor container back to the top to counter auto-focus scroll down
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        const divs = document.querySelectorAll('.ant-modal-content div');
        divs.forEach((container) => {
          const style = window.getComputedStyle(container);
          if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
            container.scrollTop = 0;
          }
        });
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [open, agentId]);

  return (
    <Modal
      destroyOnClose
      className={styles.modal}
      footer={null}
      open={open}
      title={`${agentTitle} 的助手信息`}
      width={'min(92vw, 1400px)'}
      onCancel={onCancel}
    >
      <ConfigProvider getPopupContainer={() => modalWrapElement ?? document.body}>
        <AppElementContext value={modalWrapElement}>
          <AgentProfileModalContainerContext value={modalWrapElement}>
            <div className={styles.wrapper} ref={wrapperRefCallback}>
              {open && agentId && <AgentProfileModalContent agentId={agentId} />}
            </div>
          </AgentProfileModalContainerContext>
        </AppElementContext>
      </ConfigProvider>
    </Modal>
  );
});

AgentProfileModal.displayName = 'AgentProfileModal';

export default AgentProfileModal;

'use client';

import { Modal } from '@lobehub/ui';
import { ConfigProvider } from 'antd';
import { createStyles } from 'antd-style';
import { memo, useCallback, useEffect, useState } from 'react';

import { isDesktop } from '@/const/version';
import { useInitAgentConfig } from '@/hooks/useInitAgentConfig';
import { MarketAuthProvider } from '@/layout/AuthProvider/MarketAuth';
import AgentProfile from '@/routes/(main)/agent/profile';
import { useAgentStore } from '@/store/agent';
import { agentSelectors } from '@/store/agent/selectors';

import { AgentProfileModalContainerContext } from './AgentProfileModalContext';

const useStyles = createStyles(({ css }) => ({
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
      overflow: hidden !important;
      padding: 0 !important;
    }
  `,
  wrapper: css`
    display: flex;
    flex-direction: column;

    height: min(85vh, 900px);
    min-height: min(500px, 85vh);
    padding-block-end: 16px;
    padding-inline: 16px;

    /* Hide the AutoSaveHint / status hints in the header left area */
    .lobe-nav-header-left,
    [class*='AutoSaveHint'] {
      display: none !important;
    }

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

  useEffect(() => {
    if (agentId) {
      setActiveAgentId(agentId);
    }
  }, [agentId, setActiveAgentId]);

  useInitAgentConfig(agentId);

  return (
    <MarketAuthProvider isDesktop={isDesktop}>
      <AgentProfile />
    </MarketAuthProvider>
  );
});

AgentProfileModalContent.displayName = 'AgentProfileModalContent';

const AgentProfileModal = memo<AgentProfileModalProps>(({ agentId, open, onCancel }) => {
  const { styles } = useStyles();
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
        <AgentProfileModalContainerContext value={modalWrapElement}>
          <div className={styles.wrapper} ref={wrapperRefCallback}>
            {open && agentId && <AgentProfileModalContent agentId={agentId} />}
          </div>
        </AgentProfileModalContainerContext>
      </ConfigProvider>
    </Modal>
  );
});

AgentProfileModal.displayName = 'AgentProfileModal';

export default AgentProfileModal;

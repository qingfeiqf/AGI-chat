'use client';

import { Modal } from '@lobehub/ui/base-ui';
import { ConfigProvider } from 'antd';
import { createStaticStyles } from 'antd-style';
import { memo, useCallback, useEffect, useState } from 'react';

import ChannelPage from '@/routes/(main)/agent/channel';
import { useAgentStore } from '@/store/agent';
import { agentSelectors } from '@/store/agent/selectors';

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
  `,
}));

interface AgentChannelModalProps {
  agentId: string;
  onCancel: () => void;
  open: boolean;
  title?: string;
}

const AgentChannelModal = memo<AgentChannelModalProps>(({ agentId, open, title, onCancel }) => {
  const setActiveAgentId = useAgentStore((s) => s.setActiveAgentId);
  const agentMeta = useAgentStore(agentSelectors.getAgentMetaById(agentId));
  const agentTitle = title || agentMeta?.title || '助手';
  const [modalWrapElement, setModalWrapElement] = useState<HTMLElement | null>(null);

  const wrapperRefCallback = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      const modalWrap = node.closest('.ant-modal-wrap');
      setModalWrapElement(modalWrap as HTMLElement | null);
    }
  }, []);

  useEffect(() => {
    if (open && agentId) setActiveAgentId(agentId);
  }, [open, agentId, setActiveAgentId]);

  return (
    <Modal
      destroyOnClose
      className={styles.modal}
      footer={null}
      open={open}
      title={`${agentTitle} 的消息渠道配置`}
      width={'min(90vw, 1200px)'}
      onCancel={onCancel}
    >
      <ConfigProvider getPopupContainer={() => modalWrapElement ?? document.body}>
        <div className={styles.wrapper} ref={wrapperRefCallback}>
          {open && agentId && <ChannelPage agentId={agentId} />}
        </div>
      </ConfigProvider>
    </Modal>
  );
});

AgentChannelModal.displayName = 'AgentChannelModal';

export default AgentChannelModal;

'use client';

import {
  DEFAULT_INBOX_AVATAR,
  DESKTOP_HEADER_ICON_SMALL_SIZE,
  SESSION_CHAT_URL,
} from '@lobechat/const';
import { ActionIcon, Avatar, Flexbox, Icon } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import { ClipboardList, History, Loader2, MessageSquarePlus } from 'lucide-react';
import { type CSSProperties, memo, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { usePrefetchAgent } from '@/hooks/usePrefetchAgent';
import { useAgentStore } from '@/store/agent';
import { agentSelectors, builtinAgentSelectors } from '@/store/agent/selectors';
import { useChatStore } from '@/store/chat';
import { operationSelectors } from '@/store/chat/selectors';
import { prefetchRoute } from '@/utils/router';

import { useAgentModal } from '../ModalProvider';
import SidebarTopicList from './SidebarTopicList';

const useStyles = createStyles(({ css, cssVar }) => ({
  outerContainer: css`
    position: relative;

    margin-block-end: 8px;
    padding: 0;
    border: 1px solid transparent;
    border-radius: 12px;

    background: transparent;

    transition: all 0.2s ${cssVar.motionEaseInOut};
  `,
  outerContainerActive: css`
    overflow: hidden;
    padding: 12px;
    border: none;
    background: ${cssVar.colorFillSecondary};
  `,
  container: css`
    cursor: pointer;

    position: relative;

    padding-block: 8px;
    padding-inline: 12px;
    border: none;
    border-radius: 8px;

    background: transparent;

    transition: all 0.2s ${cssVar.motionEaseInOut};

    &:hover {
      background: ${cssVar.colorFillSecondary};
    }
  `,
  containerActive: css`
    padding-inline: 0;

    &:hover {
      background: transparent;

      .toolbar {
        visibility: visible;
        opacity: 1;
      }

      .title-row {
        padding-inline-end: 90px;
      }
    }
  `,
  titleRow: css`
    width: 100%;
    min-width: 0;
    transition: padding-inline-end 0.2s ${cssVar.motionEaseInOut};
  `,
  runningBadge: css`
    pointer-events: none;

    position: absolute;
    inset-block-end: -2px;
    inset-inline-end: -2px;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    width: 14px;
    height: 14px;
    border: 1.5px solid ${cssVar.colorBgContainer};
    border-radius: 999px;

    color: ${cssVar.colorWarning};

    background: ${cssVar.colorBgContainer};
  `,
  avatarWrapper: css`
    position: relative;
    display: inline-flex;
  `,
  title: css`
    overflow: hidden;

    min-width: 0;

    font-size: 14px;
    font-weight: 600;
    color: ${cssVar.colorText};
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  desc: css`
    overflow: hidden;

    margin-block-start: 2px;

    font-size: 12px;
    color: ${cssVar.colorTextDescription};
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  toolbar: css`
    position: absolute;
    inset-block-start: 6px;
    inset-inline-end: 4px;

    visibility: hidden;
    opacity: 0;

    transition: all 0.2s ${cssVar.motionEaseInOut};
  `,
}));

interface InboxItemProps {
  className?: string;
  style?: CSSProperties;
}

const InboxItem = memo<InboxItemProps>(({ className, style }) => {
  const { styles, cx } = useStyles();
  const navigate = useNavigate();

  const inboxAgentId = useAgentStore(builtinAgentSelectors.inboxAgentId);
  const inboxMeta = useAgentStore(agentSelectors.getAgentMetaById(inboxAgentId!));

  const activeAgentId = useChatStore((s) => s.activeAgentId);
  const switchTopic = useChatStore((s) => s.switchTopic);
  const openNewTopicOrSaveTopic = useChatStore((s) => s.openNewTopicOrSaveTopic);
  const { openAgentTasksModal } = useAgentModal();

  const isSelected = activeAgentId === inboxAgentId;
  const [showHistory, setShowHistory] = useState(true);

  const isLoading = useChatStore(
    inboxAgentId ? operationSelectors.isAgentRunning(inboxAgentId) : () => false,
  );
  const prefetchAgent = usePrefetchAgent();
  const inboxAgentTitle = inboxMeta.title || 'AGI-chat AI';
  const inboxAgentDesc = inboxMeta.description || '官方预置 AI 对话助手';
  const inboxAgentAvatar = inboxMeta.avatar || DEFAULT_INBOX_AVATAR;
  const inboxUrl = SESSION_CHAT_URL(inboxAgentId, false);

  // Prefetch agent layout chunk and data eagerly since AGI-chat AI is almost always clicked
  useEffect(() => {
    if (inboxAgentId) {
      prefetchRoute(inboxUrl);
      prefetchAgent(inboxAgentId);
    }
  }, [inboxAgentId, prefetchAgent, inboxUrl]);

  const handleCardClick = useCallback(() => {
    navigate(inboxUrl);
    switchTopic(null); // Switch to new topic by default on selection
  }, [navigate, inboxUrl, switchTopic]);

  const handleActionClick = useCallback((e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    e.preventDefault();
    action();
  }, []);

  const avatarNode = (
    <Avatar emojiScaleWithBackground avatar={inboxAgentAvatar} shape={'square'} size={32} />
  );

  return (
    <Flexbox
      className={cx(styles.outerContainer, isSelected && styles.outerContainerActive, className)}
      direction="vertical"
      style={style}
    >
      <Flexbox
        horizontal
        align="center"
        className={cx(styles.container, isSelected && styles.containerActive)}
        justify="space-between"
        onClick={handleCardClick}
      >
        <Flexbox horizontal align="center" gap={10} style={{ minWidth: 0, flex: 1 }}>
          <span className={styles.avatarWrapper}>
            {avatarNode}
            {isLoading && (
              <span className={styles.runningBadge}>
                <Icon spin icon={Loader2} size={9} />
              </span>
            )}
          </span>
          <Flexbox direction="vertical" style={{ minWidth: 0, flex: 1 }}>
            <Flexbox horizontal align="center" className={cx('title-row', styles.titleRow)}>
              <span className={styles.title}>{inboxAgentTitle}</span>
            </Flexbox>
            <span className={styles.desc}>{inboxAgentDesc}</span>
          </Flexbox>
        </Flexbox>

        {/* Toolbar actions */}
        <Flexbox horizontal align="center" className={cx(styles.toolbar, 'toolbar')} gap={4}>
          <ActionIcon
            icon={History}
            size={DESKTOP_HEADER_ICON_SMALL_SIZE}
            title="历史话题"
            onClick={(e) => handleActionClick(e, () => setShowHistory(!showHistory))}
          />
          <ActionIcon
            icon={MessageSquarePlus}
            size={DESKTOP_HEADER_ICON_SMALL_SIZE}
            title="新建话题"
            onClick={(e) => handleActionClick(e, openNewTopicOrSaveTopic)}
          />
          <ActionIcon
            icon={ClipboardList}
            size={DESKTOP_HEADER_ICON_SMALL_SIZE}
            title="助手任务"
            onClick={(e) => handleActionClick(e, () => openAgentTasksModal(inboxAgentId!))}
          />
        </Flexbox>
      </Flexbox>

      {/* History topic list inline */}
      {isSelected && showHistory && inboxAgentId && <SidebarTopicList agentId={inboxAgentId} />}
    </Flexbox>
  );
});

export default InboxItem;

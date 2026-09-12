import { AGENT_CHAT_URL,DESKTOP_HEADER_ICON_SMALL_SIZE } from '@lobechat/const';
import { HETEROGENEOUS_TYPE_LABELS } from '@lobechat/heterogeneous-agents';
import { type SidebarAgentItem } from '@lobechat/types';
import { type ContextMenuItem,Flexbox, Icon, showContextMenu, Tooltip } from '@lobehub/ui';
import { ActionIcon, Tag } from '@lobehub/ui/base-ui';
import { createStaticStyles, cx } from 'antd-style';
import {
  ClipboardList,
  History,
  Loader2,
  MessageSquarePlus,
  MoreVertical,
  PinIcon,
} from 'lucide-react';
import { type CSSProperties, type DragEvent, memo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { usePrefetchAgent } from '@/hooks/usePrefetchAgent';
import { useAgentStore } from '@/store/agent';
import { agentSelectors } from '@/store/agent/selectors';
import { useChatStore } from '@/store/chat';
import { operationSelectors } from '@/store/chat/selectors';
import { useGlobalStore } from '@/store/global';
import { useHomeStore } from '@/store/home';
import { prefetchRoute } from '@/utils/router';

import { useAgentModal } from '../../ModalProvider';
import SidebarTopicList from '../SidebarTopicList';
import Avatar from './Avatar';
import { useAgentDropdownMenu } from './useDropdownMenu';

const styles = createStaticStyles(({ css, cssVar }) => ({
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
  `,
  containerActive: css`
    padding-inline: 0;

    &:hover {
      background: transparent;
    }
  `,
  titleRow: css`
    position: relative;
    width: 100%;
    min-width: 0;
    transition: padding-inline-end 0.2s ease;
  `,
  badge: css`
    pointer-events: none;

    position: absolute;
    inset-block-end: -2px;
    inset-inline-end: -2px;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    min-width: 14px;
    height: 14px;
    padding-inline: 3px;
    border: 1.5px solid ${cssVar.colorBgContainer};
    border-radius: 999px;

    font-size: 9px;
    font-weight: 600;
    line-height: 1;
    color: #fff;

    background: ${cssVar.colorError};
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
    flex: 1;

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
  // Pin / toolbar — absolute positioned inside title-row, aligned with name text
  actions: css`
    position: absolute;
    inset-block-start: 50%;
    inset-inline-end: 0;
    transform: translateY(-50%);

    display: flex;
    gap: 2px;
    align-items: center;
  `,
}));

interface AgentItemProps {
  className?: string;
  item: SidebarAgentItem;
  onNavigate?: () => void;
  style?: CSSProperties;
}

const AgentItem = memo<AgentItemProps>(({ item, style, className, onNavigate }) => {
  const {
    id,
    avatar,
    backgroundColor,
    title,
    pinned,
    heterogeneousType,
    slug,
    userId,
    visibility,
    description: itemDescription,
  } = item;
  // Unread count is server-computed (topics.status === 'unread') and carried on
  // the sidebar list item, so it stays accurate across agents whose topics
  // aren't loaded into the chat store on this client.
  const unreadCount = item.unreadCount ?? 0;
  const { t } = useTranslation('chat');
  const { openCreateGroupModal, openAgentTasksModal } = useAgentModal();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const openAgentInNewWindow = useGlobalStore((s) => s.openAgentInNewWindow);

  const prefetchAgent = usePrefetchAgent();
  const isUpdating = useHomeStore((s) => s.agentUpdatingId === id);

  const activeAgentId = useChatStore((s) => s.activeAgentId);
  const switchTopic = useChatStore((s) => s.switchTopic);
  const openNewTopicOrSaveTopic = useChatStore((s) => s.openNewTopicOrSaveTopic);

  const isSelected = activeAgentId === id;
  const [showHistory, setShowHistory] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const agentMeta = useAgentStore(agentSelectors.getAgentMetaById(id));
  const currentAvatar = agentMeta?.avatar || avatar;
  const currentBackgroundColor = agentMeta?.backgroundColor || backgroundColor;
  const currentTitle = agentMeta?.title || title;
  // Prefer agent store description (real-time), fall back to sidebar item's database value
  const description = agentMeta?.description || itemDescription || '';

  const isLoading = useChatStore(operationSelectors.isAgentVisiblyRunning(id));
  const displayTitle = currentTitle || t('untitledAgent');

  const heterogeneousLabel = heterogeneousType
    ? (HETEROGENEOUS_TYPE_LABELS[heterogeneousType] ?? heterogeneousType)
    : null;

  // Dynamically calculate hover padding based on visible action icons
  const hoverIconCount = (pinned ? 1 : 0) + (isSelected ? 2 : 0) + 2; // pin? + history+newTopic? + tasks+more
  const hoverPaddingRight = hoverIconCount * 28 + (hoverIconCount - 1) * 2 + 8; // icons + gaps + margin

  const navigate = useNavigate();
  const agentUrl = AGENT_CHAT_URL(id, false);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    prefetchAgent(id);
    prefetchRoute(agentUrl);
  }, [id, prefetchAgent, agentUrl]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  const handleDoubleClick = useCallback(() => {
    openAgentInNewWindow(id);
  }, [id, openAgentInNewWindow]);

  const handleDragStart = useCallback(
    (e: DragEvent) => {
      e.dataTransfer.setData('text/plain', id);
    },
    [id],
  );

  const handleDragEnd = useCallback(
    (e: DragEvent) => {
      if (e.dataTransfer.dropEffect === 'none') {
        openAgentInNewWindow(id);
      }
    },
    [id, openAgentInNewWindow],
  );

  const handleOpenCreateGroupModal = useCallback(() => {
    openCreateGroupModal(id, visibility);
  }, [id, openCreateGroupModal, visibility]);

  const handleCardClick = useCallback(() => {
    navigate(agentUrl);
    switchTopic(null);
    if (onNavigate) onNavigate();
  }, [navigate, agentUrl, switchTopic, onNavigate]);

  const handleActionClick = useCallback((e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    e.preventDefault();
    action();
  }, []);

  const dropdownMenu = useAgentDropdownMenu({
    anchor,
    avatar: typeof currentAvatar === 'string' ? currentAvatar : undefined,
    backgroundColor: backgroundColor || undefined,
    group: undefined,
    id,
    openCreateGroupModal: handleOpenCreateGroupModal,
    pinned: pinned ?? false,
    slug,
    title: displayTitle,
    userId,
    visibility,
  });

  const avatarNode = (
    <Avatar
      avatar={typeof currentAvatar === 'string' ? currentAvatar : undefined}
      avatarBackground={currentBackgroundColor || undefined}
    />
  );

  return (
    <Flexbox
      className={cx(styles.outerContainer, isSelected && styles.outerContainerActive, className)}
      direction="vertical"
      draggable={!isUpdating}
      ref={setAnchor}
      style={style}
      onDoubleClick={handleDoubleClick}
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Flexbox
        horizontal
        align="center"
        className={cx(styles.container, isSelected && styles.containerActive)}
        justify="space-between"
        onClick={handleCardClick}
        onContextMenu={(e) => {
          e.preventDefault();
          showContextMenu(dropdownMenu() as unknown as ContextMenuItem[]);
        }}
      >
          <Flexbox horizontal align="center" gap={10} style={{ minWidth: 0, flex: 1 }}>
            <span className={styles.avatarWrapper}>
              {avatarNode}
              {isLoading ? (
                <span className={styles.runningBadge}>
                  <Icon spin icon={Loader2} size={9} />
                </span>
              ) : unreadCount > 0 ? (
                <span className={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
              ) : null}
            </span>

            <Flexbox direction="vertical" style={{ minWidth: 0, flex: 1 }}>
              <Flexbox
                horizontal
                align="center"
                className={cx('title-row', styles.titleRow)}
                gap={4}
                style={{ paddingRight: isHovered ? hoverPaddingRight : 36 }}
              >
                <span className={styles.title}>{displayTitle}</span>
                {heterogeneousLabel && (
                  <Tag size="small" style={{ flexShrink: 0, fontSize: 10 }}>
                    {heterogeneousLabel}
                  </Tag>
                )}
                {/* Actions — absolute inside title-row, aligned with name text */}
                <div className={styles.actions}>
                  {pinned && !isHovered && (
                    <ActionIcon
                      icon={PinIcon}
                      size={DESKTOP_HEADER_ICON_SMALL_SIZE}
                      style={{ opacity: 0.6 }}
                      title="已置顶"
                    />
                  )}
                  {isHovered && (
                    <>
                      {pinned && (
                        <ActionIcon
                          icon={PinIcon}
                          size={DESKTOP_HEADER_ICON_SMALL_SIZE}
                          style={{ opacity: 0.6 }}
                          title="已置顶"
                        />
                      )}
                      {isSelected && (
                        <>
                          <ActionIcon
                            icon={History}
                            size={DESKTOP_HEADER_ICON_SMALL_SIZE}
                            title="历史话题"
                            onClick={(e) =>
                              handleActionClick(e, () => setShowHistory(!showHistory))
                            }
                          />
                          <ActionIcon
                            icon={MessageSquarePlus}
                            size={DESKTOP_HEADER_ICON_SMALL_SIZE}
                            title="新建话题"
                            onClick={(e) => handleActionClick(e, openNewTopicOrSaveTopic)}
                          />
                        </>
                      )}
                      <ActionIcon
                        icon={ClipboardList}
                        size={DESKTOP_HEADER_ICON_SMALL_SIZE}
                        title="助手任务"
                        onClick={(e) => handleActionClick(e, () => openAgentTasksModal(id))}
                      />
                      <ActionIcon
                        icon={MoreVertical}
                        size={DESKTOP_HEADER_ICON_SMALL_SIZE}
                        title="更多操作"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          showContextMenu(dropdownMenu() as unknown as ContextMenuItem[]);
                        }}
                      />
                    </>
                  )}
                </div>
              </Flexbox>
              <Tooltip mouseEnterDelay={1} title={description}>
                <span className={styles.desc}>{description}</span>
              </Tooltip>
            </Flexbox>
          </Flexbox>
        </Flexbox>

      {/* History topic list inline */}
      {isSelected && showHistory && <SidebarTopicList agentId={id} />}
    </Flexbox>
  );
});

export default AgentItem;

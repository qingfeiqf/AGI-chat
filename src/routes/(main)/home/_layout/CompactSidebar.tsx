'use client';

import { DEFAULT_AVATAR, DEFAULT_INBOX_AVATAR, SESSION_CHAT_URL } from '@lobechat/const';
import { Flexbox, Tooltip } from '@lobehub/ui';
import { ActionIcon, Avatar } from '@lobehub/ui/base-ui';
import { createStaticStyles } from 'antd-style';
import isEqual from 'fast-deep-equal';
import { MessageSquarePlus, Settings } from 'lucide-react';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { getRouteById } from '@/config/routes';
import { DESKTOP_HEADER_ICON_SIZE } from '@/const/layoutTokens';
import { useActiveTabKey } from '@/hooks/useActiveTabKey';
import { useAgentStore } from '@/store/agent';
import { agentSelectors, builtinAgentSelectors } from '@/store/agent/selectors';
import { useChatStore } from '@/store/chat';
import { operationSelectors } from '@/store/chat/selectors';
import { useGlobalStore } from '@/store/global';
import { systemStatusSelectors } from '@/store/global/selectors';
import { SIDEBAR_SPACER_ID } from '@/store/global/selectors/systemStatus';

import { useAgentList } from './Body/Agent/List/useAgentList';

/** Route id → i18n key for compact sidebar tooltip labels */
const COMPACT_TOOLTIP_KEYS: Record<string, string> = {
  community: 'tab.community',
  image: 'tab.generation',
  memory: 'tab.memory',
  pages: 'tab.pages',
  resource: 'tab.resource',
  tasks: 'tab.tasks',
};

/** Sidebar item id → route id mapping (sidebar uses 'pages' but route uses 'page') */
const SIDEBAR_TO_ROUTE_ID: Record<string, string> = {
  community: 'community',
  image: 'image',
  memory: 'memory',
  pages: 'page',
  resource: 'resource',
  tasks: 'tasks',
};

const styles = createStaticStyles(({ css, cssVar }) => ({
  container: css`
    position: relative;

    align-items: center;

    width: 64px;
    height: 100%;
    padding-block: 16px;
    border-inline-end: 1px solid ${cssVar.colorBorderSecondary};

    background: ${cssVar.colorBgContainer};
  `,
  avatarWrapper: css`
    cursor: pointer;

    position: relative;

    display: inline-flex;

    margin-block: 6px;

    transition: transform 0.2s;

    &:hover {
      transform: scale(1.08);
    }
  `,
  badge: css`
    pointer-events: none;

    position: absolute;
    inset-block-start: -2px;
    inset-inline-end: -2px;

    width: 8px;
    height: 8px;
    border: 1.5px solid ${cssVar.colorBgContainer};
    border-radius: 999px;

    background: ${cssVar.colorError};
  `,
  activeDot: css`
    position: absolute;
    inset-block-start: 50%;
    inset-inline-start: -8px;
    transform: translateY(-50%);

    width: 4px;
    height: 16px;
    border-radius: 0 4px 4px 0;

    background: ${cssVar.colorPrimary};
  `,
  avatarList: css`
    /* Hide scrollbar */
    scrollbar-width: none;

    overflow-y: auto;
    flex: 1;
    align-items: center;

    width: 100%;
    margin-block-start: 12px;
    padding-inline: 4px;

    &::-webkit-scrollbar {
      display: none;
    }
  `,
  bottomMenu: css`
    gap: 12px;
    align-items: center;

    width: 100%;
    margin-block-start: auto;
    padding-block-start: 12px;
    border-block-start: 1px solid ${cssVar.colorBorderSecondary};
  `,
}));

const CompactSidebar = memo(() => {
  const { t } = useTranslation('common');
  const activeAgentId = useChatStore((s) => s.activeAgentId);
  const openNewTopicOrSaveTopic = useChatStore((s) => s.openNewTopicOrSaveTopic);
  const activeTab = useActiveTabKey();

  const inboxAgentId = useAgentStore(builtinAgentSelectors.inboxAgentId);
  const inboxMeta = useAgentStore(agentSelectors.getAgentMetaById(inboxAgentId!));
  const inboxAgentTitle = inboxMeta.title || '随便聊聊';
  const inboxAgentAvatar = inboxMeta.avatar || DEFAULT_INBOX_AVATAR;

  const { customList, pinnedList, defaultList } = useAgentList();

  // Read sidebar items and extract bottom items (after spacer) for dynamic icon order
  const [sidebarItems, hiddenSections] = useGlobalStore((s) => [
    systemStatusSelectors.sidebarItems(s),
    systemStatusSelectors.hiddenSidebarSections(s),
  ]);
  const bottomItemIds = useMemo(() => {
    const idx = sidebarItems.indexOf(SIDEBAR_SPACER_ID);
    if (idx === -1) return [];
    return sidebarItems.slice(idx + 1).filter((id) => !hiddenSections.includes(id));
  }, [sidebarItems, hiddenSections]);

  // Combine custom, pinned and default agent items into a single flat list
  const agents = useMemo(() => {
    const list: Array<{ id: string; avatar: string; title: string; backgroundColor?: string }> = [];

    // Builtin inbox agent at top
    if (inboxAgentId) {
      list.push({
        id: inboxAgentId,
        avatar: typeof inboxAgentAvatar === 'string' ? inboxAgentAvatar : DEFAULT_INBOX_AVATAR,
        title: inboxAgentTitle,
      });
    }

    // Combine pinned agents
    if (pinnedList) {
      pinnedList.forEach((item) => {
        if (item.type !== 'group') {
          list.push({
            id: item.id,
            avatar: typeof item.avatar === 'string' ? item.avatar : '',
            title: item.title || '',
            backgroundColor: item.backgroundColor || undefined,
          });
        }
      });
    }

    // Combine custom list (can contain nested items under .items, flat them out)
    if (customList) {
      customList.forEach((group) => {
        if (group.items) {
          group.items.forEach((item) => {
            list.push({
              id: item.id,
              avatar: typeof item.avatar === 'string' ? item.avatar : '',
              title: item.title || '',
              backgroundColor: item.backgroundColor || undefined,
            });
          });
        }
      });
    }

    // Default agents
    if (defaultList) {
      defaultList.forEach((item) => {
        if (item.type !== 'group') {
          list.push({
            id: item.id,
            avatar: typeof item.avatar === 'string' ? item.avatar : '',
            title: item.title || '',
            backgroundColor: item.backgroundColor || undefined,
          });
        }
      });
    }

    // Deduplicate list by id
    const seen = new Set<string>();
    return list.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [inboxAgentId, inboxAgentAvatar, inboxAgentTitle, pinnedList, customList, defaultList]);

  const handleNewTopic = () => {
    openNewTopicOrSaveTopic();
  };

  return (
    <Flexbox className={styles.container} direction="vertical" gap={12}>
      {/* New Topic Action Icon */}
      <Tooltip placement="right" title={t('navPanel.newTopic' as any)}>
        <ActionIcon
          icon={MessageSquarePlus}
          size={DESKTOP_HEADER_ICON_SIZE}
          onClick={handleNewTopic}
        />
      </Tooltip>

      {/* Agent Avatar List */}
      <Flexbox className={styles.avatarList} direction="vertical">
        {agents.map((agent) => {
          const isSelected = activeAgentId === agent.id && activeTab === 'home';
          const agentUrl = SESSION_CHAT_URL(agent.id, false);

          return (
            <AgentAvatarItem
              agent={agent}
              agentUrl={agentUrl}
              isSelected={isSelected}
              key={agent.id}
            />
          );
        })}
      </Flexbox>

      {/* Bottom Menu Buttons — dynamic order from sidebar customization */}
      <Flexbox className={styles.bottomMenu} direction="vertical">
        {bottomItemIds.map((id) => {
          const routeId = SIDEBAR_TO_ROUTE_ID[id];
          const route = routeId ? getRouteById(routeId) : undefined;
          if (!route) return null;

          const tooltipKey = COMPACT_TOOLTIP_KEYS[id];
          const label = tooltipKey ? t(tooltipKey as any) : id;
          const isActive = activeTab === route.id || (route.id === 'page' && activeTab === 'pages');

          return (
            <Tooltip key={id} placement="right" title={label}>
              <Link to={route.path}>
                <ActionIcon active={isActive} icon={route.icon} size={DESKTOP_HEADER_ICON_SIZE} />
              </Link>
            </Tooltip>
          );
        })}
        <Tooltip placement="right" title={t('tab.setting' as any)}>
          <Link to="/settings">
            <ActionIcon
              active={activeTab === 'settings'}
              icon={Settings}
              size={DESKTOP_HEADER_ICON_SIZE}
            />
          </Link>
        </Tooltip>
      </Flexbox>
    </Flexbox>
  );
});

CompactSidebar.displayName = 'CompactSidebar';

interface AgentAvatarItemProps {
  agent: { id: string; avatar: string; title: string; backgroundColor?: string };
  agentUrl: string;
  isSelected: boolean;
}

const AgentAvatarItem = memo<AgentAvatarItemProps>(({ agent, isSelected, agentUrl }) => {
  const unreadCount = useChatStore(operationSelectors.agentUnreadCount(agent.id));
  const storeMeta = useAgentStore((s) => agentSelectors.getAgentMetaById(agent.id)(s), isEqual);
  const avatar = storeMeta.avatar || agent.avatar;
  const backgroundColor = storeMeta.backgroundColor || agent.backgroundColor;
  const title = storeMeta.title || agent.title;

  return (
    <Tooltip placement="right" title={title}>
      <Link className={styles.avatarWrapper} to={agentUrl}>
        {isSelected && <span className={styles.activeDot} />}
        <Avatar
          avatar={avatar || DEFAULT_AVATAR}
          background={backgroundColor}
          shape="circle"
          size={32}
        />
        {unreadCount > 0 && <span className={styles.badge} />}
      </Link>
    </Tooltip>
  );
});

AgentAvatarItem.displayName = 'AgentAvatarItem';

export default CompactSidebar;

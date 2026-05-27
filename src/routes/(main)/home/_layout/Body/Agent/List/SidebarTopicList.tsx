'use client';

import { type ChatTopic } from '@lobechat/types';
import { Flexbox, Icon } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import { ChevronDown, ChevronRight, Heart, MessageSquareDot } from 'lucide-react';
import type { MouseEvent } from 'react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useChatStore } from '@/store/chat';
import { topicSelectors } from '@/store/chat/selectors';

/* ─────────────────────────── styles ─────────────────────────── */
const useStyles = createStyles(({ css, cssVar }) => ({
  wrapper: css`
    padding-block: 4px 0;
    padding-inline: 0;
  `,
  scrollArea: css`
    overflow: hidden auto;
    max-height: 310px;
    padding-block-end: 8px;

    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-thumb {
      border-radius: 2px;
      background: ${cssVar.colorFill};
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }
  `,
  defaultTopic: css`
    cursor: pointer;

    display: flex;
    gap: 8px;
    align-items: center;

    margin-block: 4px 8px;
    margin-inline: 8px;
    padding-block: 8px;
    padding-inline: 12px;
    border: 1px solid transparent;
    border-radius: 8px;

    font-size: 13px;
    color: ${cssVar.colorTextSecondary};

    background: transparent;

    transition: all 0.15s ease;

    &:hover {
      color: ${cssVar.colorText};
      background: ${cssVar.colorFillSecondary};
    }
  `,
  defaultTopicActive: css`
    border-color: ${cssVar.colorBorderSecondary} !important;
    color: ${cssVar.colorText} !important;
    background: ${cssVar.colorBgContainer} !important;
    box-shadow: 0 1px 3px rgb(0 0 0 / 5%);
  `,
  tempTag: css`
    flex-shrink: 0;

    margin-inline-start: auto;
    padding-block: 1px;
    padding-inline: 6px;
    border-radius: 4px;

    font-size: 11px;
    color: ${cssVar.colorTextDescription};

    background: ${cssVar.colorFillSecondary};
  `,
  // collapsible group header
  groupHeader: css`
    cursor: pointer;
    user-select: none;

    display: flex;
    gap: 4px;
    align-items: center;

    padding-block: 6px 2px;
    padding-inline: 12px;

    font-size: 11px;
    font-weight: 500;
    color: ${cssVar.colorTextDescription};
    letter-spacing: 0.03em;

    transition: color 0.15s;

    &:hover {
      color: ${cssVar.colorTextSecondary};
    }
  `,
  groupChevron: css`
    flex-shrink: 0;
    opacity: 0.6;
  `,
  // individual topic row
  topicRow: css`
    cursor: pointer;

    display: flex;
    gap: 8px;
    align-items: center;

    margin-block: 4px;
    margin-inline: 8px;
    padding-block: 8px;
    padding-inline: 12px;
    border: 1px solid transparent;
    border-radius: 8px;

    font-size: 13px;
    color: ${cssVar.colorTextSecondary};

    background: transparent;

    transition: all 0.15s ease;

    &:hover {
      color: ${cssVar.colorText};
      background: ${cssVar.colorFillSecondary};
    }
  `,
  topicRowActive: css`
    border-color: ${cssVar.colorBorderSecondary} !important;

    font-weight: 500;
    color: ${cssVar.colorText} !important;

    background: ${cssVar.colorBgContainer} !important;
    box-shadow: 0 1px 3px rgb(0 0 0 / 5%);
  `,
  favoriteIcon: css`
    cursor: pointer;
    flex-shrink: 0;
    color: ${cssVar.colorTextQuaternary};
    transition: color 0.15s;

    &:hover {
      transform: scale(1.15);
      color: ${cssVar.colorError};
    }
  `,
  favoriteIconActive: css`
    color: ${cssVar.colorError};

    &:hover {
      opacity: 0.7;
    }
  `,
  topicTitle: css`
    overflow: hidden;
    flex: 1;

    min-width: 0;

    text-overflow: ellipsis;
    white-space: nowrap;
  `,
}));

/* ─────────────────────────── helpers ─────────────────────────── */
function getDateLabel(date: Date | string | number): string {
  const d = new Date(date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86_400_000);
  const topicDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (topicDay.getTime() === today.getTime()) return '今天';
  if (topicDay.getTime() === yesterday.getTime()) return '昨天';

  const diffDays = Math.round((today.getTime() - topicDay.getTime()) / 86_400_000);
  if (diffDays <= 7) return '本周';
  if (diffDays <= 30) return '本月';

  return `${d.getMonth() + 1}月`;
}

// Group order: today -> yesterday -> week -> month -> older
const GROUP_ORDER: Record<string, number> = {
  今天: 0,
  昨天: 1,
  本周: 2,
  本月: 3,
};

function getTimeGroups(topics: ChatTopic[]): { label: string; items: ChatTopic[] }[] {
  const map = new Map<string, ChatTopic[]>();
  for (const t of topics) {
    const label = t.updatedAt ? getDateLabel(t.updatedAt) : '更早';
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(t);
  }
  return [...map.entries()]
    .map(([label, items]) => ({ label, items }))
    .sort((a, b) => {
      const oa = GROUP_ORDER[a.label] ?? 99;
      const ob = GROUP_ORDER[b.label] ?? 99;
      return oa - ob;
    });
}

/* ─────────────────────────── Collapsible Group ─────────────────────────── */
const GROUP_BATCH_SIZE = 15;

interface CollapsibleGroupProps {
  activeTopicId: string | null;
  cx: ReturnType<typeof useStyles>['cx'];
  defaultOpen?: boolean;
  isAgentActive: boolean;
  items: ChatTopic[];
  label: string;
  onFavoriteToggle: (topicId: string, favorite: boolean, e: MouseEvent) => void;
  onSwitch: (topicId: string | null, e?: MouseEvent) => void;
  styles: ReturnType<typeof useStyles>['styles'];
}

const CollapsibleGroup = memo<CollapsibleGroupProps>(
  ({
    label,
    items,
    defaultOpen = true,
    onFavoriteToggle,
    onSwitch,
    activeTopicId,
    isAgentActive,
    styles,
    cx,
  }) => {
    const [open, setOpen] = useState(defaultOpen);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const [visibleCount, setVisibleCount] = useState(GROUP_BATCH_SIZE);

    // Reset when items change
    useEffect(() => {
      setVisibleCount(Math.min(GROUP_BATCH_SIZE, items.length));
    }, [items.length]);

    const loadMore = useCallback(() => {
      setVisibleCount((prev) => Math.min(prev + GROUP_BATCH_SIZE, items.length));
    }, [items.length]);

    // IntersectionObserver for lazy loading within this group
    useEffect(() => {
      if (!open) return;
      const sentinel = sentinelRef.current;
      if (!sentinel) return;

      let scrollParent = sentinel.parentElement;
      while (scrollParent) {
        const style = window.getComputedStyle(scrollParent);
        if (style.overflowY === 'auto' || style.overflowY === 'scroll') break;
        scrollParent = scrollParent.parentElement;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) loadMore();
        },
        { root: scrollParent, rootMargin: '100px' },
      );

      observer.observe(sentinel);
      return () => observer.disconnect();
    }, [open, loadMore]);

    const hasMore = visibleCount < items.length;
    const visibleItems = open ? items.slice(0, visibleCount) : [];

    return (
      <div>
        <div className={styles.groupHeader} onClick={() => setOpen((v) => !v)}>
          <Icon
            className={styles.groupChevron}
            icon={open ? ChevronDown : ChevronRight}
            size={12}
          />
          <span>{label}</span>
        </div>
        {visibleItems.map((topic) => {
          const isActive = isAgentActive && activeTopicId === topic.id;
          return (
            <div
              className={cx(styles.topicRow, isActive && styles.topicRowActive)}
              key={topic.id}
              onClick={(e) => onSwitch(topic.id, e)}
            >
              <Icon
                icon={Heart}
                size={13}
                className={cx(styles.favoriteIcon, topic.favorite && styles.favoriteIconActive)}
                onClick={(e) => onFavoriteToggle(topic.id, !topic.favorite, e)}
              />
              <span className={styles.topicTitle}>{topic.title || '未命名话题'}</span>
            </div>
          );
        })}
        {open && hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}
      </div>
    );
  },
);

CollapsibleGroup.displayName = 'CollapsibleGroup';

/* ─────────────────────────── component ─────────────────────────── */
interface SidebarTopicListProps {
  agentId: string;
}

const SidebarTopicList = memo<SidebarTopicListProps>(({ agentId }) => {
  const { styles, cx } = useStyles();
  const { t } = useTranslation('topic');

  const useFetchTopics = useChatStore((s) => s.useFetchTopics);
  useFetchTopics(true, { agentId });

  const activeAgentId = useChatStore((s) => s.activeAgentId);
  const activeTopicId = useChatStore((s) => s.activeTopicId);
  const switchTopic = useChatStore((s) => s.switchTopic);
  const favoriteTopic = useChatStore((s) => s.favoriteTopic);

  const topics = useChatStore(topicSelectors.getTopicsByAgentId(agentId)) || [];
  const isAgentActive = activeAgentId === agentId;

  const handleSwitch = useCallback(
    (topicId: string | null, e?: MouseEvent) => {
      e?.stopPropagation();
      switchTopic(topicId);
    },
    [switchTopic],
  );

  const handleFavoriteToggle = useCallback(
    (topicId: string, favorite: boolean, e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      favoriteTopic(topicId, favorite);
    },
    [favoriteTopic],
  );

  // Split into favorites and non-favorites
  const { favTopics, unfavTopics } = useMemo(() => {
    const fav: ChatTopic[] = [];
    const unfav: ChatTopic[] = [];
    for (const t of topics) {
      if (t.favorite) fav.push(t);
      else unfav.push(t);
    }
    return { favTopics: fav, unfavTopics: unfav };
  }, [topics]);

  const timeGroups = useMemo(() => getTimeGroups(unfavTopics), [unfavTopics]);

  const isAgentActiveNoTopic = isAgentActive && !activeTopicId;

  return (
    <Flexbox className={styles.wrapper} direction="vertical">
      {/* Default / current temporary topic — always visible */}
      <div
        className={cx(styles.defaultTopic, isAgentActiveNoTopic && styles.defaultTopicActive)}
        onClick={(e) => handleSwitch(null, e)}
      >
        <Icon icon={MessageSquareDot} size={14} style={{ flexShrink: 0 }} />
        <span
          style={{
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          默认话题
        </span>
        <span className={styles.tempTag}>临时</span>
      </div>

      {/* Scrollable topic groups — max ~7 rows visible */}
      <div className={styles.scrollArea}>
        {/* Favorites group */}
        {favTopics.length > 0 && (
          <CollapsibleGroup
            activeTopicId={activeTopicId}
            cx={cx}
            defaultOpen={true}
            isAgentActive={isAgentActive}
            items={favTopics}
            label={t('favorite')}
            styles={styles}
            onFavoriteToggle={handleFavoriteToggle}
            onSwitch={handleSwitch}
          />
        )}

        {/* Time groups */}
        {timeGroups.map(({ label, items }) => (
          <CollapsibleGroup
            activeTopicId={activeTopicId}
            cx={cx}
            defaultOpen={true}
            isAgentActive={isAgentActive}
            items={items}
            key={label}
            label={label}
            styles={styles}
            onFavoriteToggle={handleFavoriteToggle}
            onSwitch={handleSwitch}
          />
        ))}
      </div>
    </Flexbox>
  );
});

SidebarTopicList.displayName = 'SidebarTopicList';

export default SidebarTopicList;

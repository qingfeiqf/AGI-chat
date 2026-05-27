import { type SidebarAgentItem } from '@lobechat/types';
import { Flexbox } from '@lobehub/ui';
import { type CSSProperties } from 'react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import GroupItem from './AgentGroupItem';
import AgentItem from './AgentItem';

const INITIAL_BATCH = 10;
const BATCH_SIZE = 10;

interface SessionListProps {
  dataSource: SidebarAgentItem[];
  itemClassName?: string;
  itemStyle?: CSSProperties;
}

const List = memo<SessionListProps>(({ dataSource, itemStyle, itemClassName }) => {
  const isEmpty = useMemo(() => dataSource.length === 0, [dataSource.length]);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH);

  // Reset visible count when dataSource changes (e.g. filter, reorder)
  useEffect(() => {
    setVisibleCount(Math.min(INITIAL_BATCH, dataSource.length));
  }, [dataSource.length]);

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, dataSource.length));
  }, [dataSource.length]);

  // IntersectionObserver: load more when sentinel enters viewport
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    // Find the scroll container (ScrollShadow wrapper)
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
      { root: scrollParent, rootMargin: '200px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  const hasMore = visibleCount < dataSource.length;
  const visibleItems = dataSource.slice(0, visibleCount);

  if (isEmpty) return null;

  return (
    <Flexbox gap={1}>
      {visibleItems.map((item) =>
        item.type === 'group' ? (
          <GroupItem className={itemClassName} item={item} key={item.id} style={itemStyle} />
        ) : (
          <AgentItem className={itemClassName} item={item} key={item.id} style={itemStyle} />
        ),
      )}
      {hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}
    </Flexbox>
  );
});

export default List;

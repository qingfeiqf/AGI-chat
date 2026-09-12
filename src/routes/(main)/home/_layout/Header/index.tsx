'use client';

import { Flexbox, Icon } from '@lobehub/ui';
import { ActionIcon } from '@lobehub/ui/base-ui';
import { createStaticStyles } from 'antd-style';
import { Home, MessageSquarePlus, PanelLeftClose, Search } from 'lucide-react';
import { memo } from 'react';
import { useNavigate } from 'react-router';

import { DESKTOP_HEADER_ICON_SMALL_SIZE } from '@/const/layoutTokens';
import { useChatStore } from '@/store/chat';
import { useGlobalStore } from '@/store/global';

const styles = createStaticStyles(({ css, cssVar }) => ({
  container: css`
    padding-block: 12px 8px;
    padding-inline: 12px 8px;
    border-block-end: 1px solid ${cssVar.colorBorderSecondary};
    background: ${cssVar.colorBgContainer};
  `,
  searchBar: css`
    cursor: pointer;

    overflow: hidden;
    flex: 1;

    min-width: 0;
    height: 34px;
    padding-inline: 10px;
    border: 1px solid ${cssVar.colorBorderSecondary};
    border-radius: 8px;

    font-size: 13px;
    color: ${cssVar.colorTextPlaceholder};

    background: ${cssVar.colorFillTertiary};

    transition: all 0.2s ${cssVar.motionEaseInOut};

    &:hover {
      border-color: ${cssVar.colorBorder};
      background: ${cssVar.colorFillSecondary};
    }
  `,
  searchLabel: css`
    overflow: hidden;
    flex: 1;

    min-width: 0;

    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  hotkey: css`
    flex-shrink: 0;

    padding-block: 1px;
    padding-inline: 5px;
    border: 1px solid ${cssVar.colorBorderSecondary};
    border-radius: 4px;

    font-size: 11px;
    color: ${cssVar.colorTextDescription};
    white-space: nowrap;

    background: ${cssVar.colorBgContainer};
  `,
}));

const Header = memo(() => {
  const navigate = useNavigate();
  const toggleCommandMenu = useGlobalStore((s) => s.toggleCommandMenu);
  const togglePanel = useGlobalStore((s) => s.toggleLeftPanel);
  const openNewTopicOrSaveTopic = useChatStore((s) => s.openNewTopicOrSaveTopic);

  return (
    <Flexbox horizontal align="center" className={styles.container} gap={4} width="100%">
      {/* Home Button */}
      <ActionIcon
        icon={Home}
        size={DESKTOP_HEADER_ICON_SMALL_SIZE}
        style={{ flexShrink: 0 }}
        title="返回首页"
        onClick={() => navigate('/')}
      />

      {/* Mock Search Input */}
      <Flexbox
        horizontal
        align="center"
        className={styles.searchBar}
        gap={6}
        justify="space-between"
        onClick={() => toggleCommandMenu(true)}
      >
        <Flexbox horizontal align="center" gap={5} style={{ minWidth: 0, flex: 1 }}>
          <Icon icon={Search} size={13} style={{ flexShrink: 0 }} />
          <span className={styles.searchLabel}>搜索助手...</span>
        </Flexbox>
        <span className={styles.hotkey}>⌘K</span>
      </Flexbox>

      {/* New Topic */}
      <ActionIcon
        icon={MessageSquarePlus}
        size={DESKTOP_HEADER_ICON_SMALL_SIZE}
        style={{ flexShrink: 0 }}
        title="新建话题"
        onClick={openNewTopicOrSaveTopic}
      />

      {/* Collapse sidebar button */}
      <ActionIcon
        icon={PanelLeftClose}
        size={DESKTOP_HEADER_ICON_SMALL_SIZE}
        style={{ flexShrink: 0 }}
        title="收起助手列表"
        onClick={() => togglePanel(false)}
      />
    </Flexbox>
  );
});

export default Header;

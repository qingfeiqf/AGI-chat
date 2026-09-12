'use client';

import { Flexbox, Icon } from '@lobehub/ui';
import { Text } from '@lobehub/ui/base-ui';
import type { BreadcrumbProps } from 'antd';
import { Breadcrumb } from 'antd';
import { createStaticStyles } from 'antd-style';
import { ChevronRightIcon, HomeIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { memo, useMemo } from 'react';

import { DESKTOP_HEADER_ICON_SMALL_SIZE } from '@/const/layoutTokens';
import { useWorkspaceAwareNavigate } from '@/features/Workspace/useWorkspaceAwareNavigate';

import BackButton from './components/BackButton';
import ToggleLeftPanelButton from './ToggleLeftPanelButton';

const prefixCls = 'ant';

const styles = createStaticStyles(({ css, cssVar }) => ({
  breadcrumb: css`
    ol {
      align-items: center;
    }
    .${prefixCls}-breadcrumb-separator {
      margin-inline: 4px;
    }
    .${prefixCls}-breadcrumb-link {
      display: flex !important;
      align-items: center !important;
      font-size: 12px;
      color: ${cssVar.colorTextDescription};
    }
    a.${prefixCls}-breadcrumb-link {
      cursor: pointer;

      &:hover {
        color: ${cssVar.colorText};
      }
    }
  `,
  container: css`
    overflow: hidden;
  `,
}));

type BreadcrumbItem = NonNullable<BreadcrumbProps['items']>[number];

interface SideBarHeaderLayoutProps {
  backTo?: string;
  breadcrumb?: BreadcrumbProps['items'];
  /** Override the leading home breadcrumb item (defaults to home icon → `/`). */
  homeItem?: BreadcrumbItem;
  left?: ReactNode;
  right?: ReactNode;
  showBack?: boolean;
  showTogglePanelButton?: boolean;
}

const SideBarHeaderLayout = memo<SideBarHeaderLayoutProps>(
  ({
    left,
    right,
    backTo = '/',
    showBack = true,
    breadcrumb = [],
    homeItem,
    showTogglePanelButton = true,
  }) => {
    const navigate = useWorkspaceAwareNavigate();

    const breadcrumbItems = useMemo(
      () =>
        [
          homeItem ?? {
            href: '/',
            title: <Icon icon={HomeIcon} />,
          },
          ...breadcrumb,
        ].map((item) => ({
          ...item,
          onClick: item.href
            ? (e: React.MouseEvent<HTMLElement>) => {
                e.preventDefault();
                navigate(item.href!);
              }
            : undefined,
        })),
      [homeItem, breadcrumb, navigate],
    );

    const leftContent = left ? (
      <Flexbox
        horizontal
        align={'center'}
        flex={1}
        gap={2}
        style={{
          overflow: 'hidden',
        }}
      >
        {showBack && <BackButton size={DESKTOP_HEADER_ICON_SMALL_SIZE} to={backTo} />}
        {left && typeof left === 'string' ? (
          <Text ellipsis fontSize={16} weight={500}>
            {left}
          </Text>
        ) : (
          left
        )}
      </Flexbox>
    ) : (
      <Flexbox flex={1} paddingInline={6}>
        <Breadcrumb
          className={styles.breadcrumb}
          items={breadcrumbItems}
          separator={<Icon icon={ChevronRightIcon} />}
        />
      </Flexbox>
    );

    return (
      <Flexbox
        horizontal
        align={'center'}
        className={styles.container}
        flex={'none'}
        justify={'space-between'}
        padding={'8px 6px'}
      >
        {leftContent}
        <Flexbox horizontal align={'center'} gap={2} justify={'flex-end'}>
          {showTogglePanelButton && <ToggleLeftPanelButton />}
          {right}
        </Flexbox>
      </Flexbox>
    );
  },
);

export default SideBarHeaderLayout;

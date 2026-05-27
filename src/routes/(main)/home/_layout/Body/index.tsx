'use client';

import type { MenuProps } from '@lobehub/ui';
import { Accordion, Flexbox, Icon } from '@lobehub/ui';
import { EyeOffIcon, SlidersHorizontalIcon } from 'lucide-react';
import type { Key, ReactElement } from 'react';
import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useActiveTabKey } from '@/hooks/useActiveTabKey';
import Recents from '@/routes/(main)/home/features/Recents';
import { useGlobalStore } from '@/store/global';
import { systemStatusSelectors } from '@/store/global/selectors';

import Agent from './Agent';
import { openCustomizeSidebarModal } from './CustomizeSidebarModal';

export enum GroupKey {
  Agent = 'agent',
  Community = 'community',
  Pages = 'pages',
  Project = 'project',
  Recents = 'recents',
  Resource = 'resource',
}

const ACCORDION_KEYS = new Set<string>([GroupKey.Recents, GroupKey.Agent]);

/** Keys rendered in the header — must be excluded from the body to avoid duplicates
 * when migrating users whose persisted sidebarItems still include them. */
const HEADER_KEYS = new Set<string>(['home', 'search']);

/** Items now rendered in the footer bar — excluded from the body. */
const FOOTER_KEYS = new Set<string>(['tasks', 'pages', 'image', 'community', 'resource', 'memory']);

const accordionComponents: Record<string, (key: string) => ReactElement> = {
  [GroupKey.Agent]: (key) => <Agent itemKey={key} key={key} />,
  [GroupKey.Recents]: (key) => <Recents itemKey={key} key={key} />,
};

const mergeSidebarExpandedKeys = (
  currentKeys: string[],
  accordionKeys: string[],
  expandedKeys: Key[],
): string[] => {
  const nextExpandedKeys = new Set(expandedKeys.map(String));
  const accordionKeySet = new Set(accordionKeys);
  const nextKeys = currentKeys.filter((key) => !accordionKeySet.has(key));

  for (const key of accordionKeys) {
    if (nextExpandedKeys.has(key)) nextKeys.push(key);
  }

  return nextKeys;
};

const Body = memo(() => {
  const { t } = useTranslation('common');
  const tab = useActiveTabKey();
  const sidebarItems = useGlobalStore(systemStatusSelectors.sidebarItems);
  const sidebarExpandedKeys = useGlobalStore(systemStatusSelectors.sidebarExpandedKeys);
  const hiddenSections = useGlobalStore(systemStatusSelectors.hiddenSidebarSections);
  const updateSystemStatus = useGlobalStore((s) => s.updateSystemStatus);

  const hideSection = useCallback(
    (key: string) => {
      updateSystemStatus({ hiddenSidebarSections: [...hiddenSections, key] });
    },
    [hiddenSections, updateSystemStatus],
  );

  const getContextMenuItems = useCallback(
    (key: string): MenuProps['items'] => [
      {
        icon: <Icon icon={EyeOffIcon} />,
        key: 'hideSection',
        label: t('navPanel.hideSection'),
        onClick: () => hideSection(key),
      },
      { type: 'divider' as const },
      {
        icon: <Icon icon={SlidersHorizontalIcon} />,
        key: 'customizeSidebar',
        label: t('navPanel.customizeSidebar'),
        onClick: () => openCustomizeSidebarModal(),
      },
    ],
    [t, hideSection],
  );

  const handleAccordionExpandedChange = useCallback(
    (accordionKeys: string[], expandedKeys: Key[]) => {
      updateSystemStatus({
        sidebarExpandedKeys: mergeSidebarExpandedKeys(
          sidebarExpandedKeys,
          accordionKeys,
          expandedKeys,
        ),
      });
    },
    [sidebarExpandedKeys, updateSystemStatus],
  );

  // Render only accordion sections — footer items are now in the bottom bar
  const content = useMemo(() => {
    const elements: ReactElement[] = [];
    const accGroup: { element: ReactElement; key: string }[] = [];

    const visibleKeys = sidebarItems.filter(
      (k) =>
        !HEADER_KEYS.has(k) &&
        !FOOTER_KEYS.has(k) &&
        (k === GroupKey.Agent || !hiddenSections.includes(k)),
    );

    for (const key of visibleKeys) {
      if (ACCORDION_KEYS.has(key)) {
        const comp = accordionComponents[key]?.(key);
        if (comp) accGroup.push({ element: comp, key });
      }
    }

    if (accGroup.length > 0) {
      const accordionKeys = accGroup.map((item) => item.key);
      elements.push(
        <Accordion
          expandedKeys={sidebarExpandedKeys}
          gap={8}
          key="body-accordion"
          onExpandedChange={(keys) => handleAccordionExpandedChange(accordionKeys, keys)}
        >
          {accGroup.map((item) => item.element)}
        </Accordion>,
      );
    }

    return elements;
  }, [sidebarItems, hiddenSections, sidebarExpandedKeys, handleAccordionExpandedChange]);

  return (
    <Flexbox flex={1} gap={1} paddingInline={4} style={{ minHeight: '100%' }}>
      {content}
    </Flexbox>
  );
});

export default Body;

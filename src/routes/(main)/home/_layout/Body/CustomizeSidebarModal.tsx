'use client';

import {
  defaultDropAnimationSideEffects,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Flexbox, Icon, Tooltip } from '@lobehub/ui';
import { ActionIcon, Button, Text } from '@lobehub/ui/base-ui';
import { createModal, type ModalInstance } from '@lobehub/ui/base-ui';
import { createStaticStyles, cssVar, cx } from 'antd-style';
import { t } from 'i18next';
import { Eye, EyeOff, GripVertical, PinIcon, RotateCcw } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import { useActiveWorkspaceId } from '@/business/client/hooks/useActiveWorkspaceId';
import { useActiveWorkspaceSlug } from '@/business/client/hooks/useActiveWorkspaceSlug';
import { getRouteById } from '@/config/routes';
import { useGlobalStore } from '@/store/global';
import { systemStatusSelectors } from '@/store/global/selectors';
import { SIDEBAR_ACCORDION_KEYS, SIDEBAR_SPACER_ID } from '@/store/global/selectors/systemStatus';

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

const ACCORDION_GROUP_ID = 'accordion-group';

export interface SidebarItemConfig {
  alwaysVisible?: boolean;
  id: string;
  labelKey: string;
  routeId?: string;
}

const ALL_SIDEBAR_ITEMS: SidebarItemConfig[] = [
  { id: 'tasks', labelKey: 'tab.tasks', routeId: 'tasks' },
  { id: 'pages', labelKey: 'tab.pages', routeId: 'page' },
  { id: 'recents', labelKey: 'recents' },
  { id: 'private', labelKey: 'navPanel.privateAgents' },
  { alwaysVisible: true, id: 'agent', labelKey: 'navPanel.agent' },
  { id: 'image', labelKey: 'tab.generation', routeId: 'image' },
  { id: 'community', labelKey: 'tab.community', routeId: 'community' },
  { id: 'resource', labelKey: 'tab.resource', routeId: 'resource' },
  { id: 'memory', labelKey: 'tab.memory', routeId: 'memory' },
];

const ITEM_MAP = new Map(ALL_SIDEBAR_ITEMS.map((item) => [item.id, item]));

// Private is workspace-only; in personal mode every row is implicitly
// owner-private, so hide it from the customizer where toggling it on
// would render an empty accordion no user can populate.
export const getAvailableSidebarItems = (isWorkspaceMode: boolean): SidebarItemConfig[] =>
  ALL_SIDEBAR_ITEMS.filter((item) => {
    if (isWorkspaceMode && item.id === 'memory') return false;
    if (!isWorkspaceMode && item.id === 'private') return false;
    return true;
  });

export const getSortableSidebarItemIds = (isWorkspaceMode: boolean): Set<string> =>
  new Set([...getAvailableSidebarItems(isWorkspaceMode).map((item) => item.id), SIDEBAR_SPACER_ID]);

const isAccordionKey = (id: string) => SIDEBAR_ACCORDION_KEYS.has(id);

/** Split items array into top (before spacer) and bottom (after spacer). */
const splitBySpacer = (items: string[]): { top: string[]; bottom: string[] } => {
  const idx = items.indexOf(SIDEBAR_SPACER_ID);
  if (idx === -1) return { bottom: [], top: items };
  return {
    bottom: items.slice(idx + 1),
    top: items.slice(0, idx),
  };
};

/** Merge top + spacer + bottom back into a single items array. */
const mergeWithSpacer = (top: string[], bottom: string[]): string[] => [
  ...top,
  SIDEBAR_SPACER_ID,
  ...bottom,
];

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = createStaticStyles(({ css }) => ({
  accordionGroup: css`
    margin-inline: -5px;
    padding: 4px;
    border: 1px dashed ${cssVar.colorBorderSecondary};
    border-radius: ${cssVar.borderRadius};
  `,
  item: css`
    height: 40px;
    padding-inline: 8px;
    border-radius: ${cssVar.borderRadius};
    transition: background 0.2s ease-in-out;

    &:hover {
      background: ${cssVar.colorFillTertiary};
    }
  `,
  itemDragging: css`
    opacity: 0;
  `,
  overlay: css`
    height: 40px;
    padding-inline: 8px;
    border-radius: ${cssVar.borderRadius};

    background: ${cssVar.colorBgElevated};
    box-shadow: ${cssVar.boxShadowSecondary};
  `,
  spacerLine: css`
    flex: 1;
    block-size: 1px;
    background: ${cssVar.colorBorderSecondary};
  `,
}));

// ---------------------------------------------------------------------------
// SortableItem
// ---------------------------------------------------------------------------

const SortableItem = memo<{
  hiddenSections: string[];
  id: string;
  onToggle: (key: string) => void;
}>(({ id, hiddenSections, onToggle }) => {
  const { t } = useTranslation('common');
  const item = ITEM_MAP.get(id);
  const {
    attributes,
    isDragging,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  if (!item) return null;

  const route = item.routeId ? getRouteById(item.routeId) : undefined;
  const isHidden = !item.alwaysVisible && hiddenSections.includes(id);

  return (
    <Flexbox
      horizontal
      align={'center'}
      className={isDragging ? cx(styles.item, styles.itemDragging) : styles.item}
      gap={4}
      justify={'space-between'}
      ref={setNodeRef}
      style={{
        opacity: isHidden && !isDragging ? 0.5 : undefined,
        transform: CSS.Translate.toString(transform),
        transition,
      }}
      {...attributes}
    >
      <Flexbox horizontal align={'center'} gap={8}>
        <Flexbox
          ref={setActivatorNodeRef}
          style={{ cursor: isDragging ? 'grabbing' : 'grab', flexShrink: 0, touchAction: 'none' }}
          {...listeners}
        >
          <Icon icon={GripVertical} size={14} style={{ color: cssVar.colorTextQuaternary }} />
        </Flexbox>
        {route?.icon && <Icon icon={route.icon} size={18} />}
        <Text>{t(item.labelKey as any)}</Text>
      </Flexbox>
      {item.alwaysVisible ? (
        <Tooltip title={t('navPanel.pinned' as any)}>
          <ActionIcon icon={PinIcon} size={'small'} style={{ cursor: 'default', opacity: 0.45 }} />
        </Tooltip>
      ) : (
        <Tooltip title={t(isHidden ? ('navPanel.hidden' as any) : ('navPanel.visible' as any))}>
          <ActionIcon icon={isHidden ? EyeOff : Eye} size={'small'} onClick={() => onToggle(id)} />
        </Tooltip>
      )}
    </Flexbox>
  );
});

// ---------------------------------------------------------------------------
// SpacerDivider — non-draggable static divider line
// ---------------------------------------------------------------------------

const SpacerDivider = memo(() => {
  const { t } = useTranslation('common');

  return (
    <Flexbox
      horizontal
      align={'center'}
      className={styles.item}
      gap={8}
      style={{ cursor: 'default' }}
    >
      <div className={styles.spacerLine} />
      <Text style={{ fontSize: 12 }} type={'secondary'}>
        {t('navPanel.bottomDivider' as any)}
      </Text>
      <div className={styles.spacerLine} />
    </Flexbox>
  );
});

// ---------------------------------------------------------------------------
// AccordionGroup — a non-draggable slot that wraps a nested SortableContext
// for accordion items. Registers with useSortable so other top items can
// reorder relative to its position.
// ---------------------------------------------------------------------------

const AccordionGroup = memo<{ children: React.ReactNode }>(({ children }) => {
  const { setNodeRef, transform, transition } = useSortable({ id: ACCORDION_GROUP_ID });

  return (
    <div
      className={styles.accordionGroup}
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
      }}
    >
      <Flexbox gap={2}>{children}</Flexbox>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Drag overlay items (static, no sortable hooks)
// ---------------------------------------------------------------------------

const OverlayItem = memo<{ id: string }>(({ id }) => {
  const { t } = useTranslation('common');

  if (id === ACCORDION_GROUP_ID) {
    return (
      <Flexbox horizontal align={'center'} className={styles.overlay} gap={8}>
        <Icon icon={GripVertical} size={14} style={{ color: cssVar.colorTextQuaternary }} />
        <Text>{t('navPanel.agent' as any)}</Text>
        <Text type={'secondary'}>+ {t('recents' as any)}</Text>
      </Flexbox>
    );
  }

  const item = ITEM_MAP.get(id);
  if (!item) return null;
  const route = item.routeId ? getRouteById(item.routeId) : undefined;

  return (
    <Flexbox horizontal align={'center'} className={styles.overlay} gap={8}>
      <Icon icon={GripVertical} size={14} style={{ color: cssVar.colorTextQuaternary }} />
      {route?.icon && <Icon icon={route.icon} size={18} />}
      <Text>{t(item.labelKey as any)}</Text>
    </Flexbox>
  );
});

// ---------------------------------------------------------------------------
// DnD Zone — a self-contained sortable area with its own DndContext
// ---------------------------------------------------------------------------

interface DndZoneProps {
  hiddenSections: string[];
  items: string[];
  onReorder: (items: string[]) => void;
  onToggle: (key: string) => void;
}

/** Flatten outer list (with ACCORDION_GROUP_ID placeholder) + inner accordion items → full list. */
const flattenItems = (outer: string[], inner: string[]): string[] =>
  outer.flatMap((id) => (id === ACCORDION_GROUP_ID ? inner : [id]));

const DndZone = memo<DndZoneProps>(({ hiddenSections, items, onReorder, onToggle }) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  // Derive outer (with group placeholder) and inner (accordion items)
  const { innerItems, outerItems } = useMemo(() => {
    const outer: string[] = [];
    const inner: string[] = [];
    let insertedGroup = false;
    for (const id of items) {
      if (isAccordionKey(id)) {
        inner.push(id);
        if (!insertedGroup) {
          outer.push(ACCORDION_GROUP_ID);
          insertedGroup = true;
        }
      } else {
        outer.push(id);
      }
    }
    return { innerItems: inner, outerItems: outer };
  }, [items]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      if (!over || active.id === over.id) return;

      const activeKey = active.id as string;
      const overKey = over.id as string;

      let next: string[];
      if (isAccordionKey(activeKey)) {
        const oldIdx = innerItems.indexOf(activeKey);
        const newIdx = innerItems.indexOf(overKey);
        if (oldIdx === -1 || newIdx === -1) return;
        next = flattenItems(outerItems, arrayMove(innerItems, oldIdx, newIdx));
      } else {
        const oldIdx = outerItems.indexOf(activeKey);
        const newIdx = outerItems.indexOf(overKey);
        if (oldIdx === -1 || newIdx === -1) return;
        next = flattenItems(arrayMove(outerItems, oldIdx, newIdx), innerItems);
      }

      onReorder(next);
    },
    [innerItems, outerItems, onReorder],
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  const renderItem = (id: string) => (
    <SortableItem hiddenSections={hiddenSections} id={id} key={id} onToggle={onToggle} />
  );

  return (
    <DndContext
      sensors={sensors}
      onDragCancel={handleDragCancel}
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
    >
      <SortableContext items={outerItems} strategy={verticalListSortingStrategy}>
        <Flexbox gap={2}>
          {outerItems.map((id) =>
            id === ACCORDION_GROUP_ID ? (
              <AccordionGroup key={id}>
                <SortableContext items={innerItems} strategy={verticalListSortingStrategy}>
                  {innerItems.map(renderItem)}
                </SortableContext>
              </AccordionGroup>
            ) : (
              renderItem(id)
            ),
          )}
        </Flexbox>
      </SortableContext>

      {createPortal(
        <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({}) }}>
          {activeId ? <OverlayItem id={activeId} /> : null}
        </DragOverlay>,
        document.body,
      )}
    </DndContext>
  );
});

// ---------------------------------------------------------------------------
// Main content
// ---------------------------------------------------------------------------

const CustomizeSidebarContent = memo(() => {
  const activeWorkspaceId = useActiveWorkspaceId();
  const [storeItems, hiddenSections, updateSystemStatus] = useGlobalStore((s) => [
    systemStatusSelectors.sidebarItems(activeWorkspaceId)(s),
    systemStatusSelectors.hiddenSidebarSections(activeWorkspaceId)(s),
    s.updateSystemStatus,
  ]);
  const isWorkspaceMode = !!useActiveWorkspaceSlug();
  const sortableItemIds = useMemo(
    () => getSortableSidebarItemIds(isWorkspaceMode),
    [isWorkspaceMode],
  );
  const availableStoreItems = useMemo(
    () => storeItems.filter((id) => sortableItemIds.has(id)),
    [storeItems, sortableItemIds],
  );

  // Local state for drag operations — only persisted on dragEnd
  const [topItems, setTopItems] = useState<string[]>([]);
  const [bottomItems, setBottomItems] = useState<string[]>([]);

  // Sync local state when store changes (e.g. reset)
  useEffect(() => {
    const { top, bottom } = splitBySpacer(availableStoreItems);
    setTopItems(top);
    setBottomItems(bottom);
  }, [availableStoreItems]);

  const toggleSection = useCallback(
    (key: string) => {
      const isHidden = hiddenSections.includes(key);
      const newHidden = isHidden
        ? hiddenSections.filter((k) => k !== key)
        : [...hiddenSections, key];
      updateSystemStatus({ hiddenSidebarSections: newHidden });
    },
    [hiddenSections, updateSystemStatus],
  );

  const handleTopReorder = useCallback(
    (next: string[]) => {
      setTopItems(next);
      updateSystemStatus({ sidebarItems: mergeWithSpacer(next, bottomItems) });
    },
    [bottomItems, updateSystemStatus],
  );

  const handleBottomReorder = useCallback(
    (next: string[]) => {
      setBottomItems(next);
      updateSystemStatus({ sidebarItems: mergeWithSpacer(topItems, next) });
    },
    [topItems, updateSystemStatus],
  );

  return (
    <Flexbox gap={2}>
      <DndZone
        hiddenSections={hiddenSections}
        items={topItems}
        onReorder={handleTopReorder}
        onToggle={toggleSection}
      />
      <SpacerDivider />
      <DndZone
        hiddenSections={hiddenSections}
        items={bottomItems}
        onReorder={handleBottomReorder}
        onToggle={toggleSection}
      />
    </Flexbox>
  );
});

// ---------------------------------------------------------------------------
// Modal entry
// ---------------------------------------------------------------------------

export const openCustomizeSidebarModal = (): ModalInstance =>
  createModal({
    content: <CustomizeSidebarContent />,
    footer: (
      <Button
        block
        icon={<Icon icon={RotateCcw} />}
        type={'text'}
        onClick={() => useGlobalStore.getState().resetSidebarCustomization()}
      >
        {t('navPanel.resetDefault', { ns: 'common' })}
      </Button>
    ),
    maskClosable: true,
    title: t('navPanel.customizeSidebar', { ns: 'common' }),
    width: 360,
  });

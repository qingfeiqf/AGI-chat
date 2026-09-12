import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Body from './index';

interface MockGlobalState {
  status: {
    hiddenSidebarSections?: string[];
    sidebarExpandedKeys?: string[];
    sidebarItems?: string[];
  };
  updateSystemStatus: (patch: Partial<MockGlobalState['status']>) => void;
}

const mocks = vi.hoisted(() => ({
  globalState: undefined as unknown as MockGlobalState,
  navLayout: {
    bottomMenuItems: [] as { key: string; title: string; url: string }[],
    topNavItems: [] as { key: string; title: string; url: string }[],
  },
  updateSystemStatus: vi.fn(),
}));

vi.mock('@lobehub/ui', () => ({
  Accordion: ({
    children,
    expandedKeys,
    onExpandedChange,
  }: {
    children: React.ReactNode;
    expandedKeys?: string[];
    onExpandedChange?: (keys: string[]) => void;
  }) => (
    <div data-expanded-keys={JSON.stringify(expandedKeys)} data-testid="sidebar-accordion">
      <button aria-label="collapse recents" onClick={() => onExpandedChange?.(['agent'])} />
      {children}
    </div>
  ),
  ActionIcon: () => <span />,
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Flexbox: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar-body">{children}</div>
  ),
  Icon: () => <span />,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('react-router', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useNavigate: () => vi.fn(),
}));

vi.mock('@/features/NavPanel/components/NavItem', () => ({
  default: ({ title }: { title: string }) => <div>{title}</div>,
}));

vi.mock('@/hooks/useActiveTabKey', () => ({
  useActiveTabKey: () => 'home',
}));

vi.mock('@/hooks/useNavLayout', () => ({
  useNavLayout: () => mocks.navLayout,
}));

vi.mock('@/utils/navigation', () => ({
  isModifierClick: () => false,
}));

vi.mock('@/routes/(main)/home/features/Recents', () => ({
  default: ({ itemKey }: { itemKey: string }) => <div data-testid={`sidebar-item-${itemKey}`} />,
}));

vi.mock('./Agent', () => ({
  default: ({ itemKey }: { itemKey: string }) => <div data-testid={`sidebar-item-${itemKey}`} />,
}));

vi.mock('./Private', () => ({
  default: ({ itemKey }: { itemKey: string }) => <div data-testid={`sidebar-item-${itemKey}`} />,
}));

vi.mock('./CustomizeSidebarModal', () => ({
  openCustomizeSidebarModal: vi.fn(),
}));

vi.mock('@/store/global', () => ({
  useGlobalStore: (selector: (state: MockGlobalState) => unknown) => selector(mocks.globalState),
}));

beforeEach(() => {
  mocks.updateSystemStatus.mockReset();
  mocks.navLayout = {
    bottomMenuItems: [],
    topNavItems: [],
  };
  mocks.globalState = {
    status: {
      hiddenSidebarSections: [],
      sidebarExpandedKeys: ['recents', 'agent'],
      sidebarItems: ['recents', 'agent'],
    },
    updateSystemStatus: mocks.updateSystemStatus,
  };
});

afterEach(() => {
  cleanup();
});

describe('Home sidebar body', () => {
  it('uses persisted sidebar accordion expanded keys', () => {
    mocks.globalState.status.sidebarExpandedKeys = ['agent'];

    render(<Body />);

    expect(screen.getByTestId('sidebar-accordion')).toHaveAttribute(
      'data-expanded-keys',
      '["agent"]',
    );
  });

  it('persists sidebar accordion expanded changes', () => {
    render(<Body />);

    fireEvent.click(screen.getByRole('button', { name: 'collapse recents' }));

    expect(mocks.updateSystemStatus).toHaveBeenCalledWith({ sidebarExpandedKeys: ['agent'] });
  });

  it('renders only top-section items, stopping at the spacer (bottom zone is the Footer)', () => {
    mocks.navLayout = {
      bottomMenuItems: [
        { key: 'image', title: 'Image', url: '/image' },
        { key: 'resource', title: 'Resource', url: '/resource' },
      ],
      topNavItems: [
        { key: 'pages', title: 'Pages', url: '/page' },
        { key: 'tasks', title: 'Tasks', url: '/tasks' },
      ],
    };
    mocks.globalState.status.sidebarItems = [
      'pages',
      'recents',
      'agent',
      '__spacer__',
      'image',
      'tasks',
      'resource',
    ];

    render(<Body />);

    const children = Array.from(screen.getByTestId('sidebar-body').children);

    // The spacer and every item after it belong to the sidebar Footer; the
    // body renders only the top section.
    expect(children.some((child) => child.hasAttribute('data-sidebar-bottom-spacer'))).toBe(false);
    expect(children[0]).toHaveTextContent('Pages');
    expect(children[1]).toHaveAttribute('data-testid', 'sidebar-accordion');
    expect(children).toHaveLength(2);
    expect(screen.queryByText('Image')).not.toBeInTheDocument();
    expect(screen.queryByText('Resource')).not.toBeInTheDocument();
  });

  it('stops at the spacer even when items were dragged past it', () => {
    mocks.navLayout = {
      bottomMenuItems: [{ key: 'image', title: 'Image', url: '/image' }],
      topNavItems: [{ key: 'tasks', title: 'Tasks', url: '/tasks' }],
    };
    // User dragged `tasks` from the top section to sit after `image`.
    mocks.globalState.status.sidebarItems = ['recents', 'agent', '__spacer__', 'image', 'tasks'];

    render(<Body />);

    const children = Array.from(screen.getByTestId('sidebar-body').children);

    expect(children[0]).toHaveAttribute('data-testid', 'sidebar-accordion');
    expect(children).toHaveLength(1);
    expect(screen.queryByText('Image')).not.toBeInTheDocument();
    expect(screen.queryByText('Tasks')).not.toBeInTheDocument();
  });
});

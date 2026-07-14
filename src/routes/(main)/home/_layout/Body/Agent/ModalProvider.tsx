'use client';

import { type ReactNode, useCallback } from 'react';
import { createContext, memo, use, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ChatGroupWizard } from '@/components/ChatGroupWizard';
import { MemberSelectionModal } from '@/components/MemberSelectionModal';
import CreatePlatformAgentModal from '@/features/CreatePlatformAgent';
import EditingPopover from '@/features/EditingPopover';
import { CreateAgentModal } from '@/routes/(main)/home/_layout/hooks/useCreateModal';
import { useAgentStore } from '@/store/agent';
import { builtinAgentSelectors } from '@/store/agent/selectors';
import { useHomeStore } from '@/store/home';

import AgentChannelModal from './Modals/AgentChannelModal';
import AgentProfileModal from './Modals/AgentProfileModal';
import AgentTasksModal from './Modals/AgentTasksModal';
import ConfigGroupModal from './Modals/ConfigGroupModal';
import CreateGroupModal from './Modals/CreateGroupModal';

interface OpenCreateModalOptions {
  groupId?: string;
}

interface AgentModalContextValue {
  closeAgentChannelModal: () => void;
  closeAgentProfileModal: () => void;
  closeAgentTasksModal: () => void;
  closeAllModals: () => void;
  closeConfigGroupModal: () => void;
  closeCreateGroupModal: () => void;
  closeCreatePlatformAgentModal: () => void;
  closeGroupWizardModal: () => void;
  closeMemberSelectionModal: () => void;
  openAgentChannelModal: (agentId: string, title?: string) => void;
  openAgentProfileModal: (agentId: string) => void;
  openAgentTasksModal: (agentId: string) => void;
  openConfigGroupModal: () => void;
  openCreateGroupModal: (sessionId: string) => void;
  openCreateModal: (type: 'agent' | 'group', options?: OpenCreateModalOptions) => void;
  openCreatePlatformAgentModal: (options?: OpenCreateModalOptions) => void;
  openGroupWizardModal: (callbacks: GroupWizardCallbacks) => void;
  openMemberSelectionModal: (callbacks: MemberSelectionCallbacks) => void;
  setGroupWizardLoading: (loading: boolean) => void;
}

interface GroupWizardCallbacks {
  onCancel?: () => void;
  onCreateCustom?: (selectedAgents: string[]) => Promise<void>;
  onCreateFromTemplate?: (templateId: string, selectedMemberTitles?: string[]) => Promise<void>;
}

interface MemberSelectionCallbacks {
  onCancel?: () => void;
  onConfirm?: (selectedAgents: string[]) => Promise<void>;
}

const AgentModalContext = createContext<AgentModalContextValue | null>(null);

export const useAgentModal = () => {
  const context = use(AgentModalContext);
  if (!context) {
    throw new Error('useAgentModal must be used within AgentModalProvider');
  }
  return context;
};

export const useOptionalAgentModal = () => {
  return use(AgentModalContext);
};

interface CreateModalRendererProps {
  groupId?: string;
  onClose: () => void;
  open: boolean;
  type: 'agent' | 'group';
}

const CreateModalRenderer = memo<CreateModalRendererProps>(({ open, type, groupId, onClose }) => {
  const navigate = useNavigate();
  const inboxAgentId = useAgentStore(builtinAgentSelectors.inboxAgentId);
  const storeCreateAgent = useAgentStore((s) => s.createAgent);
  const refreshAgentList = useHomeStore((s) => s.refreshAgentList);
  const sendAsAgent = useHomeStore((s) => s.sendAsAgent);
  const sendAsGroup = useHomeStore((s) => s.sendAsGroup);

  const handleSubmit = useCallback(
    async (prompt: string) => {
      if (type === 'agent') {
        await sendAsAgent({ groupId, message: prompt });
      } else {
        await sendAsGroup({ groupId, message: prompt });
      }
    },
    [type, sendAsAgent, sendAsGroup, groupId],
  );

  const handleCreateBlank = useCallback(async () => {
    if (type === 'agent') {
      const result = await storeCreateAgent({ groupId });
      navigate(`/agent/${result.agentId}/profile`);
      await refreshAgentList();
    } else {
      await sendAsGroup({ groupId, message: '' });
    }
  }, [type, storeCreateAgent, navigate, refreshAgentList, sendAsGroup, groupId]);

  return (
    <CreateAgentModal
      agentId={inboxAgentId}
      open={open}
      type={type}
      onClose={onClose}
      onCreateBlank={handleCreateBlank}
      onSubmit={handleSubmit}
    />
  );
});

interface AgentModalProviderProps {
  children: ReactNode;
}

export const AgentModalProvider = memo<AgentModalProviderProps>(({ children }) => {
  // CreateGroupModal state
  const [createGroupModalOpen, setCreateGroupModalOpen] = useState(false);
  const [createGroupSessionId, setCreateGroupSessionId] = useState<string>('');

  // ConfigGroupModal state
  const [configGroupModalOpen, setConfigGroupModalOpen] = useState(false);

  // GroupWizard state
  const [groupWizardOpen, setGroupWizardOpen] = useState(false);
  const [groupWizardCallbacks, setGroupWizardCallbacks] = useState<GroupWizardCallbacks>({});
  const [groupWizardLoading, setGroupWizardLoading] = useState(false);

  // MemberSelection state
  const [memberSelectionOpen, setMemberSelectionOpen] = useState(false);
  const [memberSelectionCallbacks, setMemberSelectionCallbacks] =
    useState<MemberSelectionCallbacks>({});

  // CreateAgentModal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createModalType, setCreateModalType] = useState<'agent' | 'group'>('agent');
  const [createModalGroupId, setCreateModalGroupId] = useState<string | undefined>(undefined);

  // AgentTasksModal state
  const [agentTasksModalOpen, setAgentTasksModalOpen] = useState(false);
  const [agentTasksModalAgentId, setAgentTasksModalAgentId] = useState<string>('');

  // AgentProfileModal state
  const [agentProfileModalOpen, setAgentProfileModalOpen] = useState(false);
  const [agentProfileModalAgentId, setAgentProfileModalAgentId] = useState<string>('');

  // AgentChannelModal state
  const [agentChannelModalOpen, setAgentChannelModalOpen] = useState(false);
  const [agentChannelModalAgentId, setAgentChannelModalAgentId] = useState<string>('');
  const [agentChannelModalTitle, setAgentChannelModalTitle] = useState<string>('');

  // CreatePlatformAgentModal state
  const [createPlatformAgentOpen, setCreatePlatformAgentOpen] = useState(false);
  const [createPlatformAgentGroupId, setCreatePlatformAgentGroupId] = useState<string | undefined>(
    undefined,
  );

  const contextValue = useMemo<AgentModalContextValue>(
    () => ({
      closeAllModals: () => {
        setCreateGroupModalOpen(false);
        setConfigGroupModalOpen(false);
        setGroupWizardOpen(false);
        setMemberSelectionOpen(false);
        setCreateModalOpen(false);
        setAgentTasksModalOpen(false);
        setAgentProfileModalOpen(false);
        setAgentChannelModalOpen(false);
        setCreatePlatformAgentOpen(false);
      },
      closeConfigGroupModal: () => setConfigGroupModalOpen(false),
      closeCreateGroupModal: () => setCreateGroupModalOpen(false),
      closeCreatePlatformAgentModal: () => setCreatePlatformAgentOpen(false),
      closeGroupWizardModal: () => setGroupWizardOpen(false),
      closeMemberSelectionModal: () => setMemberSelectionOpen(false),
      closeAgentTasksModal: () => setAgentTasksModalOpen(false),
      closeAgentProfileModal: () => setAgentProfileModalOpen(false),
      closeAgentChannelModal: () => setAgentChannelModalOpen(false),
      openConfigGroupModal: () => setConfigGroupModalOpen(true),
      openCreateGroupModal: (sessionId: string) => {
        setCreateGroupSessionId(sessionId);
        setCreateGroupModalOpen(true);
      },
      openCreateModal: (type: 'agent' | 'group', options?: OpenCreateModalOptions) => {
        setCreateModalType(type);
        setCreateModalGroupId(options?.groupId);
        setCreateModalOpen(true);
      },
      openCreatePlatformAgentModal: (options?: OpenCreateModalOptions) => {
        setCreatePlatformAgentGroupId(options?.groupId);
        setCreatePlatformAgentOpen(true);
      },
      openGroupWizardModal: (callbacks: GroupWizardCallbacks) => {
        setGroupWizardCallbacks(callbacks);
        setGroupWizardOpen(true);
      },
      openMemberSelectionModal: (callbacks: MemberSelectionCallbacks) => {
        setMemberSelectionCallbacks(callbacks);
        setMemberSelectionOpen(true);
      },
      openAgentTasksModal: (agentId: string) => {
        setAgentTasksModalAgentId(agentId);
        setAgentTasksModalOpen(true);
      },
      openAgentProfileModal: (agentId: string) => {
        setAgentProfileModalAgentId(agentId);
        setAgentProfileModalOpen(true);
      },
      openAgentChannelModal: (agentId: string, title?: string) => {
        setAgentChannelModalAgentId(agentId);
        setAgentChannelModalTitle(title || '');
        setAgentChannelModalOpen(true);
      },
      setGroupWizardLoading,
    }),
    [],
  );

  return (
    <AgentModalContext value={contextValue}>
      <CreateModalRenderer
        groupId={createModalGroupId}
        open={createModalOpen}
        type={createModalType}
        onClose={() => setCreateModalOpen(false)}
      />
      <CreatePlatformAgentModal
        groupId={createPlatformAgentGroupId}
        open={createPlatformAgentOpen}
        onClose={() => setCreatePlatformAgentOpen(false)}
      />
      {children}

      {/* All modals rendered at top level */}
      {createGroupModalOpen && (
        <CreateGroupModal
          id={createGroupSessionId}
          open={createGroupModalOpen}
          onCancel={() => setCreateGroupModalOpen(false)}
        />
      )}

      <ConfigGroupModal
        open={configGroupModalOpen}
        onCancel={() => setConfigGroupModalOpen(false)}
      />

      {agentTasksModalOpen && (
        <AgentTasksModal
          agentId={agentTasksModalAgentId}
          open={agentTasksModalOpen}
          onCancel={() => setAgentTasksModalOpen(false)}
        />
      )}

      {agentProfileModalOpen && (
        <AgentProfileModal
          agentId={agentProfileModalAgentId}
          open={agentProfileModalOpen}
          onCancel={() => setAgentProfileModalOpen(false)}
        />
      )}

      {agentChannelModalOpen && (
        <AgentChannelModal
          agentId={agentChannelModalAgentId}
          open={agentChannelModalOpen}
          title={agentChannelModalTitle}
          onCancel={() => setAgentChannelModalOpen(false)}
        />
      )}

      <ChatGroupWizard
        isCreatingFromTemplate={groupWizardLoading}
        open={groupWizardOpen}
        onCancel={() => {
          groupWizardCallbacks.onCancel?.();
          setGroupWizardOpen(false);
        }}
        onCreateCustom={async (selectedAgents: string[]) => {
          await groupWizardCallbacks.onCreateCustom?.(selectedAgents);
        }}
        onCreateFromTemplate={async (templateId: string, selectedMemberTitles?: string[]) => {
          await groupWizardCallbacks.onCreateFromTemplate?.(templateId, selectedMemberTitles);
        }}
      />

      <MemberSelectionModal
        mode="create"
        open={memberSelectionOpen}
        onCancel={() => {
          memberSelectionCallbacks.onCancel?.();
          setMemberSelectionOpen(false);
        }}
        onConfirm={async (selectedAgents: string[]) => {
          await memberSelectionCallbacks.onConfirm?.(selectedAgents);
        }}
      />

      <EditingPopover />
    </AgentModalContext>
  );
});

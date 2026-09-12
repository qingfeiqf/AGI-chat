import { useCallback } from 'react';
import { useParams } from 'react-router';

import { useWorkspaceAwareNavigate } from '@/features/Workspace/useWorkspaceAwareNavigate';
import { useOptionalAgentModal } from '@/routes/(main)/home/_layout/Body/Agent/ModalProvider';
import { useTaskStore } from '@/store/task';

export const taskDetailPath = (taskId: string, agentId?: string) =>
  agentId ? `/agent/${agentId}/task/${taskId}` : `/task/${taskId}`;

export const useTaskDetailPath = () => {
  const { aid } = useParams<{ aid?: string }>();

  return useCallback(
    (taskId: string, agentId?: string) => taskDetailPath(taskId, agentId ?? aid),
    [aid],
  );
};

export const useNavigateToTaskDetail = () => {
  const navigate = useWorkspaceAwareNavigate();
  const getTaskDetailPath = useTaskDetailPath();
  const agentModal = useOptionalAgentModal();
  const setActiveTaskId = useTaskStore((s) => s.setActiveTaskId);

  return useCallback(
    (taskId: string, agentId?: string) => {
      // If we are in the AgentModalProvider and the tasks modal is open (indicated by agentModal being defined)
      // we can set the activeTaskId in the store instead of navigating.
      if (agentModal) {
        setActiveTaskId(taskId);
      } else {
        navigate(getTaskDetailPath(taskId, agentId));
      }
    },
    [getTaskDetailPath, navigate, agentModal, setActiveTaskId],
  );
};

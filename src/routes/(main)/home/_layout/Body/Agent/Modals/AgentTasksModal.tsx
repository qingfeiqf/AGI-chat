'use client';

import { Button, Flexbox, Modal } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import { memo, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import TaskDetailPage from '@/features/AgentTasks/AgentTaskDetail/TaskDetailPage';
import EmptyState from '@/features/AgentTasks/AgentTaskList/EmptyState';
import KanbanBoard from '@/features/AgentTasks/AgentTaskList/KanbanBoard';
import { normalizeTaskListViewOptions } from '@/features/AgentTasks/AgentTaskList/listViewOptions';
import TaskList from '@/features/AgentTasks/AgentTaskList/TaskList';
import { useAgentStore } from '@/store/agent';
import { agentSelectors } from '@/store/agent/selectors';
import { useGlobalStore } from '@/store/global';
import { systemStatusSelectors } from '@/store/global/selectors';
import { useTaskStore } from '@/store/task';
import { taskListSelectors } from '@/store/task/selectors';

const useStyles = createStyles(({ css, cssVar }) => ({
  contentWrapper: css`
    overflow: hidden auto;

    min-height: 400px;
    max-height: 70vh;
    padding-block: 12px 24px;
    padding-inline: 12px;
  `,
  header: css`
    margin-block-end: 16px;
    padding-block-end: 8px;
    border-block-end: 1px solid ${cssVar.colorBorderSecondary};
  `,
}));

interface AgentTasksModalProps {
  agentId: string;
  onCancel: () => void;
  open: boolean;
}

const AgentTasksModal = memo<AgentTasksModalProps>(({ agentId, open, onCancel }) => {
  const { styles } = useStyles();
  const { t } = useTranslation('common');

  // Fetch task lists for this specific agent
  const useFetchTaskList = useTaskStore((s) => s.useFetchTaskList);
  const useFetchTaskGroupList = useTaskStore((s) => s.useFetchTaskGroupList);

  useFetchTaskList({ agentId, enabled: open && !!agentId });
  useFetchTaskGroupList({ agentId, enabled: open && !!agentId });

  // Get task view selectors
  const isEmpty = useTaskStore(taskListSelectors.isListEmpty);
  const viewMode = useTaskStore(taskListSelectors.viewMode);
  const setViewMode = useTaskStore((s) => s.setViewMode);
  const activeTaskId = useTaskStore((s) => s.activeTaskId);
  const setActiveTaskId = useTaskStore((s) => s.setActiveTaskId);

  // Get agent details
  const agentMeta = useAgentStore(agentSelectors.getAgentMetaById(agentId));
  const agentTitle = agentMeta.title || '助手';

  // Options configuration
  const rawViewOptions = useGlobalStore(systemStatusSelectors.taskListViewOptions);
  const viewOptions = useMemo(() => normalizeTaskListViewOptions(rawViewOptions), [rawViewOptions]);

  // Clean up or trigger refetch when opening
  useEffect(() => {
    if (open && agentId) {
      // Re-trigger store update for this agent
      useTaskStore.getState().setListAgentId(agentId);
      useTaskStore.getState().refreshTaskList();
    }
  }, [open, agentId]);

  const activeTaskName = useTaskStore((s) =>
    activeTaskId ? s.taskDetailMap[activeTaskId]?.name : undefined,
  );

  return (
    <Modal
      footer={null}
      open={open}
      title={`${agentTitle} 的任务`}
      width={1000}
      onCancel={() => {
        setActiveTaskId(undefined);
        onCancel();
      }}
    >
      {activeTaskId ? (
        <Flexbox horizontal align="center" className={styles.header} gap={8}>
          <span
            style={{ cursor: 'pointer', color: 'rgba(0, 0, 0, 0.45)', fontSize: 13 }}
            onClick={() => {
              setActiveTaskId(undefined);
            }}
          >
            任务列表
          </span>
          <span style={{ color: 'rgba(0, 0, 0, 0.25)' }}>/</span>
          <span style={{ fontWeight: 500, fontSize: 13 }}>{activeTaskName || activeTaskId}</span>
        </Flexbox>
      ) : (
        <Flexbox horizontal align="center" className={styles.header} justify="space-between">
          <span>查看当前助手下的自动化任务进度与详情</span>
          <Flexbox horizontal gap={8}>
            <Button
              type={viewMode === 'list' ? 'primary' : 'default'}
              onClick={() => setViewMode('list')}
            >
              列表视图
            </Button>
            <Button
              type={viewMode === 'kanban' ? 'primary' : 'default'}
              onClick={() => setViewMode('kanban')}
            >
              看板视图
            </Button>
          </Flexbox>
        </Flexbox>
      )}

      <div className={styles.contentWrapper}>
        {activeTaskId ? (
          <TaskDetailPage hideHeader showTaskAgentPanelToggle={false} taskId={activeTaskId} />
        ) : isEmpty ? (
          <EmptyState agentId={agentId} />
        ) : viewMode === 'kanban' ? (
          <Flexbox flex={1} style={{ overflowX: 'auto', overflowY: 'hidden' }}>
            <KanbanBoard />
          </Flexbox>
        ) : (
          <TaskList options={viewOptions} onShowHiddenCompleted={() => {}} />
        )}
      </div>
    </Modal>
  );
});

AgentTasksModal.displayName = 'AgentTasksModal';

export default AgentTasksModal;

'use client';

import { Flexbox } from '@lobehub/ui';
import { type FC } from 'react';
import { memo, Suspense } from 'react';

import Loading from '@/components/Loading/BrandTextLoading';
import AgentBuilder from '@/features/AgentBuilder';
import WideScreenContainer from '@/features/WideScreenContainer';
import { useAgentStore } from '@/store/agent';
import { agentSelectors } from '@/store/agent/selectors';
import { StyleSheet } from '@/utils/styles';

import Header from './features/Header';
import ProfileEditor from './features/ProfileEditor';
import ProfileHydration from './features/ProfileHydration';
import ProfileProvider from './features/ProfileProvider';
import { useProfileStore } from './features/store';

const styles = StyleSheet.create({
  contentWrapper: {
    cursor: 'text',
    display: 'flex',
    // flex:1 + minHeight:0 so the editor (left) takes the remaining height after
    // the Header and scrolls on its own — the modal body itself does NOT scroll,
    // so the right-side AgentBuilder chat + input stay fully visible.
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    position: 'relative',
  },
  profileArea: {
    minWidth: 0,
    // minHeight:0 completes the flex shrink chain so contentWrapper scrolls
    // instead of the column growing past the modal.
    minHeight: 0,
  },
});

const ProfileArea = memo(() => {
  const editor = useProfileStore((s) => s.editor);
  const isAgentConfigLoading = useAgentStore(agentSelectors.isAgentConfigLoading);

  return (
    <>
      <Flexbox flex={1} height={'100%'} style={styles.profileArea}>
        {isAgentConfigLoading ? (
          <Loading debugId="ProfileArea" />
        ) : (
          <>
            <Header />
            <Flexbox
              horizontal
              flex={1}
              style={styles.contentWrapper}
              width={'100%'}
              onClick={(e) => {
                // Only focus editor for clicks within this DOM element,
                // not from React portal (e.g. Modal) whose DOM is outside this tree
                if (e.currentTarget.contains(e.target as Node)) {
                  editor?.focus();
                }
              }}
            >
              <WideScreenContainer>
                <ProfileEditor />
              </WideScreenContainer>
            </Flexbox>
          </>
        )}
      </Flexbox>
      <Suspense fallback={null}>
        <ProfileHydration />
      </Suspense>
    </>
  );
});
const AgentProfile: FC = () => {
  return (
    <Suspense fallback={<Loading debugId="AgentProfile" />}>
      <ProfileProvider>
        <Flexbox horizontal height={'100%'} style={{ minHeight: 0 }} width={'100%'}>
          <ProfileArea />
          <AgentBuilder />
        </Flexbox>
      </ProfileProvider>
    </Suspense>
  );
};

export default AgentProfile;

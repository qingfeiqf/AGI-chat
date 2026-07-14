'use client';

import { createModal } from '@lobehub/ui';
import { t } from 'i18next';

import ModalPopupScope from '@/components/ModalPopupScope';
import { isDesktop } from '@/const/version';
import { MarketAuthProvider } from '@/layout/AuthProvider/MarketAuth';

import { SkillStoreContent } from './SkillStoreContent';

export const createSkillStoreModal = () =>
  createModal({
    allowFullscreen: true,
    children: (
      <MarketAuthProvider isDesktop={isDesktop}>
        {/* ModalPopupScope portals antd + base-ui popups into THIS modal's wrap so
            they render above the modal content (not behind it). The modal itself
            renders to document.body (default) so antd's incremental z-index stacks
            it correctly on top of a parent modal — closing returns to the parent. */}
        <ModalPopupScope>
          <SkillStoreContent />
        </ModalPopupScope>
      </MarketAuthProvider>
    ),
    destroyOnHidden: false,
    footer: null,
    styles: {
      body: { overflow: 'hidden', padding: 0 },
    },
    title: t('skillStore.title', { ns: 'setting' }),
    width: 'min(80%, 800px)',
  });

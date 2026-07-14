/**
 * Ambient declaration for @lobehub/ui's AppElementContext.
 *
 * The runtime module (`@lobehub/ui/es/ThemeProvider/AppElementContext`, reachable
 * via the package's `./es/*` export) exports `AppElementContext` as its default,
 * but the shipped `.d.mts` only declares the `useAppElement` named export — the
 * context default is missing from the types.
 *
 * We import the context so AgentProfileModal can override the Base UI portal
 * container per-subtree: portaling Select / DropdownMenu / Popover popups into
 * the modal wrap so they render above the antd modal instead of behind it.
 */
declare module '@lobehub/ui/es/ThemeProvider/AppElementContext' {
  import type { Context } from 'react';

  const AppElementContext: Context<HTMLElement | null>;
  export default AppElementContext;
}

import { registerPlugin } from '@capacitor/core';

import type { TappAdjustPlugin } from './definitions';

/**
 * Tapp Capacitor plugin with the native Adjust adapter.
 * Register deferred-link and failure listeners, then call start() first and await
 * completion before resolving links, generating links, sending events, or using Adjust.
 * Load credentials from app configuration and disable Capacitor bridge logging with
 * loggingBehavior: 'none' before passing credentials to the bridge.
 * @platform iOS, Android; web uses the limited fallback described in TappAdjustPlugin.
 * @example
 * await Tapp.start({ authToken, env, tappToken });
 * await Tapp.handleEvent({ eventToken });
 */
const Tapp = registerPlugin<TappAdjustPlugin>('Tapp', {
  web: () => import('./web').then((m) => new m.TappWeb()),
});

export * from './definitions';
export { Tapp };

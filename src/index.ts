import { registerPlugin } from '@capacitor/core';

import type { TappAdjustPlugin } from './definitions';

const Tapp = registerPlugin<TappAdjustPlugin>('Tapp', {
  web: () => import('./web').then((m) => new m.TappWeb()),
});

export * from './definitions';
export { Tapp };

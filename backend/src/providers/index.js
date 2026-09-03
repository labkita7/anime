import mock from './mock.js';
import { createAniStreamProvider } from './anistream/index.js';

const providers = {
  mock,
  anistream: createAniStreamProvider(),
};

export function getProvider(name = process.env.PROVIDER || 'mock') {
  const provider = providers[name];
  if (!provider) {
    console.warn(`PROVIDER "${name}" tidak dikenal, fallback ke mock`);
    return providers.mock;
  }
  return provider;
}

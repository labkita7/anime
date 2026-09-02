import mock from './mock.js';

const providers = { mock };

export function getProvider(name = process.env.PROVIDER || 'mock') {
  return providers[name] ?? providers.mock;
}

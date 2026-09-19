export const apiEndpoints = {
  get: {
    health: '/health',
    cache: '/cache',
  },
  post: {},
  put: {},
  patch: {},
  delete: {
    cache: '/cache',
  },
} as const;

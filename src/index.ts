/**
 * @eldrin-project/eldrin-app-react
 *
 * React adapter for Eldrin apps providing:
 * - Single-spa compatible lifecycle (createApp, combineLifecycles)
 * - Database context and hooks
 * - Shell context access (auth, user info)
 * - Migration integration
 */

// App lifecycle
export { createApp, combineLifecycles } from './createApp';

// Database context and hooks
export {
  DatabaseProvider,
  useDatabase,
  useDatabaseContext,
  useMigrationsComplete,
  useEldrinGlobal,
  useAuthHeaders,
  getEldrinGlobal,
} from './context';

// Types
export type {
  CreateAppOptions,
  LifecycleProps,
  LifecycleFn,
  AppLifecycle,
  DatabaseContext,
  DatabaseProviderProps,
  EldrinGlobal,
  AppState,
} from './types';

// Re-export commonly used types from core
export type { MigrationFile, MigrationResult } from '@eldrin-project/eldrin-app-core';

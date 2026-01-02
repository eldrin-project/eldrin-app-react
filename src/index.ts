/**
 * @eldrin-project/app-react
 *
 * React adapter for Eldrin apps providing:
 * - Single-spa compatible lifecycle (createApp)
 * - Database context and hooks
 * - Migration integration
 */

// App lifecycle
export { createApp } from './createApp';

// Database context and hooks
export {
  DatabaseProvider,
  useDatabase,
  useDatabaseContext,
  useMigrationsComplete,
} from './context';

// Types
export type {
  CreateAppOptions,
  LifecycleProps,
  AppLifecycle,
  DatabaseContext,
  DatabaseProviderProps,
} from './types';

// Re-export commonly used types from core
export type { MigrationFile, MigrationResult } from '@eldrin-project/eldrin-app-core';

/**
 * Types for @eldrin-project/eldrin-app-react
 */

import type { ReactNode } from 'react';
import type { MigrationFile, MigrationResult } from '@eldrin-project/eldrin-app-core';

/**
 * Global Eldrin context exposed by the shell
 */
export interface EldrinGlobal {
  getAuthHeaders?: () => Record<string, string>;
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

/**
 * Props passed by single-spa during lifecycle
 */
export interface LifecycleProps {
  name: string;
  singleSpa: unknown;
  mountParcel: unknown;
  db?: D1Database;
  manifest?: {
    baseUrl?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Options for creating an Eldrin React app
 */
export interface CreateAppOptions {
  /** App name (must match single-spa registration) */
  name: string;
  /** Migration files to run on bootstrap */
  migrations?: MigrationFile[];
  /** Called when migrations complete successfully */
  onMigrationsComplete?: (result: MigrationResult) => void;
  /** Called when migrations fail */
  onMigrationError?: (error: Error) => void;
}

/**
 * Single-spa lifecycle function type
 */
export type LifecycleFn<T = LifecycleProps> = (props: T) => Promise<void>;

/**
 * Single-spa lifecycle functions
 */
export interface AppLifecycle<T = LifecycleProps> {
  bootstrap: LifecycleFn<T> | LifecycleFn<T>[];
  mount: LifecycleFn<T> | LifecycleFn<T>[];
  unmount: LifecycleFn<T> | LifecycleFn<T>[];
}

/**
 * Database context for components
 */
export interface DatabaseContext {
  db: D1Database | null;
  migrationsComplete: boolean;
  migrationResult: MigrationResult | null;
}

/**
 * Internal app state
 */
export interface AppState {
  db: D1Database | null;
  migrationsComplete: boolean;
  migrationResult: MigrationResult | null;
}

/**
 * Props for DatabaseProvider
 */
export interface DatabaseProviderProps {
  children: ReactNode;
}

/**
 * Types for @eldrin-project/app-react
 */

import type { ComponentType, ReactNode } from 'react';
import type { MigrationFile, MigrationResult } from '@eldrin-project/eldrin-app-core';

/**
 * Options for createApp factory
 */
export interface CreateAppOptions {
  /** Unique app identifier */
  name: string;
  /** Root React component */
  root: ComponentType<unknown>;
  /** Migration files (loaded at build time via Vite plugin) */
  migrations?: MigrationFile[];
  /** Called when migrations complete successfully */
  onMigrationsComplete?: (result: MigrationResult) => void;
  /** Called when migrations fail */
  onMigrationError?: (error: Error) => void;
}

/**
 * Single-spa lifecycle props passed to lifecycle functions
 */
export interface LifecycleProps {
  /** DOM element to mount the app into */
  domElement?: HTMLElement;
  /** App name */
  name?: string;
  /** D1 Database instance (provided by shell) */
  db?: D1Database;
  /** Custom props from shell */
  customProps?: Record<string, unknown>;
}

/**
 * Single-spa compatible lifecycle object
 */
export interface AppLifecycle {
  bootstrap: (props: LifecycleProps) => Promise<void>;
  mount: (props: LifecycleProps) => Promise<void>;
  unmount: (props: LifecycleProps) => Promise<void>;
}

/**
 * Database context passed to app components
 */
export interface DatabaseContext {
  /** D1 database instance (null if app has no database) */
  db: D1Database | null;
  /** Whether migrations have completed */
  migrationsComplete: boolean;
  /** Migration result (if migrations were run) */
  migrationResult?: MigrationResult;
}

/**
 * Props for DatabaseProvider
 */
export interface DatabaseProviderProps {
  /** D1 database instance (null if app has no database) */
  db: D1Database | null;
  /** Whether migrations have completed */
  migrationsComplete: boolean;
  /** Migration result */
  migrationResult?: MigrationResult;
  /** Child components */
  children: ReactNode;
}

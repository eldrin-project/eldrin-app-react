/**
 * App factory for creating Eldrin React apps
 *
 * Returns single-spa compatible lifecycle functions with:
 * - Automatic migration execution on bootstrap
 * - Database provider wrapping
 * - Error boundary integration
 */

import { createElement, type ComponentType, type ReactNode } from 'react';
import { runMigrations, type MigrationResult } from '@eldrin-project/eldrin-app-core';
import { DatabaseProvider } from './context';
import type { CreateAppOptions, LifecycleProps, AppLifecycle } from './types';

/**
 * Internal state for the app
 */
interface AppState {
  db: D1Database | null;
  migrationsComplete: boolean;
  migrationResult?: MigrationResult;
  mountedElement?: HTMLElement;
  reactRoot?: {
    render: (element: ReactNode) => void;
    unmount: () => void;
  };
}

/**
 * Create an Eldrin app with single-spa compatible lifecycle
 *
 * @param options - App configuration
 * @returns Object with bootstrap, mount, and unmount lifecycle functions
 *
 * @example
 * ```tsx
 * // src/eldrin-my-app.tsx
 * import { createApp } from '@eldrin-project/app-react';
 * import App from './App';
 * import migrations from 'virtual:eldrin/migrations';
 *
 * export const { bootstrap, mount, unmount } = createApp({
 *   name: 'my-app',
 *   root: App,
 *   migrations,
 * });
 * ```
 */
export function createApp(options: CreateAppOptions): AppLifecycle {
  const { name, root: RootComponent, migrations = [], onMigrationsComplete, onMigrationError } = options;

  // App state persists across mount/unmount cycles
  const state: AppState = {
    db: null,
    migrationsComplete: false,
    migrationResult: undefined,
    mountedElement: undefined,
    reactRoot: undefined,
  };

  /**
   * Bootstrap phase - runs once when app is first loaded
   * Executes migrations here before any mounting
   */
  async function bootstrap(props: LifecycleProps): Promise<void> {
    const db = props.db ?? null;
    state.db = db;

    // Run migrations if we have a database and migrations
    if (db && migrations.length > 0) {
      try {
        const result = await runMigrations(db, {
          migrations,
          onLog: (message, level) => {
            const prefix = `[${name}]`;
            if (level === 'error') {
              console.error(prefix, message);
            } else if (level === 'warn') {
              console.warn(prefix, message);
            } else {
              console.log(prefix, message);
            }
          },
        });

        state.migrationResult = result;

        if (result.success) {
          state.migrationsComplete = true;
          onMigrationsComplete?.(result);
        } else {
          const error = new Error(result.error?.message ?? 'Migration failed');
          onMigrationError?.(error);
          throw error;
        }
      } catch (error) {
        state.migrationsComplete = false;
        const err = error instanceof Error ? error : new Error(String(error));
        onMigrationError?.(err);
        throw err;
      }
    } else {
      // No database or no migrations - mark as complete
      state.migrationsComplete = true;
    }
  }

  /**
   * Mount phase - renders the app into the DOM
   */
  async function mount(props: LifecycleProps): Promise<void> {
    const domElement = props.domElement ?? document.getElementById(`app-${name}`);

    if (!domElement) {
      throw new Error(`No DOM element found for app "${name}". Expected element with id="app-${name}" or domElement prop.`);
    }

    state.mountedElement = domElement;

    // Create the app element with providers
    const rootElement = createElement(RootComponent as ComponentType, props.customProps ?? {});
    const appElement = createElement(DatabaseProvider, {
      db: state.db,
      migrationsComplete: state.migrationsComplete,
      migrationResult: state.migrationResult,
      children: rootElement,
    });

    // Dynamically import React DOM to avoid bundling issues
    // Apps using this library will have React DOM in their dependencies
    const ReactDOM = await import('react-dom/client');
    const root = ReactDOM.createRoot(domElement);
    root.render(appElement);

    state.reactRoot = root;
  }

  /**
   * Unmount phase - removes the app from the DOM
   */
  async function unmount(_props: LifecycleProps): Promise<void> {
    if (state.reactRoot) {
      state.reactRoot.unmount();
      state.reactRoot = undefined;
    }

    if (state.mountedElement) {
      state.mountedElement.innerHTML = '';
      state.mountedElement = undefined;
    }
  }

  return {
    bootstrap,
    mount,
    unmount,
  };
}

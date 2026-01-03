/**
 * React single-spa lifecycle factory for Eldrin apps
 */

import { runMigrations } from '@eldrin-project/eldrin-app-core';
import { _setDatabaseContext } from './context';
import type {
  CreateAppOptions,
  AppLifecycle,
  AppState,
  LifecycleProps,
  LifecycleFn,
} from './types';

/**
 * Creates a single-spa compatible React app with Eldrin integration
 *
 * This function creates Eldrin lifecycle hooks that handle database migrations.
 * Combine with single-spa-react for the full React app lifecycle.
 *
 * @example
 * ```tsx
 * // main.single-spa.ts
 * import React from 'react';
 * import ReactDOMClient from 'react-dom/client';
 * import singleSpaReact from 'single-spa-react';
 * import { createApp, combineLifecycles, DatabaseProvider } from '@eldrin-project/eldrin-app-react';
 * import App from './App';
 * import migrations from './migrations';
 *
 * const eldrinLifecycle = createApp({
 *   name: 'my-react-app',
 *   migrations,
 *   onMigrationsComplete: (result) => {
 *     console.log(`Ran ${result.executed} migrations`);
 *   },
 * });
 *
 * const reactLifecycle = singleSpaReact({
 *   React,
 *   ReactDOMClient,
 *   rootComponent: () => (
 *     <DatabaseProvider>
 *       <App />
 *     </DatabaseProvider>
 *   ),
 *   domElementGetter: () => document.getElementById('app-my-react-app')!,
 * });
 *
 * const lifecycles = combineLifecycles(eldrinLifecycle, reactLifecycle);
 *
 * export const { bootstrap, mount, unmount } = lifecycles;
 * ```
 */
export function createApp(options: CreateAppOptions): AppLifecycle {
  const {
    name,
    migrations = [],
    onMigrationsComplete,
    onMigrationError,
  } = options;

  // App state persists across mount/unmount cycles
  const state: AppState = {
    db: null,
    migrationsComplete: false,
    migrationResult: null,
  };

  /**
   * Bootstrap - runs once when app is first loaded
   * Runs migrations before the app mounts
   */
  async function bootstrap(props: LifecycleProps): Promise<void> {
    const db = props.db;

    if (!db) {
      console.warn(`[${name}] No database provided in lifecycle props`);
      state.migrationsComplete = true;
      _setDatabaseContext({
        db: null,
        migrationsComplete: true,
        migrationResult: null,
      });
      return;
    }

    state.db = db;

    // Run migrations if provided
    if (migrations.length > 0) {
      try {
        const result = await runMigrations(db, { migrations });
        state.migrationResult = result;
        state.migrationsComplete = result.success;

        // Update the shared context for providers
        _setDatabaseContext({
          db,
          migrationsComplete: result.success,
          migrationResult: result,
        });

        if (result.success) {
          onMigrationsComplete?.(result);
        } else if (result.error) {
          const error = new Error(result.error.message);
          onMigrationError?.(error);
        }
      } catch (error) {
        console.error(`[${name}] Migration failed:`, error);
        state.migrationsComplete = false;
        _setDatabaseContext({
          db,
          migrationsComplete: false,
          migrationResult: null,
        });
        onMigrationError?.(error instanceof Error ? error : new Error(String(error)));
      }
    } else {
      state.migrationsComplete = true;
      _setDatabaseContext({
        db,
        migrationsComplete: true,
        migrationResult: null,
      });
    }
  }

  /**
   * Mount - called each time the app is mounted
   * React apps handle their own mounting via single-spa-react
   */
  async function mount(_props: LifecycleProps): Promise<void> {
    // React mounting is handled by single-spa-react in the consuming app
    // This is a placeholder that consuming apps will override via combineLifecycles
    console.warn(
      `[${name}] Default mount called. ` +
      'You should combine this with single-spa-react lifecycle. ' +
      'See documentation for integration examples.'
    );
  }

  /**
   * Unmount - called each time the app is unmounted
   * React apps handle their own unmounting via single-spa-react
   */
  async function unmount(_props: LifecycleProps): Promise<void> {
    // React unmounting is handled by single-spa-react in the consuming app
    console.warn(
      `[${name}] Default unmount called. ` +
      'You should combine this with single-spa-react lifecycle.'
    );
  }

  return {
    bootstrap,
    mount,
    unmount,
  };
}

/**
 * Helper to run a lifecycle function (handles both single functions and arrays)
 */
async function runLifecycleFn<T>(
  fn: LifecycleFn<T> | LifecycleFn<T>[],
  props: T
): Promise<void> {
  if (Array.isArray(fn)) {
    for (const f of fn) {
      await f(props);
    }
  } else {
    await fn(props);
  }
}

/**
 * Helper to combine Eldrin lifecycle with single-spa-react lifecycle
 *
 * Ensures Eldrin bootstrap (migrations) runs before React bootstrap,
 * while delegating mount/unmount entirely to single-spa-react.
 *
 * @example
 * ```tsx
 * import React from 'react';
 * import ReactDOMClient from 'react-dom/client';
 * import singleSpaReact from 'single-spa-react';
 * import { createApp, combineLifecycles, DatabaseProvider } from '@eldrin-project/eldrin-app-react';
 * import App from './App';
 * import migrations from './migrations';
 *
 * const eldrinLifecycle = createApp({
 *   name: 'my-app',
 *   migrations,
 * });
 *
 * const reactLifecycle = singleSpaReact({
 *   React,
 *   ReactDOMClient,
 *   rootComponent: () => (
 *     <DatabaseProvider>
 *       <App />
 *     </DatabaseProvider>
 *   ),
 *   domElementGetter: () => document.getElementById('app-my-app')!,
 * });
 *
 * export const { bootstrap, mount, unmount } = combineLifecycles(
 *   eldrinLifecycle,
 *   reactLifecycle
 * );
 * ```
 */
export function combineLifecycles<T = LifecycleProps>(
  eldrinLifecycle: AppLifecycle<T>,
  reactLifecycle: AppLifecycle<T>
): AppLifecycle<T> {
  return {
    bootstrap: async (props: T) => {
      // Run Eldrin bootstrap first (migrations)
      await runLifecycleFn(eldrinLifecycle.bootstrap, props);
      // Then React bootstrap
      await runLifecycleFn(reactLifecycle.bootstrap, props);
    },
    mount: async (props: T) => {
      // React handles mounting
      await runLifecycleFn(reactLifecycle.mount, props);
    },
    unmount: async (props: T) => {
      // React handles unmounting
      await runLifecycleFn(reactLifecycle.unmount, props);
    },
  };
}

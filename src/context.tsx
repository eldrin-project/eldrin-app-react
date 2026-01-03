/**
 * Database context and hooks for Eldrin React apps
 *
 * Provides access to the app's isolated D1 database instance
 * and shell context (auth, user info)
 */

import { createContext, useContext } from 'react';
import type { DatabaseContext, DatabaseProviderProps, EldrinGlobal } from './types';

/**
 * Module-level database context state
 * Updated by createApp during bootstrap, accessed by providers
 */
let _databaseContext: DatabaseContext = {
  db: null,
  migrationsComplete: false,
  migrationResult: null,
};

/**
 * Update the shared database context
 * Called by createApp during bootstrap
 * @internal
 */
export function _setDatabaseContext(context: DatabaseContext): void {
  _databaseContext = context;
}

/**
 * Get the current database context
 * @internal
 */
export function _getDatabaseContext(): DatabaseContext {
  return _databaseContext;
}

/**
 * React context for database access
 */
const EldrinDatabaseContext = createContext<DatabaseContext | null>(null);

/**
 * Provider component for database context
 *
 * Wraps your app to provide database access to all child components.
 * Use with single-spa-react's rootComponent.
 *
 * @example
 * ```tsx
 * import singleSpaReact from 'single-spa-react';
 * import { DatabaseProvider } from '@eldrin-project/eldrin-app-react';
 *
 * const reactLifecycle = singleSpaReact({
 *   React,
 *   ReactDOMClient,
 *   rootComponent: () => (
 *     <DatabaseProvider>
 *       <App />
 *     </DatabaseProvider>
 *   ),
 * });
 * ```
 */
export function DatabaseProvider({ children }: DatabaseProviderProps) {
  // Use the shared context that was set during bootstrap
  return (
    <EldrinDatabaseContext.Provider value={_databaseContext}>
      {children}
    </EldrinDatabaseContext.Provider>
  );
}

/**
 * Hook to access the app's D1 database
 *
 * @returns D1Database instance or null if app has no database
 * @throws Error if used outside of DatabaseProvider
 *
 * @example
 * ```tsx
 * function InvoiceList() {
 *   const db = useDatabase();
 *
 *   if (!db) {
 *     return <div>No database configured</div>;
 *   }
 *
 *   const { results } = await db.prepare(
 *     'SELECT * FROM invoices ORDER BY created_at DESC'
 *   ).all();
 *
 *   return <div>{results.map(invoice => ...)}</div>;
 * }
 * ```
 */
export function useDatabase(): D1Database | null {
  const context = useContext(EldrinDatabaseContext);

  if (context === null) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }

  return context.db;
}

/**
 * Hook to access full database context including migration status
 *
 * @returns DatabaseContext object
 * @throws Error if used outside of DatabaseProvider
 */
export function useDatabaseContext(): DatabaseContext {
  const context = useContext(EldrinDatabaseContext);

  if (context === null) {
    throw new Error('useDatabaseContext must be used within a DatabaseProvider');
  }

  return context;
}

/**
 * Hook to check if migrations have completed
 *
 * Useful for showing loading states while migrations run
 *
 * @returns true if migrations are complete
 */
export function useMigrationsComplete(): boolean {
  const context = useContext(EldrinDatabaseContext);
  return context?.migrationsComplete ?? false;
}

/**
 * Get the global Eldrin context from the shell
 *
 * @returns EldrinGlobal object or null if not available
 *
 * @example
 * ```tsx
 * const eldrin = getEldrinGlobal();
 * const headers = eldrin?.getAuthHeaders?.() ?? {};
 * ```
 */
export function getEldrinGlobal(): EldrinGlobal | null {
  const win = window as unknown as { __ELDRIN__?: EldrinGlobal };
  return win.__ELDRIN__ ?? null;
}

/**
 * Hook to access the Eldrin shell context
 *
 * Provides access to auth headers, user info, and other shell features.
 *
 * @returns EldrinGlobal object or null if not available
 *
 * @example
 * ```tsx
 * function UserProfile() {
 *   const eldrin = useEldrinGlobal();
 *
 *   if (!eldrin?.user) {
 *     return <div>Not logged in</div>;
 *   }
 *
 *   return <div>Welcome, {eldrin.user.name}</div>;
 * }
 * ```
 */
export function useEldrinGlobal(): EldrinGlobal | null {
  return getEldrinGlobal();
}

/**
 * Hook to get authentication headers from the shell
 *
 * Use these headers when making API requests to your backend.
 *
 * @returns Record of auth headers (empty object if not available)
 *
 * @example
 * ```tsx
 * function DataFetcher() {
 *   const authHeaders = useAuthHeaders();
 *
 *   async function fetchData() {
 *     const response = await fetch('/api/data', {
 *       headers: authHeaders,
 *     });
 *     return response.json();
 *   }
 * }
 * ```
 */
export function useAuthHeaders(): Record<string, string> {
  const eldrin = getEldrinGlobal();
  return eldrin?.getAuthHeaders?.() ?? {};
}

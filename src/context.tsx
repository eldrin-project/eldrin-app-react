/**
 * Database context and hooks for Eldrin React apps
 *
 * Provides access to the app's isolated D1 database instance
 */

import { createContext, useContext } from 'react';
import type { DatabaseContext, DatabaseProviderProps } from './types';

/**
 * React context for database access
 */
const EldrinDatabaseContext = createContext<DatabaseContext | null>(null);

/**
 * Provider component for database context
 */
export function DatabaseProvider({
  db,
  migrationsComplete,
  migrationResult,
  children,
}: DatabaseProviderProps) {
  const value: DatabaseContext = {
    db,
    migrationsComplete,
    migrationResult,
  };

  return (
    <EldrinDatabaseContext.Provider value={value}>{children}</EldrinDatabaseContext.Provider>
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
    throw new Error('useDatabase must be used within a DatabaseProvider (via createApp)');
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
    throw new Error('useDatabaseContext must be used within a DatabaseProvider (via createApp)');
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

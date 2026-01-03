# @eldrin-project/eldrin-app-react

React adapter for building Eldrin marketplace apps with single-spa micro-frontend architecture and Cloudflare D1 database support.

## Overview

This package is the **React adapter layer** in the Eldrin ecosystem:

```
┌─────────────────────────────────────────────────────────────┐
│                     Your React App                          │
├─────────────────────────────────────────────────────────────┤
│              @eldrin-project/eldrin-app-react               │
│  • single-spa lifecycle management                          │
│  • React hooks for database access                          │
│  • Shell communication (auth, user context)                 │
├─────────────────────────────────────────────────────────────┤
│              @eldrin-project/eldrin-app-core                │
│  • Database migrations with checksum verification           │
│  • Auth utilities (JWT, permissions)                        │
│  • Event communication                                      │
├─────────────────────────────────────────────────────────────┤
│                    Eldrin Shell                             │
│  • Micro-frontend orchestration                             │
│  • User authentication                                      │
│  • D1 database provisioning                                 │
└─────────────────────────────────────────────────────────────┘
```

## Installation

```bash
npm install @eldrin-project/eldrin-app-react
```

**Peer dependencies:**
- `react` ^18.0.0 || ^19.0.0
- `react-dom` ^18.0.0 || ^19.0.0
- `single-spa-react` ^6.0.0 || ^7.0.0 (optional, required for combineLifecycles)

## Quick Start

### 1. Set up single-spa entry point (`main.single-spa.tsx`)

```tsx
import React from 'react';
import ReactDOMClient from 'react-dom/client';
import singleSpaReact from 'single-spa-react';
import {
  createApp,
  combineLifecycles,
  DatabaseProvider,
} from '@eldrin-project/eldrin-app-react';
import App from './App';
import migrations from './migrations';

// Eldrin lifecycle - runs migrations during bootstrap
const eldrinLifecycle = createApp({
  name: 'my-react-app',
  migrations,
  onMigrationsComplete: (result) => {
    console.log(`Executed ${result.executed} migrations`);
  },
});

// React single-spa lifecycle
const reactLifecycle = singleSpaReact({
  React,
  ReactDOMClient,
  rootComponent: () => (
    <DatabaseProvider>
      <App />
    </DatabaseProvider>
  ),
  domElementGetter: () => document.getElementById('app-my-react-app')!,
});

// Combine: Eldrin runs first (migrations), then React mounts
const lifecycles = combineLifecycles(eldrinLifecycle, reactLifecycle);

export const { bootstrap, mount, unmount } = lifecycles;
```

### 2. Use Eldrin hooks in components

```tsx
import { useDatabase, useAuthHeaders, useEldrinGlobal } from '@eldrin-project/eldrin-app-react';

function ItemList() {
  const db = useDatabase();
  const authHeaders = useAuthHeaders();
  const eldrin = useEldrinGlobal();
  const [items, setItems] = useState([]);

  useEffect(() => {
    async function loadItems() {
      // Option 1: Direct D1 query
      if (db) {
        const result = await db.prepare('SELECT * FROM items').all();
        setItems(result.results);
      }

      // Option 2: API call with auth
      const response = await fetch('/api/items', {
        headers: authHeaders,
      });
      setItems(await response.json());
    }
    loadItems();
  }, [db, authHeaders]);

  return (
    <div>
      <p>Welcome, {eldrin?.user?.name}</p>
      <ul>
        {items.map(item => <li key={item.id}>{item.name}</li>)}
      </ul>
    </div>
  );
}
```

## API Reference

### Lifecycle Functions

#### `createApp(options: CreateAppOptions): AppLifecycle`

Creates a single-spa lifecycle that handles database migrations during bootstrap.

```ts
interface CreateAppOptions {
  name: string;                                      // App name (for logging)
  migrations?: MigrationFile[];                      // SQL migrations to run
  onMigrationsComplete?: (result: MigrationResult) => void;
  onMigrationError?: (error: Error) => void;
}
```

#### `combineLifecycles(eldrinLifecycle, reactLifecycle): AppLifecycle`

Combines the Eldrin lifecycle with single-spa-react's lifecycle. Eldrin's bootstrap runs first (migrations), then React bootstraps. Mount and unmount are delegated to React.

### Hooks

| Hook | Return Type | Description |
|------|-------------|-------------|
| `useDatabase()` | `D1Database \| null` | Access the D1 database instance |
| `useDatabaseContext()` | `DatabaseContext` | Full context with migration status |
| `useMigrationsComplete()` | `boolean` | Check if migrations completed |
| `useEldrinGlobal()` | `EldrinGlobal \| null` | Access shell context (auth, user) |
| `useAuthHeaders()` | `Record<string, string>` | Get authentication headers for API calls |

### Components

#### `DatabaseProvider`

React context provider that makes database context available to child components.

```tsx
import { DatabaseProvider } from '@eldrin-project/eldrin-app-react';

// Use in single-spa-react's rootComponent
const reactLifecycle = singleSpaReact({
  rootComponent: () => (
    <DatabaseProvider>
      <App />
    </DatabaseProvider>
  ),
});
```

### Helper Functions

#### `getEldrinGlobal(): EldrinGlobal | null`

Get the shell context directly (useful outside React components).

```ts
import { getEldrinGlobal } from '@eldrin-project/eldrin-app-react';

const eldrin = getEldrinGlobal();
const headers = eldrin?.getAuthHeaders?.() ?? {};
```

### Types

```ts
// Global context exposed by the Eldrin shell
interface EldrinGlobal {
  getAuthHeaders?: () => Record<string, string>;
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

// Database context with migration status
interface DatabaseContext {
  db: D1Database | null;
  migrationsComplete: boolean;
  migrationResult: MigrationResult | null;
}

// Single-spa lifecycle props
interface LifecycleProps {
  name: string;
  singleSpa: unknown;
  mountParcel: unknown;
  db?: D1Database;
  manifest?: { baseUrl?: string; [key: string]: unknown };
}
```

## Migration System

Migrations run automatically during the single-spa bootstrap phase, before your React app mounts. This ensures the database schema is ready before any components try to access data.

```ts
// migrations.ts (auto-generated by Vite plugin)
import type { MigrationFile } from '@eldrin-project/eldrin-app-core';

const migrations: MigrationFile[] = [
  {
    name: '20240101120000-create-items.sql',
    content: 'CREATE TABLE IF NOT EXISTS items (id TEXT PRIMARY KEY, name TEXT);',
  },
];

export default migrations;
```

Migrations are tracked in the `_eldrin_migrations` table with SHA-256 checksums to prevent re-running and detect tampering.

## Shell Integration

The Eldrin shell provides:

- **Authentication**: Access tokens and auth headers via `window.__ELDRIN__.getAuthHeaders()`
- **User context**: Current user info via `window.__ELDRIN__.user`
- **Database**: D1 instance passed through single-spa props

Your app communicates with the shell through these mechanisms, and this package provides the React hooks to access them cleanly.

## Related Packages

- [`@eldrin-project/eldrin-app-core`](https://www.npmjs.com/package/@eldrin-project/eldrin-app-core) - Core library (migrations, auth, events)
- [`@eldrin-project/eldrin-app-angular`](https://www.npmjs.com/package/@eldrin-project/eldrin-app-angular) - Angular adapter
- [`@eldrin-project/eldrin-app-vue`](https://www.npmjs.com/package/@eldrin-project/eldrin-app-vue) - Vue adapter
- [`@eldrin-project/eldrin-app-svelte`](https://www.npmjs.com/package/@eldrin-project/eldrin-app-svelte) - Svelte adapter
- [`create-eldrin-project`](https://www.npmjs.com/package/create-eldrin-project) - Project scaffolding CLI

## License

MIT

# @eldrin-project/eldrin-app-react

React adapter for Eldrin apps providing single-spa lifecycle and database hooks.

## Installation

```bash
npm install @eldrin-project/eldrin-app-react
```

## Usage

```tsx
import { createApp } from '@eldrin-project/eldrin-app-react';
import App from './App';
import migrations from 'virtual:eldrin/migrations';

export const { bootstrap, mount, unmount } = createApp({
  name: 'my-react-app',
  root: App,
  migrations,
});
```

## Exports

- `createApp(options)` - Factory returning single-spa lifecycle
- `useDatabase()` - Hook for D1 database access
- `useDatabaseContext()` - Hook for full database context
- `useMigrationsComplete()` - Hook for migration status
- `DatabaseProvider` - React context provider

import { defineConfig } from 'tsup';

export default defineConfig((options) => ({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  // In `pnpm dev`, api/admin/mobile compile against dist while this watcher starts.
  // Cleaning there leaves dist without index.d.ts for a moment, and a consumer that
  // compiles in that window types every `@coffeeroute/shared` import as `any`.
  clean: !options.watch,
  sourcemap: true,
  target: 'es2022',
}));

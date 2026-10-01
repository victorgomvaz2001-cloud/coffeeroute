import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { testEnv } from './test-env';

/**
 * Applies pending migrations to the e2e database (creating it if needed).
 * Non-destructive: each spec truncates its own tables in `resetState`.
 */
export default function globalSetup() {
  execSync('pnpm exec prisma migrate deploy', {
    cwd: resolve(__dirname, '..'),
    env: { ...process.env, ...testEnv },
    stdio: 'pipe',
  });
}

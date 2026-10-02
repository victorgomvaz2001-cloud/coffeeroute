import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Don't auto-generate AGENTS.md / CLAUDE.md when an AI agent runs `next dev`.
  agentRules: false,
  poweredByHeader: false,
};

export default nextConfig;

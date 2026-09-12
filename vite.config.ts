import { defineConfig } from 'vite'
import { defaultExclude } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: 'tests/setup.ts',
    globals: true,
    // Vitest's default excludes don't cover nested git worktrees (this repo
    // hosts a sibling agent's worktree under `.claude/worktrees/`), so its
    // own test files would otherwise be picked up and run alongside ours.
    exclude: [...defaultExclude, '**/.claude/**'],
  },
})

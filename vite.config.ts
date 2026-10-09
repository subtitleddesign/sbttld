import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `--mode artifact` inlines everything into one HTML file for a claude.ai preview link.
export default defineConfig(({ mode }) =>
  mode === 'artifact'
    ? { plugins: [react(), viteSingleFile()], build: { outDir: 'dist-artifact' } }
    : { plugins: [react()] },
);

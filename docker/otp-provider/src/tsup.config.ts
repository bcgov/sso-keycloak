import { defineConfig } from 'tsup';
import { cpSync } from 'fs';
import { join } from 'path';

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['esm'],
  splitting: false,
  sourcemap: false,
  clean: true,
  outDir: 'build',
  onSuccess: async () => {
    // Copy views folder after build
    cpSync(join(__dirname, 'views'), './build/views', {
      recursive: true,
    });
    cpSync(join(__dirname, 'public'), './build/public', {
      recursive: true,
    });
  },
});

import { defineConfig } from 'tsup';
import { cpSync } from 'fs';
import { join } from 'path';

export default defineConfig([
  {
    entry: ['src/server.ts'],
    format: ['esm'],
    splitting: true,
    sourcemap: false,
    clean: true,
    outDir: 'build',
    target: 'es2022',

    onSuccess: async () => {
      // Copy views folder after build
      cpSync(join(__dirname, 'views'), './build/views', {
        recursive: true,
      });
      cpSync(join(__dirname, 'public'), './build/public', {
        recursive: true,
      });
    },
  },
  {
    entry: ['src/modules/sequelize/migrations/*.ts'],
    format: ['esm'],
    outDir: 'build/migrations',
    splitting: true,
  },
]);

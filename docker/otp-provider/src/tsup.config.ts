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
      cpSync(join(__dirname, 'public/fonts'), './build/public/fonts', {
        recursive: true,
      });
      cpSync(join(__dirname, 'public/img'), './build/public/img', {
        recursive: true,
      });
      cpSync(join(__dirname, 'public/css/output.css'), './build/public/css/output.css', {
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
  {
    entry: ['src/modules/sequelize/migrate.ts'],
    format: ['esm'],
    outDir: 'build',
    splitting: true,
  },
  {
    entry: ['src/client/*.ts',],
    format: ['esm'],
    sourcemap: false,
    clean: true,
    outDir: 'build/public/js',
    target: 'es2017',
    minify: true,
}
]);

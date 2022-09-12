import { UserConfig } from 'vite';
import createVuePlugin from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import svgLoader from 'vite-svg-loader';

import path from 'path';
import electron, { onstart } from 'vite-plugin-electron';
import pkg from './package.json';

export default (): UserConfig => {
  return {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    plugins: [
      electron({
        main: {
          entry: 'electron/main/index.ts',
          vite: {
            build: {
              sourcemap: true,
              outDir: 'dist/electron/main',
            },
            plugins: [process.env.VSCODE_DEBUG ? onstart() : null],
          },
        },
        preload: {
          input: {
            index: path.join(__dirname, 'electron/preload/index.ts'),
          },
          vite: {
            build: {
              sourcemap: 'inline',
              outDir: 'dist/electron/preload',
            },
          },
        },
        renderer: {},
      }),
      createVuePlugin(),
      vueJsx(),
      svgLoader(),
    ],
    server: process.env.VSCODE_DEBUG
      ? {
          host: pkg.debug.env.VITE_DEV_SERVER_HOSTNAME,
          port: pkg.debug.env.VITE_DEV_SERVER_PORT,
        }
      : undefined,
  };
};

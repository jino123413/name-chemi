import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'name-chemi',
  web: {
    host: '0.0.0.0',
    port: 3014,
    commands: {
      dev: 'rsbuild dev --host',
      build: 'rsbuild build',
    },
  },
  permissions: [],
  outdir: 'dist',
  brand: {
    displayName: '우리 케미',
    icon: 'https://raw.githubusercontent.com/jino123413/app-logos/master/name-chemi.png',
    primaryColor: '#FF7043',
    bridgeColorMode: 'basic',
  },
  webViewProps: {
    type: 'partner',
  },
});

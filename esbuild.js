const esbuild = require('esbuild');

async function main() {
  await Promise.all([
    esbuild.build({
      entryPoints: ['src/extension.ts'],
      bundle: true,
      outfile: 'dist/extension.js',
      external: ['vscode'],
      format: 'cjs',
      platform: 'node',
      target: 'node18',
      sourcemap: true,
      logLevel: 'info',
    }),
    esbuild.build({
      entryPoints: ['src/webview/main.ts'],
      bundle: true,
      outfile: 'media/webview.js',
      format: 'iife',
      platform: 'browser',
      target: ['es2022'],
      minify: true,
      legalComments: 'none',
      logLevel: 'info',
      define: {
        'process.env.NODE_ENV': '"production"',
      },
    }),
    esbuild.build({
      entryPoints: ['src/storage.test.ts'],
      bundle: true,
      outfile: 'dist/storage.test.js',
      format: 'cjs',
      platform: 'node',
      target: 'node18',
      logLevel: 'info',
    }),
  ]);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

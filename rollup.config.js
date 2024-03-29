import typescript from '@rollup/plugin-typescript';
import {join} from 'path';
import {peerDependencies} from './package.json';
import {cleanPlugin} from '@alorel/rollup-plugin-clean';
import {copyPkgJsonPlugin as copyPkgJson} from '@alorel/rollup-plugin-copy-pkg-json';
import {copyPlugin as cpPlugin} from '@alorel/rollup-plugin-copy';

function mkOutput(overrides = {}) {
  return {
    entryFileNames: '[name].js',
    assetFileNames: '[name][extname]',
    preserveModules: true,
    sourcemap: false,
    ...overrides
  };
}

const baseSettings = {
  input: {
    index: join(__dirname, 'src', 'index.ts'),
    worker: join(__dirname, 'src', 'worker.ts')
  },
  external: Array.from(
    new Set(
      Object.keys(peerDependencies)
        .concat('path', 'worker_threads')
        .filter(v => !v.startsWith('@types/'))
    )
  ),
  watch: {
    exclude: 'node_modules/*'
  }
};

function plugins(add = [], tscOpts = {}) {
  return [
    typescript({
      tsconfig: join(__dirname, 'tsconfig.json'),
      ...tscOpts
    })
  ].concat(add);
}

export default [
  {
    ...baseSettings,
    output: mkOutput({
      dir: join(__dirname, 'dist'),
      format: 'cjs',
      plugins: [
        copyPkgJson({
          unsetPaths: ['devDependencies', 'scripts']
        })
      ]
    }),
    plugins: plugins([
      cleanPlugin({
        dir: join(__dirname, 'dist')
      }),
      cpPlugin({
        defaultOpts: {
          glob: {
            cwd: __dirname
          },
          emitNameKind: 'fileName'
        },
        copy: [
          'LICENSE',
          'CHANGELOG.md',
          'README.md'
        ]
      })
    ], {
      declaration: true,
    })
  },
  {
    ...baseSettings,
    output: mkOutput({
      dir: join(__dirname, 'dist', 'esm'),
      format: 'esm'
    }),
    plugins: plugins([], {outDir: 'dist/esm'})
  }
];

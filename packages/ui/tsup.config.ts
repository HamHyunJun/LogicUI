import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  outExtension: ({ format }) => ({ js: format === 'esm' ? '.mjs' : '.cjs' }),
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  target: 'es2020',
  // 의존 패키지는 번들에 포함하지 않는다.
  external: ['react', 'react-dom', 'react/jsx-runtime', /^@logic-ui\//, 'clsx', 'tailwind-merge'],
});

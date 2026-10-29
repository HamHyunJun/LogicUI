import { defineConfig } from 'tsup';

export default defineConfig({
  // 서브패스 export(@logic-ui/primitives/dialog)마다 엔트리를 둔다.
  entry: {
    index: 'src/index.ts',
    'accordion/index': 'src/accordion/index.ts',
    'dialog/index': 'src/dialog/index.ts',
  },
  format: ['esm', 'cjs'],
  outExtension: ({ format }) => ({ js: format === 'esm' ? '.mjs' : '.cjs' }),
  dts: true,
  sourcemap: true,
  clean: true,
  // 공통 코드는 청크로 분리되어 엔트리 간 중복 없이 트리셰이킹된다.
  splitting: true,
  treeshake: true,
  target: 'es2020',
  external: ['react', 'react-dom', 'react/jsx-runtime'],
});

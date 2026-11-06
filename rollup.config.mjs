export default {
  input: 'dist/esm/index.js',
  external: ['@capacitor/core'],
  output: [
    {
      file: 'dist/plugin.js',
      format: 'iife',
      name: 'tappAdjustCapacitorSdk',
      globals: { '@capacitor/core': 'capacitorExports' },
      inlineDynamicImports: true,
    },
    {
      file: 'dist/plugin.cjs.js',
      format: 'cjs',
      inlineDynamicImports: true,
    },
  ],
};

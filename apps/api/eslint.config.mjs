import base from '@coffeeroute/eslint-config';

export default [
  ...base,
  {
    rules: {
      // Nest's DI needs runtime class references for emitDecoratorMetadata.
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/no-extraneous-class': 'off',
    },
  },
];

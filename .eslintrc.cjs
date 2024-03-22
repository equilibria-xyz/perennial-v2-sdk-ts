module.exports = {
  extends: ['prettier', 'plugin:@typescript-eslint/recommended'],
  rules: {
    'no-unused-vars': 'off',
    'no-console': ['error', { allow: ['warn', 'error'] }],
    '@typescript-eslint/no-inferrable-types': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
      },
    ],
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
  },
  ignorePatterns: ['src/types/gql/*.ts'],
  parser: '@typescript-eslint/parser',
  root: true,
  plugins: ['@typescript-eslint'],
}

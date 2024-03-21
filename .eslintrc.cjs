module.exports = {
  extends: [
    'next',
    'prettier',
    'plugin:storybook/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    'react/no-unescaped-entities': [0],
    '@next/next/no-img-element': [0],
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
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    'formatjs/no-literal-string-in-jsx': [
      'error',
      {
        // Include or exclude additional prop checks (merged with the default checks)
        props: {
          include: [
            ['*', 'label'],
            ['*', 'message'],
            ['*', 'labelText'],
          ],
          // Exclude will always override include.
          exclude: [],
        },
      },
    ],
    'formatjs/no-id': 'error',
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: 'wagmi',
            importNames: ['useAccount'],
            message: 'Please use useAddress to correctly handle overriding addresses.',
          },
          {
            name: 'wagmi',
            importNames: ['useChainId'],
            message: 'Use hook from @/hooks/network instead',
          },
          {
            name: 'wagmi',
            importNames: ['useWebSocketPublicClient'],
            message: 'Use hook from @/hooks/network instead',
          },
          {
            name: 'viem',
            importNames: ['parseEther'],
            message: 'Use Big18Math.fromFloatString',
          },
        ],
      },
    ],
  },
  overrides: [
    {
      files: ['**/*.spec.tsx', '**/*.stories.tsx'],
      rules: {
        'formatjs/no-literal-string-in-jsx': 'off',
      },
    },
  ],
  parser: '@typescript-eslint/parser',
  root: true,
  plugins: ['jsx-a11y', '@typescript-eslint', 'formatjs'],
}

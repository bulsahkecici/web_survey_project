module.exports = {
  env: {
    node: true,
    es2022: true,
  },
  extends: ['airbnb-base', 'prettier'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  rules: {
    'no-console': 'off',
    'import/extensions': ['error', 'ignorePackages'],
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-underscore-dangle': ['error', { allow: ['__dirname', '__filename'] }],
    'consistent-return': 'off',
    'import/prefer-default-export': 'off',
  },
};

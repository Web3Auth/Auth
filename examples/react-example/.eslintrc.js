module.exports = {
    env: {
        browser: true,
        es2021: true,
    },
    extends: ['plugin:react/recommended', 'airbnb'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaFeatures: {
            jsx: true,
        },
        ecmaVersion: 12,
        sourceType: 'module',
    },
    plugins: ['react', '@typescript-eslint'],
    settings: {
        'import/resolver': {
            node: {
                extensions: ['.js', '.jsx', '.ts', '.tsx'],
            },
        },
        'import/extensions': ['.js', '.mjs', '.jsx', '.js', '.jsx', '.ts', '.tsx'],
    },
    rules: {
        'import/extensions': [
            'error',
            'ignorePackages',
            {
                js: 'never',
                jsx: 'never',
                ts: 'never',
                tsx: 'never',
            },
        ],
        'react/jsx-filename-extension': [2, { extensions: ['.js', '.jsx', '.ts', '.tsx'] }],
        'react/button-has-type': 0,
        'no-console': 0,
        'import/prefer-default-export': 0,
        'react/prop-types': 0,
        'no-use-before-define': 0,
        'promise/always-return': 0,
        'react/forbid-prop-types': 0,
        'react/jsx-uses-react': 0,
        'react/react-in-jsx-scope': 0,
        'simple-import-sort/imports': 0,
        'simple-import-sort/exports': 0,
        'sort-imports': 0,
        'import/order': 0,
        'react/state-in-constructor': [2, 'never'],
        'no-param-reassign': [2, { props: false }],
        'no-unused-vars': 0,
        '@typescript-eslint/no-unused-vars': ['error'],
        'no-restricted-syntax': 0,
        'max-len': [2, { code: 150, ignoreComments: true }],
    },
    root: true,
};

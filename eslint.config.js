'use strict'
const node = require('eslint-plugin-n')
const { defineConfig } = require('eslint/config')

module.exports = defineConfig([
  {
    plugins: {n: node},
    extends: ['n/recommended-module'],
    rules: {
      'no-unused-vars': ['error', { args: 'all', argsIgnorePattern: '^_' }]
    }
  }
])

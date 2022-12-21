const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://127.0.0.1:9090/',
    specPattern: 'e2e/**/*.spec.js',
    supportFile: false,
    video: false,
  }
})
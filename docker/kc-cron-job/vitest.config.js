// vitest.config.js
export default {
  test: {
    globals: true, // Optional: allows `test`, `expect`, etc. globally
    environment: 'node' // or 'jsdom' if you test browser code
  }
};

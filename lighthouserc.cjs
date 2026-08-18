/* eslint-disable @typescript-eslint/no-require-imports */

const budgets = require("./lighthouse-budget.json");

module.exports = {
  ci: {
    collect: {
      url: [
        "http://127.0.0.1:3000/",
        "http://127.0.0.1:3000/comunidades",
      ],
      startServerCommand: "npm run start",
      startServerReadyPattern: "ready|started server|localhost:3000",
      startServerReadyTimeout: 30000,
      numberOfRuns: 1,
      settings: {
        budgets,
        preset: "desktop",
        chromeFlags: "--headless=new --no-sandbox",
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.8 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:best-practices": ["warn", { minScore: 0.9 }],
        "categories:seo": ["warn", { minScore: 0.9 }],
        "uses-http2": "off",
      },
    },
    upload: {
      target: "filesystem",
      outputDir: ".lighthouseci",
    },
  },
};

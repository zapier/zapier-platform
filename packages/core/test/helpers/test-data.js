'use strict';

const fs = require('fs');
const path = require('path');

// Helper function to create realistic large bundle data for compression testing
const createLargeBundleTestData = (options = {}) => {
  const {
    stringSize = 1024 * 50, // ~50KB by default, configurable for larger sizes
  } = options;

  // Read the base fixture data
  const fixturePath = path.join(__dirname, '../fixtures/bundle-data.json');
  const baseData = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

  // Deep clone to avoid modifying the original
  const data = JSON.parse(JSON.stringify(baseData));

  // Scale up the SCALE_ME placeholders
  const scaledString = 'x'.repeat(stringSize);

  // Scale the Custom-Data header
  if (data.rawRequest?.headers?.['Custom-Data'] === 'SCALE_ME') {
    data.rawRequest.headers['Custom-Data'] = scaledString;
  }

  // Scale the body data field
  if (data.rawRequest?.body?.data === 'SCALE_ME') {
    data.rawRequest.body.data = scaledString;
  }

  return data;
};

module.exports = {
  createLargeBundleTestData,
};

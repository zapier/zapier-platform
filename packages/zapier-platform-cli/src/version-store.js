// Index of each item is equivalent to the major of zapier-platform-core version.
// The next item will be for zapier-platform-core version of major 7.

// node version listed here: https://docs.aws.amazon.com/lambda/latest/dg/current-supported-versions.html
module.exports = [
  { nodeVersion: '4.3.2', npmVersion: '>=2.14.12' }, // 0.x
  { nodeVersion: '4.3.2', npmVersion: '>=2.14.12' }, // 1.x
  { nodeVersion: '6.10.2', npmVersion: '>=3.10.10' }, // 2.x
  { nodeVersion: '6.10.2', npmVersion: '>=3.10.10' }, // 3.x
  { nodeVersion: '6.10.2', npmVersion: '>=3.10.10' }, // 4.x
  { nodeVersion: '6.10.3', npmVersion: '>=3.10.10' }, // 5.x // patch version change on AWS
  { nodeVersion: '6.10.3', npmVersion: '>=3.10.10' } // 6.x
];

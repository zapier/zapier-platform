// Index of each item is equivalent to the major of zapier-platform-core version.

// node version listed here: https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html
module.exports = [
  { nodeVersion: '4.3.2', npmVersion: '>=2.14.12' }, // 0.x
  { nodeVersion: '4.3.2', npmVersion: '>=2.14.12' }, // 1.x
  { nodeVersion: '6.10.2', npmVersion: '>=3.10.10' }, // 2.x
  { nodeVersion: '6.10.2', npmVersion: '>=3.10.10' }, // 3.x
  { nodeVersion: '6.10.2', npmVersion: '>=3.10.10' }, // 4.x
  { nodeVersion: '6.10.3', npmVersion: '>=3.10.10' }, // 5.x // patch version change on AWS
  { nodeVersion: '6.10.3', npmVersion: '>=3.10.10' }, // 6.x
  { nodeVersion: '8.10.0', npmVersion: '>=5.6.0' }, // 7.x
  { nodeVersion: '8.10.0', npmVersion: '>=5.6.0' }, // 8.x
  { nodeVersion: '10', npmVersion: '>=5.6.0' }, // 9.x; it's no longer a specific version
  { nodeVersion: '12', npmVersion: '>=5.6.0' }, // 10.x
  { nodeVersion: '14', npmVersion: '>=5.6.0' }, // 11.x
  { nodeVersion: '14', npmVersion: '>=5.6.0' }, // 12.x
  { nodeVersion: '16', npmVersion: '>=5.6.0' }, // 13.x
  { nodeVersion: '18', npmVersion: '>=5.6.0' }, // 15.x
  { nodeVersion: '18', npmVersion: '>=10.7.0' }, // 16.x
  { nodeVersion: '18', npmVersion: '>=10.7.0' }, // 17.x
  { nodeVersion: '22', npmVersion: '>=10.7.0' }, // 18.x
];

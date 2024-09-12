const { createCanary, deleteCanary, listCanaries } = require('./api');

const handleCreate = async (versionFrom, versionTo, percentage, duration) => {
  if (!versionFrom || !versionTo || !percentage || !duration) {
    throw new Error('All parameters are required for creating a canary deployment: versionFrom, versionTo, percentage, duration');
  }

  console.log(`Creating canary deployment:
    From version: ${versionFrom}
    To version: ${versionTo}
    Percentage: ${percentage}%
    Duration: ${duration} seconds`);

  await createCanary(versionFrom, versionTo, percentage, duration);
}

const handleList = async () => {
  console.log('Listing all canary deployments');
  const res = await listCanaries();
  console.log(res);
  // TODO: implement list functionality
  // maybe yeet this into a table
}

const handleDelete = async (versionFrom, versionTo) => {
  if (!versionFrom || !versionTo) {
    throw new Error('The versionFrom parameter is required for deleting a canary deployment');
  }
  console.log(`Deleting canary deployment for version: ${versionFrom}`);

  await deleteCanary(versionFrom, versionTo);
}

module.exports = {
  handleCreate,
  handleList,
  handleDelete,
};
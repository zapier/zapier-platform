const throwForInvalidVersion = (version) => {
  if (
    !version.match(
      // this is mirrored in schemas/VersionSchema.js and developer_cli/constants.py
      /^(?:0|[1-9]\d{0,2})\.(?:0|[1-9]\d{0,2})\.(?:0|[1-9]\d{0,2})(?:-(?=.{1,12}$)[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*)?$/g,
    )
  ) {
    throw new Error(
      `${version} is an invalid version str. Try something like \`1.2.3\` or \`0.0.0-TICKET\``,
    );
  }
};

module.exports = {
  throwForInvalidVersion,
};

'use strict';

// node-fetch puts the full URL in errors: "request to <url> failed, reason: ...".
// Apps that send secrets in the query string would leak them into error messages.
const SENSITIVE_QUERY_PARAM_RE =
  /([?&;][\w.-]*(?:key|token|secret|password|passwd|pwd|auth|signature|sig|credential)[\w.-]*=)[^&\s"'<>]+/gi;

const redactUrlSecrets = (str) =>
  typeof str === 'string'
    ? str.replace(SENSITIVE_QUERY_PARAM_RE, '$1[redacted]')
    : str;

module.exports = redactUrlSecrets;

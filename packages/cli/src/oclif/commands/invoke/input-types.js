const _ = require('lodash');

// Datetime related imports
const chrono = require('chrono-node');
const { DateTime, IANAZone } = require('luxon');

const FALSE_STRINGS = new Set([
  'noo',
  'no',
  'n',
  'false',
  'nope',
  'f',
  'never',
  'no thanks',
  'no thank you',
  'nul',
  '0',
  'none',
  'nil',
  'nill',
  'null',
]);

const TRUE_STRINGS = new Set([['yes', 'yeah', 'y', 'true', 't', '1']]);

const NUMBER_CHARSET = '0123456789.-,';

/**
 * Parses a string value to a boolean like how Zapier production does.
 * Recognizes common truthy/falsy strings like 'yes', 'no', 'true', 'false', etc.
 * @param {string} s - The string to parse
 * @returns {boolean} The parsed boolean value
 */
const parseBoolean = (s) => {
  s = s.toLowerCase();
  if (TRUE_STRINGS.has(s)) {
    return true;
  }
  if (FALSE_STRINGS.has(s)) {
    return false;
  }
  return Boolean(s);
};

/**
 * Parses a string to a decimal number like how Zapier production does.
 * Extracts numeric characters and handles various number formats.
 * @param {string} s - The string to parse
 * @returns {number} The parsed decimal number
 */
const parseDecimal = (s) => {
  const chars = [];
  for (const c of s) {
    if (NUMBER_CHARSET.includes(c)) {
      chars.push(c);
    }
  }
  const cleaned = chars.join('').replace(/[.,-]$/, '');
  return parseFloat(cleaned);
};

/**
 * Parses a string to an integer.
 * Falls back to parseDecimal if parseInt fails.
 * @param {string} s - The string to parse
 * @returns {number} The parsed integer
 */
const parseInteger = (s) => {
  const n = parseInt(s);
  if (!isNaN(n)) {
    return n;
  }
  return Math.floor(parseDecimal(s));
};

/**
 * Parses a Unix timestamp string to an ISO datetime string.
 * Handles both seconds and milliseconds timestamps.
 * @param {string} dtString - String potentially containing a timestamp
 * @param {string} tzName - IANA timezone name
 * @returns {string|null} ISO datetime string or null if not a timestamp
 */
const parseTimestamp = (dtString, tzName) => {
  const match = dtString.match(/-?\d{10,14}/);
  if (!match) {
    return null;
  }

  dtString = match[0];
  let timestamp = parseInt(dtString);
  if (dtString.length <= 12) {
    timestamp *= 1000;
  }

  return DateTime.fromMillis(timestamp, { zone: tzName }).toFormat(
    "yyyy-MM-dd'T'HH:mm:ssZZ",
  );
};

/**
 * Checks if chrono parsing components contain time information.
 * @param {Object} parsingComps - Chrono parsing components
 * @returns {boolean} True if time info is present
 */
const hasTimeInfo = (parsingComps) => {
  const tags = [...parsingComps.tags()];
  for (const tag of tags) {
    if (tag.includes('ISOFormat') || tag.includes('Time')) {
      return true;
    }
  }
  return false;
};

/**
 * Adds default time info (09:00:00) to parsing components if not present.
 * @param {Object} parsingComps - Chrono parsing components
 * @returns {Object} The modified parsing components
 */
const maybeImplyTimeInfo = (parsingComps) => {
  if (!hasTimeInfo(parsingComps)) {
    parsingComps.imply('hour', 9);
    parsingComps.imply('minute', 0);
    parsingComps.imply('second', 0);
    parsingComps.imply('millisecond', 0);
  }
  return parsingComps;
};

/**
 * Converts chrono parsing components to an ISO datetime string (without timezone).
 * @param {Object} parsingComps - Chrono parsing components
 * @returns {string} ISO datetime string like "2024-01-15T09:00:00"
 */
const parsingCompsToString = (parsingComps) => {
  const yyyy = parsingComps.get('year');
  const mm = String(parsingComps.get('month')).padStart(2, '0');
  const dd = String(parsingComps.get('day')).padStart(2, '0');
  const hh = String(parsingComps.get('hour')).padStart(2, '0');
  const ii = String(parsingComps.get('minute')).padStart(2, '0');
  const ss = String(parsingComps.get('second')).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${ii}:${ss}`;
};

/**
 * Parses a datetime string using chrono-node with timezone support.
 * Handles timestamps, natural language dates, and ISO formats.
 * @param {string} dtString - The datetime string to parse
 * @param {string} tzName - IANA timezone name
 * @param {Date} now - Reference date for relative parsing
 * @returns {string} ISO datetime string with timezone offset
 */
const parseDatetime = (dtString, tzName, now) => {
  const timestampResult = parseTimestamp(dtString, tzName);
  if (timestampResult) {
    return timestampResult;
  }

  const offset = IANAZone.create(tzName).offset(now.getTime());
  const results = chrono.parse(dtString, {
    instant: now,
    timezone: offset,
  });

  let isoString;
  if (results.length) {
    const parsingComps = results[0].start;
    if (parsingComps.get('timezoneOffset') == null) {
      // No timezone info in the input string => interpret the datetime string
      // exactly as it is and append the timezone
      isoString = parsingCompsToString(maybeImplyTimeInfo(parsingComps));
    } else {
      // Timezone info is present or implied in the input string => convert the
      // datetime to the specified timezone
      isoString = maybeImplyTimeInfo(parsingComps).date().toISOString();
    }
  } else {
    // No datetime info in the input string => just return the current time
    isoString = now.toISOString();
  }

  return DateTime.fromISO(isoString, { zone: tzName }).toFormat(
    "yyyy-MM-dd'T'HH:mm:ssZZ",
  );
};

/**
 * Resolves input data types based on field definitions.
 * Converts string values to appropriate types (integer, number, boolean, datetime).
 * Also applies default values for fields that have them.
 * @param {Object} inputData - The input data object (will be mutated)
 * @param {Array<Object>} inputFields - Array of field definitions with type info
 * @param {string} timezone - IANA timezone name for datetime parsing
 * @returns {Object} The mutated inputData object with resolved types
 */
const resolveInputDataTypes = (inputData, inputFields, timezone) => {
  const fieldsWithDefault = inputFields.filter((f) => f.default);
  for (const f of fieldsWithDefault) {
    if (!inputData[f.key]) {
      inputData[f.key] = f.default;
    }
  }

  const inputFieldsByKey = _.keyBy(inputFields, 'key');
  for (const [k, v] of Object.entries(inputData)) {
    const inputField = inputFieldsByKey[k];
    if (!inputField) {
      continue;
    }

    switch (inputField.type) {
      case 'integer':
        inputData[k] = parseInteger(v);
        break;
      case 'number':
        inputData[k] = parseDecimal(v);
        break;
      case 'boolean':
        inputData[k] = parseBoolean(v);
        break;
      case 'datetime':
        inputData[k] = parseDatetime(v, timezone, new Date());
        break;
      case 'file':
        // TODO: How to handle a file field?
        break;
      // TODO: Handle 'list' and 'dict' types?
      default:
        // No need to do anything with 'string' type
        break;
    }
  }

  // TODO: Handle line items (fields with "children")

  return inputData;
};

module.exports = resolveInputDataTypes;

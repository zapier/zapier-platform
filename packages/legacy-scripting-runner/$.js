'use strict';

const _ = require('lodash');
const cheerio = require('cheerio');
const xmldom = require('xmldom');

const DOMParser = xmldom.DOMParser;

const $ = cheerio.load('<html></html>');

$.param = require('jquery-param');

$.parseXML = data => {
  if (!data || typeof data !== 'string') {
    return null;
  }

  let xml;

  try {
    xml = new DOMParser().parseFromString(data, 'text/xml');
  } catch (e) {
    // We can safely ignore this
  }

  if (
    !xml ||
    !xml.documentElement ||
    xml.getElementsByTagName('parsererror').length
  ) {
    throw new Error(`Invalid XML: ${data}`);
  }

  return xml;
};

$.inArray = (elem, arr, i) => arr.indexOf(elem, i);
$.isArray = Array.isArray;
$.isEmptyObject = _.isEmpty;
$.isFunction = _.isFunction;
$.isNumeric = _.isNumber;
$.isPlainObject = _.isPlainObject;
$.parseJSON = JSON.parse;
$.trim = _.trim;
$.extend = _.extend;

$.type = obj => {
  if (obj == null) {
    return obj + '';
  }
  if (Array.isArray(obj)) {
    return 'array';
  }
  return typeof obj;
};

$.each = (arr, func) => {
  arr.forEach((elem, i) => func.bind(elem)(i, elem));
};

module.exports = $;

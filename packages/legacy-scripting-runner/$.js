'use strict';

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

module.exports = $;

'use strict';

const xmldom = require('xmldom');
const jQueryParam = require('node-jquery-param');
const DOMParser = xmldom.DOMParser;

const $ = {
  param: jQueryParam,
  parseXML: (data) => {
    if (!data || typeof data !== 'string') {
      return null;
    }

    let xml;

    try {
      xml = new DOMParser().parseFromString(data, 'text/xml');
    } catch (e) {
      // We can safely ignore this
    }

    if (!xml || !xml.documentElement || xml.getElementsByTagName('parsererror').length) {
      throw new Error(`Invalid XML: ${data}`);
    }

    return xml;
  },
};

module.exports = $;

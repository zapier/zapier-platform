const jQuery = require('jquery');
const { DOMParser } = require('@xmldom/xmldom');
const { jsdom } = require('jsdom');

const window = jsdom().defaultView;
window.DOMParser = DOMParser;

const $ = jQuery(window);

$.parseXML = (data) => {
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

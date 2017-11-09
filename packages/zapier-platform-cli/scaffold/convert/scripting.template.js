'use strict';

// START: HEADER -- AUTOMATICALLY ADDED FOR COMPATIBILITY - v<%= VERSION %>
const _ = require('lodash');
_.templateSettings.interpolate = /{{([\s\S]+?)}}/g;
const crypto = require('crypto');
const async = require('async');
const moment = require('moment-timezone');
const { DOMParser, XMLSerializer } = require('xmldom');
const atob = require('zapier-platform-legacy-scripting-runner/atob');
const btoa = require('zapier-platform-legacy-scripting-runner/btoa');
const z = require('zapier-platform-legacy-scripting-runner/z');
const $ = require('zapier-platform-legacy-scripting-runner/$');
const {
  ErrorException,
  HaltedException,
  StopRequestException,
  ExpiredAuthException,
  RefreshTokenException,
  InvalidSessionException,
} = require('zapier-platform-legacy-scripting-runner/exceptions');
// END: HEADER -- AUTOMATICALLY ADDED FOR COMPATIBILITY - v<%= VERSION %>

<%= CODE %>

// START: FOOTER -- AUTOMATICALLY ADDED FOR COMPATIBILITY - v<%= VERSION %>
module.exports = Zap;
// END: FOOTER -- AUTOMATICALLY ADDED FOR COMPATIBILITY - v<%= VERSION %>

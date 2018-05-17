'use strict';

const ZapierPromise = require('bluebird').getNewLibraryCopy();

if (!process.env.DISABLE_LONG_STACK_TRACES) {
  ZapierPromise.config({
    longStackTraces: true
  });
}

// Make a pretty message for your error using the frameStack. Must mutate
const enrichErrorMessage = (err, frameStack) => {
  if (frameStack.length === 0) {
    return;
  }
  const details = frameStack.map(f => `  ${f}`).join('\n');
  try {
    err.message = `${err.message}\nWhat happened:\n${details}\n  ${
      err.message
    }`;
  } catch (e) {
    // Do nothing
  }
};

// Because reject callbacks stack, we have to skip errors we've already seen.
const contextifyOnce = (err, attachErrorTrace, frameStack) => {
  if (!err || err.isContextified) {
    return err;
  }

  Object.defineProperty(err, 'isContextified', {
    value: true,
    enumerable: false
  });

  // Preserve original stack. Bluebird defines a dynamic 'err.stack' property
  // which puts 'err.message' (also a dynamic prop) at the front of the stack.
  // We don't want that - we want to modify err.message, but not err.stack.
  // So, define our own stack prop that returns the original stack.
  Object.defineProperty(err, 'stack', {
    value: err.stack,
    enumerable: false,
    writable: false
  });

  attachErrorTrace = attachErrorTrace || enrichErrorMessage;
  attachErrorTrace(err, frameStack);
  return err;
};

const find_boundTo = promise => {
  if (promise._boundTo) {
    return promise._boundTo;
  } else if (promise._promise0) {
    return find_boundTo(promise._promise0);
  } else {
    return undefined;
  }
};

// Bluebird already does some fancy footwork here - so let's just hijack it... kinda!
// See longStackTracesAttachExtraTrace in Bluebird's src/debuggability.js for more.
const _attachExtraTrace = ZapierPromise.prototype._attachExtraTrace;
ZapierPromise.prototype._attachExtraTrace = function(error, ignoreSelf) {
  const _boundTo = find_boundTo(this);
  if (_boundTo && _boundTo.isContext && _boundTo.attachErrorTraceOnce) {
    _boundTo.attachErrorTraceOnce(error);
  }
  _attachExtraTrace.call(this, error, ignoreSelf);
};

// Expose a this.pushStack() in promises, and always wrap an error from a promise chain.
ZapierPromise.makeContext = function(attachErrorTrace) {
  const frameStack = [];
  const attachErrorTraceOnce = err =>
    contextifyOnce(err, attachErrorTrace, frameStack);
  return {
    isContext: true,
    frameStack: frameStack,
    addContext(msg) {
      frameStack.push(msg);
    },
    attachErrorTraceOnce: attachErrorTraceOnce
  };
};

/*
  Globally replace native Promise with bluebird Promise. Native
  promises don't work reliably with domains; bluebird does.

  If we start using babel, be careful - babel might blow the global
  promise away. See https://github.com/petkaantonov/bluebird/issues/1026#issuecomment-221238870.

  If that happens, this might fix it:
  require('babel-runtime/core-js/promise').default = require('zapier-platform-core').ZapierPromise;
*/
const patchGlobal = () => {
  if (global._PromisePatched) {
    return;
  }
  global.Promise = ZapierPromise;
  global._PromisePatched = true;
};
ZapierPromise.patchGlobal = patchGlobal;

module.exports = ZapierPromise;

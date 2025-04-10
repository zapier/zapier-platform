import AfterMiddlewarePPlugin from './propertyPlugins/afterMiddlewarePPlugin.ts';
import BeforeMiddlewarePPlugin from './propertyPlugins/beforeMiddlewarePPlugin.ts';
import InterfacePlugin from './interfacePlugin.ts';
import PerformFunctionPlugin from './performFunctionPlugin.ts';

// Create new Top Level or Property plugins in this directory, and register
// them here.

export const TOP_LEVEL_PLUGINS = [
  new InterfacePlugin(),
  new PerformFunctionPlugin(),
];

export const INTERFACE_PROPERTY_PLUGINS = [
  new BeforeMiddlewarePPlugin(),
  new AfterMiddlewarePPlugin(),
];

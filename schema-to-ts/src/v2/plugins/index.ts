import AfterMiddlewarePPlugin from './propertyPlugins/afterMiddlewarePPlugin.ts';
import BeforeMiddlewarePPlugin from './propertyPlugins/beforeMiddlewarePPlugin.ts';
import DynamicInputsPlugin from './dynamicInputsPlugin.ts';
import InterfacePlugin from './interfacePlugin.ts';
import PerformFunctionPlugin from './performFunctionPlugin.ts';
import TypeArgsBasicPollingOperationPlugin from './TypeArgsBasicPollingOperationPlugin.ts';
import TypeArgsTriggerPlugin from './TypeArgsAndSplitTriggersPlugin.ts';

// Create new Top Level or Property plugins in this directory, and register
// them here.

export const TOP_LEVEL_PLUGINS = [
  new TypeArgsBasicPollingOperationPlugin(),
  new TypeArgsTriggerPlugin(),
  new DynamicInputsPlugin(),
  new InterfacePlugin(),
  new PerformFunctionPlugin(),
];

export const INTERFACE_PROPERTY_PLUGINS = [
  new BeforeMiddlewarePPlugin(),
  new AfterMiddlewarePPlugin(),
];

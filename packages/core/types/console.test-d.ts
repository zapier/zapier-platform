import { expectType } from 'tsd';
import { console } from '..';

// Test that console is exported and has the right type
expectType<Console>(console);

// Test that console has expected methods with proper signatures
expectType<{
  (...data: any[]): void;
  (message?: any, ...optionalParams: any[]): void;
}>(console.log);
expectType<{
  (...data: any[]): void;
  (message?: any, ...optionalParams: any[]): void;
}>(console.error);
expectType<{
  (...data: any[]): void;
  (message?: any, ...optionalParams: any[]): void;
}>(console.warn);

// Test that console can be used for logging
console.log('test message');
console.error('test error');
console.warn('test warning');
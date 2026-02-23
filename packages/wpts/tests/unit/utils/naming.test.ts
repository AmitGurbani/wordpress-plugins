import { describe, it, expect } from 'vitest';
import {
  toSlugCase,
  toSnakeCase,
  toPascalCase,
  toWPClassName,
  toConstantPrefix,
  toFunctionPrefix,
  toPhpFunctionName,
  toFilePrefix,
  toTextDomain,
} from '../../../src/utils/naming.js';

describe('toSlugCase', () => {
  it('converts PascalCase', () => {
    expect(toSlugCase('MyAwesomePlugin')).toBe('my-awesome-plugin');
  });

  it('converts space-separated words', () => {
    expect(toSlugCase('Hello World Plugin')).toBe('hello-world-plugin');
  });

  it('converts camelCase', () => {
    expect(toSlugCase('greetingMessage')).toBe('greeting-message');
  });

  it('converts snake_case', () => {
    expect(toSlugCase('hello_world')).toBe('hello-world');
  });

  it('handles already slug-case', () => {
    expect(toSlugCase('hello-greeter')).toBe('hello-greeter');
  });

  it('handles consecutive uppercase (acronyms)', () => {
    expect(toSlugCase('HTMLParser')).toBe('html-parser');
  });
});

describe('toSnakeCase', () => {
  it('converts camelCase', () => {
    expect(toSnakeCase('greetingMessage')).toBe('greeting_message');
  });

  it('converts PascalCase', () => {
    expect(toSnakeCase('MyAwesomePlugin')).toBe('my_awesome_plugin');
  });

  it('converts slug-case', () => {
    expect(toSnakeCase('hello-world')).toBe('hello_world');
  });

  it('converts space-separated', () => {
    expect(toSnakeCase('Hello World')).toBe('hello_world');
  });

  it('handles appendGreeting', () => {
    expect(toSnakeCase('appendGreeting')).toBe('append_greeting');
  });

  it('handles already snake_case', () => {
    expect(toSnakeCase('hello_world')).toBe('hello_world');
  });
});

describe('toPascalCase', () => {
  it('converts slug-case', () => {
    expect(toPascalCase('hello-world-plugin')).toBe('HelloWorldPlugin');
  });

  it('converts snake_case', () => {
    expect(toPascalCase('my_awesome_plugin')).toBe('MyAwesomePlugin');
  });

  it('converts space-separated', () => {
    expect(toPascalCase('greeting message')).toBe('GreetingMessage');
  });
});

describe('toWPClassName', () => {
  it('converts PascalCase to WP class name', () => {
    expect(toWPClassName('HelloGreeter')).toBe('Hello_Greeter');
  });

  it('converts multi-word PascalCase', () => {
    expect(toWPClassName('MyAwesomePlugin')).toBe('My_Awesome_Plugin');
  });

  it('converts from slug-case', () => {
    expect(toWPClassName('hello-greeter')).toBe('Hello_Greeter');
  });
});

describe('toConstantPrefix', () => {
  it('creates constant prefix from name', () => {
    expect(toConstantPrefix('Hello Greeter')).toBe('HELLO_GREETER_');
  });

  it('creates from slug-case', () => {
    expect(toConstantPrefix('my-awesome-plugin')).toBe('MY_AWESOME_PLUGIN_');
  });
});

describe('toFunctionPrefix', () => {
  it('creates function prefix from name', () => {
    expect(toFunctionPrefix('Hello Greeter')).toBe('hello_greeter_');
  });

  it('creates from PascalCase', () => {
    expect(toFunctionPrefix('MyAwesomePlugin')).toBe('my_awesome_plugin_');
  });
});

describe('toPhpFunctionName', () => {
  it('converts camelCase WP functions', () => {
    expect(toPhpFunctionName('getOption')).toBe('get_option');
    expect(toPhpFunctionName('wpEnqueueScript')).toBe('wp_enqueue_script');
    expect(toPhpFunctionName('escHtml')).toBe('esc_html');
    expect(toPhpFunctionName('addOption')).toBe('add_option');
    expect(toPhpFunctionName('isSingle')).toBe('is_single');
  });
});

describe('toFilePrefix', () => {
  it('creates file prefix from name', () => {
    expect(toFilePrefix('Hello Greeter')).toBe('hello-greeter');
  });

  it('creates from PascalCase', () => {
    expect(toFilePrefix('MyAwesomePlugin')).toBe('my-awesome-plugin');
  });
});

describe('toTextDomain', () => {
  it('creates text domain from name', () => {
    expect(toTextDomain('Hello Greeter')).toBe('hello-greeter');
  });
});

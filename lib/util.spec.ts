import { describe, it, expect } from 'bun:test';
import * as util from './util.ts';

describe('util', () => {
  describe('setIn', () => {
    it('should set object for 2 elem array', () => {
      expect(util.setIn({}, ['a', 'b'])).toEqual({
        a: 'b',
      });
      expect(util.setIn({}, ['a', { l: 1 }])).toEqual({
        a: { l: 1 },
      });
    });

    it('should set object for more than 2 elem array', () => {
      expect(util.setIn({}, ['a', 'b', 'c'])).toEqual({
        a: {
          b: 'c',
        },
      });

      expect(util.setIn({}, ['a', 'b', 1])).toEqual({
        a: {
          b: 1,
        },
      });
    });
  });
});

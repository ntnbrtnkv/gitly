import { describe, it, expect } from 'bun:test';
import * as config from './config.ts';

describe('config', () => {
  describe('objToStr', () => {
    it('should convert object config to string', () => {
      expect(
        config.objToStr({
          core: {
            '': {
              repositoryformatversion: '0',
              filemode: 'false',
              bare: 'false',
              logallrefupdates: 'true',
              symlinks: 'false',
              ignorecase: 'true',
            },
          },
        })
      ).toEqual(
        '[core]\n' +
          '\trepositoryformatversion = 0\n' +
          '\tfilemode = false\n' +
          '\tbare = false\n' +
          '\tlogallrefupdates = true\n' +
          '\tsymlinks = false\n' +
          '\tignorecase = true\n'
      );

      expect(
        config.objToStr({
          core: {
            '': {
              bare: true,
            },
          },
        })
      ).toEqual('[core]\n\tbare = true\n');
    });
  });

  describe('strToObj', () => {
    it('should convert string config to object', () => {
      expect(
        config.strToObj(
          '[core]\n' +
            '\trepositoryformatversion = 0\n' +
            '\tfilemode = false\n' +
            '\tbare = false\n' +
            '\tlogallrefupdates = true\n' +
            '\tsymlinks = false\n' +
            '\tignorecase = true\n'
        )
      ).toEqual({
        remote: {},
        core: {
          '': {
            repositoryformatversion: '0',
            filemode: 'false',
            bare: 'false',
            logallrefupdates: 'true',
            symlinks: 'false',
            ignorecase: 'true',
          },
        },
      });
    });
  });
});

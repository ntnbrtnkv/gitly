import * as nodePath from 'node:path';
import * as files from './files.ts';
import * as util from './util.ts';

export const write = (str: string) => {
  files.write(nodePath.join(files.gitPath(), files.OBJECTS_DIR, util.hash(str)), str);
  return util.hash(str);
};

import * as refs from './refs.ts';
import * as files from './files.ts';

export const isMergeInProgress = () => {
  return refs.hash(files.MERGE_HEAD_FILE);
};

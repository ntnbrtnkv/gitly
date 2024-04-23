import * as fs from 'node:fs';
import * as nodePath from 'node:path';
import * as files from './files.ts';
import * as index from './index.ts';
import * as refs from './refs.ts';
import * as objects from './objects.ts';
import * as diff from './diff.ts';
import * as util from './util.ts';

const untracked = () => {
  const toc = index.toc();

  const rootFiles = fs
    .readdirSync(files.workingCopyPath())
    .filter((p) => toc[p] === undefined && p !== files.GITLY_DIR);

  const allFiles = rootFiles.reduce((acc, p) => {
    if (fs.statSync(p).isDirectory()) {
      return [
        ...acc,
        ...fs
          .readdirSync(p, { recursive: true })
          .filter((f) => !fs.statSync(nodePath.join(p, f)).isDirectory())
          .map((f: any) => nodePath.join(p, f)),
      ];
    } else {
      return [...acc, p];
    }
  }, []);

  return allFiles.filter((p) => toc[p] === undefined);
};

const toBeCommitted = () => {
  const headHash = refs.hash(files.HEAD_FILE);
  const headToc = headHash === undefined ? {} : objects.commitToc(headHash);
  const ns = diff.nameStatus(diff.tocDiff(headToc, index.toc()));
  return Object.keys(ns).map((p) => `${ns[p]} ${p}`);
};

const notStagedForCommit = () => {
  const ns = diff.nameStatus(diff.diff());
  return Object.keys(ns).map((p) => `${ns[p]} ${p}`);
};

const listing = (heading: string, lines: string[]) => {
  return lines.length > 0 ? [heading, lines] : [];
};

export const toString = () => {
  return util
    .flatten([
      'On branch ' + refs.headBranchName(),
      listing('Untracked files:', untracked()),
      listing('Unmerged paths:', index.conflictedPaths()),
      listing('Changes to be committed:', toBeCommitted()),
      listing('Changes not staged for commit:', notStagedForCommit()),
    ])
    .join('\n');
};

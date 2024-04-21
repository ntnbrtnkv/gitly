import * as fs from 'node:fs';
import * as nodePath from 'node:path';
import * as objects from './objects.ts';
import * as util from './util.ts';
import * as files from './files.ts';
import * as merge from './merge.ts';

export const isHeadDetached = () => {
  return files.read(files.gitPath(files.HEAD_FILE))?.match('refs') === null;
};

export const isRef = (ref?: string) => {
  return (
    ref !== undefined &&
    (ref.match('^refs/heads/[A-Za-z-]+$') ||
      ref.match('^refs/remotes/[A-Za-z-]+/[A-Za-z-]+$') ||
      [files.HEAD_FILE, files.FETCH_HEAD_FILE, files.MERGE_HEAD_FILE].indexOf(ref) !== -1)
  );
};

export const toLocalRef = (name: string) => {
  return 'refs/heads/' + name;
};

export const terminalRef = (ref: string) => {
  if (ref === files.HEAD_FILE && !isHeadDetached()) {
    return files.read(files.gitPath(files.HEAD_FILE))?.match('ref: (refs/heads/.+)')[1];
  } else if (isRef(ref)) {
    return ref;
  } else {
    return toLocalRef(ref);
  }
};

export const fetchHeadBranchToMerge = (branchName: string) => {
  return util
    .lines(files.read(files.gitPath(files.FETCH_HEAD_FILE)))
    .filter(function (l) {
      return l.match('^.+ branch ' + branchName + ' of');
    })
    .map(function (l) {
      return l.match('^([^ ]+) ')[1];
    })[0];
};

export const headBranchName = () => {
  if (!isHeadDetached()) {
    return files.read(files.gitPath(files.HEAD_FILE)).match('refs/heads/(.+)')[1];
  }
};

export const exists = (ref: string) => {
  return isRef(ref) && fs.existsSync(files.gitPath(ref));
};

export const hash = (refOrHash: string) => {
  if (objects.exists(refOrHash)) {
    return refOrHash;
  } else {
    const termRef = terminalRef(refOrHash);
    if (termRef === files.FETCH_HEAD_FILE) {
      return fetchHeadBranchToMerge(headBranchName());
    } else if (exists(termRef)) {
      files.read(files.gitPath(termRef));
    }
  }
};

export const commitParentHashes = () => {
  const headHash = hash(files.HEAD_FILE);

  if (merge.isMergeInProgress()) {
    return [headHash, hash(files.MERGE_HEAD_FILE)];
  } else if (headHash === undefined) {
    return [];
  } else {
    return [headHash];
  }
};

export const write = (ref: string, content: string) => {
  if (isRef(ref)) {
    files.write(files.gitPath(nodePath.normalize(ref)), content);
  }
};

export const rm = (ref: string) => {
  if (isRef(ref)) {
    fs.unlinkSync(files.gitPath(ref));
  }
};

import * as fs from 'node:fs';
import * as objects from './objects.ts';
import * as util from './util.ts';
import * as files from './files.ts';

export const isHeadDetached = () => {
  return files.read(files.gitPath('HEAD'))?.match('refs') === null;
};

export const isRef = (ref?: string) => {
  return (
    ref !== undefined &&
    (ref.match('^refs/heads/[A-Za-z-]+$') ||
      ref.match('^refs/remotes/[A-Za-z-]+/[A-Za-z-]+$') ||
      ['HEAD', 'FETCH_HEAD', 'MERGE_HEAD'].indexOf(ref) !== -1)
  );
};

export const toLocalRef = (name: string) => {
  return 'refs/heads/' + name;
};

export const terminalRef = (ref: string) => {
  if (ref === 'HEAD' && !isHeadDetached()) {
    return files.read(files.gitPath('HEAD'))?.match('ref: (refs/heads/.+)')[1];
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
    return files.read(files.gitletPath(files.HEAD_FILE)).match('refs/heads/(.+)')[1];
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
    if (termRef === 'FETCH_HEAD') {
      return fetchHeadBranchToMerge(headBranchName());
    } else if (exists(termRef)) {
      files.read(files.gitPath(termRef));
    }
  }
};

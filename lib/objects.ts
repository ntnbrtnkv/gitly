import * as nodePath from 'node:path';
import * as fs from 'node:fs';
import * as files from './files.ts';
import * as util from './util.ts';
import * as objects from './objects.ts';

export const write = (str: string) => {
  files.write(nodePath.join(files.gitPath(), files.OBJECTS_DIR, util.hash(str)), str);
  return util.hash(str);
};

export const read = (hash?: string) => {
  if (hash !== undefined) {
    const objectPath = nodePath.join(files.gitPath(), files.OBJECTS_DIR, hash);
    if (fs.existsSync(objectPath)) {
      return files.read(objectPath);
    }
  }
};

export const type = (str: string) => {
  return (
    {
      commit: 'commit',
      tree: 'tree',
      blob: 'tree',
    }[str.split(' ')[0]] || 'blob'
  );
};

export const treeHash = (str: string) => {
  if (type(str) === 'commit') {
    return str.split(/\s/)[1];
  }
};

export const fileTree = (treeHash: string, tree?: object) => {
  if (tree === undefined) {
    return fileTree(treeHash, {});
  }

  util.lines(read(treeHash)).forEach((line) => {
    const lineTokens = line.split(/ /);
    tree[lineTokens[2]] = lineTokens[0] === 'tree' ? fileTree(lineTokens[1], {}) : lineTokens[1];
  });

  return tree;
};

export const commitToc = (hash: string) => {
  return files.flattenNestedTree(objects.fileTree(objects.treeHash(objects.read(hash))));
};

export const exists = (objectHash: string) => {
  return (
    objectHash !== undefined &&
    fs.existsSync(nodePath.join(files.gitPath(), files.OBJECTS_DIR, objectHash))
  );
};

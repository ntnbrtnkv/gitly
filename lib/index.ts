import * as fs from 'node:fs';
import * as files from './files.ts';
import * as util from './util.ts';
import * as objects from './objects.ts';

export const key = (path: string, stage: string | number | undefined) => {
  return `${path},${stage}`;
};

export const read = () => {
  const indexFilePath = files.gitPath(files.INDEX_FILE);

  return util
    .lines(fs.existsSync(indexFilePath) ? files.read(indexFilePath) : '\n')
    .reduce((idx, blobSrt) => {
      const blobData = blobSrt.split(/ /);
      const ref = blobData.pop();
      const stage = blobData.pop();
      idx[key(blobData.join(' '), stage)] = ref;
      return idx;
    }, {});
};

export const write = (index) => {
  const indexStr =
    Object.keys(index)
      .map((k) => {
        const [path, stage] = k.split(',');
        return `${path} ${stage} ${index[k]}`;
      })
      .join('\n') + '\n';
  files.write(files.gitPath(files.INDEX_FILE), indexStr);
};

export const hasFile = (path: string, stage: number) => {
  return read()[key(path, stage)] !== undefined;
};

export const isFileInConflict = (path: string) => {
  return hasFile(path, 2);
};

export const writeRm = (path: string) => {
  const idx = read();

  [0, 1, 2, 3].forEach((stage) => {
    delete idx[key(path, stage)];
  });

  write(idx);
};

const writeStageEntry = (path: string, stage: number, content: string) => {
  const idx = read();
  idx[key(path, stage)] = objects.write(content);
  write(idx);
};

export const writeNonConflict = (path: string, content: string) => {
  writeRm(path);
  writeStageEntry(path, 0, content);
};

export const toc = () => {
  const idx = read();
  return Object.keys(idx).reduce((acc, k) => {
    return util.setIn(acc, [k.split(',')[0], idx[k]]);
  }, {});
};

export const matchingFiles = (pathSpec: string) => {
  const searchPath = files.pathFromRepoRoot(pathSpec);
  return Object.keys(toc()).filter((p) => p.match('^' + searchPath.replace(/\\/g, '\\\\')));
};

export const workingCopyToc = () => {
  return Object.keys(read())
    .map(function (k) {
      return k.split(',')[0];
    })
    .filter(function (p) {
      return fs.existsSync(files.workingCopyPath(p));
    })
    .reduce(function (idx, p) {
      idx[p] = util.hash(files.read(files.workingCopyPath(p)));
      return idx;
    }, {});
};

export const keyPieces = (key: string) => {
  const pieces = key.split(/,/);
  return { path: pieces[0], stage: parseInt(pieces[1]) };
};

export const conflictedPaths = () => {
  const idx = read();
  return Object.keys(idx)
    .filter((k) => keyPieces(k).stage === 2)
    .map((k) => keyPieces(k).path);
};

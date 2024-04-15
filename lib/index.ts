import * as fs from 'node:fs';
import * as files from './files.ts';
import * as util from './util.ts';
import * as objects from './objects.ts';

export const key = (path: string, stage: string | number) => {
  return `${path},${stage}`;
};

export const read = () => {
  const indexFilePath = files.gitPath(files.INDEX_FILE);

  return util
    .lines(fs.existsSync(indexFilePath) ? files.read(indexFilePath) : '\n')
    .reduce((idx, blobSrt) => {
      const blobData = blobSrt.split(/ /);
      idx[key(blobData[0], blobData[1])] = blobData[2];
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

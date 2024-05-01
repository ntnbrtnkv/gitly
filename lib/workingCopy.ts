import * as fs from 'node:fs';
import * as objects from './objects.ts';
import * as diff from './diff.ts';
import * as files from './files.ts';

export const write = (dif: string) => {
  function composeConflict(receiverFileHash, giverFileHash) {
    return (
      '<<<<<<\n' +
      objects.read(receiverFileHash) +
      '\n======\n' +
      objects.read(giverFileHash) +
      '\n>>>>>>\n'
    );
  }

  Object.keys(dif).forEach(function (p) {
    if (dif[p].status === diff.FILE_STATUS.ADD) {
      files.write(files.workingCopyPath(p), objects.read(dif[p].receiver || dif[p].giver));
    } else if (dif[p].status === diff.FILE_STATUS.CONFLICT) {
      files.write(files.workingCopyPath(p), composeConflict(dif[p].receiver, dif[p].giver));
    } else if (dif[p].status === diff.FILE_STATUS.MODIFY) {
      files.write(files.workingCopyPath(p), objects.read(dif[p].giver));
    } else if (dif[p].status === diff.FILE_STATUS.DELETE) {
      fs.unlinkSync(files.workingCopyPath(p));
    }
  });

  fs.readdirSync(files.workingCopyPath())
    .filter((n) => n !== files.GITLY_DIR)
    .forEach(files.rmEmptyDirs);
};

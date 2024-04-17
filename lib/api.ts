import * as fs from 'node:fs';
import * as files from './files.ts';
import * as config from './config.ts';
import * as index from './index.ts';
import * as util from './util.ts';
import * as diff from './diff.ts';

const api = {
  init(opts: Record<string, any> = {}) {
    if (files.inRepo()) {
      return;
    }

    const gitlyStruct = {
      HEAD: 'ref: refs/heads/master\n',
      objects: {},
      refs: {
        heads: {},
      },
      config: config.objToStr({
        core: {
          '': {
            bare: opts.bare === true,
          },
        },
      }),
    };

    files.writeFilesFromTree(
      opts.bare ? gitlyStruct : { [files.GITLY_DIR]: gitlyStruct },
      process.cwd()
    );
  },

  add(path: string, _: any) {
    files.assertInRepo();
    config.assertNotBare();

    const addedFiles = files.lsRecursive(path).filter((file) => !files.isInGitPath(file));

    if (addedFiles.length === 0) {
      throw new Error(files.pathFromRepoRoot(path) + ' did not match any files');
    } else {
      addedFiles.forEach((p) => {
        api.update_index(p, {
          add: true,
        });
      });
    }
  },

  rm(path: string, opts: { f?: boolean; r?: boolean } = {}) {
    files.assertInRepo();
    config.assertNotBare();

    const filesToRm = index.matchingFiles(path);

    if (opts.f) {
      throw new Error('unsupported');
    } else if (filesToRm.length === 0) {
      throw new Error(files.pathFromRepoRoot(path) + ' did not match any files');
    } else if (fs.existsSync(path) && fs.statSync(path).isDirectory() && !opts.r) {
      throw new Error('not removing ' + path + ' recursively without -r');
    } else {
      const changesToRm = util.intersection(diff.addedOrModifiedFiles(), filesToRm);
      if (changesToRm.length > 0) {
        throw new Error('these files have changes:\n' + changesToRm.join('\n') + '\n');
      } else {
        filesToRm.map(files.workingCopyPath).filter(fs.existsSync).forEach(fs.unlinkSync);
        filesToRm.forEach((p) => api.update_index(p, { remove: true }));
      }
    }
  },

  update_index(path: string, opts: { add?: boolean; remove?: boolean } = {}) {
    files.assertInRepo();
    config.assertNotBare();

    const pathFromRoot = files.pathFromRepoRoot(path);
    const isOnDisk = fs.existsSync(path);
    const isInIndex = index.hasFile(path, 0);

    if (isOnDisk && fs.statSync(path).isDirectory()) {
      throw new Error(pathFromRoot + ' is a directory - add files inside');
    } else if (opts.remove && !isOnDisk && isInIndex) {
      if (index.isFileInConflict(path)) {
        throw new Error('unsupported');
      } else {
        index.writeRm(path);
        return '\n';
      }
    } else if (opts.remove && !isOnDisk && !isInIndex) {
      return '\n';
    } else if (!opts.add && isOnDisk && !isInIndex) {
      throw new Error('cannot add ' + pathFromRoot + ' to index - use --add option\n');
    } else if (isOnDisk && (opts.add || isInIndex)) {
      index.writeNonConflict(path, files.read(files.workingCopyPath(path)));
      return '\n';
    } else if (!opts.remove && !isOnDisk) {
      throw new Error(pathFromRoot + ' does not exist and --remove not passed\n');
    }
  },
};

export default api;

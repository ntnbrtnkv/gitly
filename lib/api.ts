import * as fs from 'node:fs';
import * as files from './files.ts';
import * as config from './config.ts';
import * as index from './index.ts';
import * as util from './util.ts';
import * as diff from './diff.ts';
import * as objects from './objects.ts';
import * as refs from './refs.ts';
import * as merge from './merge.ts';
import * as status from './status.ts';
import * as workingCopy from './workingCopy.ts';

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

  write_tree() {
    files.assertInRepo();
    return objects.writeTree(files.nestFlatTree(index.toc()));
  },

  status() {
    files.assertInRepo();
    config.assertNotBare();
    return status.toString();
  },

  log(ref: string | undefined, _: any) {
    files.assertInRepo();
    config.assertNotBare();

    const actualRef = ref || files.HEAD_FILE;

    if (actualRef !== undefined && refs.hash(actualRef) === undefined) {
      throw new Error('ambiguous argument ' + ref + ': unknown revision');
    } else {
      return refs.log(refs.hash(actualRef)).join('\n\n');
    }
  },

  branch(name?: string, opts?: {}) {
    files.assertInRepo();
    opts = opts || {};

    if (name === undefined) {
      return (
        Object.keys(refs.localHeads())
          .map((branch) => (branch === refs.headBranchName() ? '* ' : '  ') + branch)
          .join('\n') + '\n'
      );
    } else if (refs.hash(files.HEAD_FILE) === undefined) {
      throw new Error(refs.headBranchName() + ' not a valid object name');
    } else if (refs.exists(refs.toLocalRef(name))) {
      throw new Error('A branch named ' + name + ' already exists');
    } else {
      api.update_ref(refs.toLocalRef(name), refs.hash(files.HEAD_FILE));
    }
  },

  checkout(ref: string, _) {
    files.assertInRepo();
    config.assertNotBare();

    const toHash = refs.hash(ref);

    if (!objects.exists(toHash)) {
      throw new Error(ref + ' did not match any file(s) known to Gitly');
    } else if (objects.type(objects.read(toHash)) !== 'commit') {
      throw new Error('reference is not a tree: ' + ref);
    } else if (
      ref === refs.headBranchName() ||
      ref === files.read(files.gitPath(files.HEAD_FILE))
    ) {
      return 'Already on ' + ref;
    } else {
      const paths = diff.changedFilesCommitWouldOverwrite(toHash);

      if (paths.length > 0) {
        throw new Error('local changes would be lost\n' + paths.join('\n') + '\n');
      } else {
        process.chdir(files.workingCopyPath());

        const isDetachingHead = objects.exists(ref);

        workingCopy.write(diff.diff(refs.hash(files.HEAD_FILE), toHash));

        refs.write(files.HEAD_FILE, isDetachingHead ? toHash : 'ref: ' + refs.toLocalRef(ref));

        index.write(index.tocToIndex(objects.commitToc(toHash)));

        return isDetachingHead
          ? 'Note: checking out ' + toHash + '\nYou are in detached HEAD state.'
          : 'Switched to branch ' + ref;
      }
    }
  },

  diff(ref1: string | undefined, ref2: string | undefined, opts: {} = {}) {
    files.assertInRepo();
    config.assertNotBare();

    if (ref1 !== undefined && refs.hash(ref1) === undefined) {
      throw new Error('ambiguous argument ' + ref1 + ': unknown revision');
    } else if (ref2 !== undefined && refs.hash(ref2) === undefined) {
      throw new Error('ambiguous argument ' + ref2 + ': unknown revision');
    } else {
      const nameToStatus = diff.nameStatus(diff.diff(refs.hash(ref1), refs.hash(ref2)));

      return (
        Object.keys(nameToStatus)
          .map((path) => `${nameToStatus[path]} ${path}`)
          .join('\n') + '\n'
      );
    }
  },

  commit(opts: { m?: string } = {}) {
    files.assertInRepo();
    config.assertNotBare();

    const treeHash = api.write_tree();

    const headDesc = refs.isHeadDetached() ? 'detached HEAD' : refs.headBranchName();

    if (
      refs.hash(files.HEAD_FILE) !== undefined &&
      treeHash === objects.treeHash(objects.read(refs.hash(files.HEAD_FILE)))
    ) {
      throw new Error('# On ' + headDesc + '\nnothing to commit, working directory clean');
    } else {
      const conflictedPaths = index.conflictedPaths();
      if (merge.isMergeInProgress() && conflictedPaths > 0) {
        throw new Error(
          conflictedPaths
            .map(function (p) {
              return 'U ' + p;
            })
            .join('\n') + '\ncannot commit because you have unmerged files\n'
        );
      } else {
        const m = merge.isMergeInProgress()
          ? files.read(files.gitPath(files.MERGE_MSG_FILE))
          : opts.m;

        const commitHash = objects.writeCommit(treeHash, m, refs.commitParentHashes());

        api.update_ref(files.HEAD_FILE, commitHash);

        if (merge.isMergeInProgress()) {
          fs.unlinkSync(files.gitPath(files.MERGE_MSG_FILE));
          refs.rm(files.MERGE_HEAD_FILE);
          return 'Merge made by the three-way strategy';
        } else {
          return `[${headDesc} ${commitHash}] ${m}`;
        }
      }
    }
  },

  update_ref(refToUpdate: string, refToUpdateTo: string) {
    files.assertInRepo();

    const hash = refs.hash(refToUpdateTo);

    if (!objects.exists(hash)) {
      throw new Error(refToUpdateTo + ' not a valid SHA1');
    } else if (!refs.isRef(refToUpdate)) {
      throw new Error('cannot lock the ref ' + refToUpdate);
    } else if (objects.type(objects.read(hash)) !== 'commit') {
      const branch = refs.terminalRef(refToUpdate);
      throw new Error(branch + ' cannot refer to non-commit object ' + hash + '\n');
    } else {
      refs.write(refs.terminalRef(refToUpdate), hash);
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

import * as fs from 'node:fs';
import * as nodePath from 'node:path';
import * as util from './util.ts';

export const GITLY_DIR = '.gitly';
export const CONFIG_FILE = 'config';
export const INDEX_FILE = 'index';
export const OBJECTS_DIR = 'objects';

export const read = (path: string | undefined) => {
  if (path && fs.existsSync(path)) {
    return fs.readFileSync(path, 'utf-8');
  }
};

export const inRepo = () => {
  return gitPath() !== undefined;
};

export const assertInRepo = () => {
  if (!inRepo()) {
    throw new Error('not a Gitly repository');
  }
};

export const gitPath = (path?: string) => {
  function gitlyDir(dir: string) {
    if (fs.existsSync(dir)) {
      const configPath = nodePath.join(dir, CONFIG_FILE);
      const gitlyPath = nodePath.join(dir, GITLY_DIR);
      if (
        fs.existsSync(configPath) &&
        fs.statSync(configPath) &&
        read(configPath)?.match(/\[core\]/)
      ) {
        return dir;
      } else if (fs.existsSync(gitlyPath)) {
        return gitlyPath;
      } else if (dir !== nodePath.parse(dir).root) {
        return gitlyDir(nodePath.join(dir, '..'));
      }
    }
  }

  const gDir = gitlyDir(process.cwd());
  if (gDir !== undefined) {
    return nodePath.join(gDir, path || '');
  }
};

export const writeFilesFromTree = (tree: Record<string, any>, prefix: string) => {
  Object.keys(tree).forEach((name) => {
    const path = nodePath.join(prefix, name);
    if (util.isString(tree[name])) {
      fs.writeFileSync(path, tree[name]);
    } else {
      if (!fs.existsSync(path)) {
        fs.mkdirSync(path, '777');
      }

      writeFilesFromTree(tree[name], path);
    }
  });
};

export const workingCopyPath = (path?: string) => {
  return nodePath.join(gitPath(), '..', path || '');
};

export const lsRecursive = (path: string) => {
  if (!fs.existsSync(path)) {
    return [];
  } else if (fs.statSync(path).isFile()) {
    return [path];
  } else if (fs.statSync(path).isDirectory()) {
    return fs
      .readdirSync(path)
      .reduce((acc, child) => acc.concat(lsRecursive(nodePath.join(path, child))), []);
  }
};

export const pathFromRepoRoot = (path: string) => {
  return nodePath.relative(workingCopyPath(), nodePath.join(process.cwd(), path));
};

export const write = (path: string, content: string) => {
  const prefix = process.platform === 'win32' ? '.' : '/';
  writeFilesFromTree(util.setIn({}, path.split(nodePath.sep).concat(content)), prefix);
};

export const isInGitPath = (path: string) => {
  console.log(path, GITLY_DIR);
  return path.includes(GITLY_DIR);
};

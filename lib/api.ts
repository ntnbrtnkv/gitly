import * as files from './files.ts';
import * as config from './config.ts';

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
};

export default api;

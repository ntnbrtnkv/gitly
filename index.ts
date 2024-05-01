const { default: api } = require('./lib/api.ts');

const SUPPORTED_COMMANDS = [
  'start a working area',
  '\tinit\tCreate an empty Git repository',
  '',
  'work on the current change',
  '\tadd\tAdd file contents to the index',
  '\trm\tRemove files from the working tree and from the index',
  '',
  'examine the history and state',
  '\tstatus\tShow the working tree status',
  '\tdiff\tShow changes between commits, commit and working tree, etc',
  '\tlog\tshow commit logs',
  '',
  'grow, mark and tweak your common history',
  '\tcommit\tRecord changes to the repository',
  '\tbranch\tList or create branches',
];

const parseOptions = (argv: string[]) => {
  let name: any;
  return argv.reduce(
    (opts, arg) => {
      if (arg.match(/^-/)) {
        name = arg.replace(/^-+/, '');
        opts[name] = true;
      } else if (name !== undefined) {
        opts[name] = arg;
        name = undefined;
      } else {
        opts._.push(arg);
      }

      return opts;
    },
    { _: [] } as {
      _: string[];
      [key: string]: any;
    }
  );
};

const runCli = (argv: string[]) => {
  const opts = parseOptions(argv);
  const commandName = opts._[2];

  if (commandName === undefined) {
    throw new Error('you must specify a Gitly command to run\n\n' + SUPPORTED_COMMANDS.join('\n'));
  } else {
    const commandFnName = commandName.replace(/-/g, '_');
    // @ts-ignore
    const fn = api[commandFnName];

    if (fn === undefined) {
      throw new Error("'" + commandFnName + "' is not a Gitly command");
    } else {
      const commandArgs: Array<string | undefined> = opts._.slice(3);
      while (commandArgs.length < fn.length - 1) {
        commandArgs.push(undefined);
      }

      // @ts-ignore
      return fn(...commandArgs.concat(opts));
    }
  }
};

try {
  const result = runCli(process.argv);
  if (result !== undefined) {
    console.log(result);
  }
} catch (e: any) {
  console.error(e.toString());
}

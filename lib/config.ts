import * as util from './util';
import * as files from './files';

export const read = () => {
  return strToObj(files.read(files.gitPath(files.CONFIG_FILE)) || '');
};

export const strToObj = (str: string) => {
  return str
    .split('[')
    .map((i: string) => i.trim())
    .filter((i: string) => i !== '')
    .reduce(
      (acc: Record<string, any>, i: string) => {
        const lines = i.split('\n');
        const entry: any[] = [];

        entry.push(lines[0].match(/([^ \]]+)( |\])/)?.[1] ?? '');

        const subsectionMatch = lines[0].match(/\"(.+)\"/);
        const subsection = subsectionMatch === null ? '' : subsectionMatch[1];
        entry.push(subsection);

        entry.push(
          lines.slice(1).reduce((s: Record<string, string>, l) => {
            s[l.split('=')[0].trim()] = l.split('=')[1].trim();
            return s;
          }, {})
        );

        return util.setIn(acc, entry);
      },
      {
        remote: {},
      }
    );
};

export const objToStr = (obj: any) => {
  return Object.keys(obj)
    .reduce(
      (arr: Array<{ section: string; subsection: string }>, section) =>
        arr.concat(
          Object.keys(obj[section]).map((subsection) => ({
            section,
            subsection,
          }))
        ),
      []
    )
    .map((entry) => {
      const subsection = entry.subsection === '' ? '' : ' "' + entry.subsection + '"';
      const settings = obj[entry.section][entry.subsection];
      return (
        '[' +
        entry.section +
        subsection +
        ']\n' +
        Object.keys(settings)
          .map(function (k) {
            return '\t' + k + ' = ' + settings[k];
          })
          .join('\n') +
        '\n'
      );
    })
    .join('\n');
};

export const isBare = () => {
  return read().core[''].bare === 'true';
};

export const assertNotBare = () => {
  if (isBare()) {
    throw new Error('this operation must be run in a work tree');
  }
};

import * as objects from './objects.ts';
import * as refs from './refs.ts';
import * as index from './index.ts';
import * as util from './util.ts';

export const FILE_STATUS = {
  ADD: 'A',
  MODIFY: 'M',
  DELETE: 'D',
  SAME: 'SAME',
  CONFLICT: 'CONFLICT',
};

export const tocDiff = (receiver?: object, giver?: object, base?: object) => {
  function fileStatus(receiver?: object, giver?: object, base?: object) {
    const receiverPresent = receiver !== undefined;
    const basePresent = base !== undefined;
    const giverPresent = giver !== undefined;

    if (receiverPresent && giverPresent && receiver !== giver) {
      if (receiver !== base && giver !== base) {
        return FILE_STATUS.CONFLICT;
      } else {
        return FILE_STATUS.MODIFY;
      }
    } else if (receiver === giver) {
      return FILE_STATUS.SAME;
    } else if (
      (!receiverPresent && !basePresent && giverPresent) ||
      (receiverPresent && !basePresent && !giverPresent)
    ) {
      return FILE_STATUS.ADD;
    } else if (
      (receiverPresent && basePresent && !giverPresent) ||
      (!receiverPresent && basePresent && giverPresent)
    ) {
      return FILE_STATUS.DELETE;
    }
  }

  base = base || receiver;

  const paths = Object.keys(receiver).concat(Object.keys(base)).concat(Object.keys(base));

  return util.unique(paths).reduce((idx, p) => {
    return util.setIn(idx, [
      p,
      {
        status: fileStatus(receiver[p], giver[p], base[p]),
        receiver: receiver[p],
        base: base[p],
        giver: giver[p],
      },
    ]);
  }, {});
};

export const nameStatus = (dif: object) => {
  return Object.keys(dif)
    .filter(function (p) {
      return dif[p].status !== FILE_STATUS.SAME;
    })
    .reduce(function (ns, p) {
      return util.setIn(ns, [p, dif[p].status]);
    }, {});
};

export const addedOrModifiedFiles = () => {
  const headToc = refs.hash('HEAD') ? objects.commitToc(refs.hash('HEAD')) : {};
  const wc = nameStatus(tocDiff(headToc, index.workingCopyToc()));
  return Object.keys(wc).filter((p) => {
    return wc[p] !== FILE_STATUS.DELETE;
  });
};

export const setIn = (obj: Record<string, any>, arr: any[]) => {
  if (arr.length === 2) {
    obj[arr[0]] = arr[1];
  } else if (arr.length > 2) {
    const o = obj[arr[0]] || {};
    obj[arr[0]] = o;
    setIn(o, arr.slice(1));
  }

  return obj;
};

export const isString = (o: unknown) => {
  return typeof o === 'string';
};

export const lines = (s: string) => {
  return s.split('\n').filter((l) => l !== '');
};

export const hash = (s: string) => {
  let hashInt = 0;

  for (let i = 0; i < s.length; i++) {
    hashInt = hashInt * 31 + s.charCodeAt(i);
    hashInt = hashInt | 0;
  }

  return Math.abs(hashInt).toString(16);
};

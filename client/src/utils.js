/* eslint-disable no-param-reassign */
export function completeAssign(target, ...sources) {
  sources.forEach((source) => {
    // eslint-disable-next-line no-shadow
    const descriptors = Object.keys(source).reduce((descriptors, key) => {
      // eslint-disable-next-line no-param-reassign
      descriptors[key] = Object.getOwnPropertyDescriptor(source, key);
      return descriptors;
    }, {});

    Object.getOwnPropertySymbols(source).forEach((sym) => {
      const descriptor = Object.getOwnPropertyDescriptor(source, sym);
      if (descriptor.enumerable) {
        descriptors[sym] = descriptor;
      }
    });

    Object.defineProperties(target, descriptors);
  });

  return target;
}

export function truncateCharsIfLonger(str, maxLength, extension = '') {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}${extension}`;
}

export function isEmptyObject(obj) {
  return Object.keys(obj).length === 0 && obj.constructor === Object;
}

export function checkOverflow(el) {
  const curOverflow = el.style.overflow;

  if (!curOverflow || curOverflow === 'visible') el.style.overflow = 'hidden';
  const isOverflowing = el.clientWidth < el.scrollWidth
      || el.clientHeight < el.scrollHeight;

  el.style.overflow = curOverflow;
  return isOverflowing;
}

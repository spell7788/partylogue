/* eslint-disable no-param-reassign */
import { checkOverflow } from '@/utils';

export default {
  componentUpdated(el, binding, vnode, oldVnode) {
    let verifiableElement = document.querySelector(binding.value);
    if (!verifiableElement) return;
    if (verifiableElement.length > 0) [verifiableElement] = verifiableElement;

    const isOverflowing = checkOverflow(verifiableElement);
    if (isOverflowing) {
      el.style.display = oldVnode.elm.style.display;
    } else {
      el.style.display = 'none';
    }
  },
};

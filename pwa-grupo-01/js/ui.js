/** Mini librería para trabajar con UI, inspirada por SolidJS */

/** @typedef {{run: () => void, deps: Set<Dependencies>}} Subscriber */
/** @typedef {Set<Subscriber>} Dependencies */

/** @type {Subscriber[]} */
const context = [];

/**
 * @template T
 * @param {T} value
 * @returns {[() => T, (value: T) => void]}
 */
export function createSignal(value) {
  /** @type {Dependencies} */
  const dependencies = new Set();
  /** @returns {T} */
  const read = () => {
    const running = context[context.length - 1];
    if (running) subscribe(running, dependencies);
    return value;
  };
  /** @param {T} newValue */
  const write = (newValue) => {
    value = newValue;
    for (const subscriber of [...dependencies]) subscriber.run();
  };
  return [read, write];
}

/**
 * @param {Subscriber} running
 * @param {Dependencies} subscriptions
 */
function subscribe(running, subscriptions) {
  subscriptions.add(running);
  running.deps.add(subscriptions);
}

/** @param {Subscriber} running */
function cleanup(running) {
  for (const dep of running.deps) dep.delete(running);
  running.deps.clear();
}

/** @param {() => void} fn */
export function createEffect(fn) {
  const run = () => {
    cleanup(running);
    context.push(running);
    try {
      fn();
    } finally {
      context.pop();
    }
  };
  /** @type {Subscriber} */
  const running = { run, deps: new Set() };
  run();
}

/** @param {() => Promise<void> | void} fn */
export async function animateDomUpdate(fn, onFinish = () => {}) {
  if ("startViewTransition" in document) {
    // @ts-ignore
    const transition = await document.startViewTransition(fn);
    transition.finished.then(onFinish);
  } else {
    await fn();
  }
}

/** @typedef {keyof HTMLElementTagNameMap} HTMLElementKey */
/**
 * @template {HTMLElementKey} T
 * @param {HTMLElement} parent
 * @param {T} element
 * @param {((el: HTMLElementTagNameMap[T]) => void) | undefined} fn
 **/
export function appendNode(parent, element, fn = undefined) {
  const el = document.createElement(element);
  parent.appendChild(el);
  if (fn) fn(el);
  return el;
}

/** @param {string} id */
export function getElById(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Element with id ${id} not found`);
  return el;
}

/**
 * @param {Element} el
 * @param {string} selector
 * @returns {Element}
 **/
export function querySelect(el, selector) {
  const found = el.querySelector(selector);
  if (!found) throw new Error(`Element with selector ${selector} not found`);
  return found;
}

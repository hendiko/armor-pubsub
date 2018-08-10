/*
 * @Author: Xavier Yin 
 * @Date: 2018-08-09 15:09:07 
 * @Last Modified by: Xavier Yin
 * @Last Modified time: 2018-08-10 10:00:37
 */
// 强制转换命名空间的合法名称
export function safeNs(ns) {
  return ns == void 0 ? "default" : ns;
}

export function safeTopic(topic) {
  return topic == void 0 ? "" : topic;
}

export function isEmptyArray(arr) {
  return !arr || arr.length === 0;
}

export function isFunction(obj) {
  return typeof obj === "function";
}

// 将 api 调用推入队列中，确保所有 API 顺序调用
export const queue = (function() {
  const _queue = [];
  let isConsuming = false;

  return function(task) {
    _queue.push(task);
    if (isConsuming) return;
    isConsuming = true;
    task = _queue.shift();
    while (task) {
      task.fn(...task.args);
      task = _queue.shift();
    }
    isConsuming = false;
  };
})();

// 生成唯一 ID 作为 subscribing 的 ID
export const subId = (function() {
  let count = 0;
  return function() {
    return ++count;
  };
})();

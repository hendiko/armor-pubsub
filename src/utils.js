/*
 * @Author: Xavier Yin 
 * @Date: 2018-08-09 15:09:07 
 * @Last Modified by: Xavier Yin
 * @Last Modified time: 2018-08-10 16:01:30
 */

/**
 * todo:  暂时不考虑支持以空格分隔多个 Topic 的传参方式
 *
 * 顾虑：
 * 1. 如此，则 topic 被限定为不能包含空格的字符串，在多 topic 的发布便捷性与 topic 字符有效性方面，暂取后者。
 * 2. 多 topic 发布，会导致 sub() 方法返回值类型不行。如果以对象返回（键名为 topic），那会造成 topics 字符串中不能有重复话题。如果以 Array 返回，则对返回值的使用不方便。
 */
//* todo:
// 因为如此的话，则 topic 会被限定为不能包含空格。
// export const EVENT_SPLITTER = /\s+/;
// export const EVENT_TRIM = /(^\s+)|(\s+$)/g;

// export const splitEvent = function(str) {
//   return str.split(EVENT_SPLITTER);
// };

// export const trim = function(str) {
//   return str.replace(EVENT_TRIM, "");
// };

// 强制转换命名空间的合法名称
export function safeNs(ns) {
  return ns == void 0 ? "default" : ns;
}

export function safeTopic(topic) {
  return topic == void 0 ? "" : topic;
}

export function isString(obj) {
  return "string" === typeof obj;
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

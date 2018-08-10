/*
 * @Author: Xavier Yin 
 * @Date: 2018-08-10 10:58:35 
 * @Last Modified by: Xavier Yin
 * @Last Modified time: 2018-08-10 14:23:28
 */
import subscribe from "./subscribe";
import unsubscribe, { unsubscribeByIdInQueue } from "./unsubscribe";
import publish from "./publish";
import { isFunction, isEmptyArray } from "./utils";

const pubsub = {
  /**
   * 判断是否订阅了某个 Topic，以及使用 callback, ctx, ns 进行筛选
   * @param {*} topic
   * @param {*} callback
   * @param {*} options
   */
  hasSub(topic, callback, options) {
    let pubsub = this._armorPubSub;
    if (isEmptyArray(pubsub)) return false;
    let { ns, ctx } = options || {};
    let subscribing, i;
    for (i = 0; i < pubsub.length; i++) {
      subscribing = pubsub[i];
      let { topic: t, callback: cb, ns: n, ctx: c } = subscribing;
      if (
        (topic == void 0 || topic === t) &&
        (callback == void 0 || callback === t) &&
        (ns == void 0 || ns === n) &&
        (!ctx || ctx === c)
      ) {
        return true;
      }
    }
    return false;
  },

  sub(topic, callback, options) {
    if (!isFunction(callback)) return;
    let { ns, ctx } = options || {};
    let id = subscribe(this, topic, callback, { ns, ctx });
    return function() {
      unsubscribeByIdInQueue(id);
    };
  },

  subOnce(topic, callback, options) {
    if (!isFunction(callback)) return;
    let { ns, ctx } = options || {};
    let id = subscribe(this, topic, callback, { ns, ctx, once: true });
    return function() {
      unsubscribeByIdInQueue(id);
    };
  },

  pub(topic, content, options) {
    publish(topic, content, options);
    return this;
  },

  unsub(topic, callback, options) {
    unsubscribe(this, topic, callback, options);
    return this;
  }
};

module.exports = pubsub;

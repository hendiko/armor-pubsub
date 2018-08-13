/*
 * @Author: Xavier Yin 
 * @Date: 2018-08-10 10:58:35 
 * @Last Modified by: Xavier Yin
 * @Last Modified time: 2018-08-13 11:45:40
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
        (callback == void 0 || callback === cb) &&
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
      return unsubscribeByIdInQueue(id);
    };
  },

  subOnce(topic, callback, options) {
    if (!isFunction(callback)) return;
    let { ns, ctx } = options || {};
    let id = subscribe(this, topic, callback, { ns, ctx, once: true });
    return function() {
      return unsubscribeByIdInQueue(id);
    };
  },

  pub(topic, content, options) {
    return publish(topic, content, options);
  },

  unsub(topic, callback, options) {
    return unsubscribe(this, topic, callback, options);
  }
};

module.exports = pubsub;

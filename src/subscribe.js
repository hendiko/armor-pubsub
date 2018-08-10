/*
 * @Author: Xavier Yin 
 * @Date: 2018-08-09 17:37:51 
 * @Last Modified by: Xavier Yin
 * @Last Modified time: 2018-08-10 11:09:04
 */

import { safeNs, safeTopic, subId } from "./utils";
import { getRegistry, book } from "./registry";

export default function subscribe(subscriber, topic, callback, options) {
  let { once, ns, ctx } = options || {};
  ns = safeNs(ns);
  topic = safeTopic(topic);
  if (!ctx) ctx = subscriber;
  let registry = getRegistry(ns, true);
  let subscribings = registry[topic] || (registry[topic] = []);
  let id = subId();
  let subscribing = {
    id,
    callback,
    ctx,
    ns,
    once,
    subscriber,
    topic
  };
  book.register(subscribing); // 注册 subscribing
  subscribings.push(subscribing); // 在命名空间中注册 subscribing
  let _armorPubSub =
    subscriber["_armorPubSub"] || (subscriber["_armorPubSub"] = []);
  _armorPubSub.push(subscribing); // 在订阅者中注册 subscribing
  return id;
}

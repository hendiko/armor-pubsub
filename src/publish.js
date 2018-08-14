/*
 * @Author: Xavier Yin 
 * @Date: 2018-08-09 15:13:42 
 * @Last Modified by: Xavier Yin
 * @Last Modified time: 2018-08-13 16:12:11
 */

import { safeNs, safeTopic, isEmptyArray, queue } from "./utils";
import { getRegistry } from "./registry";
import { unsubscribeById } from "./unsubscribe";

function pubSync(subscribing, content) {
  let { callback, ctx } = subscribing;
  callback.call(ctx, content);
}

function pubAsync(subscribing, content) {
  setTimeout(function() {
    pubSync(subscribing, content);
  });
}

function publishApi(topic, content, options) {
  let { ns, sync } = options || {};
  ns = safeNs(ns);
  topic = safeTopic(topic);

  let registry = getRegistry(ns);
  if (!registry) return;

  // 没有注册表
  let subscribings = registry[topic];
  // 没有订阅者
  if (isEmptyArray(subscribings)) return;

  let onces = [];
  let func = sync ? pubSync : pubAsync;
  let index = 0;
  let subscribing;
  while (index < subscribings.length) {
    subscribing = subscribings[index++];
    func(subscribing, content);
    let { once } = subscribing;
    if (once) onces.push(subscribing);
  }

  for (let i = 0; i < onces.length; i++) {
    unsubscribeById(onces[i]["id"]);
  }
}

export default function publish(topic, content, options) {
  return queue({ fn: publishApi, args: [topic, content, options] });
}

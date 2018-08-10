/*
 * @Author: Xavier Yin 
 * @Date: 2018-08-09 18:08:26 
 * @Last Modified by: Xavier Yin
 * @Last Modified time: 2018-08-10 16:23:38
 */

import { queue, safeTopic, isEmptyArray } from "./utils";
import { book, getRegistry, removeRegistry } from "./registry";

function removeSubscribingFromRegistry(subscribing) {
  let { ns, id, topic } = subscribing;
  let registry = getRegistry(ns);
  if (registry) {
    let subscribings = registry[topic];
    if (subscribings) {
      let index = subscribings.findIndex(function(x) {
        return x.id === id;
      });
      subscribings.splice(index, 1);
      if (subscribings.length === 0) {
        delete registry[topic];
        if (Object.keys(registry).length === 0) {
          removeRegistry(ns);
        }
      }
    }
  }
}

function removeSubscribingFromSubscriber(subscribing) {
  let { id, subscriber } = subscribing;
  let pubsub = subscriber._armorPubSub;
  if (pubsub) {
    let index = pubsub.findIndex(function(x) {
      return x.id === id;
    });
    pubsub.splice(index, 1);
  }
}

function unsubscribeApi(subscriber, topic, callback, options) {
  let pubsub = subscriber._armorPubSub;
  if (isEmptyArray(pubsub)) return;
  let { ns, ctx } = options || {};
  let toRemove = [];
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
      toRemove.push(subscribing);
    }
  }
  for (i = 0; i < toRemove.length; i++) {
    unsubscribeById(toRemove[i]["id"]);
  }
}

export function unsubscribeById(id) {
  let subscribing = book.get(id);
  if (subscribing) {
    book.remove(id);
    removeSubscribingFromRegistry(subscribing);
    removeSubscribingFromSubscriber(subscribing);
  }
}

export function unsubscribeByIdInQueue(id) {
  queue({ fn: unsubscribeById, args: [id] });
}

export default function unsubscribe(subscriber, topic, callback, options) {
  queue({ fn: unsubscribeApi, args: [subscriber, topic, callback, options] });
}

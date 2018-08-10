/*
 * @Author: Xavier Yin 
 * @Date: 2018-08-09 15:11:21 
 * @Last Modified by: Xavier Yin
 * @Last Modified time: 2018-08-10 10:40:56
 */
import { safeNs } from "./utils";

export const book = {
  subscribings: {},

  register(subscribing) {
    let { id } = subscribing;
    this.subscribings[id] = subscribing;
  },

  get(id) {
    return this.subscribings[id];
  },

  remove(id) {
    let subscribing = this.subscribings[id];
    if (subscribing) delete this.subscribings[id];
    return subscribing;
  }
};

export function registerSubscribing(subscribing) {
  let { id } = subscribing;
  SUBSCRIBINGS[id] = subscribing;
}

export const namespaces = {
  default: {}
};

export function getRegistry(ns, create) {
  ns = safeNs(ns);
  let registry = namespaces[ns];
  if (!registry && create) {
    registry = namespaces[ns] = {};
  }
  return registry;
}

export function removeRegistry(ns) {
  delete namespaces[ns];
}

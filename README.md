# Armor PubSub

ArmorPubSub is a publish/subscribe library written in JavaScript. It can be used in both Browser or NodeJS. It needs no dependencies and can be brought in as an `UMD` module. It exposes a global variable named `ArmorPubSub` when it be loaded globally.

ArmorPubSub asynchronously publishes topics by default, you can also synchronously publish topics if you want, there is a so-called `invoke queue` that is used to sort all publish/unsubscribe to be called in order, so you don't worry about embedding publish/unsubscribe, they behave like asynchronous calls which actually are synchronous in an `invoke loop`, you can get a promise which would be resolved when an invoke loop is over, or be rejected if an error occurred.

# Installation

`npm install armor-pubsub`

# Usage

```js
import ArmorPubSub from "armor-pubsub";

// Assign ArmorPubSub to any object that will can publish/subscribe topic.
let foo = Object.assign({}, ArmorPubSub);

// Make a subscrption to a topic and return an unsubscribe handler which is a function
// that could be called whenever you want to unsubscribe this specific subscription.
let unsubscribe = foo.sub("topic", msg => console.log(msg));

// Publish a topic with a content
foo.pub("topic", "hello world");

// Return a promise which would be resolved when unsubscription has been done.
let promise = unsubscribe();
```

# Terms

## namespace

A seperated space to store the subscriptions of topics. The default namespace name is `default`.

```js
const foo = Object.assign({ id: "foo" }, ArmorPubSub);

foo.sub("hello", callback, { ns: foo.id });

foo.pub("hello", content, { ns: foo.id });

// wrap pub/sub into a specific namespace.
foo.subPrivate = function(topic, callback, options) {
  return this.sub(topic, callback, Object.assign({}, options, { ns: this.id }));
};

foo.pubPrivate = function(topic, content, options) {
  return this.pub(topic, content, Object.assgin({}, options, { ns: this.id }));
};
```

## invoke-queue

You can choose to publish/unsubscribe topic in a synchronous way or an asynchronous way.

ArmorPubSub uses `setTimeout` to asynchronously invoke callbacks of subscription, so it won't block the current call stack and publish/unsubscribe will be called one-by-one in turn.

The synchronously invoking callbacks is a little more complicated, the publish/unsubscribe might be embedded in another one, the callback might has been removed when iterating the callbacks. So there is a so-called `invoke-queue`, all of the invoke of the publish/unsubscibe would be pushed into this queue to wait for being executed in turn instead of calling them immediately. The duration between the first invoke pushed into the queue and the last one has been pushed out is called an `invoke-loop`. In an `invoke-loop`, every one of calling publish/unsubscribe would return a same promise that won't be resolved until the current `invoke-loop` has finished.

You can see the steps when using `invoke-queue` to deal with publish/unsubscribe in the testcase below:

```js
it("Embed publish/subscribe", done => {
  let step = 0; // counter to show the current step.
  let p1, p2, p3, p4;

  // subscribe to topic x.
  foo.sub("x", () => {
    // This line would be met in the first invoke-loop.
    // The publish won't be executed immediately, instead,
    // it would be pushed into invoke-queue and wait for being executed.
    // It returns a promise of the first invoke-loop.
    p2 = foo.pub("y", null, { sync: true });
    p2.then(() => {
      expect(++step).toBe(4);
    });
    // Publish another topic z,
    // it returns the same promise of the first invoke-loop.
    p4 = foo.pub("z");
    expect(p2).toBe(p4);

    expect(++step).toBe(1);
  });

  // subscribe to topic y and save the unsubscribe handler.
  let promiseToDestroy = foo.sub("y", () => {
    expect(++step).toBe(2);
  });

  // subscribe to topic z
  foo.sub("z", () => {
    // As topic z is published asynchronously, this callback would be called by using setTimeout
    expect(++step).toBe(7);
    done();
  });

  expect(p2).toBeUndefined(); // The value of p2 is still undefined.

  // No one has been called until we decide to make a synchronous publish.
  // It returns the promise of the first invoke-loop.
  p1 = foo.pub("x", void 0, { sync: true });
  p1.then(() => {
    expect(++step).toBe(5);
  });
  // Make sure all the promises returned is the same one in a single invoke-loop.
  expect(p1).toBe(p2);

  // The first invoke-loop is over.
  // We call the unsubscribe handler to start another invoke-loop.
  p3 = promiseToDestroy();
  p3.then(() => {
    expect(++step).toBe(6);
  });
  // Make sure the two promises are different.
  expect(p3 === p1).toBeFalsy();

  expect(++step).toBe(3);
});
```

# APIs

## pub(topic:string, [content:any], [options:object])

Publish a topic and return a promise that will be resolved when the `invoke-loop` is over.

- `topic`: This argument should be a string, if it given an `undefined` or `null`, it would be force to transform to an empty string.
- `content`: This optional argument would be passed into callback function provided when subscribing a topic as the first argument.
- `options`: This optional argument must be a plain object that can include the keys as below:
  - `ns:string`: The namespace of topic, if it given an `undefined` or `null`, it would be tranformed to default name `default`.
  - `sync:bool`: If given true, it will synchronously call callbacks for the topic, otherwise they will be called asynchronously. Default as `false`.

## sub(topic:string, callback:function, [options:object])

Make a subscription to the topic with a callback, return an `unsubscribe` function which can be called to unsubscribe this specific subscription.

A promise that will be resolved when the `invoke-loop` is over is returned when calling `unsubscribe` function.

- `topic`: This argument should be a string, if it given an `undefined` or `null`, it would be force to transform to an empty string.
- `callback`: The function bound to the topic will be called when the topic is published.
- `options`: This optional argument must be a plain object that can include the keys as below:
  - `ns:string`: The namespace of topic, if it given an `undefined` or `null`, it would be tranformed to default name `default`.
  - `ctx:object`: The context of `callback`, default value is the current subscriber.

## subOnce(topic:string, callback:function, [options:object])

It behaves like `sub`, but the subscription will be unsubscribed as soon as the topic has once been published.

## unsub([topic:string], [callback:function], [options])

Unsubscribe a specific topic or multiple topics filtered by `topic`, `callback`, `ns` and `ctx`.

The subscriptions of a subscriber will be unsubscribed if they meet the conditions as below:

- `topic`: If this is given `undefined` or `null`, it will match all topics, otherwise it must match the topic of subscription.
- `callback`: If this is given `undefined` or `null`, it will match all callbacks, otherwise it must match the callback of subscription.
- `ns`: If this is given `undefined` or `null`, it will match all namespaces, otherwise it must match the ns of subscription.
- `ctx`: if this is given falsy, it will match all ctxs, otherwise it must match the ns of subscription.

## hasSub([topic:string], [callback:function], [options])

To find out if a subscription has been made by the subscriber, the signature of `hasSub` is same as `unsub`, but it returns `true` if the first subscription is found, or `false` if no subscription is found.

/*
 * @Author: Xavier Yin 
 * @Date: 2018-08-10 14:52:44 
 * @Last Modified by: Xavier Yin
 * @Last Modified time: 2018-08-13 15:42:14
 */
import PubSub from "armor-pubsub";

describe("Armor-pubsub test cases.", () => {
  let foo, bar;

  beforeEach(() => {
    foo = Object.assign({ id: "foo" }, PubSub);
    bar = Object.assign({ id: "bar" }, PubSub);
  });

  afterEach(() => {
    foo.unsub();
    bar.unsub();
  });

  it("[sub] Subscribe a topic", done => {
    let cancel = foo.sub("x", null);
    expect(cancel).toBeUndefined(); // callback 不是函数不能订阅。

    let m = 200;
    cancel = foo.sub("x", function(x) {
      expect(x).toBe(m); // x 传参来自 pub 发布
      expect(this).toBe(foo); // 默认上下文为当前订阅者
      done(); // 异步调用
    });
    foo.pub("x", m);
    cancel();
    let hasAnySubscription = foo.hasSub("x");
    expect(hasAnySubscription).toBe(false); // 通过 sub() 返回的 cancel 函数撤销订阅。
  });

  it("[pub] Synchronously publish a topic", () => {
    let m = 0;
    foo.sub("x", function(x) {
      m += x;
    });
    foo.pub("x", 10, { sync: true });
    expect(m).toBe(10); // 因为是同步发布，所以此时 m 值为加运算后的值。
  });

  it("[pub] Asynchronously publish a topic", done => {
    let m = 0;
    foo.sub("x", function(x) {
      m += x;
      if (m === 10) done();
    });
    foo.pub("x", 10);
    expect(m).toBe(0); // 因为是异步发布，所以此时 m 还未进行加法运算。
  });

  it("[pub] Subscribe once", () => {
    let m = 0;
    foo.subOnce("x", function(x) {
      m += x;
    });
    foo.pub("x", 10, { sync: true });
    foo.pub("x", 10, { sync: true });
    expect(m).toBe(10); // 因为发布一次后订阅即被解除，所以此时 m 值为10。
  });

  it("[pub] Publish and subscribe with namespace", () => {
    let m = 0;
    let ns = "foo";
    foo.sub(
      "x",
      function(x) {
        m += x;
      },
      { ns }
    );
    foo.pub("x", 10, { sync: true });
    expect(m).toBe(0); // 因为命名空间不对，所以订阅回调未执行
    foo.pub("x", 10, { sync: true, ns });
    expect(m).toBe(10); // 命名空间正确，所以此时 m 值为10。
  });

  it("[pub] Unsubscribe", () => {
    let [t1, c1, n1, ctx1] = ["x", () => {}, "x", {}];
    let [t2, c2, n2, ctx2] = ["y", () => {}, "y", {}];

    foo.sub(t2, c2, { ns: n2, ctx: ctx2 });

    let sub = () => {
      foo.sub(t1, c1, { ns: n1, ctx: ctx1 });
    };
    sub();
    let has1 = () => foo.hasSub(t1);
    let has2 = () => foo.hasSub(t2);

    expect(has1()).toBe(true); // 证明订阅了
    expect(has2()).toBe(true); // 证明订阅了

    foo.unsub(t1);
    expect(has1()).toBe(false); // 证明解绑了

    sub();
    foo.unsub(null, c1);
    expect(has1()).toBe(false); // 证明解绑了

    sub();
    foo.unsub(null, null, { ns: n1 });
    expect(has1()).toBe(false); // 证明解绑了

    sub();
    foo.unsub(null, null, { ctx: ctx1 });
    expect(has1()).toBe(false); // 证明解绑了

    sub();
    foo.unsub(t1, c1, { ctx: ctx1, ns: n1 });
    expect(has1()).toBe(false); // 证明解绑了

    expect(has2()).toBe(true); // 证明没有解绑不应该解绑的订阅

    sub();
    foo.unsub();
    expect(has1()).toBe(false); // 证明所有的都解绑了
    expect(has2()).toBe(false);
  });

  it("[pub] Synchronous publishing and subscribing should be called in queue", () => {
    let m = 0;
    foo.sub("x", () => {
      foo.pub("y", null, { sync: true }); // #1
      foo.unsub("z"); // #2
      expect(m).toBe(0); // 此时 pub('y') 被压入队列尚未执行，因此 m 为 0；
    });
    foo.sub("y", () => {
      m += 10;
      foo.pub("z", null, { sync: true }); // #3
    });
    foo.sub("z", () => {
      m += 100;
    });
    foo.pub("x", null, { sync: true }); // #4

    // 因此 #4 执行时，#1，#2 都压入队列并未立即调用。
    // #3 执行时，z 发布压入队列未立即执行。
    // 因此整个过程队列中的操作顺序为：
    // 1. 发布 x
    // 2. 发布 y
    // 4. 取消订阅 z
    // 5. 发布 z
    // 所以到执行第5个任务时，z 已经被取消订阅，但整个过程都是同步操作，所以此时 m 为 10
    expect(m).toBe(10);
  });

  it("[pub] Asynchronous publishing and subscribing should be called in queue", done => {
    let m = 0;
    foo.sub("x", () => {
      foo.pub("y"); // #1
      foo.unsub("z"); // #2
      expect(m).toBe(0); // 此时 pub('y') 被异步压入队列尚未执行，因此 m 为 0；
    });

    foo.sub("y", () => {
      m += 10;
      foo.pub("z"); // #3
      expect(m).toBe(10);
    });

    foo.sub("z", () => {
      m += 100;
      expect(m).toBe(100000); // 永远不会到达这里
    });

    foo.pub("x"); // #4

    // 因为整个过程都是异步将任务推入队列执行，因此整个过程队列中都始终只有一个任务，它们分别是：
    // 1. 发布 x
    // 2. 发布 y
    // 4. 取消订阅 z
    // 5. 发布 z
    // 所以第5次清空队列时，z 已经被取消订阅，所以此时 m 为 10
    expect(m).toBe(0);

    setTimeout(() => {
      expect(m).toBe(10); // 证明最终值为 10
      done();
    }, 1000);
  });

  it("[promise] Get promise when embedding publish/subscribe", done => {
    let m = 0; // 计步器
    let p1, p2, p3, p4; // Promises

    // 订阅主题 x
    foo.sub("x", () => {
      // 在第一次队列循环中，发布主题 y，
      // 本次发布操作被压入本次队列循环，等待执行。
      // 获取本次队列循环的完结 PromiseA
      p2 = foo.pub("y", null, { sync: true });
      p2.then(() => {
        expect(++m).toBe(4);
      });
      p4 = foo.pub("z");
      expect(p2).toBe(p4);
      expect(++m).toBe(1);
    });

    // 订阅主题 y，同时保留取消订阅函数
    let promiseToDestroy = foo.sub("y", () => {
      expect(++m).toBe(2);
    });

    // 订阅主题 z
    foo.sub("z", () => {
      // 因为 z 是异步发布，本回调函数处于 macro-task 事件循环中
      // 所以本回调函数是最后被调用。
      expect(++m).toBe(7);
      done();
    });

    expect(p2).toBeUndefined(); // 此时 p2 仍然是 undefined
    // 发布主题 x，得到本次队列完结 PromiseA。
    p1 = foo.pub("x", void 0, { sync: true });
    p1.then(() => {
      expect(++m).toBe(5);
    });
    // 此时 p2 已被赋值 PromiseA
    expect(p2 === void 0).toBeFalsy();
    expect(p1).toBe(p2);

    // 取消订阅主题 y，得到本次队列完结 PromiseB
    p3 = promiseToDestroy();
    p3.then(() => {
      expect(++m).toBe(6);
    });
    expect(p3 === p1).toBeFalsy();

    // 同步执行的代码
    // 此之前的 expect 判断，只有同步发布的x, y 主题
    expect(++m).toBe(3);
  });
});

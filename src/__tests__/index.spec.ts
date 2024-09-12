import { assert } from "chai";
import { AsyncEventEmitter } from "../index.js";

interface Events {
  bar: [string];
  foo: [number];
}

describe("Test AsyncEventEmitter", async () => {
  it("should await", async () => {
    let result = "";
    const emitter = new AsyncEventEmitter<Events>();
    emitter.on("bar", v => {
      result = v;
    });
    await emitter.emit("bar", "a");
    assert.equal(result, "a");
  });

  it("should follow order", async () => {
    let result = 0;
    const emitter = new AsyncEventEmitter<Events>();
    emitter.on("foo", v => {
      result += v;
    });
    emitter.on("foo", v => {
      result *= v;
    });
    await emitter.emit("foo", 2);
    assert.equal(result, 4);
  });

  it("should not run after throw", async () => {
    let result = 0;
    const emitter = new AsyncEventEmitter<Events>();
    emitter.on("foo", () => {
      throw new Error();
    });
    emitter.on("foo", v => {
      result = v;
    });
    try {
      await emitter.emit("foo", 2);
    } catch (e) {
      assert.instanceOf(e, Error);
    }
    assert.equal(result, 0);
  });
});

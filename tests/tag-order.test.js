const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { moveTag } = require("../tag-order.js");

describe("moveTag", () => {
  it("moves an item down to the drop target index", () => {
    assert.deepEqual(moveTag(["a", "b", "c", "d"], 0, 3), ["b", "c", "d", "a"]);
  });

  it("moves an item up to the drop target index", () => {
    assert.deepEqual(moveTag(["a", "b", "c", "d"], 3, 0), ["d", "a", "b", "c"]);
  });

  it("moves an item down by one", () => {
    assert.deepEqual(moveTag(["a", "b", "c"], 0, 1), ["b", "a", "c"]);
  });

  it("does not change order when dropped on itself", () => {
    const tags = ["a", "b", "c"];
    assert.deepEqual(moveTag(tags, 1, 1), ["a", "b", "c"]);
    assert.notEqual(moveTag(tags, 1, 1), tags);
  });

  it("does not mutate the original array", () => {
    const tags = ["a", "b", "c"];
    moveTag(tags, 0, 2);
    assert.deepEqual(tags, ["a", "b", "c"]);
  });

  it("returns a copy when indexes are out of bounds", () => {
    const tags = ["a", "b"];
    assert.deepEqual(moveTag(tags, -1, 0), ["a", "b"]);
    assert.deepEqual(moveTag(tags, 0, 2), ["a", "b"]);
    assert.deepEqual(moveTag(tags, 5, 0), ["a", "b"]);
  });
});

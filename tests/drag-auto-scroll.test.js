const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  dragAutoScrollDelta,
  applyDragAutoScroll
} = require("../drag-auto-scroll.js");

const TOP = 100;
const BOTTOM = 400;
const EDGE = 48;
const MAX_SPEED = 12;

describe("dragAutoScrollDelta", () => {
  it("returns 0 when the pointer is in the middle of the list", () => {
    assert.equal(dragAutoScrollDelta(250, TOP, BOTTOM, { edge: EDGE, maxSpeed: MAX_SPEED }), 0);
  });

  it("returns a negative delta when the pointer is near the top edge", () => {
    const delta = dragAutoScrollDelta(TOP + 10, TOP, BOTTOM, { edge: EDGE, maxSpeed: MAX_SPEED });
    assert.ok(delta < 0);
  });

  it("returns a positive delta when the pointer is near the bottom edge", () => {
    const delta = dragAutoScrollDelta(BOTTOM - 10, TOP, BOTTOM, { edge: EDGE, maxSpeed: MAX_SPEED });
    assert.ok(delta > 0);
  });

  it("scrolls up at full speed when the pointer is above the list", () => {
    assert.equal(
      dragAutoScrollDelta(TOP - 20, TOP, BOTTOM, { edge: EDGE, maxSpeed: MAX_SPEED }),
      -MAX_SPEED
    );
  });

  it("scrolls down at full speed when the pointer is below the list", () => {
    assert.equal(
      dragAutoScrollDelta(BOTTOM + 20, TOP, BOTTOM, { edge: EDGE, maxSpeed: MAX_SPEED }),
      MAX_SPEED
    );
  });

  it("scrolls faster as the pointer gets closer to the edge", () => {
    const farther = dragAutoScrollDelta(TOP + 40, TOP, BOTTOM, { edge: EDGE, maxSpeed: MAX_SPEED });
    const closer = dragAutoScrollDelta(TOP + 8, TOP, BOTTOM, { edge: EDGE, maxSpeed: MAX_SPEED });
    assert.ok(closer < farther);
    assert.ok(farther < 0);
  });
});

function fakeList({ top, bottom, scrollTop, scrollHeight, clientHeight }) {
  return {
    scrollTop,
    scrollHeight,
    clientHeight,
    getBoundingClientRect() {
      return { top, bottom };
    }
  };
}

describe("applyDragAutoScroll", () => {
  it("increases scrollTop when dragging near the bottom", () => {
    const list = fakeList({
      top: TOP,
      bottom: BOTTOM,
      scrollTop: 40,
      scrollHeight: 800,
      clientHeight: 300
    });
    const moved = applyDragAutoScroll(list, BOTTOM - 4, { edge: EDGE, maxSpeed: MAX_SPEED });
    assert.ok(moved > 0);
    assert.equal(list.scrollTop, 40 + moved);
  });

  it("decreases scrollTop when dragging near the top", () => {
    const list = fakeList({
      top: TOP,
      bottom: BOTTOM,
      scrollTop: 80,
      scrollHeight: 800,
      clientHeight: 300
    });
    const moved = applyDragAutoScroll(list, TOP + 4, { edge: EDGE, maxSpeed: MAX_SPEED });
    assert.ok(moved < 0);
    assert.equal(list.scrollTop, 80 + moved);
  });

  it("does not scroll past the top", () => {
    const list = fakeList({
      top: TOP,
      bottom: BOTTOM,
      scrollTop: 3,
      scrollHeight: 800,
      clientHeight: 300
    });
    applyDragAutoScroll(list, TOP - 10, { edge: EDGE, maxSpeed: MAX_SPEED });
    assert.equal(list.scrollTop, 0);
  });

  it("does not scroll past the bottom", () => {
    const list = fakeList({
      top: TOP,
      bottom: BOTTOM,
      scrollTop: 498,
      scrollHeight: 800,
      clientHeight: 300
    });
    applyDragAutoScroll(list, BOTTOM + 10, { edge: EDGE, maxSpeed: MAX_SPEED });
    assert.equal(list.scrollTop, 500);
  });

  it("does not move when the pointer is in the middle", () => {
    const list = fakeList({
      top: TOP,
      bottom: BOTTOM,
      scrollTop: 80,
      scrollHeight: 800,
      clientHeight: 300
    });
    const moved = applyDragAutoScroll(list, 250, { edge: EDGE, maxSpeed: MAX_SPEED });
    assert.equal(moved, 0);
    assert.equal(list.scrollTop, 80);
  });
});

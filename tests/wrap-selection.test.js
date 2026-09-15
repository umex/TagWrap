const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { JSDOM } = require("jsdom");
const {
  wrapRangeWithTag,
  serializeWrappedHtml
} = require("../wrap-selection.js");

function makeDoc(html) {
  return new JSDOM(`<!DOCTYPE html><body>${html}</body>`).window.document;
}

describe("wrapRangeWithTag", () => {
  it("keeps bold markup when wrapping a formatted selection", () => {
    const doc = makeDoc('<p>Hello <b>world</b></p>');
    const p = doc.querySelector("p");
    const range = doc.createRange();
    range.selectNodeContents(p);

    wrapRangeWithTag(range, "error");

    assert.equal(p.innerHTML, "&lt;error&gt;Hello <b>world</b>&lt;/error&gt;");
    assert.equal(p.querySelector("b").textContent, "world");
  });

  it("keeps links when wrapping a formatted selection", () => {
    const doc = makeDoc('<p>See <a href="https://example.com">docs</a> now</p>');
    const p = doc.querySelector("p");
    const range = doc.createRange();
    range.selectNodeContents(p);

    wrapRangeWithTag(range, "context");

    const link = p.querySelector("a");
    assert.ok(link);
    assert.equal(link.getAttribute("href"), "https://example.com");
    assert.equal(link.textContent, "docs");
    assert.match(p.textContent, /^<context>See docs now<\/context>$/);
  });

  it("wraps a partial formatted selection without flattening siblings", () => {
    const doc = makeDoc("<p><i>alpha</i><b>beta</b></p>");
    const bold = doc.querySelector("b");
    const range = doc.createRange();
    range.selectNode(bold);

    wrapRangeWithTag(range, "note");

    const p = doc.querySelector("p");
    assert.equal(p.querySelector("i").textContent, "alpha");
    assert.equal(p.querySelector("b").textContent, "beta");
    assert.equal(p.innerHTML, "<i>alpha</i>&lt;note&gt;<b>beta</b>&lt;/note&gt;");
  });

  it("returns the closing tag text node", () => {
    const doc = makeDoc("<p>plain</p>");
    const p = doc.querySelector("p");
    const range = doc.createRange();
    range.selectNodeContents(p);

    const endNode = wrapRangeWithTag(range, "code");

    assert.equal(endNode.nodeType, doc.TEXT_NODE);
    assert.equal(endNode.nodeValue, "</code>");
  });
});

describe("serializeWrappedHtml", () => {
  it("serializes formatted contents with escaped tag text", () => {
    const doc = makeDoc("<p><strong>hi</strong></p>");
    const fragment = doc.createDocumentFragment();
    fragment.appendChild(doc.querySelector("strong").cloneNode(true));

    assert.equal(
      serializeWrappedHtml(doc, fragment, "instruction"),
      "&lt;instruction&gt;<strong>hi</strong>&lt;/instruction&gt;"
    );
  });
});

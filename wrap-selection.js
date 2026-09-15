function wrapFragmentWithTag(doc, fragment, tag) {
  const wrapped = doc.createDocumentFragment();
  wrapped.appendChild(doc.createTextNode(`<${tag}>`));
  wrapped.appendChild(fragment);
  wrapped.appendChild(doc.createTextNode(`</${tag}>`));
  return wrapped;
}

function wrapRangeWithTag(range, tag) {
  const doc = range.startContainer.ownerDocument || range.startContainer;
  const wrapped = wrapFragmentWithTag(doc, range.extractContents(), tag);
  const endNode = wrapped.lastChild;
  range.insertNode(wrapped);
  return endNode;
}

function serializeWrappedHtml(doc, fragment, tag) {
  const holder = doc.createElement("div");
  holder.appendChild(fragment);
  return `&lt;${tag}&gt;${holder.innerHTML}&lt;/${tag}&gt;`;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { wrapRangeWithTag, serializeWrappedHtml };
}

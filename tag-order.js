function moveTag(tags, fromIndex, toIndex) {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= tags.length ||
    toIndex >= tags.length
  ) {
    return [...tags];
  }

  const next = [...tags];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { moveTag };
}

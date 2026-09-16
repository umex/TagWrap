function dragAutoScrollDelta(pointerY, containerTop, containerBottom, options = {}) {
  const edge = options.edge ?? 48;
  const maxSpeed = options.maxSpeed ?? 12;
  const distTop = pointerY - containerTop;
  const distBottom = containerBottom - pointerY;

  const speedFor = (dist) => {
    if (dist >= edge) return 0;
    const t = 1 - Math.max(0, dist) / edge;
    return Math.max(1, Math.round(t * t * maxSpeed));
  };

  if (distTop < edge && distTop <= distBottom) {
    return -speedFor(distTop);
  }
  if (distBottom < edge) {
    return speedFor(distBottom);
  }
  return 0;
}

function applyDragAutoScroll(container, pointerY, options) {
  const rect = container.getBoundingClientRect();
  const delta = dragAutoScrollDelta(pointerY, rect.top, rect.bottom, options);
  if (!delta) return 0;

  const maxScroll = Math.max(0, container.scrollHeight - container.clientHeight);
  const next = Math.max(0, Math.min(maxScroll, container.scrollTop + delta));
  const moved = next - container.scrollTop;
  container.scrollTop = next;
  return moved;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { dragAutoScrollDelta, applyDragAutoScroll };
}

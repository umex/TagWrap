// Preserve the old positional assignments when loading settings without placements.
function normalizeTagPlacements(tags, savedPlacements) {
  const hasPlacements = savedPlacements && typeof savedPlacements === "object" && !Array.isArray(savedPlacements);
  return Object.fromEntries(tags.map((tag, index) => {
    const placement = hasPlacements && Object.hasOwn(savedPlacements, tag) ? savedPlacements[tag] : null;
    const legacyPlacement = index < 3 ? "direct" : index < 8 ? "submenu" : "extra";
    return [tag, ["direct", "submenu", "extra"].includes(placement)
      ? placement : hasPlacements ? "extra" : legacyPlacement];
  }));
}

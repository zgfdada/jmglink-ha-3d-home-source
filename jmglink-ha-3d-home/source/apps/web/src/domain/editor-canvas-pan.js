export function shouldRightPanEmptyCanvas({ button, pointerType, tool, selectionCount, shiftKey, ctrlKey, metaKey, hitObject }) {
  return button === 2 && pointerType !== "touch" && tool === "select" && selectionCount === 0 && !shiftKey && !ctrlKey && !metaKey && !hitObject;
}

export function canvasPanHasMoved(origin, current) {
  return Math.hypot(current[0] - origin[0], current[1] - origin[1]) >= 3;
}

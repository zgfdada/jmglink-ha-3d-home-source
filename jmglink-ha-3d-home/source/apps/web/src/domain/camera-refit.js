// Overlay changes must not reset the user's orbit controls in the home scene.
export function overlayRefitKey(insets) {
 return insets.preserveViewOnPanelChange ? 'preserve' : [insets.top,insets.right,insets.bottom,insets.left].join(':');
}

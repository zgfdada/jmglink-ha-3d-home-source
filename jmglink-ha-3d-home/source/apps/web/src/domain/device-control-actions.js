export function segmentedToggleAction(entityId, currentState, turnOn) {
  if ((currentState === "on") === turnOn) return null;
  return { type: turnOn ? "turn_on" : "turn_off", entityId };
}

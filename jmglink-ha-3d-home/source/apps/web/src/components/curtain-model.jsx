import { a as React } from "../vendor/react.js";
import { b as useFrame, u as useThree } from "../vendor/three.js";
import { createCurtainModel } from "../domain/curtain-model.js";

export default function CurtainTrackModel({
  track,
  position = 0,
  unavailable = false,
  color,
}) {
  const current = React.useRef(position),
    target = React.useRef(position),
    { invalidate } = useThree();
  const key = JSON.stringify(track);
  const model = React.useMemo(
    () =>
      createCurtainModel(track, {
        position: current.current,
        unavailable,
        color,
      }),
    [key, unavailable, color],
  );
  React.useEffect(() => () => model.dispose(), [model]);
  React.useEffect(() => {
    target.current = Number.isFinite(position)
      ? Math.max(0, Math.min(100, position))
      : 0;
    invalidate();
  }, [position, model, invalidate]);
  useFrame((_, delta) => {
    if (Math.abs(current.current - target.current) < 0.02) return;
    current.current +=
      (target.current - current.current) *
      (1 - Math.exp(-Math.min(delta, 0.1) * 9));
    if (Math.abs(current.current - target.current) < 0.02)
      current.current = target.current;
    model.update(current.current);
    invalidate();
  });
  return <primitive object={model.group} dispose={null} />;
}

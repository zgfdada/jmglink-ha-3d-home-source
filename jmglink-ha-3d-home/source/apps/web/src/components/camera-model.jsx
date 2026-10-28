import { a as React } from "../vendor/react.js";
import {
  createCameraModel,
  disposeCameraModel,
} from "../domain/camera-model.js";
export default function CameraModel({ shape, dimensions, color }) {
  const key = JSON.stringify([shape, dimensions, color]);
  const model = React.useMemo(
    () => createCameraModel(shape, { dimensions, color }),
    [key],
  );
  React.useEffect(() => () => disposeCameraModel(model), [model]);
  return <primitive object={model} dispose={null} />;
}

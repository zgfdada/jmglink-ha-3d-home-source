import "./styles/index.css";
import {
  installBrowserRecovery,
  reportClientError,
  recoverChunkFailure,
  showStartupFailure,
} from "./domain/browser-recovery.js";
installBrowserRecovery();
void import("./app/app.js").catch((error) => {
  reportClientError(error, "startup");
  if (!recoverChunkFailure(error)) showStartupFailure();
});

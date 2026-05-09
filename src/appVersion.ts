const APP_VERSION = __APP_VERSION__;
const APP_BUILD_ID = __APP_BUILD_ID__;
const APP_DEPLOYMENT_VERSION = __APP_DEPLOYMENT_VERSION__;

function shortenBuildId(rawBuildId: string): string {
  if (rawBuildId.length <= 12) return rawBuildId;
  return `${rawBuildId.slice(0, 12)}...`;
}

export const appVersion = {
  version: APP_VERSION,
  buildId: APP_BUILD_ID,
  deploymentVersion: APP_DEPLOYMENT_VERSION,
  shortBuildId: shortenBuildId(APP_BUILD_ID),
};

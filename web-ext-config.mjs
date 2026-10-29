// Settings for Mozilla's web-ext tool (https://github.com/mozilla/web-ext).
// Keeps repo-only files out of the packaged extension.
export default {
  ignoreFiles: [
    "docs",
    "PRIVACY.md",
    "README.md",
    "web-ext-config.mjs",
  ],
};

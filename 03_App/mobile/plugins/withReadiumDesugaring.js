const { withAppBuildGradle } = require("expo/config-plugins");

const MARKER = "// @generated readium-desugaring";

function withReadiumDesugaring(config) {
  return withAppBuildGradle(config, (cfg) => {
    let contents = cfg.modResults.contents;

    if (contents.includes(MARKER) && contents.includes("desugar_jdk_libs:2.1.5")) {
      return cfg;
    }

    if (contents.includes(MARKER)) {
      contents = contents.replace(
        /desugar_jdk_libs:[0-9.]+/,
        "desugar_jdk_libs:2.1.5",
      );
      cfg.modResults.contents = contents;
      return cfg;
    }

    if (!contents.includes("coreLibraryDesugaringEnabled")) {
      contents = contents.replace(
        /defaultConfig\s*\{/,
        `compileOptions {\n        coreLibraryDesugaringEnabled true\n    }\n\n    defaultConfig {`,
      );
    }

    if (!contents.includes("desugar_jdk_libs")) {
      contents = contents.replace(
        /dependencies\s*\{/,
        `dependencies {\n    ${MARKER}\n    coreLibraryDesugaring 'com.android.tools:desugar_jdk_libs:2.1.5'`,
      );
    }

    cfg.modResults.contents = contents;
    return cfg;
  });
}

module.exports = withReadiumDesugaring;
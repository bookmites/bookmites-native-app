const { withProjectBuildGradle } = require("expo/config-plugins");

/**
 * expo-build-properties sets android.kotlinVersion, but SDK 57 still resolves RN's
 * unversioned kotlin-gradle-plugin classpath (2.1.20). Pin the plugin to match.
 * @see https://github.com/expo/expo/issues/49668
 */
function withKotlinGradlePlugin(config) {
  return withProjectBuildGradle(config, (cfg) => {
    let contents = cfg.modResults.contents;

    if (!contents.includes("ext.kotlinVersion = findProperty('android.kotlinVersion')")) {
      contents = contents.replace(
        "buildscript {",
        "buildscript {\n  ext.kotlinVersion = findProperty('android.kotlinVersion') ?: '2.1.20'",
      );
    }

    contents = contents.replace(
      "classpath('org.jetbrains.kotlin:kotlin-gradle-plugin')",
      'classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlinVersion")',
    );

    cfg.modResults.contents = contents;
    return cfg;
  });
}

module.exports = withKotlinGradlePlugin;
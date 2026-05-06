const { existsSync, readFileSync, writeFileSync } = require('fs');
const { join } = require('path');
const { spawnSync } = require('child_process');

const root = join(__dirname, '..');

const candidates = [
  process.env.ANDROID_HOME,
  process.env.ANDROID_SDK_ROOT,
  process.env.LOCALAPPDATA ? join(process.env.LOCALAPPDATA, 'Android', 'Sdk') : '',
  process.env.USERPROFILE ? join(process.env.USERPROFILE, 'AppData', 'Local', 'Android', 'Sdk') : '',
].filter(Boolean);

const sdkDir = candidates.find((candidate) =>
  existsSync(join(candidate, 'platform-tools', process.platform === 'win32' ? 'adb.exe' : 'adb')),
);

if (!sdkDir) {
  console.error('Android SDK not found.');
  console.error('Set ANDROID_HOME to your Android SDK directory, for example:');
  console.error('  C:\\Users\\<you>\\AppData\\Local\\Android\\Sdk');
  process.exit(1);
}

process.env.ANDROID_HOME = sdkDir;
process.env.ANDROID_SDK_ROOT = sdkDir;
console.log(`Using Android SDK: ${sdkDir}`);

const adb = join(sdkDir, 'platform-tools', process.platform === 'win32' ? 'adb.exe' : 'adb');

if (process.argv.includes('--uninstall')) {
  const result = spawnSync(adb, ['uninstall', 'com.gocart.mobile'], {
    cwd: root,
    env: process.env,
    stdio: 'inherit',
    shell: false,
  });

  if (result.error) {
    console.error(result.error.message);
  }

  process.exit(result.status ?? 1);
}

const androidDir = join(root, 'android');
if (existsSync(androidDir)) {
  const escapedSdkDir = sdkDir.replace(/\\/g, '\\\\').replace(/:/g, '\\:');
  writeFileSync(join(androidDir, 'local.properties'), `sdk.dir=${escapedSdkDir}\n`);

  const appBuildGradle = join(androidDir, 'app', 'build.gradle');
  if (existsSync(appBuildGradle)) {
    const buildGradle = readFileSync(appBuildGradle, 'utf8');
    const defaultDebugKeystore = "storeFile file('debug.keystore')";
    if (buildGradle.includes(defaultDebugKeystore)) {
      writeFileSync(
        appBuildGradle,
        buildGradle.replace(
          defaultDebugKeystore,
          "def userDebugKeystore = new File(System.getProperty('user.home'), '.android/debug.keystore')\n            storeFile userDebugKeystore.exists() ? userDebugKeystore : file('debug.keystore')",
        ),
      );
    }
  }
}

const expoCli = require.resolve('expo/bin/cli');
const result = spawnSync(process.execPath, [expoCli, 'run:android'], {
  cwd: root,
  env: process.env,
  stdio: 'inherit',
  shell: false,
});

if (result.error) {
  console.error(result.error.message);
}

process.exit(result.status ?? 1);

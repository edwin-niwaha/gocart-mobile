const fs = require('fs');
const path = require('path');

const root = process.cwd();

function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--profile' && argv[index + 1]) {
      args.profile = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith('--profile=')) {
      args.profile = arg.split('=')[1];
    }
  }

  return args;
}

function readEnvFile(fileName) {
  const filePath = path.join(root, fileName);
  if (!fs.existsSync(filePath)) return {};

  const output = {};
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separator = trimmed.indexOf('=');
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    const rawValue = trimmed.slice(separator + 1).trim();
    output[key] = rawValue.replace(/^['"]|['"]$/g, '');
  }

  return output;
}

function loadEnv(profile) {
  return {
    ...readEnvFile('.env'),
    ...readEnvFile(`.env.${profile}`),
    ...readEnvFile('.env.local'),
    ...readEnvFile(`.env.${profile}.local`),
    ...process.env,
  };
}

function isPlaceholder(value) {
  if (!value) return true;
  const normalized = String(value).toLowerCase();
  return (
    normalized.includes('example.com') ||
    normalized.includes('your-') ||
    normalized.includes('replace-me')
  );
}

function fail(message, failures) {
  failures.push(message);
}

const args = parseArgs(process.argv.slice(2));
const profile = args.profile || process.env.EXPO_PUBLIC_APP_ENV || 'production';
const env = loadEnv(profile);
const failures = [];
const warnings = [];

const requiredPublicEnv = [
  'EXPO_PUBLIC_API_BASE_URL',
  'EXPO_PUBLIC_TENANT_SLUG',
  'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID',
  'EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID',
  'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID',
];

for (const key of requiredPublicEnv) {
  if (isPlaceholder(env[key])) {
    fail(`${key} must be set to a real ${profile} value.`, failures);
  }
}

try {
  const apiUrl = new URL(env.EXPO_PUBLIC_API_BASE_URL || '');
  const allowInsecure = env.EXPO_PUBLIC_ALLOW_INSECURE_API === 'true';

  if (!['http:', 'https:'].includes(apiUrl.protocol)) {
    fail('EXPO_PUBLIC_API_BASE_URL must use http or https.', failures);
  }

  if (profile !== 'development' && apiUrl.protocol !== 'https:' && !allowInsecure) {
    fail('Release API URL must use HTTPS unless EXPO_PUBLIC_ALLOW_INSECURE_API=true.', failures);
  }
} catch {
  fail('EXPO_PUBLIC_API_BASE_URL must be a valid absolute URL.', failures);
}

if (isPlaceholder(env.EXPO_PUBLIC_EAS_PROJECT_ID)) {
  warnings.push('EXPO_PUBLIC_EAS_PROJECT_ID is not set; link the project before EAS release builds.');
}

if (!fs.existsSync(path.join(root, 'google-services.json'))) {
  warnings.push('google-services.json is missing locally; EAS builds need this supplied as a secret file.');
} else {
  try {
    const googleServices = JSON.parse(
      fs.readFileSync(path.join(root, 'google-services.json'), 'utf8')
    );
    const expectedAndroidClientId = env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
    const clients = Array.isArray(googleServices.client)
      ? googleServices.client
      : [];
    const oauthClients = clients.flatMap((client) =>
      Array.isArray(client.oauth_client) ? client.oauth_client : []
    );
    const hasAndroidOAuthClient = oauthClients.some(
      (client) =>
        client.client_type === 1 &&
        client.client_id === expectedAndroidClientId
    );

    if (expectedAndroidClientId && !hasAndroidOAuthClient) {
      const message =
        'google-services.json does not contain the configured Android OAuth client. Download the current Firebase google-services.json after adding the package/SHA-1 client.';
      if (profile === 'development') {
        warnings.push(message);
      } else {
        fail(message, failures);
      }
    }
  } catch {
    warnings.push('google-services.json could not be parsed as JSON.');
  }
}

if (failures.length) {
  console.error(`Release environment validation failed for profile "${profile}":`);
  for (const item of failures) {
    console.error(`- ${item}`);
  }

  if (warnings.length) {
    console.error('\nWarnings:');
    for (const item of warnings) {
      console.error(`- ${item}`);
    }
  }

  process.exit(1);
}

console.info(`Release environment validation passed for profile "${profile}".`);

if (warnings.length) {
  console.warn('Warnings:');
  for (const item of warnings) {
    console.warn(`- ${item}`);
  }
}

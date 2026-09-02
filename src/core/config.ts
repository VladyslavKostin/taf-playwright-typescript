import 'dotenv/config';

export type Config = {
  webBaseUrl: string;
  apiBaseUrl: string;
};

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required env var ${name} (set it in .env, see .env.example)`);
  }
  return value;
}

export function loadConfig(): Config {
  return {
    webBaseUrl: required('WEB_BASE_URL', 'https://automationexercise.com'),
    // Trailing slash is required: APIRequestContext resolves a leading-slash path against the base
    // URL's authority, not its path, so a leading `/` in a client call would silently drop `/api`.
    apiBaseUrl: required('API_BASE_URL', 'https://automationexercise.com/api/'),
  };
}

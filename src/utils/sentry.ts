import * as Sentry from '@sentry/react-native';

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

let initialized = false;

export function initSentry() {
  if (initialized || !dsn) return;
  initialized = true;

  Sentry.init({
    dsn,
    debug: __DEV__,
  });
}

export { Sentry };

import 'react-native-url-polyfill/auto';
import { registerRootComponent } from 'expo';

import App from './App';
import { initSentry, wrapRootComponent } from './src/observability/sentry';

// No-ops when EXPO_PUBLIC_SENTRY_DSN is absent: Sentry is never loaded and App is
// registered untouched.
initSentry();

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(wrapRootComponent(App));

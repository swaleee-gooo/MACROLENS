const projectId = '8ae438cb-02a8-45a1-a028-89cd7545c81c';

const variants = {
  development: {
    name: 'MacroLens Dev',
    bundleIdentifier: 'com.idrisscarta.macrolens.dev',
    androidPackage: 'com.idrisscarta.macrolens.dev',
  },
  preview: {
    name: 'MacroLens Preview',
    bundleIdentifier: 'com.idrisscarta.macrolens.preview',
    androidPackage: 'com.idrisscarta.macrolens.preview',
  },
  production: {
    name: 'MacroLens',
    bundleIdentifier: 'com.idrisscarta.macrolens',
    androidPackage: 'com.idrisscarta.macrolens',
  },
};

function resolveVariant() {
  const appVariant = process.env.APP_VARIANT;
  if (appVariant === 'development' || appVariant === 'preview' || appVariant === 'production') {
    return appVariant;
  }

  if (process.env.EAS_BUILD_PROFILE === 'development') {
    return 'development';
  }

  if (process.env.EAS_BUILD_PROFILE === 'preview') {
    return 'preview';
  }

  return 'production';
}

const appVariant = resolveVariant();
const variant = variants[appVariant];
const socialShareSchemes = [
  'instagram',
  'instagram-stories',
  'snapchat',
  'snapchat-creativekit',
  'tiktoksharesdk',
  'tiktokopensdk',
  'fb',
  'fbapi',
  'fb-messenger-share-api',
];
const androidSharePackages = [
  'com.instagram.android',
  'com.zhiliaoapp.musically',
  'com.snapchat.android',
  'com.facebook.orca',
  'com.facebook.katana',
];

const plugins = [
  'expo-font',
  [
    'expo-share-intent',
    {
      iosShareExtensionName: 'MacroLens Share',
      iosActivationRules: {
        NSExtensionActivationSupportsAttachmentsWithMatchingTypeIdentifiers: [
          'public.url',
          'public.text',
          'public.plain-text',
        ],
        NSExtensionActivationSupportsWebURLWithMaxCount: 1,
        NSExtensionActivationSupportsWebPageWithMaxCount: 1,
        NSExtensionActivationSupportsText: true,
      },
    },
  ],
  [
    'react-native-share',
    {
      android: androidSharePackages,
    },
  ],
];

// Sentry's expo plugin handles the native crash handler + sourcemap upload during
// EAS builds. org/project (and SENTRY_AUTH_TOKEN) live in the EAS environment,
// never in the repo — without them the plugin is skipped and the build is unchanged.
if (process.env.SENTRY_ORG && process.env.SENTRY_PROJECT) {
  plugins.push([
    '@sentry/react-native/expo',
    {
      organization: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
    },
  ]);
}

module.exports = {
  expo: {
    name: variant.name,
    slug: 'macrolens',
    scheme: 'macrolens',
    plugins,
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    owner: 'idrisscarta',
    // appVersion keeps the runtime stable across builds/updates (tied to `version`
    // above), so JS-only OTA updates actually reach installed builds. Bump `version`
    // whenever a NATIVE module is added/removed, then ship a fresh build.
    runtimeVersion: {
      policy: 'appVersion',
    },
    updates: {
      enabled: true,
      url: `https://u.expo.dev/${projectId}`,
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: variant.bundleIdentifier,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        LSApplicationQueriesSchemes: socialShareSchemes,
        NSCameraUsageDescription:
          'MacroLens uses the camera to analyze meals, scan barcodes, and read nutrition labels.',
        NSPhotoLibraryUsageDescription:
          'MacroLens lets you pick an existing photo of a meal to analyze its calories and macros.',
      },
    },
    android: {
      package: variant.androidPackage,
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
    },
    web: {
      favicon: './assets/favicon.png',
    },
    extra: {
      appVariant,
      eas: {
        projectId,
      },
    },
  },
};

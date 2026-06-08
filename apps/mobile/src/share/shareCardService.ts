import type { RefObject } from 'react';
import { ActionSheetIOS, Alert, Platform, type View } from 'react-native';
import type { ShareOptions, ShareSingleOptions } from 'react-native-share';
import { buildShareCaption, MACROLENS_APP_STORE_URL, type ShareCardData } from './shareCardContent';

export const SHARE_CARD_CAPTURE_WIDTH = 1080;

export type ShareCardTarget = 'tiktok' | 'instagram_stories' | 'snapchat' | 'messenger' | 'facebook' | 'more';

type NativeShareModule = typeof import('react-native-share').default;
type CaptureRef = typeof import('react-native-view-shot').captureRef;

type ShareCardOptions = {
  instagramStoriesAppId?: string;
};

const IMAGE_TYPE = 'image/png';
const SHARE_TITLE = 'Share your card';

function getNativeShare(): NativeShareModule | null {
  if (Platform.OS === 'web') {
    return null;
  }

  return require('react-native-share').default as NativeShareModule;
}

export function waitForShareCardRender(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

export async function captureShareCard(ref: RefObject<View | null>): Promise<string> {
  if (Platform.OS === 'web') {
    throw new Error('share_card_native_unavailable');
  }

  if (!ref.current) {
    throw new Error('share_card_ref_missing');
  }

  const captureRef = (require('react-native-view-shot') as { captureRef: CaptureRef }).captureRef;

  return captureRef(ref.current, {
    format: 'png',
    quality: 1,
    result: 'tmpfile',
  });
}

function pickShareTarget(): Promise<ShareCardTarget | null> {
  if (Platform.OS === 'ios') {
    const options = ['TikTok', 'Instagram Stories', 'Snapchat', 'Messenger', 'Facebook', 'More', 'Cancel'];
    return new Promise((resolve) => {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: SHARE_TITLE,
          options,
          cancelButtonIndex: options.length - 1,
        },
        (buttonIndex) => {
          resolve((['tiktok', 'instagram_stories', 'snapchat', 'messenger', 'facebook', 'more'] as ShareCardTarget[])[buttonIndex] ?? null);
        },
      );
    });
  }

  return Promise.resolve('more');
}

async function shareSystem(share: NativeShareModule, uri: string, caption: string): Promise<void> {
  const options: ShareOptions = {
    title: SHARE_TITLE,
    message: caption,
    url: uri,
    type: IMAGE_TYPE,
    filename: 'macrolens-card',
    failOnCancel: false,
  };

  await share.open(options);
}

async function shareSingleOrSystem(
  share: NativeShareModule,
  uri: string,
  caption: string,
  options: ShareSingleOptions,
): Promise<void> {
  try {
    await share.shareSingle(options);
  } catch {
    await shareSystem(share, uri, caption);
  }
}

async function shareToTarget(
  share: NativeShareModule,
  uri: string,
  data: ShareCardData,
  target: ShareCardTarget,
  options: ShareCardOptions,
): Promise<void> {
  const caption = buildShareCaption(data.kind, data.title);

  if (target === 'instagram_stories') {
    if (!options.instagramStoriesAppId) {
      await shareSystem(share, uri, caption);
      return;
    }

    await shareSingleOrSystem(share, uri, caption, {
      social: share.Social.INSTAGRAM_STORIES as ShareSingleOptions['social'],
      appId: options.instagramStoriesAppId,
      backgroundImage: uri,
      linkUrl: MACROLENS_APP_STORE_URL,
      linkText: 'Get MacroLens',
    } as ShareSingleOptions);
    return;
  }

  if (target === 'snapchat') {
    await shareSingleOrSystem(share, uri, caption, {
      social: share.Social.SNAPCHAT as ShareSingleOptions['social'],
      url: uri,
      type: IMAGE_TYPE,
      message: caption,
    } as ShareSingleOptions);
    return;
  }

  if (target === 'messenger') {
    await shareSingleOrSystem(share, uri, caption, {
      social: share.Social.MESSENGER as ShareSingleOptions['social'],
      url: uri,
      type: IMAGE_TYPE,
      message: caption,
    } as ShareSingleOptions);
    return;
  }

  if (target === 'facebook') {
    await shareSingleOrSystem(share, uri, caption, {
      social: share.Social.FACEBOOK as ShareSingleOptions['social'],
      url: uri,
      type: IMAGE_TYPE,
      message: caption,
    } as ShareSingleOptions);
    return;
  }

  await shareSystem(share, uri, caption);
}

export async function shareCard(
  data: ShareCardData,
  ref: RefObject<View | null>,
  options: ShareCardOptions = {},
): Promise<void> {
  const share = getNativeShare();

  if (!share) {
    Alert.alert(SHARE_TITLE, 'Native sharing is available in the iOS and Android builds.');
    return;
  }

  const uri = await captureShareCard(ref);
  const target = await pickShareTarget();
  if (!target) {
    return;
  }

  await shareToTarget(share, uri, data, target, options);
}

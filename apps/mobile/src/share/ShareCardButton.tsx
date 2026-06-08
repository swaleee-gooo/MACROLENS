import { useEffect, useRef, useState } from 'react';
import { Alert, type StyleProp, View, type ViewStyle } from 'react-native';
import { Share2 } from 'lucide-react-native';
import { appEnv } from '../config/env';
import { PrimaryButton } from '../ui/primitives';
import { colors } from '../ui/theme';
import { ShareCard } from './ShareCard';
import { SHARE_CARD_CAPTURE_WIDTH, shareCard, waitForShareCardRender } from './shareCardService';
import type { ShareCardData } from './shareCardContent';

type Props = {
  data: ShareCardData;
  label: string;
  sharingLabel: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  variant?: 'dark' | 'accent' | 'ghost';
};

export function ShareCardButton({ data, label, sharingLabel, disabled, style, variant = 'accent' }: Props) {
  const captureRef = useRef<View>(null);
  const [captureData, setCaptureData] = useState<ShareCardData | null>(null);

  useEffect(() => {
    if (!captureData) {
      return undefined;
    }

    let cancelled = false;
    const dataToShare = captureData;

    async function run() {
      try {
        await waitForShareCardRender();
        if (cancelled) {
          return;
        }

        await shareCard(dataToShare, captureRef, {
          instagramStoriesAppId: appEnv.facebookAppId,
        });
      } catch {
        if (!cancelled) {
          Alert.alert('Share your card', 'The card could not be shared. Please try again.');
        }
      } finally {
        if (!cancelled) {
          setCaptureData(null);
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [captureData]);

  const isSharing = captureData !== null;

  return (
    <>
      <PrimaryButton
        label={isSharing ? sharingLabel : label}
        onPress={() => setCaptureData(data)}
        disabled={disabled || isSharing}
        variant={variant}
        icon={<Share2 color={variant === 'ghost' ? colors.ink : '#FFFFFF'} size={17} strokeWidth={2.2} />}
        style={style}
      />
      {captureData ? (
        <View pointerEvents="none" style={{ left: -99999, position: 'absolute', top: 0 }}>
          <ShareCard ref={captureRef} data={captureData} width={SHARE_CARD_CAPTURE_WIDTH} />
        </View>
      ) : null}
    </>
  );
}

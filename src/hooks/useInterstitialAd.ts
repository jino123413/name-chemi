import { useCallback, useRef, useState, useEffect } from 'react';
import { GoogleAdMob } from '@apps-in-toss/web-framework';

const AD_GROUP_ID = 'ait.v2.live.823663a60799462d';

interface InterstitialAdCallback {
  onDismiss?: () => void;
}

export function useInterstitialAd(adGroupId: string = AD_GROUP_ID) {
  const [loading, setLoading] = useState(true);
  const [adSupported, setAdSupported] = useState(true);
  const dismissCallbackRef = useRef<(() => void) | undefined>();

  useEffect(() => {
    try {
      const isAdUnsupported = GoogleAdMob?.loadAppsInTossAdMob?.isSupported?.() === false;

      if (isAdUnsupported) {
        console.warn('광고가 지원되지 않는 환경입니다.');
        setAdSupported(false);
        setLoading(false);
        return;
      }

      setLoading(true);

      const cleanup = GoogleAdMob.loadAppsInTossAdMob({
        options: { adGroupId },
        onEvent: (event: any) => {
          if (event.type === 'loaded') setLoading(false);
        },
        onError: (error: any) => {
          console.error('광고 로드 실패', error);
          setLoading(false);
        },
      });

      return cleanup;
    } catch {
      console.warn('광고가 지원되지 않는 환경입니다.');
      setAdSupported(false);
      setLoading(false);
    }
  }, [adGroupId]);

  const showInterstitialAd = useCallback(({ onDismiss }: InterstitialAdCallback) => {
    try {
      const isAdUnsupported = GoogleAdMob?.showAppsInTossAdMob?.isSupported?.() === false;
      if (isAdUnsupported) throw new Error('unsupported');
    } catch {
      onDismiss?.();
      return;
    }

    if (!adSupported || loading) {
      onDismiss?.();
      return;
    }

    dismissCallbackRef.current = onDismiss;

    GoogleAdMob.showAppsInTossAdMob({
      options: { adGroupId },
      onEvent: (event: any) => {
        switch (event.type) {
          case 'requested':
            setLoading(true);
            break;
          case 'dismissed':
            dismissCallbackRef.current?.();
            dismissCallbackRef.current = undefined;
            reloadAd();
            break;
          case 'failedToShow':
            dismissCallbackRef.current?.();
            dismissCallbackRef.current = undefined;
            break;
        }
      },
      onError: (error: any) => {
        console.error('광고 보여주기 실패', error);
        dismissCallbackRef.current?.();
        dismissCallbackRef.current = undefined;
      },
    });
  }, [loading, adSupported, adGroupId]);

  const reloadAd = useCallback(() => {
    if (!adSupported) return;
    setLoading(true);
    GoogleAdMob.loadAppsInTossAdMob({
      options: { adGroupId },
      onEvent: (event: any) => {
        if (event.type === 'loaded') setLoading(false);
      },
      onError: (error: any) => {
        console.error('광고 재로드 실패', error);
        setLoading(false);
      },
    });
  }, [adSupported, adGroupId]);

  return { loading, adSupported, showInterstitialAd };
}

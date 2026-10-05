import { useEffect, useRef, useState } from 'react';
import { Linking, StyleSheet } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { createLeafletHtml } from '@/components/map/leaflet-html';
import type { LeafletMapProps, MapInboundMessage, MapOutboundMessage } from '@/components/map/types';
import { Colors } from '@/constants/theme';

export function LeafletMap({ scheme, origin, destination, colors, onPress, style }: LeafletMapProps) {
  const webViewRef = useRef<WebView>(null);
  // Incremented on every page load so state is re-sent if the WebView reloads.
  const [loadCount, setLoadCount] = useState(0);
  const [html] = useState(() => createLeafletHtml(scheme, Colors[scheme].backgroundElement));

  const message: MapInboundMessage = { type: 'update', state: { scheme, origin, destination, colors } };
  const payload = JSON.stringify(message);

  useEffect(() => {
    if (loadCount === 0) return;
    webViewRef.current?.injectJavaScript(`window.__essarotaReceive(${payload}); true;`);
  }, [loadCount, payload]);

  function handleMessage(event: WebViewMessageEvent) {
    const data = JSON.parse(event.nativeEvent.data) as MapOutboundMessage;
    if (data.type === 'ready') {
      setLoadCount((count) => count + 1);
    } else if (data.type === 'press') {
      onPress?.({ latitude: data.latitude, longitude: data.longitude });
    }
  }

  return (
    <WebView
      ref={webViewRef}
      originWhitelist={['*']}
      source={{ html }}
      onMessage={handleMessage}
      onShouldStartLoadWithRequest={(request) => {
        if (/^https?:/.test(request.url)) {
          Linking.openURL(request.url);
          return false;
        }
        return true;
      }}
      applicationNameForUserAgent="EssaRota/1.0"
      setSupportMultipleWindows={false}
      overScrollMode="never"
      bounces={false}
      style={[styles.map, { backgroundColor: Colors[scheme].backgroundElement }, style]}
    />
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});

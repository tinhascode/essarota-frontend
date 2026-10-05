import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { APP_MESSAGE_SOURCE, createLeafletHtml, MAP_MESSAGE_SOURCE } from '@/components/map/leaflet-html';
import type { LeafletMapProps, MapInboundMessage, MapOutboundMessage } from '@/components/map/types';
import { Colors } from '@/constants/theme';

export function LeafletMap({ scheme, origin, destination, colors, onPress, style }: LeafletMapProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // Incremented on every page load so state is re-sent if the iframe reloads.
  const [loadCount, setLoadCount] = useState(0);
  const [html] = useState(() => createLeafletHtml(scheme, Colors[scheme].backgroundElement));
  const onPressRef = useRef(onPress);

  useEffect(() => {
    onPressRef.current = onPress;
  }, [onPress]);

  const message: MapInboundMessage = { type: 'update', state: { scheme, origin, destination, colors } };
  const payload = JSON.stringify(message);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (event.data?.source !== MAP_MESSAGE_SOURCE) return;
      const data = JSON.parse(event.data.payload) as MapOutboundMessage;
      if (data.type === 'ready') {
        setLoadCount((count) => count + 1);
      } else if (data.type === 'press') {
        onPressRef.current?.({ latitude: data.latitude, longitude: data.longitude });
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (loadCount === 0) return;
    iframeRef.current?.contentWindow?.postMessage({ source: APP_MESSAGE_SOURCE, payload }, '*');
  }, [loadCount, payload]);

  return (
    <View style={[styles.map, { backgroundColor: Colors[scheme].backgroundElement }, style]}>
      <iframe
        ref={iframeRef}
        srcDoc={html}
        title="Mapa"
        style={{ border: 0, width: '100%', height: '100%', display: 'block' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
    overflow: 'hidden',
  },
});

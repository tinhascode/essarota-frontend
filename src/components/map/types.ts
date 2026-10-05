import type { StyleProp, ViewStyle } from 'react-native';

import type { ColorSchemeName } from '@/constants/theme';
import type { LatLng } from '@/services/geocoding';

export type MapColors = {
  origin: string;
  destination: string;
  line: string;
  markerBorder: string;
};

export type MapState = {
  scheme: ColorSchemeName;
  origin: LatLng | null;
  destination: LatLng | null;
  colors: MapColors;
};

export type MapInboundMessage = { type: 'update'; state: MapState };

export type MapOutboundMessage =
  | { type: 'ready' }
  | { type: 'press'; latitude: number; longitude: number };

export type LeafletMapProps = MapState & {
  onPress?: (point: LatLng) => void;
  style?: StyleProp<ViewStyle>;
};

import { SymbolView, type SFSymbol, type AndroidSymbol } from 'expo-symbols';
import type { ColorValue, StyleProp, ViewStyle } from 'react-native';

const icons = {
  map: { ios: 'map.fill', material: 'map' },
  route: { ios: 'point.topleft.down.to.point.bottomright.curvepath.fill', material: 'route' },
  moon: { ios: 'moon.fill', material: 'dark_mode' },
  sun: { ios: 'sun.max.fill', material: 'light_mode' },
  logout: { ios: 'rectangle.portrait.and.arrow.right', material: 'logout' },
  swap: { ios: 'arrow.up.arrow.down', material: 'swap_vert' },
  myLocation: { ios: 'location.fill', material: 'my_location' },
  edit: { ios: 'pencil', material: 'edit' },
  delete: { ios: 'trash', material: 'delete' },
  clock: { ios: 'clock', material: 'schedule' },
  search: { ios: 'magnifyingglass', material: 'search' },
  close: { ios: 'xmark', material: 'close' },
  origin: { ios: 'circle.circle.fill', material: 'trip_origin' },
  pin: { ios: 'mappin.circle.fill', material: 'location_on' },
  train: { ios: 'tram.fill', material: 'directions_subway' },
  add: { ios: 'plus', material: 'add' },
} satisfies Record<string, { ios: SFSymbol; material: AndroidSymbol }>;

export type IconName = keyof typeof icons;

type IconProps = {
  name: IconName;
  size?: number;
  color: ColorValue;
  style?: StyleProp<ViewStyle>;
};

export function Icon({ name, size = 22, color, style }: IconProps) {
  const { ios, material } = icons[name];
  return (
    <SymbolView
      name={{ ios, android: material, web: material }}
      size={size}
      tintColor={color}
      style={[{ width: size, height: size }, style]}
    />
  );
}

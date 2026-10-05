import { Stack } from 'expo-router';

import { useStackOptions, withThemeToggle } from '@/hooks/use-stack-options';

export const unstable_settings = {
  anchor: 'index',
};

export default function TrajetosLayout() {
  return (
    <Stack screenOptions={useStackOptions()}>
      <Stack.Screen name="index" options={{ title: 'Meus trajetos', ...withThemeToggle }} />
      <Stack.Screen name="[id]" options={{ title: 'Trajeto' }} />
    </Stack>
  );
}

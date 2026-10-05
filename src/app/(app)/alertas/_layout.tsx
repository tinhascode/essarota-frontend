import { Stack } from 'expo-router';

import { useStackOptions, withThemeToggle } from '@/hooks/use-stack-options';

export const unstable_settings = {
  anchor: 'index',
};

export default function AlertasLayout() {
  return (
    <Stack screenOptions={useStackOptions()}>
      <Stack.Screen name="index" options={{ title: 'Alertas e linhas', ...withThemeToggle }} />
      <Stack.Screen name="novo" options={{ title: 'Novo alerta' }} />
      <Stack.Screen name="linha" options={{ title: 'Linha' }} />
      <Stack.Screen name="[id]" options={{ title: 'Alerta' }} />
    </Stack>
  );
}

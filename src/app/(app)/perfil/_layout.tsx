import { Stack } from 'expo-router';

import { useStackOptions } from '@/hooks/use-stack-options';

export const unstable_settings = {
  anchor: 'index',
};

export default function PerfilLayout() {
  return (
    <Stack screenOptions={useStackOptions()}>
      <Stack.Screen name="index" options={{ title: 'Perfil' }} />
      <Stack.Screen name="editar" options={{ title: 'Editar dados' }} />
      <Stack.Screen name="notificacoes" options={{ title: 'Notificações' }} />
    </Stack>
  );
}

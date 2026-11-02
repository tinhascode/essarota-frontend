import AppTabs from '@/components/app-tabs';
import { InboxProvider } from '@/providers/inbox-provider';

export default function AppLayout() {
  return (
    <InboxProvider>
      <AppTabs />
    </InboxProvider>
  );
}

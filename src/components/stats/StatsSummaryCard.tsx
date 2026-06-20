import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';

type Props = {
  label: string;
  value: string;
};

export function StatsSummaryCard({ label, value }: Props) {
  return (
    <Card style={{ flex: 1, minHeight: 72, justifyContent: 'space-between', gap: 6 }}>
      <AppText variant="caption" tone="tertiary">
        {label}
      </AppText>
      <AppText variant="title" style={{ fontSize: 20, fontWeight: '700' }}>
        {value}
      </AppText>
    </Card>
  );
}

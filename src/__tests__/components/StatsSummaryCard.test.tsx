import React from 'react';
import { render, screen } from '@testing-library/react-native';

import { StatsSummaryCard } from '@/components/stats/StatsSummaryCard';

jest.mock('@/hooks/useThemeColors', () => ({
  useThemeColors: () => ({
    ink: '#000',
    inkSecondary: '#666',
    inkTertiary: '#999',
    inkDisabled: '#ccc',
    surface: '#fff',
    surfaceSubtle: '#f5f5f5',
    border: '#e0e0e0',
    neonGlow: '#22c55e',
  }),
}));

jest.mock('@/constants/themeEffects', () => ({
  neonGlowShadow: () => ({}),
}));

describe('StatsSummaryCard', () => {
  it('renders label and value', async () => {
    await render(<StatsSummaryCard label="Total" value="42회" />);
    expect(screen.getByText('Total')).toBeTruthy();
    expect(screen.getByText('42회')).toBeTruthy();
  });

  it('renders different values', async () => {
    await render(<StatsSummaryCard label="Average" value="3시간 20분" />);
    expect(screen.getByText('Average')).toBeTruthy();
    expect(screen.getByText('3시간 20분')).toBeTruthy();
  });
});

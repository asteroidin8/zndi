import React from 'react';
import { render, screen } from '@testing-library/react-native';

import { EmptyState } from '@/components/EmptyState';

jest.mock('@/components/EmptyIllustration', () => ({
  EmptyIllustration: () => null,
}));

jest.mock('@/hooks/useThemeColors', () => ({
  useThemeColors: () => ({
    ink: '#000',
    inkSecondary: '#666',
    inkTertiary: '#999',
    inkDisabled: '#ccc',
    surface: '#fff',
    primary: '#22c55e',
  }),
}));

describe('EmptyState', () => {
  it('renders the message', async () => {
    await render(<EmptyState message="No items yet" />);
    expect(screen.getByText('No items yet')).toBeTruthy();
  });

  it('renders with inline style', async () => {
    await render(<EmptyState message="Empty section" inline />);
    expect(screen.getByText('Empty section')).toBeTruthy();
  });
});

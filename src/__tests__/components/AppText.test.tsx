import React from 'react';
import { render, screen } from '@testing-library/react-native';

import { AppText } from '@/components/AppText';

jest.mock('@/hooks/useThemeColors', () => ({
  useThemeColors: () => ({
    ink: '#000000',
    inkSecondary: '#666666',
    inkTertiary: '#999999',
    inkDisabled: '#cccccc',
  }),
}));

describe('AppText', () => {
  it('renders text content', async () => {
    await render(<AppText>Hello</AppText>);
    expect(screen.getByText('Hello')).toBeTruthy();
  });

  it('renders with different variants', async () => {
    await render(<AppText variant="title">Title</AppText>);
    expect(screen.getByText('Title')).toBeTruthy();
  });

  it('renders with different tones', async () => {
    await render(<AppText tone="tertiary">Muted</AppText>);
    expect(screen.getByText('Muted')).toBeTruthy();
  });
});

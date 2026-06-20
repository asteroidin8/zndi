import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';

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

  it('renders action button when provided', async () => {
    const onAction = jest.fn();
    await render(
      <EmptyState message="Empty" actionLabel="Add item" onAction={onAction} />,
    );
    const button = screen.getByText('Add item');
    expect(button).toBeTruthy();
    fireEvent.press(button);
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('does not render action button when no actionLabel', async () => {
    await render(<EmptyState message="Empty" />);
    expect(screen.queryByText('Add item')).toBeNull();
  });
});

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { spacing } from '@/constants/spacing';
import { Sentry } from '@/utils/sentry';

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.screen }}>
          <AppText variant="title" style={{ marginBottom: spacing.sm }}>
            문제가 발생했어요
          </AppText>
          <AppText variant="caption" tone="tertiary" style={{ textAlign: 'center' }}>
            앱을 다시 시작해 주세요.
          </AppText>
        </View>
      );
    }

    return this.props.children;
  }
}

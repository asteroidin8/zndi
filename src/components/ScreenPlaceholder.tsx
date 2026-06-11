import { Text, View } from 'react-native';

type Props = {
  title: string;
};

export function ScreenPlaceholder({ title }: Props) {
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-ink-tertiary text-sm">{title} 화면 준비 중</Text>
    </View>
  );
}

import { Pressable, View } from 'react-native';

import { AppIcon } from '../AppIcon';
import { AppText } from '../AppText';
import { SheetModal } from '../SheetModal';
import { spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';

export type SettingOption<T> = {
  label: string;
  value: T;
};

type Props<T> = {
  visible: boolean;
  title: string;
  options: SettingOption<T>[];
  selectedValue: T;
  onSelect: (value: T) => void;
  onClose: () => void;
};

function optionKey<T>(value: T): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  return String(value);
}

export function SettingOptionSheet<T>({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
}: Props<T>) {
  const c = useThemeColors();

  function handleSelect(value: T) {
    onSelect(value);
    onClose();
  }

  return (
    <SheetModal visible={visible} onClose={onClose} title={title}>
      <View style={{ width: '100%' }}>
        {options.map((opt, index) => {
          const selected = opt.value === selectedValue;
          return (
            <View key={optionKey(opt.value)}>
              {index > 0 ? (
                <View
                  style={{
                    height: 1,
                    backgroundColor: c.borderNeutral,
                    marginHorizontal: spacing.xs,
                  }}
                />
              ) : null}
              <Pressable
                onPress={() => handleSelect(opt.value)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={opt.label}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  alignSelf: 'stretch',
                  width: '100%',
                  minHeight: 48,
                  paddingVertical: spacing.md,
                  paddingHorizontal: spacing.sm,
                  backgroundColor: pressed ? c.surfaceMuted : 'transparent',
                  borderRadius: spacing.sm,
                })}
              >
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <AppText
                    variant="body"
                    style={{
                      color: selected ? c.ink : c.inkSecondary,
                      fontWeight: selected ? '600' : '400',
                    }}
                  >
                    {opt.label}
                  </AppText>
                </View>
                {selected && (
                  <AppIcon name="Check" size={20} color={c.primary} strokeWidth={2.5} />
                )}
              </Pressable>
            </View>
          );
        })}
      </View>
    </SheetModal>
  );
}

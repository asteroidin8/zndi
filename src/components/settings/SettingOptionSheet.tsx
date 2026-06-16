import { Pressable, View } from 'react-native';

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

function RadioIndicator({ selected }: { selected: boolean }) {
  const c = useThemeColors();

  return (
    <View
      style={{
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: selected ? c.ink : c.border,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {selected ? (
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: c.ink,
          }}
        />
      ) : null}
    </View>
  );
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
                <View style={{ height: 1, backgroundColor: c.border, marginVertical: spacing.xs }} />
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
                  paddingVertical: spacing.sm,
                  backgroundColor: pressed ? c.surfaceMuted : 'transparent',
                  borderRadius: spacing.sm,
                })}
              >
                <RadioIndicator selected={selected} />
                <View style={{ flex: 1, marginLeft: spacing.md, justifyContent: 'center' }}>
                  <AppText variant="body" style={{ color: c.ink }}>
                    {opt.label}
                  </AppText>
                </View>
              </Pressable>
            </View>
          );
        })}
      </View>
    </SheetModal>
  );
}

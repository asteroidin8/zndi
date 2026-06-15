import {
  SettingSection,
  SettingSegmentTrack,
  SettingsScaffold,
} from '@/components/settings';
import { THEME_OPTIONS } from '@/constants/settingsOptions';
import { useSettingsStore } from '@/stores/useSettingsStore';

export default function SettingsThemeScreen() {
  const { themeMode, setThemeMode } = useSettingsStore();

  return (
    <SettingsScaffold title="테마">
      <SettingSection title="테마">
        <SettingSegmentTrack
          layout="full"
          tone="settings"
          value={themeMode}
          onChange={(mode) => {
            if (mode) setThemeMode(mode);
          }}
          options={THEME_OPTIONS.map((opt) => ({
            value: opt.mode,
            label: opt.label,
            icon: opt.icon,
          }))}
        />
      </SettingSection>
    </SettingsScaffold>
  );
}

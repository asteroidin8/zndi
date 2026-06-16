import { Children, Fragment, isValidElement, type ReactNode } from 'react';

import { Card } from '../Card';
import { SettingInsetDivider } from './SettingInsetDivider';
import { settingCardStyle } from './settingStyles';

type Props = {
  children: ReactNode;
};

/** iOS Settings 그룹 — Card + row 사이 inset 구분선 */
export function SettingsList({ children }: Props) {
  const rows = Children.toArray(children).filter(isValidElement);

  if (rows.length === 0) return null;

  return (
    <Card padded={false} variant="settings" style={settingCardStyle()}>
      {rows.map((row, index) => (
        <Fragment key={row.key ?? index}>
          {index > 0 && <SettingInsetDivider />}
          {row}
        </Fragment>
      ))}
    </Card>
  );
}

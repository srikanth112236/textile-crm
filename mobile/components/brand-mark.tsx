import * as React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

/**
 * The Mentoos monogram, same geometry as app/app/icon.svg:
 * amber "M" on a slate-950 tile.
 */
export function BrandMark({
  size = 64,
  withBackground = true,
  color = '#f59e0b',
  background = '#0f172a',
  radius,
}: {
  size?: number;
  withBackground?: boolean;
  color?: string;
  background?: string;
  radius?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {withBackground ? (
        <Rect width={64} height={64} rx={radius ?? 14} fill={background} />
      ) : null}
      <Path
        d="M14 46V18h7.4l10.6 15.2L42.6 18H50v28h-7V30.4L32 45.2 21 30.4V46h-7z"
        fill={color}
      />
    </Svg>
  );
}

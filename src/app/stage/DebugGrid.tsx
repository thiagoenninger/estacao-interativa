import {
  columnX,
  DIVIDER_X,
  GRID,
  NAVIGATION_ZONE,
  OBJECT_MAX_BOX,
  ORBIT_CENTER_WITH_PANEL,
  ORBIT_RADIUS,
  SAFE_AREA,
  STAGE,
  TEXT_COLUMN,
  UNIVERSE_CENTER,
} from '../../design-system/measures';

const COLUMNS = Array.from({ length: GRID.columns }, (_, i) => i + 1);

// Debug overlay: draws the Design System grid over the Stage
// Used to check the scale and the position of every element
// Receives no touch and its not part of the experience

export function DebugGrid() {
  const color = 'var(--color-state-active)';

  return (
    <svg
      data-testid="debug-grid"
      width={STAGE.width}
      height={STAGE.height}
      viewBox={`0 0 ${STAGE.width} ${STAGE.height}`}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      aria-hidden="true"
    >
      {/* Columns (12 x 120px, 32px gutter) */}
      {COLUMNS.map((n) => (
        <rect
          key={n}
          x={columnX(n)}
          y={SAFE_AREA.y}
          width={GRID.columnWidth}
          height={SAFE_AREA.height}
          fill={color}
          fillOpacity={0.08}
        />
      ))}

      {/* Safe area (64px margin) */}
      <rect
        x={SAFE_AREA.x}
        y={SAFE_AREA.y}
        width={SAFE_AREA.width}
        height={SAFE_AREA.height}
        fill="none"
        stroke={color}
        strokeWidth={2}
      />

      {/* Divider between exploration and information, and the text column */}
      <line
        x1={DIVIDER_X}
        y1={SAFE_AREA.y}
        x2={DIVIDER_X}
        y2={SAFE_AREA.y + SAFE_AREA.height}
        stroke={color}
        strokeWidth={1.5}
      />

      <rect
        x={TEXT_COLUMN.x}
        y={TEXT_COLUMN.y}
        width={TEXT_COLUMN.width}
        height={TEXT_COLUMN.height}
        fill="none"
        stroke={color}
        strokeWidth={1}
        strokeDasharray="8 8"
      />

      {/* Navigation zone */}
      <rect
        x={NAVIGATION_ZONE.x}
        y={NAVIGATION_ZONE.y}
        width={NAVIGATION_ZONE.width}
        height={NAVIGATION_ZONE.height}
        fill={color}
        fillOpacity={0.2}
        stroke={color}
        strokeWidth={1.5}
      />

      {/* Orbit with panel and the object's maximum box */}
      <circle
        cx={ORBIT_CENTER_WITH_PANEL.x}
        cy={ORBIT_CENTER_WITH_PANEL.y}
        r={ORBIT_RADIUS}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
      />
      <rect
        x={ORBIT_CENTER_WITH_PANEL.x - OBJECT_MAX_BOX.width / 2}
        y={ORBIT_CENTER_WITH_PANEL.y - OBJECT_MAX_BOX.height / 2}
        width={OBJECT_MAX_BOX.width}
        height={OBJECT_MAX_BOX.height}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeDasharray="12 8"
      />

      {/* Universe center (no panel) */}
      <line
        x1={UNIVERSE_CENTER.x - 24}
        y1={UNIVERSE_CENTER.y}
        x2={UNIVERSE_CENTER.x + 24}
        y2={UNIVERSE_CENTER.y}
        stroke={color}
        strokeWidth={2}
      />
      <line
        x1={UNIVERSE_CENTER.x}
        y1={UNIVERSE_CENTER.y - 24}
        x2={UNIVERSE_CENTER.x}
        y2={UNIVERSE_CENTER.y + 24}
        stroke={color}
        strokeWidth={2}
      />

      {/* Stage border, to check the framing */}
      <rect
        x={1}
        y={1}
        width={STAGE.width - 2}
        height={STAGE.height - 2}
        fill="none"
        stroke={color}
        strokeWidth={2}
      />
    </svg>
  );
}

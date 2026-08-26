"use client";

import {
  getArchPosition,
  getOcclusalFaceLayout,
  getPermanentToothKind,
  getRootCount,
  TOOTH_SURFACE_LABELS,
  type PermanentToothKind,
} from "@/features/records/domain/odontogram-cross";
import type { ToothSurface } from "@/features/records/domain/tooth-fdi";

const STROKE = "#5c2430";
const ANATOMICAL_FILL = "#faf6f1";
const CROWN_FILL = "#f3e2c2";

interface ToothViewsProps {
  toothNumber: number;
  surfaceColors: Partial<Record<ToothSurface, string>>;
  selectedSurface: string | null;
  columnPx: number;
  onSelectTooth: (toothNumber: number) => void;
  onSelectSurface: (toothNumber: number, surface: ToothSurface) => void;
}

export function ToothViews({
  toothNumber,
  surfaceColors,
  selectedSurface,
  columnPx,
  onSelectTooth,
  onSelectSurface,
}: ToothViewsProps) {
  const arch = getArchPosition(toothNumber);
  const views =
    arch === "upper" ? (
      <>
        <RootView toothNumber={toothNumber} onSelectTooth={onSelectTooth} />
        <CrownView toothNumber={toothNumber} onSelectTooth={onSelectTooth} />
        <OcclusalView
          toothNumber={toothNumber}
          surfaceColors={surfaceColors}
          selectedSurface={selectedSurface}
          onSelectSurface={onSelectSurface}
        />
      </>
    ) : (
      <>
        <OcclusalView
          toothNumber={toothNumber}
          surfaceColors={surfaceColors}
          selectedSurface={selectedSurface}
          onSelectSurface={onSelectSurface}
        />
        <CrownView toothNumber={toothNumber} onSelectTooth={onSelectTooth} />
        <RootView toothNumber={toothNumber} onSelectTooth={onSelectTooth} />
      </>
    );

  return (
    <div className="flex flex-col items-stretch" style={{ width: columnPx }}>
      {views}
    </div>
  );
}

interface ToothSelectProps {
  toothNumber: number;
  onSelectTooth: (toothNumber: number) => void;
}

function RootView({ toothNumber, onSelectTooth }: ToothSelectProps) {
  const kind = getPermanentToothKind(toothNumber);
  const rootCount = getRootCount(toothNumber);
  const flipped = getArchPosition(toothNumber) === "lower";

  return (
    <button
      type="button"
      aria-label={`Dente ${toothNumber}, vista da raiz`}
      onClick={() => onSelectTooth(toothNumber)}
      className="flex w-full items-center justify-center p-0"
    >
      <svg
        viewBox="0 0 40 88"
        className="h-auto w-full"
        style={{ transform: flipped ? "scaleY(-1)" : undefined }}
        aria-hidden
      >
        <AnatomicalRoots kind={kind} rootCount={rootCount} />
        <AnatomicalCrown kind={kind} />
      </svg>
    </button>
  );
}

function CrownView({ toothNumber, onSelectTooth }: ToothSelectProps) {
  return (
    <button
      type="button"
      aria-label={`Dente ${toothNumber}, vista da coroa`}
      onClick={() => onSelectTooth(toothNumber)}
      className="flex min-h-7 w-full items-center justify-center p-0.5"
    >
      <svg viewBox="0 0 40 28" className="h-auto w-[86%]" aria-hidden>
        <rect
          x="6"
          y="4"
          width="28"
          height="20"
          rx="4"
          fill={CROWN_FILL}
          stroke={STROKE}
          strokeWidth="1.2"
        />
        <path d="M10 14 H30" stroke={STROKE} strokeWidth="0.8" opacity="0.45" />
      </svg>
    </button>
  );
}

interface OcclusalViewProps {
  toothNumber: number;
  surfaceColors: Partial<Record<ToothSurface, string>>;
  selectedSurface: string | null;
  onSelectSurface: (toothNumber: number, surface: ToothSurface) => void;
}

function OcclusalView({
  toothNumber,
  surfaceColors,
  selectedSurface,
  onSelectSurface,
}: OcclusalViewProps) {
  const layout = getOcclusalFaceLayout(toothNumber);
  const regions: Array<{ surface: ToothSurface; points: string }> = [
    { surface: layout.top, points: "0,0 3,0 2,1 1,1" },
    { surface: layout.left, points: "0,0 1,1 1,2 0,3" },
    { surface: layout.right, points: "3,0 3,3 2,2 2,1" },
    { surface: layout.bottom, points: "0,3 1,2 2,2 3,3" },
  ];

  return (
    <svg viewBox="0 0 3 3" className="h-auto w-full">
      {regions.map((region) => (
        <FacePolygon
          key={region.surface}
          toothNumber={toothNumber}
          surface={region.surface}
          points={region.points}
          fill={surfaceColors[region.surface] ?? "#e5e7eb"}
          selected={selectedSurface === region.surface}
          onSelectSurface={onSelectSurface}
        />
      ))}
      <FacePolygon
        toothNumber={toothNumber}
        surface={layout.center}
        points="1,1 2,1 2,2 1,2"
        fill={surfaceColors[layout.center] ?? "#e5e7eb"}
        selected={selectedSurface === layout.center}
        onSelectSurface={onSelectSurface}
      />
    </svg>
  );
}

interface FacePolygonProps {
  toothNumber: number;
  surface: ToothSurface;
  points: string;
  fill: string;
  selected: boolean;
  onSelectSurface: (toothNumber: number, surface: ToothSurface) => void;
}

function FacePolygon({
  toothNumber,
  surface,
  points,
  fill,
  selected,
  onSelectSurface,
}: FacePolygonProps) {
  const label = TOOTH_SURFACE_LABELS[surface];

  return (
    <polygon
      points={points}
      fill={fill}
      stroke={selected ? "#d9a441" : STROKE}
      strokeWidth={selected ? 0.12 : 0.04}
      className="cursor-pointer"
      role="button"
      tabIndex={0}
      aria-label={`Dente ${toothNumber}, face ${label}`}
      onClick={(event) => {
        event.stopPropagation();
        onSelectSurface(toothNumber, surface);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelectSurface(toothNumber, surface);
        }
      }}
    />
  );
}

function AnatomicalRoots({
  kind,
  rootCount,
}: {
  kind: PermanentToothKind;
  rootCount: 1 | 2 | 3;
}) {
  if (rootCount === 3) {
    return (
      <path
        d="M8 46 L10 10 Q14 4 16 10 L18 46 Z M17 46 L19 6 Q20 2 21 6 L23 46 Z M22 46 L24 10 Q26 4 30 10 L32 46 Z"
        fill={ANATOMICAL_FILL}
        stroke={STROKE}
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    );
  }

  if (rootCount === 2) {
    return (
      <path
        d="M10 46 L12 12 Q16 6 18 12 L20 46 Z M20 46 L22 12 Q24 6 28 12 L30 46 Z"
        fill={ANATOMICAL_FILL}
        stroke={STROKE}
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    );
  }

  if (kind === "canine") {
    return (
      <path
        d="M16 48 C15 28 17 8 20 2 C23 8 25 28 24 48 Z"
        fill={ANATOMICAL_FILL}
        stroke={STROKE}
        strokeWidth="1.1"
      />
    );
  }

  return (
    <path
      d="M16 48 C15 32 17 12 20 6 C23 12 25 32 24 48 Z"
      fill={ANATOMICAL_FILL}
      stroke={STROKE}
      strokeWidth="1.1"
    />
  );
}

function AnatomicalCrown({ kind }: { kind: PermanentToothKind }) {
  if (kind === "molar") {
    return (
      <path
        d="M6 48 H34 L32 78 Q20 84 8 78 Z"
        fill={ANATOMICAL_FILL}
        stroke={STROKE}
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    );
  }

  if (kind === "premolar") {
    return (
      <path
        d="M10 48 H30 L28 76 Q20 82 12 76 Z"
        fill={ANATOMICAL_FILL}
        stroke={STROKE}
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    );
  }

  if (kind === "canine") {
    return (
      <path
        d="M12 48 H28 L26 72 L20 82 L14 72 Z"
        fill={ANATOMICAL_FILL}
        stroke={STROKE}
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    );
  }

  return (
    <path
      d="M12 48 H28 L27 76 Q20 82 13 76 Z"
      fill={ANATOMICAL_FILL}
      stroke={STROKE}
      strokeWidth="1.1"
      strokeLinejoin="round"
    />
  );
}

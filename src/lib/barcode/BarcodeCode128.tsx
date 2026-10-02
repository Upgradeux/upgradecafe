"use client";

import React, { useMemo } from "react";
import { encodeCode128 } from "./code128";

interface BarcodeCode128Props {
  value: string;
  className?: string;
  height?: number;
  barColor?: string;
  showText?: boolean;
  textColor?: string;
}

export const BarcodeCode128: React.FC<BarcodeCode128Props> = ({
  value,
  className = "",
  height = 54,
  barColor = "#1C1D1A",
  showText = true,
  textColor = "#54524D",
}) => {
  const barcode = useMemo(() => {
    try {
      return encodeCode128(value || "RCP000000");
    } catch {
      return encodeCode128("UNKNOWN");
    }
  }, [value]);

  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      <svg
        viewBox={`0 0 ${barcode.totalModules} ${height}`}
        className="w-full h-auto max-w-[280px] sm:max-w-[320px] overflow-visible"
        shapeRendering="crispEdges"
        xmlns="http://www.w3.org/2000/svg"
      >
        {barcode.bars.map((bar, idx) => (
          <rect
            key={idx}
            x={bar.x}
            y={0}
            width={bar.width}
            height={height}
            fill={barColor}
          />
        ))}
      </svg>

      {showText && (
        <span
          className="font-mono text-[11px] sm:text-xs font-semibold tracking-[0.22em] mt-1.5 uppercase"
          style={{ color: textColor }}
        >
          {value}
        </span>
      )}
    </div>
  );
};

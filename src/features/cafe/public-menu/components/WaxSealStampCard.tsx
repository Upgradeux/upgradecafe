"use client";

import React from "react";
import {
  StampCard,
  StampCardProps,
  StampBadge,
  StampBadgeProps,
  StampGrid,
  StampCardHeader,
  StampCardDescription,
  type StampItemConfig,
} from "./stamps";

export type WaxSealStampCardProps = StampCardProps;

/**
 * Backwards-compatible alias for StampCard
 */
export const WaxSealStampCard: React.FC<WaxSealStampCardProps> = (props) => {
  return <StampCard {...props} />;
};

export {
  StampCard,
  StampBadge,
  StampGrid,
  StampCardHeader,
  StampCardDescription,
};
export type { StampBadgeProps, StampItemConfig };
export * from "./stamps/StampIcons";

"use client";

import React from "react";
import { Modal, ModalProps } from "./Modal";

export type DialogProps = ModalProps;

export const Dialog: React.FC<DialogProps> = (props) => {
  return <Modal {...props} />;
};

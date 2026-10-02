"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import jsQR from "jsqr";
import { soundAlert } from "@/features/cafe/orders/utils/sound-chime";
import { getDigitalMenuVisualTheme } from "@/lib/theme/theme-tokens";
import {
  IconQrcode,
  IconX,
  IconCamera,
  IconArmchair,
  IconAlertTriangle,
  IconCheck,
  IconRefresh,
} from "@tabler/icons-react";

export interface TableQrScannerModalProps {
  isOpen: boolean;
  expectedTableNumber?: string;
  expectedTableId?: string;
  expectedTableQrIdentifier?: string | null;
  tablesList?: Array<{
    id: string;
    tableNumber: string;
    status: string;
    qrIdentifier?: string | null;
  }>;
  cafeSlug: string;
  cafeName: string;
  digitalMenuTheme?: string;
  onTableClaimed: (tableNumber: string, tableId: string, qrIdentifier?: string | null) => void;
  onClose: () => void;
}

interface QrValidationResult {
  isValid: boolean;
  errorMessage?: string;
  matchedTableNumber?: string;
  matchedTableId?: string;
  matchedQrIdentifier?: string | null;
}

/**
 * Strict validation: Only accepts this specific café's QR code.
 * If expectedTableNumber is specified (e.g. waitlist held table), strictly verifies that table.
 * If no expectedTableNumber is specified, verifies that the scanned QR belongs to this café
 * and matches an available table.
 */
export function validateTableQrCode(
  rawText: string,
  cafeSlug: string,
  cafeName: string,
  expectedTableNumber?: string,
  expectedTableQrIdentifier?: string | null,
  tablesList?: Array<{
    id: string;
    tableNumber: string;
    status: string;
    qrIdentifier?: string | null;
  }>
): QrValidationResult {
  const text = (rawText || "").trim();
  if (!text) {
    return { isValid: false, errorMessage: "No QR code data detected." };
  }

  // Parse as URL or pathname
  let urlObj: URL | null = null;
  try {
    if (text.startsWith("http://") || text.startsWith("https://")) {
      urlObj = new URL(text);
    } else if (text.startsWith("/")) {
      urlObj = new URL(`http://dummy${text}`);
    } else if (text.includes("/menu/")) {
      const slashIndex = text.indexOf("/menu/");
      urlObj = new URL(`http://dummy${text.substring(slashIndex)}`);
    }
  } catch {
    urlObj = null;
  }

  let scannedSlug = "";
  let tableParam = "";
  let qrParam = "";

  if (urlObj) {
    const pathname = urlObj.pathname.toLowerCase();

    // Must be a menu URL
    if (pathname.includes("/menu/")) {
      const parts = pathname.split("/").filter(Boolean); // ['menu', cafeSlug, ...]
      const menuIdx = parts.indexOf("menu");
      scannedSlug = menuIdx !== -1 && parts[menuIdx + 1] ? parts[menuIdx + 1] : "";

      // Reject different cafe
      if (scannedSlug && scannedSlug.toLowerCase() !== cafeSlug.toLowerCase()) {
        return {
          isValid: false,
          errorMessage: `Wrong Café: This QR code belongs to another café (${scannedSlug}). Please scan the QR code for ${cafeName}.`,
        };
      }

      tableParam = urlObj.searchParams.get("table") || "";
      qrParam = urlObj.searchParams.get("qr") || "";
    }
  }

  // CASE 1: Expected specific table (e.g., from waitlist hold)
  if (expectedTableNumber) {
    const cleanExpected = expectedTableNumber.trim().toLowerCase();
    const cleanExpectedNum = cleanExpected.replace(/^table\s*/i, "");

    // 1. Direct match on QR identifier token
    if (expectedTableQrIdentifier && text === expectedTableQrIdentifier) {
      return { isValid: true, matchedTableNumber: expectedTableNumber };
    }

    // 2. Direct match on table number string
    const cleanText = text.toLowerCase().replace(/^table\s*/i, "");
    if (cleanText === cleanExpectedNum || text.toLowerCase() === cleanExpected) {
      return { isValid: true, matchedTableNumber: expectedTableNumber };
    }

    // 3. QR param match
    if (expectedTableQrIdentifier && qrParam && qrParam.toLowerCase() === expectedTableQrIdentifier.toLowerCase()) {
      return { isValid: true, matchedTableNumber: expectedTableNumber };
    }

    // 4. Table query parameter
    if (tableParam) {
      const decodedTable = decodeURIComponent(tableParam).trim().toLowerCase();
      const decodedNum = decodedTable.replace(/^table\s*/i, "");

      if (decodedTable === cleanExpected || decodedNum === cleanExpectedNum) {
        return { isValid: true, matchedTableNumber: expectedTableNumber };
      } else {
        return {
          isValid: false,
          errorMessage: `Wrong Table: This QR code is for "${decodeURIComponent(tableParam)}". Your assigned seat is "${expectedTableNumber}". Please scan ${expectedTableNumber}.`,
        };
      }
    }

    return {
      isValid: false,
      errorMessage: `Invalid QR Code: Unrecognized code. Please scan the official tabletop QR stand for ${expectedTableNumber}.`,
    };
  }

  // CASE 2: General scan (customer seated at table in cafe scanning table QR)
  if (tablesList && tablesList.length > 0) {
    const cleanScannedText = text.toLowerCase().replace(/^table\s*/i, "");
    const decodedTableParam = tableParam ? decodeURIComponent(tableParam).trim().toLowerCase() : "";
    const cleanTableParamNum = decodedTableParam.replace(/^table\s*/i, "");

    const matched = tablesList.find((t) => {
      const tNum = t.tableNumber.trim().toLowerCase();
      const cleanTNum = tNum.replace(/^table\s*/i, "");

      if (t.qrIdentifier && qrParam && t.qrIdentifier.toLowerCase() === qrParam.toLowerCase()) return true;
      if (t.qrIdentifier && text.toLowerCase() === t.qrIdentifier.toLowerCase()) return true;
      if (decodedTableParam && (decodedTableParam === tNum || cleanTableParamNum === cleanTNum)) return true;
      if (text.toLowerCase() === tNum || cleanScannedText === cleanTNum) return true;
      return false;
    });

    if (matched) {
      if ((matched.status || "").toUpperCase() === "OCCUPIED") {
        return {
          isValid: false,
          errorMessage: `Table "${matched.tableNumber}" is currently occupied. Please choose an open table or join the waiting list.`,
        };
      }
      return {
        isValid: true,
        matchedTableNumber: matched.tableNumber,
        matchedTableId: matched.id,
        matchedQrIdentifier: matched.qrIdentifier || null,
      };
    }
  }

  // Fallback: If tableParam was present for this café
  if (tableParam && (!scannedSlug || scannedSlug.toLowerCase() === cafeSlug.toLowerCase())) {
    const decodedTable = decodeURIComponent(tableParam).trim();
    return {
      isValid: true,
      matchedTableNumber: decodedTable,
    };
  }

  // Non-menu QR or unrecognized code
  return {
    isValid: false,
    errorMessage: `Invalid QR Code: Unrecognized code. Please scan the official tabletop QR stand for ${cafeName}.`,
  };
}

export const TableQrScannerModal: React.FC<TableQrScannerModalProps> = ({
  isOpen,
  expectedTableNumber,
  expectedTableId,
  expectedTableQrIdentifier,
  tablesList,
  cafeSlug,
  cafeName,
  digitalMenuTheme,
  onTableClaimed,
  onClose,
}) => {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [lastScannedTable, setLastScannedTable] = useState<string>("");
  const [scanError, setScanError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanPauseUntilRef = useRef<number>(0);

  const activeTheme = useMemo(
    () => getDigitalMenuVisualTheme(digitalMenuTheme || "roast"),
    [digitalMenuTheme]
  );

  const themeRgb = useMemo(() => {
    const hex = (activeTheme.avatarFallbackBg || "#E57B24").replace("#", "");
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
      };
    }
    if (hex.length === 6) {
      return {
        r: parseInt(hex.substring(0, 2), 16),
        g: parseInt(hex.substring(2, 4), 16),
        b: parseInt(hex.substring(4, 6), 16),
      };
    }
    return { r: 229, g: 123, b: 36 };
  }, [activeTheme.avatarFallbackBg]);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setIsClaiming(false);
      setIsSuccess(false);
      setScanError(null);
      scanPauseUntilRef.current = 0;
    }
  }, [isOpen]);

  // Request camera stream with mobile back-camera priority & universal fallback
  useEffect(() => {
    if (!isOpen) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setCameraStream(null);
      setIsVideoPlaying(false);
      return;
    }

    let isMounted = true;

    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          if (isMounted) setHasCameraPermission(false);
          return;
        }

        let stream: MediaStream | null = null;
        try {
          // Attempt mobile back camera
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: "environment" },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          });
        } catch {
          // Graceful fallback for webcams / desktop
          try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
          } catch {
            if (isMounted) setHasCameraPermission(false);
            return;
          }
        }

        if (isMounted && stream) {
          streamRef.current = stream;
          setCameraStream(stream);
          setHasCameraPermission(true);
        }
      } catch {
        if (isMounted) setHasCameraPermission(false);
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen]);

  // Safely bind video stream to video element
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current
        .play()
        .then(() => {
          setIsVideoPlaying(true);
        })
        .catch(() => {});
    }
  }, [cameraStream]);

  // Validation & claim handler
  const handleValidateAndClaim = useCallback(
    (rawScannedText: string) => {
      if (isClaiming || isSuccess) return;

      const result = validateTableQrCode(
        rawScannedText,
        cafeSlug,
        cafeName,
        expectedTableNumber,
        expectedTableQrIdentifier,
        tablesList
      );

      if (!result.isValid || !result.matchedTableNumber) {
        setScanError(result.errorMessage || "Invalid QR code. Please scan your assigned table.");
        scanPauseUntilRef.current = Date.now() + 3000; // Pause scanning 3s
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          try {
            navigator.vibrate([80, 60, 80]);
          } catch {}
        }
        return;
      }

      const confirmedTableNum = result.matchedTableNumber;
      const confirmedTableId = result.matchedTableId || expectedTableId || "";
      const confirmedQrIdent = result.matchedQrIdentifier || expectedTableQrIdentifier || null;

      // Valid QR code for THIS cafe and THIS table!
      setLastScannedTable(confirmedTableNum);
      setScanError(null);
      setIsSuccess(true);
      setIsClaiming(true);
      soundAlert.playOrderPlacedSuccess();

      if (typeof navigator !== "undefined" && navigator.vibrate) {
        try {
          navigator.vibrate([100, 50, 100]);
        } catch {}
      }

      setTimeout(() => {
        setIsClaiming(false);
        onTableClaimed(confirmedTableNum, confirmedTableId, confirmedQrIdent);
      }, 750);
    },
    [isClaiming, isSuccess, cafeSlug, cafeName, expectedTableNumber, expectedTableQrIdentifier, expectedTableId, tablesList, onTableClaimed]
  );

  // Controlled scanning interval (250ms) to avoid canvas GPU thrashing / black flicker
  useEffect(() => {
    if (!isOpen || !isVideoPlaying || isClaiming || isSuccess) return;

    let isCancelled = false;

    const interval = setInterval(() => {
      if (isCancelled || isClaiming || isSuccess) return;

      const now = Date.now();
      if (now < scanPauseUntilRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
        // Only update canvas dimensions when video dimensions actually change
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          try {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "dontInvert",
            });

            if (qrCode && qrCode.data) {
              handleValidateAndClaim(qrCode.data);
            }
          } catch {
            // Frame read safe fallback
          }
        }
      }
    }, 250);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [isOpen, isVideoPlaying, isClaiming, isSuccess, handleValidateAndClaim]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:pb-6 bg-black/60 backdrop-blur-xs pointer-events-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget && !isClaiming) onClose();
        }}
      >
        <motion.div
          initial={{ y: 80, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 80, opacity: 0, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 450, damping: 28 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0.05, bottom: 0.75 }}
          onDragEnd={(_e, info) => {
            if ((info.offset.y > 75 || info.velocity.y > 350) && !isClaiming) {
              onClose();
            }
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm sm:max-w-md relative flex flex-col pointer-events-auto max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-stone-200/90 overflow-hidden touch-pan-y"
        >
          {/* Top Grab Handle */}
          <div className="pt-2.5 pb-1 flex justify-center">
            <div className="w-9 h-1 rounded-full bg-stone-300 select-none" />
          </div>

          {/* Dismiss Button */}
          <button
            type="button"
            disabled={isClaiming}
            onClick={onClose}
            className="absolute top-3 right-3.5 z-30 p-1.5 rounded-full hover:bg-stone-100 text-[#73716B] hover:text-[#1C1D1A] transition-colors cursor-pointer"
            title="Close"
          >
            <IconX className="w-4 h-4" />
          </button>

          {/* Hidden Canvas for QR Matrix Extraction */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Content Container */}
          <div className="px-5 pt-2 pb-5 text-center space-y-3 relative z-20 flex-1 overflow-y-auto no-scrollbar">
            {/* Header */}
            <div className="space-y-1">
              <span
                className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full inline-block border"
                style={{
                  backgroundColor: `rgba(${themeRgb.r}, ${themeRgb.g}, ${themeRgb.b}, 0.08)`,
                  borderColor: `rgba(${themeRgb.r}, ${themeRgb.g}, ${themeRgb.b}, 0.22)`,
                  color: `rgb(${themeRgb.r}, ${themeRgb.g}, ${themeRgb.b})`,
                }}
              >
                Scan Table QR
              </span>
              <h2 className="text-lg sm:text-xl font-black text-[#1C1D1A] tracking-tight leading-snug">
                {expectedTableNumber ? `Claim ${expectedTableNumber}` : "Scan Table QR"}
              </h2>
              <p className="text-[11.5px] text-[#73716B] leading-tight max-w-xs mx-auto">
                {expectedTableNumber ? (
                  <>
                    Scan the official tabletop QR stand at{" "}
                    <span className="font-semibold text-stone-900">{cafeName}</span> to seat yourself.
                  </>
                ) : (
                  <>
                    Scan the tabletop QR stand at{" "}
                    <span className="font-semibold text-stone-900">{cafeName}</span> to place your Dine-In order.
                  </>
                )}
              </p>
            </div>

            {/* Error Banner when non-cafe or wrong table scanned */}
            <AnimatePresence>
              {scanError && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  className="bg-rose-50 border border-rose-200/80 rounded-xl p-2.5 text-left flex items-start gap-2 shadow-xs"
                >
                  <IconAlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-rose-800 leading-tight">
                      {scanError}
                    </p>
                    <p className="text-[10px] text-rose-600 mt-0.5">
                      Scanner will resume automatically in a moment...
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setScanError(null);
                      scanPauseUntilRef.current = 0;
                    }}
                    className="p-1 rounded-md text-rose-400 hover:text-rose-700 cursor-pointer"
                  >
                    <IconRefresh className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Viewfinder Container */}
            <div className="relative w-52 h-52 sm:w-56 sm:h-56 mx-auto rounded-2xl overflow-hidden bg-black/95 ring-1 ring-black/10 shadow-lg shadow-black/10 flex items-center justify-center">
              {/* Always rendered video element so ref is never null */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                onLoadedMetadata={() => {
                  setIsVideoPlaying(true);
                  videoRef.current?.play().catch(() => {});
                }}
                onLoadedData={() => setIsVideoPlaying(true)}
                onCanPlay={() => setIsVideoPlaying(true)}
                onPlaying={() => setIsVideoPlaying(true)}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  isVideoPlaying ? "opacity-100" : "opacity-0 absolute"
                }`}
              />

              {/* Connecting / Fallback placeholder when video not yet playing */}
              {!isVideoPlaying && (
                <div className="text-center p-4 space-y-2 text-stone-400 z-10">
                  <IconCamera className="w-9 h-9 mx-auto text-stone-500 animate-pulse" />
                  <p className="text-[11px] font-medium text-stone-300">
                    {hasCameraPermission === false
                      ? "Camera disabled or unsupported"
                      : "Connecting to camera..."}
                  </p>
                </div>
              )}

              {/* Viewfinder Framing Overlay */}
              <div className="absolute inset-5 border border-white/20 rounded-2xl pointer-events-none">
                {/* 4 Crisp Corner Brackets */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-amber-400 rounded-tl-sm" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-amber-400 rounded-tr-sm" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-amber-400 rounded-bl-sm" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-amber-400 rounded-br-sm" />
              </div>

              {/* Animated Laser Scan Beam (Active during scanning) */}
              {isVideoPlaying && !isSuccess && !scanError && (
                <motion.div
                  animate={{ y: [-80, 80, -80] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-x-5 h-0.5 pointer-events-none shadow-[0_0_12px_#F59E0B]"
                  style={{ backgroundColor: "#F59E0B" }}
                />
              )}

              {/* Success Overlay on Valid Scan */}
              <AnimatePresence>
                {isSuccess && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-emerald-600/90 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4 z-30"
                  >
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-2 shadow-inner">
                      <IconCheck className="w-7 h-7 stroke-[3] text-white" />
                    </div>
                    <p className="text-sm font-black tracking-tight">Table Verified!</p>
                    <p className="text-[11px] text-white/90 font-mono mt-0.5">
                      {lastScannedTable || expectedTableNumber || "Table"} Confirmed
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Floating Target Table Pill inside Viewfinder */}
              <div className="absolute bottom-0 inset-x-0 flex justify-center pointer-events-none z-20">
                <span className="px-3 py-0.5 text-white text-[10.5px] bg-black/90 rounded-t-full font-mono font-bold flex items-center gap-1.5 shadow-sm">
                  <IconArmchair className="w-3 h-3 text-amber-400" />
                  <span>{expectedTableNumber ? `Target: ${expectedTableNumber}` : "Dine-In Table QR"}</span>
                </span>
              </div>
            </div>

            {/* Scan Guidance Text */}
            <div className="text-[11.5px] text-[#73716B] pt-0.5">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <IconQrcode className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                {expectedTableNumber
                  ? `Hold camera steady over Table ${expectedTableNumber}'s QR stand`
                  : "Hold camera steady over your tabletop QR stand"}
              </span>
            </div>

            {/* Cancel Action */}
            <div className="pt-1 pb-1">
              <button
                type="button"
                disabled={isClaiming}
                onClick={onClose}
                className="w-full py-2.5 rounded-full font-bold text-xs text-stone-500 hover:text-stone-800 bg-stone-100 hover:bg-stone-200 transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

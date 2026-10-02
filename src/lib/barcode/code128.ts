/**
 * Pure TypeScript Code 128 (Subset B) Barcode Generator.
 * Compliant with ISO/IEC 15417:2007 standard.
 *
 * Produces crisp, vector-perfect, scan-ready SVG barcodes
 * for retail/café digital receipts and handheld hardware scanners.
 */

// 107 standard Code 128 patterns (index 0 to 106)
// Each string contains widths of 3 bars and 3 spaces (11 modules total),
// except Stop (106) which has 4 bars and 3 spaces (13 modules total).
const CODE128_PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213", // 0-9
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132", // 10-19
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211", // 20-29
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313", // 30-39
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331", // 40-49
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111", // 50-59
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214", // 60-69
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111", // 70-79
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141", // 80-89
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141", // 90-99
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112"                               // 100-106
];

const START_B_INDEX = 104;
const STOP_INDEX = 106;

export interface BarcodeBar {
  x: number;
  width: number;
}

export interface Code128Data {
  bars: BarcodeBar[];
  totalModules: number;
  quietZone: number;
}

/**
 * Encodes text into Code 128 (Subset B) modules.
 * Only standard ASCII 32 to 126 characters are supported.
 */
export function encodeCode128(text: string, quietZoneModules = 10): Code128Data {
  const clean = text.replace(/[^\x20-\x7E]/g, ""); // ASCII 32-126
  const charCodes: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    charCodes.push(clean.charCodeAt(i) - 32);
  }

  // Calculate Checksum (Modulo 103)
  // Checksum = (StartValue + Sum(charValue * position)) % 103
  let checksum = START_B_INDEX;
  for (let i = 0; i < charCodes.length; i++) {
    checksum += charCodes[i] * (i + 1);
  }
  checksum %= 103;

  // Assemble pattern indices: Start B -> Characters -> Checksum -> Stop
  const symbolIndices = [START_B_INDEX, ...charCodes, checksum, STOP_INDEX];

  // Convert to bar positions
  const bars: BarcodeBar[] = [];
  let currentX = quietZoneModules;

  for (const symIdx of symbolIndices) {
    const pattern = CODE128_PATTERNS[symIdx];
    if (!pattern) continue;

    for (let p = 0; p < pattern.length; p++) {
      const moduleWidth = parseInt(pattern[p], 10);
      const isBar = p % 2 === 0; // Even positions are bars, odd are spaces

      if (isBar) {
        bars.push({
          x: currentX,
          width: moduleWidth,
        });
      }
      currentX += moduleWidth;
    }
  }

  const totalModules = currentX + quietZoneModules;

  return {
    bars,
    totalModules,
    quietZone: quietZoneModules,
  };
}

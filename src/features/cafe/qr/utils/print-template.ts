import { Table } from "@/lib/db/schema/tables";
import { QrCustomizerConfig, QR_THEME_PRESETS, CenterLogoType } from "../types";

function renderLogoIcon(
  logo: CenterLogoType,
  initials: string,
  primaryColor: string,
  logoUrl?: string | null,
  cafeName: string = ""
): string {
  if (logo === "none") return "";

  if (logo === "brand") {
    if (logoUrl) {
      return `<img src="${logoUrl}" style="width: 100%; height: 100%; object-fit: contain; padding: 2px;" alt="Logo" />`;
    }
    return `<span style="font-size: 9px; font-weight: 800; font-family: sans-serif; color: ${primaryColor}">${cafeName.substring(0, 2).toUpperCase()}</span>`;
  }

  return `<span style="font-size: 9px; font-weight: 800; font-family: sans-serif; color: ${primaryColor}">${initials || cafeName.substring(0, 2).toUpperCase()}</span>`;
}

export function generatePrintHtml(
  tables: Table[],
  cafeName: string,
  cafeSlug: string,
  config: QrCustomizerConfig,
  origin: string
): string {
  const preset = QR_THEME_PRESETS[config.preset] || QR_THEME_PRESETS.roast;
  const isTent = config.standFormat === "tent";
  const isCoaster = config.standFormat === "coaster";

  const renderFaceContent = (table: Table) => {
    const publicUrl = `${origin}/menu/${cafeSlug}?table=${encodeURIComponent(
      table.tableNumber
    )}&qr=${table.qrIdentifier}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
      publicUrl
    )}&bgcolor=FFFFFF&color=${preset.qrColor}&margin=1`;

    const centerLogoHtml =
      config.centerLogo !== "none"
        ? `<div class="qr-center-emblem">${renderLogoIcon(
            config.centerLogo,
            config.customInitials,
            preset.primaryColor,
            config.cafeLogoKey,
            cafeName
          )}</div>`
        : "";

    return `
      <div class="stand-face">
        <div class="brand-eyebrow">${cafeName}</div>
        <div class="table-row">
          <h1 class="table-name">${table.tableNumber}</h1>
          ${
            config.showSeats
              ? `<span class="seats-pill">${table.capacity} Seats</span>`
              : ""
          }
        </div>
        ${
          config.subtitle
            ? `<p class="invitation-text">${config.subtitle}</p>`
            : ""
        }

        <div class="qr-wrapper">
          <img src="${qrUrl}" class="qr-image" alt="QR Code for ${table.tableNumber}" />
          ${centerLogoHtml}
        </div>

        <div class="scan-guide">
          <span class="scan-dot"></span>
          <span>${config.scanPrompt || "Point camera to order"}</span>
          ${
            config.showWifi && config.wifiText
              ? `<span class="wifi-inline">• ${config.wifiText}</span>`
              : ""
          }
        </div>
      </div>
    `;
  };

  const pagesHtml = tables
    .map((table, idx) => {
      if (isTent) {
        // Table tent: Front & Back with center fold line on A4 page
        return `
          <div class="page-sheet page-break">
            <div class="sheet-header-guide">TABLE TENT (DUAL-SIDED FOLD) • ${table.tableNumber}</div>
            <div class="tent-wrapper">
              <div class="tent-panel tent-panel-top">
                ${renderFaceContent(table)}
              </div>
              <div class="crease-zone">
                <div class="cut-dash"></div>
                <div class="crease-badge">✂ FOLD ALONG CENTER CREASE</div>
                <div class="cut-dash"></div>
              </div>
              <div class="tent-panel tent-panel-bottom">
                ${renderFaceContent(table)}
              </div>
            </div>
            <div class="sheet-footer-guide">Print on 250gsm+ cardstock • Fold along crease to stand freely on table</div>
          </div>
        `;
      }

      if (isCoaster) {
        // Square coaster format
        return `
          <div class="coaster-card">
            <div class="coaster-cut-mark">✂ CUT</div>
            ${renderFaceContent(table)}
          </div>
        `;
      }

      // Acrylic 4x6" / A6 insert centered on A4 sheet
      return `
        <div class="page-sheet page-break">
          <div class="sheet-header-guide">ACRYLIC TABLE INSERT (STANDARD 4×6" / A6) • ${table.tableNumber}</div>
          <div class="acrylic-cut-container">
            <div class="crop-mark crop-tl"></div>
            <div class="crop-mark crop-tr"></div>
            <div class="crop-mark crop-bl"></div>
            <div class="crop-mark crop-br"></div>
            <div class="acrylic-insert">
              ${renderFaceContent(table)}
            </div>
          </div>
          <div class="sheet-footer-guide">✂ Trim along crop marks & slide into 4×6" / A6 vertical acrylic tabletop stand</div>
        </div>
      `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Table QR Stands - ${cafeName}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;1,400&display=swap" rel="stylesheet">
        <style>
          @page {
            size: A4 portrait;
            margin: 0;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
            background: #ffffff;
            color: ${preset.textColor};
          }
          .page-sheet {
            width: 210mm;
            min-height: 297mm;
            padding: 18mm 15mm;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
          }
          .page-break {
            page-break-after: always;
            break-after: page;
          }
          .sheet-header-guide {
            font-size: 8px;
            font-weight: 700;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            color: #A39B92;
            margin-bottom: 12mm;
          }
          .sheet-footer-guide {
            font-size: 8.5px;
            font-weight: 600;
            color: #8C8379;
            margin-top: 12mm;
            letter-spacing: 0.5px;
          }

          /* Acrylic Stand Holder (105mm x 150mm) */
          .acrylic-cut-container {
            position: relative;
            padding: 8px;
            border: 1px dashed #D0C9C0;
            border-radius: 16px;
          }
          .acrylic-insert {
            width: 105mm;
            min-height: 150mm;
            background: ${preset.cardBg};
            border: 1.5px solid ${preset.borderColor};
            border-radius: 12px;
            padding: 24px 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
          }

          /* Tent Styling (Dual-Sided A4) */
          .tent-wrapper {
            width: 130mm;
            border: 1px solid #D5CEC4;
            border-radius: 16px;
            overflow: hidden;
            background: ${preset.cardBg};
          }
          .tent-panel {
            padding: 30px 24px;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
          .tent-panel-top {
            transform: rotate(180deg);
          }
          .crease-zone {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 6px 12px;
            background: #EFE9E0;
          }
          .cut-dash {
            flex: 1;
            height: 1px;
            border-top: 1px dashed #A89E92;
          }
          .crease-badge {
            font-size: 7.5px;
            font-weight: 700;
            letter-spacing: 1.5px;
            color: #6E645A;
          }

          /* Coaster Grid */
          .coaster-grid {
            display: grid;
            grid-template-columns: repeat(2, 95mm);
            gap: 15mm;
            justify-content: center;
            padding: 25mm 10mm;
          }
          .coaster-card {
            width: 95mm;
            height: 95mm;
            border: 1px dashed #C5BCB0;
            border-radius: 16px;
            padding: 12px;
            background: ${preset.cardBg};
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            position: relative;
          }
          .coaster-cut-mark {
            position: absolute;
            top: 4px;
            right: 8px;
            font-size: 7px;
            font-weight: 700;
            color: #A39B92;
          }

          /* Typography & Elements */
          .stand-face {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
          }
          .brand-eyebrow {
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: ${preset.primaryColor};
            margin-bottom: 4px;
          }
          .table-row {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
          }
          .table-name {
            font-size: 20px;
            font-weight: 800;
            margin: 0;
            color: ${preset.textColor};
          }
          .seats-pill {
            font-size: 9px;
            font-weight: 600;
            padding: 2px 7px;
            border-radius: 20px;
            background: rgba(0,0,0,0.06);
            color: ${preset.mutedColor};
          }
          .invitation-text {
            font-size: 10px;
            color: ${preset.mutedColor};
            margin: 4px 0 12px 0;
            max-width: 200px;
            line-height: 1.3;
          }
          .qr-wrapper {
            position: relative;
            display: inline-block;
            padding: 6px;
            background: #ffffff;
            border-radius: 10px;
            border: 1px solid ${preset.borderColor};
          }
          .qr-image {
            display: block;
            width: 125px;
            height: 125px;
            border-radius: 6px;
          }
          .qr-center-emblem {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 26px;
            height: 26px;
            background: #ffffff;
            border: 1.5px solid ${preset.primaryColor};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
          }
          .scan-guide {
            margin-top: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            font-size: 9px;
            font-weight: 700;
            color: ${preset.primaryColor};
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .scan-dot {
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background: ${preset.primaryColor};
          }
          .wifi-inline {
            font-size: 8.5px;
            font-weight: 500;
            text-transform: none;
            color: ${preset.mutedColor};
          }
        </style>
      </head>
      <body>
        ${isCoaster ? `<div class="coaster-grid">${pagesHtml}</div>` : pagesHtml}
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
    </html>
  `;
}

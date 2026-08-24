// 名札裏面用のQRコード印刷シート(PDF)を生成するスクリプト。
// アンケートURLとサイトURLの2つのQRコードを1枚のカードにまとめ、
// A4用紙に敷き詰めた「キンコーズ印刷用」レイアウトを出力する。
//
// 使い方:
//   node scripts/generate-qr.js --survey "https://forms.gle/xxxx" --site "https://xxxx.github.io/kowloon-site/" --out qr-print-sheet.pdf
//
// カードサイズはデフォルトで90mm x 54mm(一般的な名札挿入サイズ)。
// 実際の名札ケースのサイズに合わせて --card-w / --card-h (mm指定)で調整可能。

const fs = require("fs");
const QRCode = require("qrcode");
const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");

const MM_TO_PT = 72 / 25.4;
const mm = (v) => v * MM_TO_PT;

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i += 2) {
    out[args[i].replace(/^--/, "")] = args[i + 1];
  }
  return out;
}

async function main() {
  const opts = parseArgs();
  const surveyUrl = opts.survey;
  const siteUrl = opts.site;
  const outPath = opts.out || "qr-print-sheet.pdf";
  const cardW = mm(parseFloat(opts["card-w"] || "90"));
  const cardH = mm(parseFloat(opts["card-h"] || "54"));

  if (!surveyUrl || !siteUrl) {
    console.error(
      '使い方: node scripts/generate-qr.js --survey "<アンケートURL>" --site "<サイトURL>" [--out qr-print-sheet.pdf] [--card-w 90] [--card-h 54]'
    );
    process.exit(1);
  }

  const surveyQrPng = await QRCode.toBuffer(surveyUrl, { margin: 1, width: 500 });
  const siteQrPng = await QRCode.toBuffer(siteUrl, { margin: 1, width: 500 });

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const surveyImg = await pdfDoc.embedPng(surveyQrPng);
  const siteImg = await pdfDoc.embedPng(siteQrPng);

  const pageW = mm(210); // A4
  const pageH = mm(297);
  const marginX = mm(10);
  const marginY = mm(10);
  const gap = mm(4);

  const cols = Math.max(1, Math.floor((pageW - marginX * 2 + gap) / (cardW + gap)));
  const rows = Math.max(1, Math.floor((pageH - marginY * 2 + gap) / (cardH + gap)));
  const perPage = cols * rows;

  const totalCards = perPage; // 1枚分の型紙を敷き詰めた1ページのみ生成(必要枚数分は同じPDFを繰り返し印刷)
  const page = pdfDoc.addPage([pageW, pageH]);

  for (let i = 0; i < totalCards; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = marginX + col * (cardW + gap);
    const yTop = pageH - marginY - row * (cardH + gap);
    const y = yTop - cardH;

    // カット目安の枠線
    page.drawRectangle({
      x, y, width: cardW, height: cardH,
      borderColor: rgb(0.7, 0.7, 0.7),
      borderWidth: 0.5
    });

    const qrSize = Math.min(cardW * 0.42, cardH * 0.75);
    const padding = cardW * 0.04;
    const labelSize = 6;

    // アンケートQR (左)
    page.drawImage(surveyImg, {
      x: x + padding,
      y: y + (cardH - qrSize) / 2,
      width: qrSize,
      height: qrSize
    });
    page.drawText("SURVEY", {
      x: x + padding,
      y: y + (cardH - qrSize) / 2 - labelSize - 2,
      size: labelSize,
      font,
      color: rgb(0.2, 0.2, 0.2)
    });

    // サイトQR (右)
    const rightX = x + cardW - padding - qrSize;
    page.drawImage(siteImg, {
      x: rightX,
      y: y + (cardH - qrSize) / 2,
      width: qrSize,
      height: qrSize
    });
    page.drawText("PHOTOS", {
      x: rightX,
      y: y + (cardH - qrSize) / 2 - labelSize - 2,
      size: labelSize,
      font,
      color: rgb(0.2, 0.2, 0.2)
    });
  }

  const bytes = await pdfDoc.save();
  fs.writeFileSync(outPath, bytes);
  console.log(`生成しました: ${outPath}`);
  console.log(`カードサイズ: ${opts["card-w"] || 90}mm x ${opts["card-h"] || 54}mm / 1ページに${cols}x${rows}=${totalCards}枚配置`);
  console.log(`名札ケースの実サイズに合わない場合は --card-w / --card-h で調整してください。`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

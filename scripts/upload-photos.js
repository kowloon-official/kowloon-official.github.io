// 指定フォルダの写真を圧縮し、Cloudflare R2にアップロードして
// data/photos/<event>.json のマニフェストを更新するスクリプト。
//
// 使い方:
//   node scripts/upload-photos.js --event kowloon-19 --photographer 各務原 --dir ./tmp/kowloon19-photos
//
// --photographer は必須。1つの大会に複数カメラマンがいる場合、カメラマンごとに
// フォルダを分けてこのスクリプトを複数回実行する(写真ID・保存先パスにカメラマン名を
// 含めることで、ファイル名が偶然かぶっても上書き事故が起きないようにしている)。
//
// 事前準備 (.env に設定):
//   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_BASE_URL
//
// アップロード後、元フォルダ(--dir)のファイルは消して問題ありません(PCに残す必要はない)。

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const THUMB_WIDTH = 500;
const FULL_WIDTH = 2000;
const JPEG_QUALITY = 80;
const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp"];

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i += 2) {
    out[args[i].replace(/^--/, "")] = args[i + 1];
  }
  return out;
}

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`環境変数 ${name} が未設定です。.env を確認してください。`);
    process.exit(1);
  }
  return v;
}

async function main() {
  const { event, dir, photographer } = parseArgs();
  if (!event || !dir || !photographer) {
    console.error("使い方: node scripts/upload-photos.js --event <slug> --photographer <名前> --dir <folder>");
    process.exit(1);
  }
  const photographerSlug = encodeURIComponent(photographer);

  const accountId = requireEnv("R2_ACCOUNT_ID");
  const accessKeyId = requireEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey = requireEnv("R2_SECRET_ACCESS_KEY");
  const bucket = requireEnv("R2_BUCKET");
  const publicBase = requireEnv("R2_PUBLIC_BASE_URL").replace(/\/$/, "");

  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey }
  });

  const files = fs
    .readdirSync(dir)
    .filter((f) => IMAGE_EXTS.includes(path.extname(f).toLowerCase()))
    .sort();

  if (files.length === 0) {
    console.error(`${dir} に画像ファイルが見つかりませんでした。`);
    process.exit(1);
  }

  console.log(`${files.length}枚の写真を処理します (event: ${event}, photographer: ${photographer})`);

  const manifestPath = path.join(__dirname, "..", "data", "photos", `${event}.json`);
  let manifest = { eventSlug: event, photos: [] };
  if (fs.existsSync(manifestPath)) {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  }
  const existingIds = new Set(manifest.photos.map((p) => p.id));

  for (const file of files) {
    const baseName = path.basename(file, path.extname(file));
    const photoId = `${event}-${photographer}-${baseName}`;
    if (existingIds.has(photoId)) {
      console.log(`skip (既にマニフェストにあり): ${file}`);
      continue;
    }

    const srcPath = path.join(dir, file);
    const thumbBuf = await sharp(srcPath)
      .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
      .jpeg({ quality: JPEG_QUALITY })
      .toBuffer();
    const fullBuf = await sharp(srcPath)
      .resize({ width: FULL_WIDTH, withoutEnlargement: true })
      .jpeg({ quality: JPEG_QUALITY })
      .toBuffer();

    const thumbKey = `events/${event}/${photographerSlug}/thumb/${baseName}.jpg`;
    const fullKey = `events/${event}/${photographerSlug}/full/${baseName}.jpg`;

    await s3.send(new PutObjectCommand({
      Bucket: bucket, Key: thumbKey, Body: thumbBuf, ContentType: "image/jpeg"
    }));
    await s3.send(new PutObjectCommand({
      Bucket: bucket, Key: fullKey, Body: fullBuf, ContentType: "image/jpeg"
    }));

    manifest.photos.push({
      id: photoId,
      thumb: `${publicBase}/${thumbKey}`,
      full: `${publicBase}/${fullKey}`,
      caption: "",
      photographer
    });

    console.log(`uploaded: ${file}`);
  }

  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");
  console.log(`マニフェストを更新しました: ${manifestPath}`);

  // tournaments.json の cover / photoManifest を自動更新
  const tournamentsPath = path.join(__dirname, "..", "data", "tournaments.json");
  const tournaments = JSON.parse(fs.readFileSync(tournamentsPath, "utf-8"));
  const target = tournaments.find((t) => t.slug === event);
  if (target) {
    target.photoManifest = `data/photos/${event}.json`;
    if (!target.cover && manifest.photos.length > 0) {
      target.cover = manifest.photos[0].thumb;
    }
    fs.writeFileSync(tournamentsPath, JSON.stringify(tournaments, null, 2), "utf-8");
    console.log(`tournaments.json の "${event}" エントリを更新しました。`);
  } else {
    console.warn(
      `警告: tournaments.json に slug "${event}" が見つかりません。大会一覧に手動で追加してください。`
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

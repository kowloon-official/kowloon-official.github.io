// R2バケットに、公式サイトとローカル確認環境からの写真読み込み許可(CORS)を設定するスクリプト。
// 結果カードページ(result.html)がギャラリー写真をcanvasに描いて画像として保存するために必要。
//
// 使い方:
//   node scripts/set-r2-cors.js          … 設定する
//   node scripts/set-r2-cors.js --show   … 今の設定を表示するだけ
//
// 事前準備 (.env に設定): R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET

require("dotenv").config();
const { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } = require("@aws-sdk/client-s3");

const ALLOWED_ORIGINS = [
  "https://kowloon-official.github.io",
  "http://localhost:3000",
  "http://localhost:8765",
  "http://127.0.0.1:8765"
];

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`環境変数 ${name} が未設定です。.env を確認してください。`);
    process.exit(1);
  }
  return v;
}

async function main() {
  const accountId = requireEnv("R2_ACCOUNT_ID");
  const bucket = requireEnv("R2_BUCKET");
  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: requireEnv("R2_ACCESS_KEY_ID"), secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY") }
  });

  if (!process.argv.includes("--show")) {
    await s3.send(new PutBucketCorsCommand({
      Bucket: bucket,
      CORSConfiguration: {
        CORSRules: [{ AllowedOrigins: ALLOWED_ORIGINS, AllowedMethods: ["GET", "HEAD"], AllowedHeaders: ["*"], MaxAgeSeconds: 86400 }]
      }
    }));
    console.log("CORSを設定しました。");
  }
  try {
    const cur = await s3.send(new GetBucketCorsCommand({ Bucket: bucket }));
    console.log(JSON.stringify(cur.CORSRules, null, 2));
  } catch (e) {
    console.log("CORSは未設定です。", e.name);
  }
}

main().catch((e) => {
  console.error("失敗しました:", e.name, e.message);
  process.exit(1);
});

# 九龍-KOWLOON- フォトアーカイブサイト

大会アーカイブ・写真ギャラリー・お気に入り機能を備えた、九龍の公式まとめサイト。ビルド不要の静的サイト（HTML/CSS/JS）で、GitHub Pagesで無料公開する想定。

## ローカルで確認する

```
npm install
npm run dev
```

表示された `http://localhost:xxxx` をブラウザで開く。

## 外部サービスの初期セットアップ（最初の1回だけ）

写真を実際にアップロードするには、Cloudflare R2（写真の保存先）のアカウントが必要です。

1. [Cloudflare](https://dash.cloudflare.com/) の無料アカウントを作成
2. ダッシュボード → R2 → バケットを作成（例: `kowloon-photos`）
3. R2 → 「管理用APIトークン」から、読み書き権限のあるトークンを発行
   - `Account ID` / `Access Key ID` / `Secret Access Key` が発行されるのでメモする
4. バケットの設定で「パブリックアクセス」を有効にし、公開URL（`https://pub-xxxx.r2.dev` など、または独自ドメイン）を確認
5. このフォルダに `.env.example` をコピーして `.env` を作成し、上記の値を記入する

```
cp .env.example .env
```

## 写真を追加する（大会が終わったら）

1. 公開してよい写真を1つのフォルダにまとめる（jpg/png/webp対応）
2. 以下を実行（フォルダ内の写真を自動で圧縮してアップロードし、サイトのデータも更新される）

```
node scripts/upload-photos.js --event kowloon-19 --dir "C:\写真が入ったフォルダ"
```

3. アップロードが終わったら、元フォルダの写真は削除してOK（PCに残しておく必要はない）
4. `git add . && git commit -m "add kowloon-19 photos" && git push` でサイトに反映

※ `--event` に指定するslugは `data/tournaments.json` の該当大会の `slug` と一致させること。新しい大会がまだ一覧にない場合は、先に `data/tournaments.json` にエントリを追加する。

## 次回大会予定を更新する

次の大会が決まったら `data/next-event.json` を編集する。

```json
{
  "scheduled": true,
  "name": "九龍-KOWLOON-#19",
  "date": "2026-10-10",
  "registrationUrl": "https://www.start.gg/tournament/kowloon-19",
  "note": "エントリー開始は9月上旬予定"
}
```

未定の場合は `scheduled` を `false` に戻す（ホームに「近日発表予定」と表示される）。

## 名札用QRコードを作る

```
node scripts/generate-qr.js --contact "<GoogleフォームのURL>" --site "<サイトのURL>" --out qr-print-sheet.pdf
```

- カードサイズは初期値90mm×54mm。名札ケースの実サイズが違う場合は `--card-w` `--card-h` (mm指定)で調整
- キンコーズなどでA4用紙に印刷し、カットして名札裏に貼る想定

## お問い合わせフォームを作る

`forms/contact-form.md` に質問の叩き台があるので、Googleフォームに転記して作成する。作成後、URLを `js/config.js` の `contactUrl` に反映する。

## GitHub Pagesで公開する

```
gh repo create kowloon-site --public --source=. --remote=origin --push
```

その後、GitHubリポジトリの Settings → Pages で公開ブランチを設定する。

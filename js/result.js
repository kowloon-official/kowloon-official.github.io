// 結果画像ページ（result.html）。デザインは 九龍/結果画像bot/デザイン試作/play.html で確定したもの。
// 画像はこの端末のブラウザ内（canvas）で作る。botから渡されるデータ ?d= の中身:
//   n:名前 t:チーム名 p:順位 c:参加人数 e:大会名 dt:日付(2026.11.28) v:会場 ct:都市,国 s:大会slug h:ハッシュタグ(#九龍KOWLOON19)
(() => {
  const $ = (id) => document.getElementById(id);

  // ===== データの読み込み =====
  function decodeData() {
    const raw = new URLSearchParams(location.search).get("d");
    if (!raw) return null;
    try {
      const b64 = raw.replace(/-/g, "+").replace(/_/g, "/");
      const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
      const json = new TextDecoder().decode(Uint8Array.from(bin, (ch) => ch.charCodeAt(0)));
      const d = JSON.parse(json);
      if (!d.n || !d.p || !d.e) return null;
      return d;
    } catch (e) {
      return null;
    }
  }
  const D = decodeData();
  if (!D) {
    $("error").hidden = false;
    $("error").innerHTML = "リンクが正しくありません。<br>Discordの「結果画像を作る」ボタンからもう一度開いてください。";
    return;
  }
  $("app").hidden = false;
  const NAME = String(D.n), TEAM = String(D.t || "").trim(), PLACE = Math.max(1, parseInt(D.p, 10) || 1);
  const TOTAL = String(D.c || ""), EVENT = String(D.e), DATE = String(D.dt || ""), VENUE = String(D.v || ""), CITY = String(D.ct || "");
  const sfx = (n) => { const s = ["th", "st", "nd", "rd"], v = n % 100; return s[(v - 20) % 10] || s[v] || s[0]; };

  // ===== 状態 =====
  const S = { ori: "h", src: "gallery", tone: "mono", layout: "bl", gal: -1, ox: 0, oy: 0, zoom: 1 };
  let gallery = [], galImg = null, ownImg = null, displayNames = {};
  const cv = $("cv");
  const load = (src, cors) => new Promise((res, rej) => {
    const i = new Image();
    if (cors) i.crossOrigin = "anonymous"; // R2のCORS許可が必要（scripts/set-r2-cors.js）
    i.onload = () => res(i); i.onerror = rej; i.src = src;
  });
  // 写真置き場(R2)のCORS許可が無いと読み込めないので、その時は許可なしで読み込む（表示はできるが保存はできない）
  const loadGallery = (src) => load(src, true).catch(() => load(src, false));
  const suffix = sfx;
  const curPhoto = () => (S.src === "own" && ownImg ? ownImg : galImg);

  // ===== フォント（確定） =====
  const nameFont = (s) => `900 ${s}px 'Noto Sans JP'`;   // 名前・九龍
  const placeFont = (s) => `400 ${s}px 'Anton'`;          // 順位
  const condFont = (s) => `900 ${s}px 'NotoSansCond75'`; // 日付・KOWLOON・#19
  const subFont = (s) => `700 ${s}px 'Noto Sans JP'`;    // 会場・チーム名・photo by

  // canvas の filter（写真のモノクロ化）が使えるか。iPhoneのSafariは使えない（指定しても無視される）
  const FILTER_OK = (() => {
    try {
      const c = document.createElement("canvas"); c.width = c.height = 1;
      const g = c.getContext("2d"); g.filter = "grayscale(1)"; g.fillStyle = "#f00"; g.fillRect(0, 0, 1, 1);
      const d = g.getImageData(0, 0, 1, 1).data; return d[0] === d[1];
    } catch (e) { return false; }
  })();

  /* ===== レイアウトの共通ルール =====
    b = 短辺の1%。余白・文字の大きさは b の倍数で決める（縦横で見た目の比率がそろう）
    上の配置（左上・右上）は 大会名グループ→名前→順位、下の配置（左下・右下）は 名前→順位→大会名グループ */
  function render() {
    const x = cv.getContext("2d");
    const H0 = S.ori === "h", W = H0 ? 1600 : 1080, H = H0 ? 900 : 1350;
    cv.width = W; cv.height = H;
    const b = Math.min(W, H) / 100, M = 6 * b, layout = S.layout;
    const sp = (x0, y0, x1, y1, st) => { const g = x.createLinearGradient(x0, y0, x1, y1); st.forEach(([o, c]) => g.addColorStop(o, c)); return g; };

    // 写真
    const ph = curPhoto();
    if (!ph) { x.fillStyle = sp(0, 0, W, H, [[0, "#0b2440"], [1, "#071526"]]); x.fillRect(0, 0, W, H); }
    else {
      const s = Math.max(W / ph.width, H / ph.height) * S.zoom, iw = ph.width * s, ih = ph.height * s;
      let px = (W - iw) / 2 + S.ox * W, py = (H - ih) / 2 + S.oy * H;
      px = Math.min(0, Math.max(W - iw, px)); py = Math.min(0, Math.max(H - ih, py));
      const mono = S.tone === "mono";
      if (mono && FILTER_OK) x.filter = "grayscale(1) contrast(1.1) brightness(.8)";
      x.drawImage(ph, px, py, iw, ih); x.filter = "none";
      if (mono && !FILTER_OK) {
        // iPhone（Safari）は filter が効かないので、合成モードで白黒にして少し暗くする
        x.save();
        x.globalCompositeOperation = "saturation"; x.fillStyle = "#808080"; x.fillRect(0, 0, W, H);
        x.globalCompositeOperation = "multiply"; x.fillStyle = "#c4c4c4"; x.fillRect(0, 0, W, H);
        x.restore();
      }
    }
    // 文字側の角を暗くする
    { const cx = layout[1] === "l" ? 0 : W, cy = layout[0] === "t" ? 0 : H, r = Math.hypot(W, H) * 0.75;
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, "rgba(5,15,30,.88)"); g.addColorStop(0.55, "rgba(5,15,30,.45)"); g.addColorStop(1, "rgba(5,15,30,0)");
      x.fillStyle = g; x.fillRect(0, 0, W, H); }

    const left = layout[1] === "l", top = layout[0] === "t";
    const maxW = W * (H0 ? 0.6 : 0.86);
    const fit = (fontFn, text, size, max) => { let s = size; x.font = fontFn(s); while (x.measureText(text).width > max && s > b * 3) { s -= b * 0.25; x.font = fontFn(s); } return s; };
    const ink = (font, t) => { x.font = font; const m = x.measureText(t); return { l: m.actualBoundingBoxLeft, r: m.actualBoundingBoxRight, a: m.actualBoundingBoxAscent, d: m.actualBoundingBoxDescent, w: m.width }; };
    const inkW = (i) => i.l + i.r;

    // 大会名「九龍-KOWLOON-#19」を「九龍」「KOWLOON」「#19」に分ける
    const mm = EVENT.match(/^([぀-ヿ㐀-鿿]*)(.*)$/);
    const rest = mm[2].split("-").map((t) => t.trim()).filter(Boolean);
    const kanjiTxt = mm[1] || EVENT, numPart = rest.filter((t) => t.startsWith("#")).join(" "), latin = rest.filter((t) => !t.startsWith("#")).join(" ");

    // 大会名グループの寸法（「九龍」の大きさKで決まる）
    const evMetrics = (K) => {
      const kI = ink(nameFont(K), kanjiTxt), kW = inkW(kI), kH = kI.a + kI.d, gapH = 0.1 * K;
      // 九龍の右に KOWLOON（上）と #19（下）を同じ幅で積み、2行の上端〜下端＝九龍の高さ
      const l100 = ink(condFont(100), latin || " "), n100 = ink(condFont(100), numPart || " ");
      const rL = latin ? (l100.a + l100.d) / inkW(l100) : 0, rN = numPart ? (n100.a + n100.d) / inkW(n100) : 0;
      const gapR = latin && numPart ? 0.08 * kH : 0, cw = rL + rN > 0 ? (kH - gapR) / (rL + rN) : 0;
      const LA = latin ? (100 * cw) / inkW(l100) : 0, NA = numPart ? (100 * cw) / inkW(n100) : 0;
      const lI = ink(condFont(LA || 1), latin || " "), nI = ink(condFont(NA || 1), numPart || " ");
      // 九龍の下に「日付（高さ＝会場2行）＋会場2行」。左端＝九龍、右端＝#19
      const gapV = 0.12 * K, Wb = kW + (cw ? gapH + cw : 0);
      const vm = ink(subFont(100), VENUE || " "), cm = ink(subFont(100), CITY || " "), dm = ink(condFont(100), DATE || " ");
      const glR = 0.3, hR = vm.a / 100 + glR + cm.a / 100, dR = hR / ((dm.a + dm.d) / 100);
      const vwR = Math.max(inkW(vm), inkW(cm)) / 100, dwR = (inkW(dm) / 100) * dR, gxR = 0.6;
      const VS = Wb / (dwR + gxR + vwR), DS = VS * dR, gl = VS * glR, subH = VS * hR;
      const vI = ink(subFont(VS), VENUE || " "), cI = ink(subFont(VS), CITY || " "), dI = ink(condFont(DS), DATE || " ");
      return { K, kI, kW, kH, gapH, cw, LA, lI, NA, nI, gapV, VS, vI, cI, DS, dI, gl, Hc: kH + gapV + subH, W: Wb };
    };
    const SUF = 0.5, TOT = 0.28; // st/nd/rd は数字の50%、「/」と人数は28%
    const numTxt = String(PLACE), sufTxt = suffix(PLACE), slashTxt = "/", cntTxt = TOTAL;
    const build = (k) => {
      const RK = 0.88, B0 = 32 * b * k, PK = 0.78;
      const rowOf = (nt, st, P0 = B0 * RK, P = P0 * PK) => {
        const numI = ink(placeFont(P), nt), sufI = ink(placeFont(P0 * SUF), st), slI = ink(placeFont(P0 * TOT), slashTxt), ctI = ink(placeFont(P0 * TOT), cntTxt || " ");
        const sufX = numI.w + P0 * 0.06, slX = sufX + sufI.w + P0 * 0.07, ctX = slX + slI.w + P0 * 0.04;
        return { P, P0, numI, sufI, sufX, slX, ctX, pW: numI.l + (cntTxt ? ctX + ctI.r : sufX + sufI.r) };
      };
      const RW = rowOf(numTxt, sufTxt);
      // 大会名グループの大きさは基準の「33rd」の行幅×1.15で決める（順位の桁数で大きさが変わらないように）
      const Rref = rowOf("33", "rd", B0, B0 * PK).pW * 1.15;
      let E = evMetrics((100 * Rref) / evMetrics(100).W);
      for (let i = 0; i < 3; i++) E = evMetrics((E.K * Rref) / E.W);
      return { ...RW, R: Math.max(RW.pW, E.W), E };
    };
    const SC = 0.8;
    const R1 = build(1).R, G = build(SC * Math.min(1, maxW / R1));
    // 名前：短い名前は大きく、長い名前は「大会名・順位の幅の1.4倍」まで縮める
    const nMaxW = Math.max(G.E.W, G.pW) * 1.4;
    const N = fit(nameFont, NAME, 21 * b * SC, Math.min(maxW, nMaxW)), nI = ink(nameFont(N), NAME);
    // チーム名：名前のすぐ左上に小さく
    const TS = G.E.VS * 1.45, tI = TEAM ? ink(subFont(TS), TEAM) : null, teamH = TEAM ? TS * 0.74 + 1.4 * b * SC : 0;
    const gE = 11 * b * SC, g1 = 7 * b * SC, grpH = teamH + N * 0.9 + g1 + G.P * 0.82, blockH = G.E.Hc + gE + grpH;
    const y0 = top ? M : H - M - blockH;
    const ME = 2.5 * b; // 大会名グループは上端／下端ぎりぎり
    const yE = top ? ME : H - ME - G.E.Hc, yN = (top ? y0 + G.E.Hc + gE : y0) + teamH + N * 0.9, yR = yN + g1 + G.P * 0.82;
    const xAt = (w) => (left ? M : W - M - w);
    const shadow = () => { x.shadowColor = "rgba(0,0,0,.45)"; x.shadowBlur = b * 1.6; };
    x.textBaseline = "alphabetic"; x.textAlign = "left"; shadow();

    // 大会名グループ（すべて白）
    const E = G.E, rowL = xAt(E.W), colX = rowL + E.kW + E.gapH;
    x.fillStyle = "#fff";
    x.font = nameFont(E.K); x.fillText(kanjiTxt, rowL + E.kI.l, yE + E.kI.a);
    if (latin) { x.font = condFont(E.LA); x.fillText(latin, colX + E.lI.l, yE + E.lI.a); }
    if (numPart) { x.font = condFont(E.NA); x.fillText(numPart, colX + E.nI.l, yE + E.kH - E.nI.d); }
    const sy0 = yE + E.kH + E.gapV, rEnd = rowL + E.W;
    if (DATE) { x.font = condFont(E.DS); x.fillText(DATE, rowL + E.dI.l, sy0 + E.dI.a); }
    x.font = subFont(E.VS);
    const vx = rEnd - Math.max(inkW(E.vI), inkW(E.cI));
    if (VENUE) x.fillText(VENUE, vx + E.vI.l, sy0 + E.vI.a);
    if (CITY) x.fillText(CITY, vx + E.cI.l, sy0 + E.vI.a + E.gl + E.cI.a);

    // 色：名前・チーム名は淡い水色。順位は1〜3位が金銀銅、4位以下は淡い水色（いずれも縦グラデ、縁なし）
    const COLORS = {
      gold: [[0, "#fff6c8"], [0.42, "#ffd24a"], [0.5, "#c98a0e"], [0.58, "#ffcf3d"], [1, "#a86d05"]],
      silver: [[0, "#ffffff"], [0.42, "#d9e2ea"], [0.5, "#8a98a6"], [0.58, "#e3eaf0"], [1, "#7d8b98"]],
      bronze: [[0, "#ffe0c2"], [0.42, "#e09452"], [0.5, "#8f4d1c"], [0.58, "#e39a5a"], [1, "#7a3d12"]],
      light: [[0, "#ffffff"], [0.5, "#c9f3ff"], [1, "#7fd8f5"]]
    };
    const rankColor = PLACE === 1 ? "gold" : PLACE === 2 ? "silver" : PLACE === 3 ? "bronze" : "light";

    // 名前とチーム名
    const nx = left ? M + nI.l : W - M - nI.r, nTop = yN - nI.a;
    x.font = nameFont(N); x.fillStyle = sp(0, nTop, 0, yN, COLORS.light); x.fillText(NAME, nx, yN);
    if (TEAM) {
      const nL = left ? M : W - M - inkW(nI), ty = nTop - 1.4 * b * SC, tTop = ty - tI.a;
      x.font = subFont(TS); x.fillStyle = sp(0, tTop, 0, ty, COLORS.light); x.fillText(TEAM, nL + tI.l, ty);
    }
    // 順位（数字と st/nd/rd は順位の色、/ と人数は白）
    const sx = xAt(G.pW) + G.numI.l, P = G.P, pTop = yR - ink(placeFont(P), numTxt).a;
    const pFill = sp(0, pTop, 0, yR, COLORS[rankColor]);
    x.fillStyle = pFill; x.font = placeFont(P); x.fillText(numTxt, sx, yR);
    x.font = placeFont(G.P0 * SUF); x.fillText(sufTxt, sx + G.sufX, yR);
    if (cntTxt) {
      x.fillStyle = "rgba(255,255,255,.9)"; x.font = placeFont(G.P0 * TOT);
      x.fillText(slashTxt, sx + G.slX, yR); x.fillText(cntTxt, sx + G.ctX, yR);
    }
    x.shadowBlur = 0;

    // photo by（大会の写真の時だけ）：常に下端。左下配置→右下、右下配置→左下、上の配置→右下
    if (ph && ph === galImg && gallery[S.gal]) {
      const c = { bl: "br", br: "bl", tl: "br", tr: "br" }[layout], cs = 2 * b, pg = gallery[S.gal].photographer;
      x.font = subFont(cs); x.fillStyle = "rgba(255,255,255,.6)"; x.textAlign = c[1] === "l" ? "left" : "right";
      x.shadowBlur = b; x.shadowColor = "rgba(0,0,0,.6)";
      x.fillText("photo by " + (displayNames[pg] || pg), c[1] === "l" ? M : W - M, H - ME);
      x.shadowBlur = 0; x.textAlign = "left";
    }
  }

  async function fontsReady() {
    const t = NAME + TEAM + EVENT + DATE + VENUE + CITY + "0123456789stndrdth/photo by";
    await Promise.all([
      document.fonts.load(`900 40px 'Noto Sans JP'`, t), document.fonts.load(`700 40px 'Noto Sans JP'`, t),
      document.fonts.load(`400 40px 'Anton'`, "0123456789stndrdth/"), document.fonts.load(`900 40px 'NotoSansCond75'`, t)
    ].map((p) => p.catch(() => {})));
  }

  // ===== 操作 =====
  const msg = (t) => { $("msg").textContent = t; clearTimeout(msg.t); msg.t = setTimeout(() => ($("msg").textContent = ""), 4000); };
  document.querySelectorAll("[data-k]").forEach((g) => g.addEventListener("click", (e) => {
    const bt = e.target.closest("button"); if (!bt || bt.disabled) return;
    g.querySelectorAll("button").forEach((z) => z.classList.toggle("on", z === bt));
    S[g.dataset.k] = bt.dataset.v;
    if (g.dataset.k === "src") { $("galBox").hidden = S.src !== "gallery"; $("ownBox").hidden = S.src !== "own"; }
    if (g.dataset.k === "src" || g.dataset.k === "ori") { S.ox = S.oy = 0; }
    render();
  }));
  $("zoom").addEventListener("input", (e) => { S.zoom = +e.target.value; render(); });
  $("file").addEventListener("change", async (e) => {
    const f = e.target.files[0]; if (!f) return;
    const url = URL.createObjectURL(f);
    try { ownImg = shrink(await load(url)); S.ox = S.oy = 0; $("ownNote").textContent = "写真はこの端末の中だけで使います（アップロードはされません）"; render(); }
    catch (err) { $("ownNote").textContent = "この写真は読み込めませんでした。別の写真（JPEG・PNGなど）を選んでください。"; }
    finally { URL.revokeObjectURL(url); }
  });
  // スマホで撮った大きな写真（4000px超）はそのままだと重く、iPhoneでは落ちることがあるので縮めてから使う
  function shrink(img, max = 2400) {
    const k = max / Math.max(img.width, img.height);
    if (k >= 1) return img;
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    return c;
  }
  let drag = null;
  cv.addEventListener("pointerdown", (e) => { drag = { x: e.clientX, y: e.clientY, ox: S.ox, oy: S.oy }; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener("pointermove", (e) => { if (!drag) return; const r = cv.getBoundingClientRect(); S.ox = drag.ox + (e.clientX - drag.x) / r.width; S.oy = drag.oy + (e.clientY - drag.y) / r.height; render(); });
  cv.addEventListener("pointerup", () => (drag = null));
  cv.addEventListener("pointercancel", () => (drag = null));

  const slug = String(D.s || "kowloon");
  const fileName = () => `${slug}-${NAME.replace(/[\\/:*?"<>|]/g, "")}.png`;
  const toBlob = () => new Promise((res, rej) => { try { cv.toBlob((b) => (b ? res(b) : rej(new Error("blob"))), "image/png"); } catch (e) { rej(e); } });
  const exportFail = () => msg("画像を書き出せませんでした。写真を選び直すか、「自分の写真」を使ってください。");
  // スマホ・タブレット（タッチ操作）か。PCは「保存・コピー」、スマホは「保存・シェア」
  const touch = matchMedia("(pointer:coarse)").matches;
  const canShareFiles = !!(navigator.canShare && navigator.canShare({ files: [new File([""], "a.png", { type: "image/png" })] }));
  $("share").hidden = !(touch && canShareFiles);
  $("copy").hidden = touch;
  $("actTitle").textContent = touch ? (canShareFiles ? "保存・シェア" : "保存") : "保存・コピー";

  $("save").addEventListener("click", async () => {
    let b;
    try { b = await toBlob(); } catch (e) { exportFail(); return; }
    const url = URL.createObjectURL(b);
    if (!touch) {
      const a = document.createElement("a"); a.href = url; a.download = fileName(); a.click(); msg("保存しました");
      return;
    }
    // スマホはダウンロードだと「写真」アプリに入らない（iPhoneはファイルAppに入る）・Discord内のブラウザでは保存できないことがあるので、
    // 画像を全画面で出して長押しで保存してもらう
    const ov = document.createElement("div"); ov.className = "saveov";
    const im = new Image(); im.src = url; im.alt = "結果画像";
    const p = document.createElement("p"); p.textContent = "画像を長押しして「写真に保存」してください";
    const close = document.createElement("button"); close.textContent = "閉じる";
    close.onclick = () => { ov.remove(); URL.revokeObjectURL(url); };
    ov.append(im, p, close); document.body.appendChild(ov);
  });
  $("copy").addEventListener("click", async () => {
    try {
      if (!navigator.clipboard || !window.ClipboardItem) throw new Error("unsupported");
      await navigator.clipboard.write([new ClipboardItem({ "image/png": toBlob() })]);
      msg("コピーしました。X や Discord に貼り付けできます");
    } catch (e) { msg("このブラウザではコピーできません。「保存」を使ってください"); }
  });
  // スマホのOSの共有メニュー（X・LINE など）
  $("share").addEventListener("click", async () => {
    try {
      const file = new File([await toBlob()], fileName(), { type: "image/png" });
      const tag = String(D.h || "#" + EVENT.replace(/[^\p{L}\p{N}_]/gu, ""));
      await navigator.share({ files: [file], text: tag });
    } catch (e) { if (e.name !== "AbortError") exportFail(); }
  });

  // ===== 初期化 =====
  (async () => {
    displayNames = await loadPhotographerDisplayNames();
    const manifest = await loadPhotoManifest(D.s ? `data/photos/${encodeURIComponent(D.s)}.json` : "");
    gallery = manifest.photos || [];
    if (!gallery.length) {
      // 大会の写真がまだ無い時は「自分の写真」から始める
      $("galNote").textContent = "大会の写真は、当日から撮れたものを順にここへ追加していきます。";
      S.src = "own"; $("galBox").hidden = true; $("ownBox").hidden = false;
      document.querySelectorAll('[data-k=src] button').forEach((z) => z.classList.toggle("on", z.dataset.v === "own"));
    } else {
      gallery.forEach((g, i) => {
        const t = document.createElement("img"); t.src = g.thumb; t.loading = "lazy"; t.alt = "";
        t.onclick = async () => {
          document.querySelectorAll("#thumbs img").forEach((z) => z.classList.toggle("on", z === t));
          try { galImg = await loadGallery(g.full); S.gal = i; S.ox = S.oy = 0; render(); }
          catch (e) { msg("この写真を読み込めませんでした。別の写真を選んでください。"); }
        };
        $("thumbs").appendChild(t);
      });
      try { galImg = await loadGallery(gallery[0].full); S.gal = 0; $("thumbs").firstChild.classList.add("on"); } catch (e) { galImg = null; }
    }
    await fontsReady();
    render();
  })();
})();

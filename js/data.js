// 大会データの取得とカードHTML生成の共通処理
async function loadTournaments() {
  const res = await fetch("data/tournaments.json");
  return res.json();
}

async function loadPhotoManifest(path) {
  if (!path) return { photos: [] };
  const res = await fetch(path);
  if (!res.ok) return { photos: [] };
  return res.json();
}

// カメラマンの内部名(ID・R2パスに使う名前)→表示名の対応表。
// 対応表に無い名前はそのまま内部名を表示に使う。
async function loadPhotographerDisplayNames() {
  try {
    const res = await fetch("data/photographer-display-names.json");
    if (!res.ok) return {};
    return res.json();
  } catch (e) {
    return {};
  }
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function eventCardHtml(t) {
  const thumb = t.cover
    ? `<img src="${t.cover}" alt="${t.name}" loading="lazy">`
    : t.noPhotographer
      ? `写真なし`
      : `写真準備中`;
  return `
    <a class="event-card" href="event.html?slug=${encodeURIComponent(t.slug)}">
      <div class="thumb">${thumb}</div>
      <div class="body">
        <div class="name">${t.name}</div>
        <div class="meta">
          <span>${formatDate(t.date)}</span>
          <span>参加${t.attendees}人</span>
        </div>
      </div>
    </a>
  `;
}

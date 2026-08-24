// 共通ヘッダー・フッターの描画(全ページで使い回す)
function renderHeader(activePage) {
  const el = document.getElementById("site-header");
  if (!el) return;
  const items = [
    { href: "index.html", label: "ホーム", key: "home" },
    { href: "archive.html", label: "大会アーカイブ", key: "archive" },
    { href: "favorites.html", label: "お気に入り", key: "favorites" }
  ];
  const links = items
    .map(
      (it) =>
        `<a href="${it.href}" class="${it.key === activePage ? "active" : ""}">${it.label}</a>`
    )
    .join("");
  el.innerHTML = `
    <div class="container">
      <a href="index.html" class="brand">九龍-KOWLOON-</a>
      <nav class="nav-links">${links}</nav>
      <a href="${window.KOWLOON_CONFIG.surveyUrl}" class="nav-cta" target="_blank" rel="noopener">アンケート</a>
    </div>
  `;
}

function renderFooter() {
  const el = document.getElementById("site-footer");
  if (!el) return;
  const { discord, x, startgg } = window.KOWLOON_CONFIG.links;
  el.innerHTML = `
    <div class="container">
      <div class="footer-links">
        <a href="${discord}" target="_blank" rel="noopener">Discord</a>
        <a href="${x}" target="_blank" rel="noopener">X (Twitter)</a>
        <a href="${startgg}" target="_blank" rel="noopener">start.gg</a>
      </div>
      <a href="${window.KOWLOON_CONFIG.surveyUrl}" class="footer-survey" target="_blank" rel="noopener">
        アンケートに回答する
      </a>
      <p style="margin-top:18px;">© 九龍-KOWLOON-</p>
    </div>
  `;
}

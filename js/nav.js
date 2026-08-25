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
      <button class="nav-toggle" id="nav-toggle" aria-label="メニュー" aria-expanded="false">&#9776;</button>
      <nav class="nav-links" id="nav-links">${links}</nav>
      <a href="${window.KOWLOON_CONFIG.contactUrl}" class="nav-cta" target="_blank" rel="noopener">お問い合わせ</a>
    </div>
  `;

  const toggle = document.getElementById("nav-toggle");
  const navLinks = document.getElementById("nav-links");
  const closeMenu = () => {
    navLinks.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  };
  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = navLinks.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });
  navLinks.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", closeMenu);
  });
  document.addEventListener("click", (e) => {
    if (!el.contains(e.target)) closeMenu();
  });
}

function renderFooter() {
  const el = document.getElementById("site-footer");
  if (!el) return;
  const { discord, x, youtube, email } = window.KOWLOON_CONFIG.links;
  el.innerHTML = `
    <div class="container">
      <div class="footer-links">
        <a href="${discord}" target="_blank" rel="noopener">Discord</a>
        <a href="${x}" target="_blank" rel="noopener">X (Twitter)</a>
        <a href="${youtube}" target="_blank" rel="noopener">YouTube</a>
        <a href="${email}">メール</a>
      </div>
      <a href="${window.KOWLOON_CONFIG.contactUrl}" class="footer-contact" target="_blank" rel="noopener">
        お問い合わせ
      </a>
      <p style="margin-top:18px;">© 九龍-KOWLOON-</p>
    </div>
  `;
}

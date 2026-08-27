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
      <nav class="nav-links" id="nav-links">
        ${links}
        <a href="${window.KOWLOON_CONFIG.contactUrl}" class="nav-mobile-contact" target="_blank" rel="noopener">お問い合わせ</a>
      </nav>
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

// 上に戻るボタン(全ページ共通で自動表示)
function renderScrollTop() {
  const btn = document.createElement("button");
  btn.id = "scroll-top-btn";
  btn.className = "scroll-top-btn";
  btn.setAttribute("aria-label", "ページ上部へ戻る");
  btn.innerHTML = "&#8593;";
  document.body.appendChild(btn);

  const toggle = () => {
    btn.classList.toggle("visible", window.scrollY > 400);
  };
  window.addEventListener("scroll", toggle, { passive: true });
  toggle();

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}
renderScrollTop();

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
      <p class="footer-note">掲載写真は、九龍および写っている方の品位を傷つける内容を除き、再掲載・二次利用いただけます。<br>写真の削除・修正をご希望の方はお問い合わせよりご連絡ください。</p>
      <p style="margin-top:10px;">© 九龍-KOWLOON-</p>
    </div>
  `;
}

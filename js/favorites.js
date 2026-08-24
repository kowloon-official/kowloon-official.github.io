// お気に入り管理。ブラウザのlocalStorageにのみ保存する(サーバー不要・端末ごと)。
const FAVORITES_KEY = "kowloon:favorites:v1";

function getFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveFavorites(map) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(map));
  } catch (e) {
    // localStorageが使えない環境(プライベートモード等)では何もしない
  }
}

function isFavorite(photoId) {
  return !!getFavorites()[photoId];
}

function toggleFavorite(photoId, photoData) {
  const map = getFavorites();
  if (map[photoId]) {
    delete map[photoId];
  } else {
    map[photoId] = { ...photoData, savedAt: Date.now() };
  }
  saveFavorites(map);
  return !!map[photoId];
}

function listFavorites() {
  const map = getFavorites();
  return Object.values(map).sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
}

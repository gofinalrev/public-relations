/** Runs before paint to avoid light/dark flash on load */
export function ThemeScript() {
  const script = `
(function () {
  try {
    var key = 'social-hq-theme';
    var stored = localStorage.getItem(key);
    var dark =
      stored === 'dark' ||
      (stored !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  } catch (e) {}
})();
`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

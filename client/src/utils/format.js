// Автоматическое восстановление кириллицы из Latin-1
export const formatFileName = (str) => {
  if (!str) return '';
  // Проверяем наличие байтов Latin-1, в которые превращается русский UTF-8
  if (/[\u00C0-\u00FF]/.test(str)) {
    try {
      const bytes = Uint8Array.from([...str].map((c) => c.charCodeAt(0) & 0xff));
      const decoded = new TextDecoder('utf-8').decode(bytes);
      return decoded;
    } catch {
      return str;
    }
  }
  return str;
};
// src/utils/helpers.ts
export function escapeHTML(str: string | null | undefined): string {
  if (str === null || str === undefined) return '';
  const p = document.createElement('p');
  p.textContent = str;
  return p.innerHTML;
}
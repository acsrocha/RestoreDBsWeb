// src/utils/helpers.tsx
import type { ParsedNoteEntry } from '../types/api'; // Ajuste o caminho se o seu arquivo de tipos estiver em outro lugar

export function escapeHTML(str: string | null | undefined): string {
  if (str === null || str === undefined) return '';
  const p = document.createElement('p');
  p.textContent = str;
  return p.innerHTML;
}

// Regex para capturar: [YYYY-MM-DD HH:MM:SS - Fonte (com parênteses opcionais)]: Mensagem
// Ex: [2025-06-01 21:34:59 - Sistema (Criação de Área)]: Área cliente 'CSROCHA'...
// Ex: [2025-06-01 21:35:34 - Monitor Drive]: Status alterado...
// Ex: [2025-06-01 22:00:00 - Admin Web]: Nota manual adicionada.
const noteRegex = /^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) - ([\w\s()]+?)\]: (.*)$/;

export const parseNotesString = (notes?: string): ParsedNoteEntry[] => {
  if (!notes || notes.trim() === "") {
    return [];
  }
  const entries: ParsedNoteEntry[] = [];
  const lines = notes.split('\n');

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    if (trimmedLine === "") return; // Ignora linhas vazias

    const match = trimmedLine.match(noteRegex);
    if (match) {
      entries.push({
        id: `note-${index}-${match[1].replace(/\s|:/g, '')}`, // Chave única simples
        timestamp: match[1],
        source: match[2].trim(),
        message: match[3].trim(),
        rawLine: trimmedLine,
      });
    } else {
      // Se uma linha não corresponder ao padrão, trate-a como uma mensagem simples
      // (talvez uma nota antiga ou uma que foi editada manualmente sem seguir o padrão)
      entries.push({
        id: `note-raw-${index}`,
        timestamp: "", // Ou um valor padrão como "Data Desconhecida"
        source: "Nota", // Ou "Manual", "Sistema (Formato Antigo)", etc.
        message: trimmedLine,
        rawLine: trimmedLine,
      });
    }
  });
  return entries.reverse(); // Mostrar as notas mais recentes primeiro
};
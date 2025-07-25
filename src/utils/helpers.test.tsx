import { parseNotesString } from './helpers';

describe('parseNotesString', () => {
  test('parseia corretamente notas com formato padrão', () => {
    const notesString = `[2023-06-15 10:30:45 - Sistema]: Backup iniciado
[2023-06-15 10:35:20 - Sistema (Processamento)]: Arquivo recebido
[2023-06-15 10:40:15 - Admin]: Verificação manual realizada`;

    const result = parseNotesString(notesString);
    
    expect(result).toHaveLength(3);
    
    expect(result[0].timestamp).toBe('2023-06-15 10:30:45');
    expect(result[0].source).toBe('Sistema');
    expect(result[0].message).toBe('Backup iniciado');
    
    expect(result[1].timestamp).toBe('2023-06-15 10:35:20');
    expect(result[1].source).toBe('Sistema (Processamento)');
    expect(result[1].message).toBe('Arquivo recebido');
    
    expect(result[2].timestamp).toBe('2023-06-15 10:40:15');
    expect(result[2].source).toBe('Admin');
    expect(result[2].message).toBe('Verificação manual realizada');
  });

  test('lida corretamente com notas vazias', () => {
    expect(parseNotesString('')).toEqual([]);
    expect(parseNotesString('   ')).toEqual([]);
    expect(parseNotesString(null)).toEqual([]);
    expect(parseNotesString(undefined)).toEqual([]);
  });

  test('lida corretamente com formatos inválidos', () => {
    const invalidFormat = `Nota sem formato correto
[2023-06-15 10:30:45 - Sistema]: Esta é válida
Outra nota sem formato`;

    const result = parseNotesString(invalidFormat);
    
    expect(result).toHaveLength(3);
    
    expect(result[0].timestamp).toBe('');
    expect(result[0].source).toBe('');
    expect(result[0].message).toBe('Nota sem formato correto');
    
    expect(result[1].timestamp).toBe('2023-06-15 10:30:45');
    expect(result[1].source).toBe('Sistema');
    expect(result[1].message).toBe('Esta é válida');
    
    expect(result[2].timestamp).toBe('');
    expect(result[2].source).toBe('');
    expect(result[2].message).toBe('Outra nota sem formato');
  });

  test('lida corretamente com formatos alternativos', () => {
    const alternativeFormat = `[15/06/2023 10:30 - Usuário]: Formato de data diferente
[Sistema - 10:30:45]: Ordem diferente
[2023-06-15]: Sem fonte`;

    const result = parseNotesString(alternativeFormat);
    
    // Mesmo com formatos diferentes, a função deve extrair o que conseguir
    expect(result).toHaveLength(3);
    
    expect(result[0].timestamp).toBe('15/06/2023 10:30');
    expect(result[0].source).toBe('Usuário');
    
    expect(result[1].source).toBe('Sistema - 10:30:45');
    expect(result[1].message).toBe('Ordem diferente');
    
    expect(result[2].timestamp).toBe('2023-06-15');
    expect(result[2].source).toBe('');
    expect(result[2].message).toBe('Sem fonte');
  });
});
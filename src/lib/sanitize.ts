/**
 * Sanitiza un texto para prevenir ataques de CSV Injection.
 * Si el texto comienza con caracteres peligrosos (=, +, -, @),
 * agrega un apóstrofe al inicio para evitar que Excel los interprete como fórmulas.
 */
export const sanitizeInput = (text: string | null | undefined): string => {
  if (!text) return "";
  
  const trimmed = text.trim();
  const dangerousChars = ["=", "+", "-", "@"];
  
  if (dangerousChars.some(char => trimmed.startsWith(char))) {
    return `'${trimmed}`;
  }
  
  return trimmed;
};

/**
 * ============================================================================
 * RFC-4180 QUOTE-AWARE CSV PARSER
 * Handles quoted fields containing commas / embedded newlines, escaped
 * double-quotes (""), CRLF and bare LF line breaks. No dependencies.
 * ============================================================================
 */

export function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  if (!text) return rows;

  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const len = text.length;

  const pushField = (): void => {
    row.push(field);
    field = "";
  };
  const pushRow = (): void => {
    pushField();
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < len; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        // Doubled quote inside a quoted field is a literal quote.
        if (i + 1 < len && text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      pushField();
    } else if (ch === "\r") {
      // Treat a lone CR as a line break; consume a following LF as one CRLF.
      if (i + 1 < len && text[i + 1] === "\n") i++;
      pushRow();
    } else if (ch === "\n") {
      pushRow();
    } else {
      field += ch;
    }
  }

  // Flush the final field / row if the text did not end with a newline.
  if (field.length > 0 || row.length > 0) pushRow();

  return rows;
}

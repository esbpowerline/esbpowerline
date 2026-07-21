/**
 * Serialize a value for safe embedding inside a <script type="application/ld+json"> tag.
 * Escapes `<`, `>`, and `&` so a string containing `</script>` (or an HTML comment
 * sequence) cannot break out of the script element — a stored-XSS vector when any
 * field is DB/user-influenced.
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

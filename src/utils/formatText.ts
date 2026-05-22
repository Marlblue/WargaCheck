/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Cleans Markdown text specifically for sharing on platforms like WhatsApp
 * that have limited markdown support (e.g., *bold* only).
 */
export function cleanMarkdownForShare(text: string): string {
  return text
    .replace(/\*\*/g, '*')       // Bold (**) → WhatsApp bold (*)
    .replace(/#{1,6}\s?/g, '')   // Remove headings (H1-H6)
    .replace(/-\s*\[\s*\]/g, '☐') // Unchecked checkbox [ ]
    .replace(/-\s*\[x\]/g, '☑')   // Checked checkbox [x]
    .replace(/_/g, '')           // Remove underscores that might trigger italic
    .trim();
}

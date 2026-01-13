/**
 * Client-safe translation utilities
 * These functions can be imported in client components ("use client")
 */

import type { TranslationContentType, TranslationFieldName } from '@/lib/types';

/**
 * Trigger translation for content (fire-and-forget)
 * This is called after content creation to translate in the background.
 * Safe to use in client components.
 */
export function triggerTranslation(
  contentType: TranslationContentType,
  contentId: string,
  fields: { field_name: TranslationFieldName; text: string }[]
): void {
  // Fire and forget - don't await
  fetch('/api/translate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content_type: contentType,
      content_id: contentId,
      fields,
      detect_language: true,
    }),
  }).catch((error) => {
    console.error('Translation trigger failed:', error);
  });
}

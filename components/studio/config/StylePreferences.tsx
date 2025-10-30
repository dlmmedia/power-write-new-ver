'use client';

import { WritingStyle } from './WritingStyle';

// StylePreferences now uses the properly structured WritingStyle component
// which works with the nested BookConfiguration structure
export function StylePreferences() {
  return <WritingStyle />;
}

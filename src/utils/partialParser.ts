import { jsonrepair } from 'jsonrepair';
import { WorkflowData } from '@/types';

/**
 * Safely parses a potentially incomplete JSON string in real-time.
 * It uses `jsonrepair` to balance unclosed arrays, objects, and strings.
 * If successful, it parses and returns the partial structure of the requested type.
 */
export function parsePartialJson<T = WorkflowData>(jsonStr: string): Partial<T> {
  if (!jsonStr || jsonStr.trim() === '') {
    return {};
  }

  let cleanJson = jsonStr.trim();
  
  // 1. Strip markdown JSON codeblock markers if present
  if (cleanJson.startsWith('```')) {
    const lines = cleanJson.split('\n');
    // Find where the JSON starts
    const startIdx = lines.findIndex(line => line.includes('{'));
    if (startIdx !== -1) {
      cleanJson = lines.slice(startIdx).join('\n');
    }
  }

  // 2. Locate the first opening brace '{'
  const firstBraceIdx = cleanJson.indexOf('{');
  if (firstBraceIdx === -1) {
    return {};
  }
  cleanJson = cleanJson.substring(firstBraceIdx);

  // 3. Strip any trailing markdown block characters
  const lastBacktickIdx = cleanJson.lastIndexOf('```');
  if (lastBacktickIdx > -1) {
    cleanJson = cleanJson.substring(0, lastBacktickIdx).trim();
  }

  // 4. Perform repair and parse
  try {
    const repaired = jsonrepair(cleanJson);
    return JSON.parse(repaired) as Partial<T>;
  } catch (error) {
    // Graceful fallback for severe truncation that jsonrepair cannot resolve
    try {
      // Standard brace balancing fallback
      let tempJson = cleanJson.trim();
      
      // If it ends with a comma, remove it
      if (tempJson.endsWith(',')) {
        tempJson = tempJson.slice(0, -1);
      }
      
      // Attempt standard JSON parsing by appending braces/brackets
      const openBraces = (tempJson.match(/\{/g) || []).length;
      const closeBraces = (tempJson.match(/\}/g) || []).length;
      const openBrackets = (tempJson.match(/\[/g) || []).length;
      const closeBrackets = (tempJson.match(/\]/g) || []).length;

      let suffix = '';
      if (openBrackets > closeBrackets) {
        suffix += ']'.repeat(openBrackets - closeBrackets);
      }
      if (openBraces > closeBraces) {
        suffix += '}'.repeat(openBraces - closeBraces);
      }

      const secondaryRepair = jsonrepair(tempJson + suffix);
      return JSON.parse(secondaryRepair) as Partial<T>;
    } catch {
      // Return empty if completely un-parsable at this stream position
      return {};
    }
  }
}

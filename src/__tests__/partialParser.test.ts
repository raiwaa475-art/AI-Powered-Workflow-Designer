import { parsePartialJson } from '../utils/partialParser';

describe('parsePartialJson', () => {
  it('should parse complete and valid JSON correctly', () => {
    const input = '{"title": "Test", "description": "Hello World"}';
    const result = parsePartialJson(input);
    expect(result).toEqual({ title: 'Test', description: 'Hello World' });
  });

  it('should strip markdown JSON codeblock markers and parse', () => {
    const input = '```json\n{\n  "title": "Markdown Test"\n}\n```';
    const result = parsePartialJson(input);
    expect(result).toEqual({ title: 'Markdown Test' });
  });

  it('should handle unclosed JSON structure by repairing it', () => {
    const input = '{"title": "Truncated", "layers": [{"id": "pres"';
    const result = parsePartialJson(input);
    expect(result.title).toBe('Truncated');
    expect(Array.isArray(result.layers)).toBe(true);
    expect(result.layers?.[0]).toEqual({ id: 'pres' });
  });

  it('should balance open brackets and braces under severe truncation', () => {
    const input = '{"title": "Severe", "steps": [ {"id": "step-1"';
    const result = parsePartialJson(input);
    expect(result.title).toBe('Severe');
    expect(result.steps?.[0]?.id).toBe('step-1');
  });

  it('should gracefully handle empty or whitespace-only inputs', () => {
    expect(parsePartialJson('')).toEqual({});
    expect(parsePartialJson('   ')).toEqual({});
  });

  it('should handle completely un-parsable strings gracefully by returning empty object', () => {
    const input = 'This is not JSON at all!';
    const result = parsePartialJson(input);
    expect(result).toEqual({});
  });
});

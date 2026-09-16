import request from './client';
import type { ParsedNote, ParsedCheckIn } from '../types';

export function parseNote(text: string): Promise<ParsedNote> {
  return request<ParsedNote>('/parse-note', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

export function parseToCheckIn(text: string): Promise<ParsedCheckIn> {
  return request<ParsedCheckIn>('/parse-to-checkin', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

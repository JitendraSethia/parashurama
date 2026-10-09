// Small DOM helpers. Returns `any` on purpose in the UI layer (typed per-feature in Phase 2).
export const $ = (s: string): any => document.querySelector(s);
export const $$ = (s: string): any[] => [...document.querySelectorAll(s)];
export const cssv = (n: string): string => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
export const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

export type Id = string;
export interface Vec2 { x: number; y: number; }
export interface Rect { x: number; y: number; w: number; h: number; }

//Some helpers
export function centerOf(r: Rect): Vec2 { return { x: r.x + r.w / 2, y: r.y + r.h / 2 }; }
export function rectContains(r: Rect, p: Vec2): boolean {
  return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
}
export function dist2(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x, dy = a.y - b.y;
  return dx*dx + dy*dy;
}

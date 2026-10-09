import { clamp, SKILLS, type Mastery } from '@parashurama/engine';

// Skill-fingerprint radar chart, plain SVG (no chart library, works offline).
export function radarChart(vals: Mastery, before: Mastery | null, o: { w?: number; h?: number; r?: number; dy?: number; labels?: boolean } = {}) {
  const W=o.w||320,H=o.h||270,cx=W/2,cy=H/2+(o.dy||4),R=o.r||92,n=SKILLS.length;
  const pt=(i,v)=>{const a=-Math.PI/2+i*2*Math.PI/n;return[cx+Math.cos(a)*R*v,cy+Math.sin(a)*R*v];};
  let s=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Skill fingerprint">`;
  for(const g of [0.25,0.5,0.75,1])s+=`<polygon points="${SKILLS.map((_,i)=>pt(i,g).join(',')).join(' ')}" fill="none" stroke="#B9C3B4" stroke-width="${g===1?1.2:0.7}"/>`;
  SKILLS.forEach((_,i)=>{const [x,y]=pt(i,1);s+=`<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#D2D9CD"/>`;});
  const poly=v=>SKILLS.map(([k],i)=>pt(i,clamp(v[k],0.02,1)).join(',')).join(' ');
  if(before)s+=`<polygon points="${poly(before)}" fill="none" stroke="#78867D" stroke-width="1.6" stroke-dasharray="4 3"/>`;
  s+=`<polygon points="${poly(vals)}" fill="rgba(24,35,29,0.13)" stroke="#18231D" stroke-width="2"/>`;
  SKILLS.forEach(([k],i)=>{const [x,y]=pt(i,clamp(vals[k],0.02,1));s+=`<circle cx="${x}" cy="${y}" r="3" fill="${vals[k]<0.5?'#B3122A':'#18231D'}"/>`;});
  if(o.labels!==false)SKILLS.forEach(([k,l],i)=>{const [x,y]=pt(i,1.2);const anc=Math.abs(x-cx)<8?'middle':x>cx?'start':'end';s+=`<text x="${x}" y="${y+4}" text-anchor="${anc}" font-family="Barlow Condensed, DejaVu Sans Condensed, sans-serif" font-size="12.5" fill="${vals[k]<0.5?'#B3122A':'#46554C'}">${l}</text>`;});
  return s+'</svg>';
}


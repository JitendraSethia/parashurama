let t: any = null;
export function toast(msg: string, ms = 2600) {
  let el = document.getElementById('toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
  el.textContent = msg; el.classList.add('on'); clearTimeout(t); t = setTimeout(() => el!.classList.remove('on'), ms);
}

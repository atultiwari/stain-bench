/* Stain Bench: the bar at the top of every page that switches between the three versions.
   Loaded with `defer`, so it runs after each page has built itself, then adds the bar as the first thing in <body>. */
(() => {
  const VERSIONS = [
    { dir: 'sketchbook', name: 'Sketchbook', hint: 'Hand-drawn 2D' },
    { dir: 'turntable', name: 'Turntable', hint: 'Rotate in 3D' },
    { dir: 'working-model', name: 'Working Model', hint: 'Every number from one model' },
  ];
  const here = VERSIONS.find(v => location.pathname.includes(`/${v.dir}/`)) || VERSIONS[0];

  const css = `
    .sb-switch{grid-column:1/-1;width:100%;box-sizing:border-box;display:flex;align-items:center;gap:14px;flex-wrap:wrap;
      margin:0 0 10px;padding:4px 0 6px;border-bottom:1px solid rgba(35,30,22,.15);
      font:500 14px/1.2 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#231e16}
    .sb-switch .sb-brand{font-weight:700;letter-spacing:.01em;white-space:nowrap}
    .sb-switch .sb-brand small{font-weight:500;color:#6f6858;margin-left:6px}
    .sb-switch .sb-tabs{display:flex;gap:4px;padding:3px;border:1.5px solid #231e16;border-radius:999px;background:#fbf8f0;margin-left:auto}
    .sb-switch a{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:30px;padding:3px 14px;border-radius:999px;
      color:#231e16;text-decoration:none;white-space:nowrap}
    .sb-switch a:hover{background:rgba(35,30,22,.07)}
    .sb-switch a[aria-current=page]{background:#231e16;color:#fbf8f0}
    .sb-switch a:focus-visible{outline:2px solid #231e16;outline-offset:2px}
    @media (max-width:560px){
      .sb-switch{gap:6px;margin-bottom:8px;padding:4px 0 8px}
      .sb-switch .sb-brand small{display:none}
      .sb-switch .sb-tabs{margin-left:0;width:100%}
      .sb-switch a{flex:1 1 0;padding:4px 6px;min-height:40px;font-size:13px}
    }`;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  const nav = document.createElement('nav');
  nav.className = 'sb-switch';
  nav.setAttribute('aria-label', 'Choose a version');
  nav.innerHTML = `<div class="sb-brand">Stain Bench<small>H&amp;E staining, three ways</small></div><div class="sb-tabs">${
    VERSIONS.map(v => `<a href="../${v.dir}/" title="${v.hint}"${v === here ? ' aria-current="page"' : ''}>${v.name}</a>`).join('')
  }</div>`;
  document.body.prepend(nav);
})();

import { useState, useEffect, useCallback, useRef } from "react";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const api = async (path, options = {}, token = null) => {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...options, headers: { ...headers, ...options.headers } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
};

// ─── Icons ────────────────────────────────────
const Icon = ({ name, size = 18 }) => {
  const icons = {
    book:     <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
    search:   <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    user:     <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    grid:     <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    list:     <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
    check:    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    x:        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    bell:     <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    bar:      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>,
    arrow:    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
    plus:     <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    shield:   <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    clock:    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    refresh:  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
    bookmark: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>,
    logout:   <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    trash:    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
    eye:      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    money:    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    phone:    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.12 6.12l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
    mail:     <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
    alert:    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    lock:     <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    id:       <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
    spinner:  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{animation:"spin 1s linear infinite"}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>,
    sun:      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
    moon:     <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
    upload:   <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>,
    "eye-off": <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  };
  return icons[name] || null;
};

// ─── Genre Colors ─────────────────────────────
const genreColors = {
  "Fiction":"#6ea3e8","Self-Help":"#5ecc8b","Sci-Fi":"#a06ee8",
  "Classic":"#e8c878","History":"#e8935a","Science":"#5ebecc",
  "Technology":"#e86e8e","Biography":"#c9a84c","Mystery":"#8e6ee8",
  "Romance":"#e86ea8","Philosophy":"#6ee8a0","Other":"#9a96a0",
};

// ─── Theme Variables ──────────────────────────
const DARK_THEME = `
  --bg:#0e0f13; --surface:#161820; --surface2:#1e2028; --surface3:#252730;
  --border:#2e3040; --accent:#e8c878; --accent2:#c9a84c; --accent-soft:rgba(232,200,120,0.12);
  --text:#f0ede8; --text2:#9a96a0; --text3:#6b6878;
  --green:#5ecc8b; --red:#e8665a; --blue:#6ea3e8; --purple:#a06ee8; --orange:#e8935a;
  --shadow:0 4px 24px rgba(0,0,0,0.4);
`;
const LIGHT_THEME = `
  --bg:#f4f2ee; --surface:#ffffff; --surface2:#f0ede8; --surface3:#e8e4de;
  --border:#d8d2c8; --accent:#b8860b; --accent2:#9a6e08; --accent-soft:rgba(184,134,11,0.1);
  --text:#1a1400; --text2:#5a5040; --text3:#8a7a60;
  --green:#2a8a5a; --red:#c0392b; --blue:#2868b8; --purple:#7040c0; --orange:#c06820;
  --shadow:0 4px 24px rgba(0,0,0,0.12);
`;

// ─── Global Styles ────────────────────────────
const getStyles = (isDark) => `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=DM+Sans:wght@300;400;500;600&display=swap');
  @keyframes spin { to { transform:rotate(360deg); } }
  @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes modalIn { from{opacity:0;transform:scale(0.95) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes toastIn { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
  @keyframes themeSwitch { from{opacity:0.6;transform:scale(0.97)} to{opacity:1;transform:scale(1)} }
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  :root { ${isDark ? DARK_THEME : LIGHT_THEME}
    --font-display:'Playfair Display',Georgia,serif;
    --font-body:'DM Sans',system-ui,sans-serif;
    --radius:12px; --radius-sm:8px;
    --transition:0.2s cubic-bezier(0.4,0,0.2,1);
  }
  body { background:var(--bg); color:var(--text); font-family:var(--font-body); min-height:100vh; transition:background 0.3s,color 0.3s; }
  .theme-animate { animation:themeSwitch 0.3s ease; }
  .app { display:flex; min-height:100vh; }
  .sidebar { width:240px; min-height:100vh; background:var(--surface); border-right:1px solid var(--border); display:flex; flex-direction:column; position:fixed; top:0; left:0; z-index:100; transition:background 0.3s,border-color 0.3s; }
  .sidebar-logo { padding:24px 20px 20px; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:12px; }
  .logo-icon { width:36px; height:36px; background:var(--accent); border-radius:8px; display:flex; align-items:center; justify-content:center; color:${isDark?"#1a1400":"#fff"}; flex-shrink:0; }
  .logo-text { font-family:var(--font-display); font-size:16px; font-weight:700; color:var(--text); line-height:1.2; }
  .logo-sub { font-size:10px; color:var(--text3); letter-spacing:0.1em; text-transform:uppercase; }
  .sidebar-nav { flex:1; padding:16px 12px; display:flex; flex-direction:column; gap:4px; overflow-y:auto; }
  .nav-section { font-size:10px; color:var(--text3); letter-spacing:0.12em; text-transform:uppercase; padding:12px 8px 6px; font-weight:600; }
  .nav-item { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:var(--radius-sm); cursor:pointer; color:var(--text2); font-size:13.5px; font-weight:500; transition:all var(--transition); border:1px solid transparent; }
  .nav-item:hover { background:var(--surface2); color:var(--text); }
  .nav-item.active { background:var(--accent-soft); color:var(--accent); border-color:rgba(184,134,11,0.2); }
  .nav-badge { margin-left:auto; background:var(--red); color:white; font-size:10px; font-weight:700; padding:2px 6px; border-radius:99px; min-width:18px; text-align:center; }
  .sidebar-user { padding:16px; border-top:1px solid var(--border); display:flex; align-items:center; gap:10px; cursor:pointer; }
  .user-avatar { width:34px; height:34px; border-radius:50%; background:linear-gradient(135deg,var(--accent),var(--purple)); display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; color:${isDark?"#1a1400":"#fff"}; flex-shrink:0; }
  .user-name { font-size:13px; font-weight:600; color:var(--text); }
  .user-role { font-size:11px; color:var(--text3); }

  /* Theme toggle in sidebar */
  .theme-toggle-wrap { padding:12px 16px; border-top:1px solid var(--border); }
  .theme-toggle-label { font-size:10px; color:var(--text3); margin-bottom:8px; text-transform:uppercase; letter-spacing:0.1em; font-weight:600; }
  .theme-toggle { display:flex; background:var(--surface2); border:1px solid var(--border); border-radius:var(--radius-sm); padding:3px; gap:2px; }
  .theme-btn { flex:1; padding:6px 8px; border-radius:6px; font-size:11px; font-weight:600; cursor:pointer; transition:all var(--transition); color:var(--text3); display:flex; align-items:center; justify-content:center; gap:5px; }
  .theme-btn.active { background:var(--accent); color:${isDark?"#1a1400":"#fff"}; }

  .main { margin-left:240px; flex:1; min-height:100vh; }
  .topbar { padding:16px 32px; border-bottom:1px solid var(--border); background:var(--surface); display:flex; align-items:center; gap:16px; position:sticky; top:0; z-index:50; transition:background 0.3s; }
  .topbar-title { font-family:var(--font-display); font-size:20px; font-weight:700; flex:1; }
  .topbar-actions { display:flex; align-items:center; gap:10px; }
  .icon-btn { width:36px; height:36px; border-radius:var(--radius-sm); border:1px solid var(--border); background:var(--surface2); color:var(--text2); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all var(--transition); position:relative; }
  .icon-btn:hover { background:var(--surface3); color:var(--text); }
  .content { padding:28px 32px; animation:fadeIn 0.3s ease; }
  .search-wrap { position:relative; flex:1; max-width:360px; }
  .search-input { width:100%; background:var(--surface2); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text); font-family:var(--font-body); font-size:13.5px; padding:9px 14px 9px 38px; outline:none; transition:border-color var(--transition),background 0.3s; }
  .search-input:focus { border-color:var(--accent); }
  .search-input::placeholder { color:var(--text3); }
  .search-icon { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--text3); pointer-events:none; }
  .stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:28px; }
  .stat-card { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); padding:20px; transition:border-color var(--transition),background 0.3s; }
  .stat-card:hover { border-color:var(--accent); }
  .stat-icon { width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; margin-bottom:12px; }
  .stat-val { font-family:var(--font-display); font-size:28px; font-weight:700; color:var(--text); line-height:1; }
  .stat-label { font-size:12px; color:var(--text3); margin-top:4px; font-weight:500; letter-spacing:0.04em; }
  .stat-trend { font-size:11px; margin-top:8px; }
  .filter-row { display:flex; align-items:center; gap:10px; margin-bottom:20px; flex-wrap:wrap; }
  .filter-chip { padding:7px 14px; border-radius:99px; border:1px solid var(--border); background:var(--surface); color:var(--text2); font-size:12.5px; font-weight:500; cursor:pointer; transition:all var(--transition); }
  .filter-chip:hover { border-color:var(--accent); color:var(--text); }
  .filter-chip.active { background:var(--accent-soft); border-color:var(--accent); color:var(--accent); }
  .view-toggle { display:flex; border:1px solid var(--border); border-radius:var(--radius-sm); overflow:hidden; margin-left:auto; }
  .view-btn { padding:7px 10px; background:var(--surface); color:var(--text3); cursor:pointer; transition:all var(--transition); border:none; }
  .view-btn.active { background:var(--surface3); color:var(--accent); }
  .books-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:18px; }
  .book-card { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); overflow:hidden; cursor:pointer; transition:all var(--transition); }
  .book-card:hover { border-color:var(--accent); transform:translateY(-2px); box-shadow:var(--shadow); }
  .book-cover { height:160px; background:var(--surface2); display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden; }
  .book-avail-badge { position:absolute; top:8px; right:8px; font-size:10px; font-weight:700; padding:3px 8px; border-radius:99px; letter-spacing:0.05em; text-transform:uppercase; }
  .badge-available { background:rgba(94,204,139,0.2); color:var(--green); border:1px solid rgba(94,204,139,0.3); }
  .badge-limited { background:rgba(232,147,90,0.2); color:var(--orange); border:1px solid rgba(232,147,90,0.3); }
  .badge-unavailable { background:rgba(232,102,90,0.2); color:var(--red); border:1px solid rgba(232,102,90,0.3); }
  .book-info { padding:14px; }
  .book-title { font-family:var(--font-display); font-size:14px; font-weight:700; color:var(--text); line-height:1.3; margin-bottom:4px; }
  .book-author { font-size:12px; color:var(--text3); margin-bottom:8px; }
  .book-genre { font-size:11px; padding:3px 8px; border-radius:4px; background:var(--surface3); color:var(--text2); display:inline-block; }
  .book-actions { display:flex; gap:6px; margin-top:10px; }
  .books-list { display:flex; flex-direction:column; gap:10px; }
  .book-list-item { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); padding:14px 18px; display:flex; align-items:center; gap:16px; cursor:pointer; transition:all var(--transition); }
  .book-list-item:hover { border-color:var(--accent); }
  .book-list-cover { width:44px; height:58px; border-radius:4px; background:var(--surface2); display:flex; align-items:center; justify-content:center; flex-shrink:0; overflow:hidden; font-family:var(--font-display); font-size:18px; font-weight:900; }
  .book-list-info { flex:1; min-width:0; }
  .book-list-title { font-family:var(--font-display); font-size:15px; font-weight:700; color:var(--text); margin-bottom:3px; }
  .book-list-meta { font-size:12px; color:var(--text3); display:flex; gap:12px; }
  .btn { display:inline-flex; align-items:center; gap:6px; padding:8px 16px; border-radius:var(--radius-sm); font-family:var(--font-body); font-size:13px; font-weight:600; cursor:pointer; transition:all var(--transition); border:1px solid transparent; }
  .btn-primary { background:var(--accent); color:${isDark?"#1a1400":"#fff"}; border-color:var(--accent); }
  .btn-primary:hover { background:var(--accent2); }
  .btn-secondary { background:var(--surface2); color:var(--text2); border-color:var(--border); }
  .btn-secondary:hover { background:var(--surface3); color:var(--text); }
  .btn-ghost { background:transparent; color:var(--text2); border-color:var(--border); }
  .btn-ghost:hover { background:var(--surface2); color:var(--text); }
  .btn-danger { background:rgba(192,57,43,0.15); color:var(--red); border-color:rgba(192,57,43,0.3); }
  .btn-danger:hover { background:rgba(192,57,43,0.25); }
  .btn-green { background:rgba(42,138,90,0.15); color:var(--green); border-color:rgba(42,138,90,0.3); }
  .btn-green:hover { background:rgba(42,138,90,0.25); }
  .btn-sm { padding:5px 10px; font-size:12px; }
  .btn:disabled { opacity:0.4; cursor:not-allowed; }
  .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,${isDark?"0.75":"0.5"}); z-index:200; display:flex; align-items:center; justify-content:center; padding:20px; backdrop-filter:blur(4px); }
  .modal { background:var(--surface); border:1px solid var(--border); border-radius:16px; width:100%; max-width:520px; max-height:88vh; overflow-y:auto; box-shadow:var(--shadow); animation:modalIn 0.2s ease; }
  .modal-wide { max-width:640px; }
  .drop-zone { border:2px dashed var(--border); border-radius:var(--radius); padding:32px; text-align:center; cursor:pointer; transition:border-color var(--transition),background var(--transition); }
  .drop-zone:hover { border-color:var(--accent); background:var(--accent-soft); }
  .file-preview { background:var(--surface2); border:1px solid var(--border); border-radius:var(--radius-sm); padding:12px; margin-bottom:16px; }
  .modal-header { padding:24px 24px 0; display:flex; align-items:flex-start; gap:16px; }
  .modal-body { padding:20px 24px 24px; }
  .modal-title { font-family:var(--font-display); font-size:20px; font-weight:700; flex:1; }
  .modal-close { width:32px; height:32px; border-radius:8px; background:var(--surface2); border:1px solid var(--border); color:var(--text3); display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; transition:all var(--transition); }
  .modal-close:hover { color:var(--text); background:var(--surface3); }
  .book-detail-cover { width:100%; height:160px; background:var(--surface2); border-radius:var(--radius-sm); display:flex; align-items:center; justify-content:center; overflow:hidden; font-family:var(--font-display); font-size:56px; font-weight:900; margin-bottom:20px; }
  .detail-row { display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid var(--border); }
  .detail-row:last-child { border-bottom:none; }
  .detail-label { font-size:12px; color:var(--text3); }
  .detail-val { font-size:13px; color:var(--text); font-weight:500; }
  .inv-bar { height:6px; background:var(--surface3); border-radius:99px; overflow:hidden; margin:8px 0 4px; }
  .inv-bar-fill { height:100%; border-radius:99px; transition:width 0.5s ease; }
  .table-wrap { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); overflow:hidden; }
  table { width:100%; border-collapse:collapse; }
  th { padding:13px 18px; font-size:11px; color:var(--text3); font-weight:600; text-transform:uppercase; letter-spacing:0.08em; border-bottom:1px solid var(--border); text-align:left; background:var(--surface2); }
  td { padding:13px 18px; font-size:13.5px; color:var(--text); border-bottom:1px solid var(--border); }
  tr:last-child td { border-bottom:none; }
  tr:hover td { background:var(--surface2); }
  .tag { display:inline-flex; align-items:center; gap:4px; padding:3px 8px; border-radius:4px; font-size:11px; font-weight:600; }
  .tag-green { background:rgba(42,138,90,0.15); color:var(--green); }
  .tag-red { background:rgba(192,57,43,0.15); color:var(--red); }
  .tag-blue { background:rgba(40,104,184,0.15); color:var(--blue); }
  .tag-orange { background:rgba(192,104,32,0.15); color:var(--orange); }
  .tag-gold { background:var(--accent-soft); color:var(--accent); }
  .tag-purple { background:rgba(112,64,192,0.15); color:var(--purple); }
  .chart-row { display:grid; grid-template-columns:1fr 1fr; gap:18px; margin-top:24px; }
  .chart-card { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); padding:20px; }
  .chart-title { font-size:13px; font-weight:600; color:var(--text2); margin-bottom:16px; text-transform:uppercase; letter-spacing:0.08em; }
  .bar-chart { display:flex; align-items:flex-end; gap:8px; height:100px; }
  .bar-col { display:flex; flex-direction:column; align-items:center; gap:5px; flex:1; }
  .bar-fill { width:100%; border-radius:4px 4px 0 0; transition:height 0.5s ease; opacity:0.85; }
  .bar-label { font-size:10px; color:var(--text3); text-align:center; }
  .donut-wrap { display:flex; align-items:center; gap:20px; }
  .donut-legend { display:flex; flex-direction:column; gap:8px; }
  .legend-item { display:flex; align-items:center; gap:8px; font-size:12px; color:var(--text2); }
  .legend-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
  .toast-container { position:fixed; bottom:24px; right:24px; z-index:500; display:flex; flex-direction:column; gap:8px; }
  .toast { background:var(--surface2); border:1px solid var(--border); border-radius:var(--radius-sm); padding:12px 16px; display:flex; align-items:center; gap:10px; min-width:280px; box-shadow:var(--shadow); animation:toastIn 0.3s ease; font-size:13.5px; }
  .toast-icon { width:24px; height:24px; border-radius:6px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .form-group { margin-bottom:16px; }
  .form-label { display:block; font-size:12px; font-weight:600; color:var(--text2); margin-bottom:6px; text-transform:uppercase; letter-spacing:0.06em; }
  .form-input { width:100%; background:var(--surface2); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text); font-family:var(--font-body); font-size:13.5px; padding:10px 14px; outline:none; transition:border-color var(--transition),background 0.3s; }
  .form-input:focus { border-color:var(--accent); }
  .form-input::placeholder { color:var(--text3); }
  select.form-input { cursor:pointer; }
  .form-row { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  .form-actions { display:flex; gap:10px; justify-content:flex-end; margin-top:20px; padding-top:16px; border-top:1px solid var(--border); }
  .empty-state { text-align:center; padding:60px 20px; color:var(--text3); }
  .empty-state-icon { width:56px; height:56px; border-radius:14px; background:var(--surface2); display:flex; align-items:center; justify-content:center; margin:0 auto 16px; color:var(--text3); }
  .empty-state-title { font-family:var(--font-display); font-size:18px; color:var(--text2); margin-bottom:8px; }
  .tx-row { display:flex; align-items:center; gap:14px; padding:13px 18px; border-bottom:1px solid var(--border); transition:background var(--transition); }
  .tx-row:hover { background:var(--surface2); }
  .tx-row:last-child { border-bottom:none; }
  .tx-icon { width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  ::-webkit-scrollbar { width:5px; height:5px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:var(--surface3); border-radius:99px; }
  .section-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; }
  .section-title { font-family:var(--font-display); font-size:18px; font-weight:700; }
  .overdue-flag { background:rgba(192,57,43,0.12); border:1px solid rgba(192,57,43,0.25); color:var(--red); font-size:11px; padding:3px 8px; border-radius:4px; font-weight:600; }
  .fine-banner { background:rgba(192,57,43,0.08); border:1px solid rgba(192,57,43,0.2); border-radius:var(--radius-sm); padding:12px 16px; display:flex; align-items:center; gap:12px; margin-bottom:20px; }
  .loading-row { display:flex; align-items:center; justify-content:center; padding:48px; color:var(--text3); gap:12px; }
  .progress-ring { transform-origin:50px 50px; }

  /* Auth page */
  .auth-page { min-height:100vh; display:flex; align-items:center; justify-content:center; background:var(--bg); position:relative; overflow:hidden; }
  .auth-bg { position:absolute; inset:0; background:radial-gradient(ellipse 80% 60% at 50% 0%,${isDark?"rgba(232,200,120,0.07)":"rgba(184,134,11,0.06)"},transparent 70%); pointer-events:none; }
  .auth-card { background:var(--surface); border:1px solid var(--border); border-radius:20px; padding:40px; width:100%; max-width:440px; box-shadow:var(--shadow); position:relative; z-index:1; animation:fadeIn 0.4s ease; }
  .auth-logo { display:flex; align-items:center; gap:12px; margin-bottom:32px; justify-content:center; }
  .auth-logo-icon { width:44px; height:44px; background:var(--accent); border-radius:10px; display:flex; align-items:center; justify-content:center; color:${isDark?"#1a1400":"#fff"}; }
  .auth-logo-text { font-family:var(--font-display); font-size:22px; font-weight:700; }
  .auth-tabs { display:flex; background:var(--surface2); border:1px solid var(--border); border-radius:var(--radius-sm); padding:3px; gap:2px; margin-bottom:24px; }
  .auth-tab { flex:1; padding:8px; border-radius:6px; font-size:13px; font-weight:600; cursor:pointer; transition:all var(--transition); color:var(--text3); text-align:center; }
  .auth-tab.active { background:var(--accent); color:${isDark?"#1a1400":"#fff"}; }
  .role-tabs { display:flex; background:var(--surface3); border-radius:var(--radius-sm); padding:3px; gap:2px; margin-bottom:20px; }
  .role-tab { flex:1; padding:7px; border-radius:6px; font-size:12px; font-weight:600; cursor:pointer; transition:all var(--transition); color:var(--text3); text-align:center; display:flex; align-items:center; justify-content:center; gap:6px; }
  .role-tab.active { background:var(--surface); color:var(--accent); box-shadow:0 2px 8px rgba(0,0,0,0.2); }
  .auth-err { background:rgba(192,57,43,0.1); border:1px solid rgba(192,57,43,0.3); color:var(--red); border-radius:var(--radius-sm); padding:10px 14px; font-size:13px; margin-bottom:16px; display:flex; align-items:center; gap:8px; }
  .auth-success { background:rgba(42,138,90,0.1); border:1px solid rgba(42,138,90,0.25); color:var(--green); border-radius:var(--radius-sm); padding:10px 14px; font-size:13px; margin-top:12px; display:flex; align-items:center; gap:8px; }
  .auth-footer { text-align:center; margin-top:20px; font-size:13px; color:var(--text3); }
  .auth-link { color:var(--accent); cursor:pointer; font-weight:600; }
  .input-with-icon { position:relative; display:flex; align-items:center; }
  .input-with-icon .form-input { padding-left:40px; width:100%; }
  .input-icon { position:absolute; left:13px; top:50%; transform:translateY(-50%); color:var(--text3); pointer-events:none; z-index:2; display:flex; }
  /* OTP boxes — prevent iOS zoom */
  .otp-box { font-size:22px !important; }
  @media (max-width:480px) { .otp-wrap { gap:6px; } .otp-box { width:40px; height:50px; } }

  /* OTP input */
  .otp-wrap { display:flex; gap:8px; justify-content:center; margin:20px 0; }
  .otp-box {
    width:46px; height:56px; text-align:center; font-size:22px; font-weight:800;
    font-family:'Courier New',monospace; border-radius:10px; outline:none;
    border:2px solid var(--border); background:var(--surface2); color:var(--accent);
    transition:border-color 0.15s,background 0.15s,transform 0.1s;
    caret-color:var(--accent);
  }
  .otp-box:focus { border-color:var(--accent); background:var(--accent-soft); transform:scale(1.05); }
  .otp-box.filled { border-color:var(--accent); background:var(--accent-soft); }

  /* OTP timer */
  .otp-timer { text-align:center; margin:8px 0; }
  .otp-timer-text { font-size:20px; font-weight:700; font-family:'Courier New',monospace; }
  .otp-timer-bar { height:3px; background:var(--surface3); border-radius:99px; margin-top:8px; overflow:hidden; }
  .otp-timer-fill { height:100%; border-radius:99px; transition:width 1s linear, background 0.3s; }
`;

// ─── Helper Components ────────────────────────
function Toast({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className="toast">
          <div className="toast-icon" style={{ background: t.type==="success"?"rgba(42,138,90,0.2)":t.type==="error"?"rgba(192,57,43,0.2)":"rgba(40,104,184,0.2)", color: t.type==="success"?"var(--green)":t.type==="error"?"var(--red)":"var(--blue)" }}>
            <Icon name={t.type==="success"?"check":t.type==="error"?"x":"bell"} size={14} />
          </div>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

function BookCover({ book, size = "card" }) {
  const color = genreColors[book.genre] || "#9a96a0";
  const initials = (book.title||"??").split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase();
  const fontSize = size === "card" ? 36 : size === "detail" ? 52 : 20;

  if (book.coverImage) {
    return (
      <div style={{ width:"100%", height:"100%", position:"relative" }}>
        <img
          src={book.coverImage}
          alt={book.title}
          style={{ width:"100%", height:"100%", objectFit:"cover" }}
          onError={e => {
            e.target.style.display = "none";
            e.target.nextSibling.style.display = "flex";
          }}
        />
        <div style={{ display:"none", background:`linear-gradient(135deg,${color}22,${color}11)`, width:"100%", height:"100%", position:"absolute", top:0, left:0, alignItems:"center", justifyContent:"center", fontFamily:"var(--font-display)", fontSize, fontWeight:900, color, letterSpacing:"-0.02em" }}>
          {initials}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background:`linear-gradient(135deg,${color}22,${color}11)`, width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--font-display)", fontSize, fontWeight:900, color, letterSpacing:"-0.02em" }}>
      {initials}
    </div>
  );
}

function AvailBadge({ book }) {
  const a = book.availableCopies ?? 0;
  if (a===0) return <span className="book-avail-badge badge-unavailable">Unavailable</span>;
  if (a<=2) return <span className="book-avail-badge badge-limited">Limited</span>;
  return <span className="book-avail-badge badge-available">Available</span>;
}

function InvBar({ book }) {
  const a = book.availableCopies ?? 0, t = book.totalCopies ?? 1;
  const pct = t>0 ? (a/t)*100 : 0;
  const color = a===0?"var(--red)":a<=2?"var(--orange)":"var(--green)";
  return (
    <div>
      <div className="inv-bar"><div className="inv-bar-fill" style={{ width:`${pct}%`, background:color }} /></div>
      <div style={{ fontSize:11, color:"var(--text3)", display:"flex", justifyContent:"space-between" }}>
        <span>{a} available</span><span>{t} total</span>
      </div>
    </div>
  );
}

function Spinner() {
  return <div className="loading-row"><Icon name="spinner" size={20}/><span>Loading…</span></div>;
}

// ─── Password Input with Eye Toggle ─────────
function PasswordInput({ value, onChange, onKeyDown, placeholder, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position:"relative", display:"flex", alignItems:"center" }}>
      <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", color:"var(--text3)", pointerEvents:"none", zIndex:1, display:"flex" }}>
        <Icon name="lock" size={15}/>
      </span>
      <input
        className="form-input"
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        autoComplete={autoComplete || "off"}
        style={{ paddingLeft:40, paddingRight:44 }}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        style={{
          position:"absolute", right:0, top:0, bottom:0,
          width:42, background:"transparent", border:"none",
          color:"var(--text3)", cursor:"pointer", display:"flex",
          alignItems:"center", justifyContent:"center",
          borderRadius:"0 var(--radius-sm) var(--radius-sm) 0",
          transition:"color 0.15s",
        }}
        onMouseEnter={e => e.currentTarget.style.color = "var(--text)"}
        onMouseLeave={e => e.currentTarget.style.color = "var(--text3)"}
        tabIndex={-1}
        title={show ? "Hide password" : "Show password"}
      >
        <Icon name={show ? "eye-off" : "eye"} size={16}/>
      </button>
    </div>
  );
}

// ─── Import Books Modal ───────────────────────
function ImportBooksModal({ token, onClose, onImported }) {
  const [step, setStep] = useState("pick"); // pick | preview | done
  const [rawContent, setRawContent] = useState("");
  const [fileType, setFileType] = useState("json");
  const [parsedBooks, setParsedBooks] = useState([]);
  const [parseError, setParseError] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [editIdx, setEditIdx] = useState(null);
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    setFileType(ext);
    const reader = new FileReader();
    reader.onload = ev => setRawContent(ev.target.result);
    reader.readAsText(file);
  };

  const handleParse = async () => {
    setParseError("");
    try {
      const data = await api("/books/parse-file", {
        method:"POST",
        body: JSON.stringify({ content: rawContent, fileType }),
      }, token);
      if (data.books.length === 0) {
        setParseError("No books found in this file. Check the format — title and author are required.");
        return;
      }
      setParsedBooks(data.books);
      setStep("preview");
    } catch (err) {
      setParseError(err.message);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const res = await api("/books/bulk", {
        method:"POST",
        body: JSON.stringify({ books: parsedBooks }),
      }, token);
      setResult(res);
      setStep("done");
      onImported();
    } catch (err) {
      setParseError(err.message);
    }
    setImporting(false);
  };

  const removeBook = (idx) => setParsedBooks(p => p.filter((_, i) => i !== idx));

  const updateBook = (idx, field, val) => {
    setParsedBooks(p => p.map((b, i) => i === idx ? { ...b, [field]: val } : b));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:640 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            {step === "pick" && "Import Books from File"}
            {step === "preview" && `Preview — ${parsedBooks.length} book(s) found`}
            {step === "done" && "Import Complete"}
          </div>
          <div className="modal-close" onClick={onClose}><Icon name="x" size={14}/></div>
        </div>
        <div className="modal-body">

          {/* ── Step 1: File picker ── */}
          {step === "pick" && (
            <>
              <p style={{ fontSize:13.5, color:"var(--text2)", marginBottom:20, lineHeight:1.6 }}>
                Upload a file containing book details. Supported formats: <strong>JSON, CSV, TXT, TSV, XML</strong>.<br/>
                The file should contain: <code style={{ background:"var(--surface3)", padding:"1px 6px", borderRadius:4, fontSize:12 }}>title</code>, <code style={{ background:"var(--surface3)", padding:"1px 6px", borderRadius:4, fontSize:12 }}>author</code>, <code style={{ background:"var(--surface3)", padding:"1px 6px", borderRadius:4, fontSize:12 }}>genre</code> (required) + optional isbn, year, description, copies.
              </p>

              <div
                style={{ border:"2px dashed var(--border)", borderRadius:"var(--radius)", padding:"32px", textAlign:"center", cursor:"pointer", transition:"border-color 0.2s", marginBottom:16 }}
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = "var(--accent)"; }}
                onDragLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; }}
                onDrop={e => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = "var(--border)";
                  const file = e.dataTransfer.files[0];
                  if (file) {
                    const ext = file.name.split(".").pop().toLowerCase();
                    setFileType(ext);
                    const reader = new FileReader();
                    reader.onload = ev => setRawContent(ev.target.result);
                    reader.readAsText(file);
                  }
                }}
              >
                <div style={{ color:"var(--text3)", marginBottom:8 }}><Icon name="upload" size={28}/></div>
                <div style={{ fontSize:14, fontWeight:600, color:"var(--text2)" }}>Click to choose file or drag & drop</div>
                <div style={{ fontSize:12, color:"var(--text3)", marginTop:4 }}>JSON · CSV · TXT · TSV · any text format</div>
                <input ref={fileRef} type="file" accept=".json,.csv,.txt,.tsv,.xml,.text" style={{ display:"none" }} onChange={handleFile}/>
              </div>

              {rawContent && (
                <div style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:"var(--radius-sm)", padding:12, marginBottom:16 }}>
                  <div style={{ fontSize:12, color:"var(--text3)", marginBottom:4 }}>File preview ({rawContent.length} chars):</div>
                  <pre style={{ fontSize:11, color:"var(--text2)", overflow:"auto", maxHeight:120, margin:0, fontFamily:"monospace", whiteSpace:"pre-wrap" }}>
                    {rawContent.slice(0, 400)}{rawContent.length > 400 ? "…" : ""}
                  </pre>
                </div>
              )}

              <div style={{ marginBottom:16 }}>
                <label className="form-label">Or paste content directly:</label>
                <textarea
                  className="form-input"
                  rows={5}
                  style={{ resize:"vertical", fontFamily:"monospace", fontSize:12 }}
                  placeholder={`[\n  {"title":"...","author":"...","genre":"Fiction",...}\n]`}
                  value={rawContent}
                  onChange={e => setRawContent(e.target.value)}
                />
              </div>

              {parseError && <div className="auth-err" style={{ marginBottom:12 }}><Icon name="alert" size={14}/>{parseError}</div>}

              <div className="form-actions" style={{ marginTop:8 }}>
                <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
                <button className="btn btn-primary" onClick={handleParse} disabled={!rawContent.trim()}>
                  <Icon name="search" size={14}/>Analyse File
                </button>
              </div>
            </>
          )}

          {/* ── Step 2: Preview & edit ── */}
          {step === "preview" && (
            <>
              <p style={{ fontSize:13, color:"var(--text2)", marginBottom:16 }}>
                Review the books below. Remove any you don't want, then click Import. Duplicates in the database are skipped automatically.
              </p>
              <div style={{ maxHeight:360, overflowY:"auto", border:"1px solid var(--border)", borderRadius:"var(--radius-sm)" }}>
                {parsedBooks.map((book, idx) => (
                  <div key={idx} style={{ padding:"10px 14px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:10 }}>
                    {editIdx === idx ? (
                      <div style={{ flex:1, display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                        {["title","author","genre","year","isbn","description"].map(field => (
                          <div key={field}>
                            <div style={{ fontSize:10, color:"var(--text3)", textTransform:"uppercase", marginBottom:2 }}>{field}</div>
                            <input className="form-input" style={{ padding:"4px 8px", fontSize:12 }}
                              value={book[field] || ""} onChange={e => updateBook(idx, field, e.target.value)}/>
                          </div>
                        ))}
                        <button className="btn btn-primary btn-sm" onClick={() => setEditIdx(null)}><Icon name="check" size={12}/>Done</button>
                      </div>
                    ) : (
                      <>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13.5, fontWeight:700, fontFamily:"var(--font-display)", color:"var(--text)" }}>{book.title}</div>
                          <div style={{ fontSize:12, color:"var(--text3)" }}>{book.author} · {book.genre}{book.year ? ` · ${book.year}` : ""}</div>
                          {book.isbn && <div style={{ fontSize:11, color:"var(--text3)" }}>ISBN: {book.isbn}</div>}
                        </div>
                        <span style={{ fontSize:11, color:"var(--text3)", background:"var(--surface3)", padding:"2px 8px", borderRadius:4 }}>{book.totalCopies || 3} copies</span>
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditIdx(idx)}><Icon name="eye" size={12}/></button>
                        <button className="btn btn-danger btn-sm" onClick={() => removeBook(idx)}><Icon name="x" size={12}/></button>
                      </>
                    )}
                  </div>
                ))}
              </div>
              {parsedBooks.length === 0 && (
                <div style={{ textAlign:"center", padding:24, color:"var(--text3)" }}>All books removed</div>
              )}
              {parseError && <div className="auth-err" style={{ marginTop:12 }}><Icon name="alert" size={14}/>{parseError}</div>}
              <div className="form-actions" style={{ marginTop:16 }}>
                <button className="btn btn-ghost" onClick={() => { setStep("pick"); setParseError(""); }}>← Back</button>
                <button className="btn btn-primary" onClick={handleImport} disabled={importing || parsedBooks.length === 0}>
                  {importing ? <><Icon name="spinner" size={14}/>Importing…</> : <><Icon name="plus" size={14}/>Import {parsedBooks.length} Book(s)</>}
                </button>
              </div>
            </>
          )}

          {/* ── Step 3: Done ── */}
          {step === "done" && result && (
            <>
              <div style={{ textAlign:"center", padding:"24px 0" }}>
                <div style={{ width:64, height:64, borderRadius:"50%", background:"rgba(42,138,90,0.15)", border:"2px solid var(--green)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", color:"var(--green)" }}>
                  <Icon name="check" size={28}/>
                </div>
                <div style={{ fontFamily:"var(--font-display)", fontSize:20, fontWeight:700, marginBottom:8 }}>Import complete!</div>
                <div style={{ fontSize:14, color:"var(--text2)" }}>{result.inserted} book(s) added to library</div>
                {result.skipped > 0 && <div style={{ fontSize:13, color:"var(--text3)", marginTop:4 }}>{result.skipped} skipped (already exist)</div>}
              </div>
              <button className="btn btn-primary" style={{ width:"100%", justifyContent:"center" }} onClick={onClose}>
                <Icon name="check" size={14}/>Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Fixed OTP Input Component ────────────────
// Uses useRef array so refs persist across renders
function OTPInput({ onComplete }) {
  const [digits, setDigits] = useState(["","","","","",""]);
  const inputRefs = useRef([]);

  // Ensure refs array is initialised
  if (inputRefs.current.length !== 6) {
    inputRefs.current = Array(6).fill(null);
  }

  const focusNext = (i) => {
    const next = inputRefs.current[i + 1];
    if (next) next.focus();
  };

  const focusPrev = (i) => {
    const prev = inputRefs.current[i - 1];
    if (prev) prev.focus();
  };

  const handleChange = (i, rawVal) => {
    // Accept only digits, take last character typed
    const digit = rawVal.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = digit;
    setDigits(next);

    if (digit) {
      focusNext(i);
      if (i === 5) {
        const full = next.join("");
        if (full.length === 6) onComplete && onComplete(full);
      }
    }
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace") {
      if (digits[i]) {
        // Clear current
        const next = [...digits];
        next[i] = "";
        setDigits(next);
      } else {
        // Move to previous
        focusPrev(i);
      }
    } else if (e.key === "ArrowLeft") {
      focusPrev(i);
    } else if (e.key === "ArrowRight") {
      focusNext(i);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = [...digits];
    pasted.split("").forEach((ch, i) => { if (i < 6) next[i] = ch; });
    setDigits(next);
    // Focus last filled or last box
    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();
    if (pasted.length === 6) onComplete && onComplete(pasted);
  };

  const handleFocus = (e) => e.target.select();

  // Expose reset via imperative — parent calls reset by changing a key
  return (
    <div className="otp-wrap">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => { inputRefs.current[i] = el; }}
          className={`otp-box${d ? " filled" : ""}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          autoComplete="one-time-code"
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={handleFocus}
        />
      ))}
    </div>
  );
}

// ─── OTP Timer ────────────────────────────────
function OTPTimer({ seconds, onExpire }) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    setLeft(seconds);
    const t = setInterval(() => {
      setLeft(p => {
        if (p <= 1) { clearInterval(t); onExpire && onExpire(); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [seconds]);
  const m = Math.floor(left / 60), s = left % 60;
  const pct = (left / seconds) * 100;
  const color = left < 60 ? "var(--red)" : left < 180 ? "var(--orange)" : "var(--green)";
  return (
    <div className="otp-timer">
      <div style={{ fontSize:12, color:"var(--text3)", marginBottom:6 }}>OTP expires in</div>
      <div className="otp-timer-text" style={{ color }}>{String(m).padStart(2,"0")}:{String(s).padStart(2,"0")}</div>
      <div className="otp-timer-bar">
        <div className="otp-timer-fill" style={{ width:`${pct}%`, background:color }} />
      </div>
    </div>
  );
}

// ─── Auth Page ────────────────────────────────
function AuthPage({ onLogin }) {
  const [view, setView] = useState("login");
  const [regStep, setRegStep] = useState("form");
  const [regRole, setRegRole] = useState("student");
  const [regForm, setRegForm] = useState({ name:"", email:"", phone:"", password:"", studentId:"", adminSecret:"" });
  const [regEmail, setRegEmail] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");
  const [regOtpExpired, setRegOtpExpired] = useState(false);
  const [regResending, setRegResending] = useState(false);
  const [regOtpKey, setRegOtpKey] = useState(0); // increment to reset OTPInput

  const [loginStep, setLoginStep] = useState("creds");
  const [loginForm, setLoginForm] = useState({ email:"", password:"" });
  const [loginEmail, setLoginEmail] = useState("");
  const [loginName, setLoginName] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginOtpExpired, setLoginOtpExpired] = useState(false);
  const [loginResending, setLoginResending] = useState(false);
  const [loginOtpKey, setLoginOtpKey] = useState(0);

  const setReg = (k, v) => setRegForm(p => ({ ...p, [k]: v }));
  const setLogin = (k, v) => setLoginForm(p => ({ ...p, [k]: v }));

  const switchView = (v) => {
    setView(v);
    setRegStep("form"); setRegError(""); setRegSuccess(""); setRegOtpExpired(false);
    setLoginStep("creds"); setLoginError(""); setLoginOtpExpired(false);
  };

  const handleRegSendOTP = async () => {
    setRegError(""); setRegLoading(true);
    try {
      const data = await api("/auth/register/send-otp", { method:"POST", body:JSON.stringify({ ...regForm, role:regRole }) });
      setRegEmail(data.email);
      setRegOtpExpired(false);
      setRegOtpKey(k => k + 1);
      setRegStep("otp");
      setRegSuccess(data.message);
    } catch (err) { setRegError(err.message); }
    setRegLoading(false);
  };

  const handleRegVerifyOTP = async (otp) => {
    if (!otp || otp.length < 6) { setRegError("Please enter all 6 digits"); return; }
    setRegError(""); setRegLoading(true);
    try {
      const data = await api("/auth/register/verify-otp", { method:"POST", body:JSON.stringify({ email:regEmail, otp }) });
      localStorage.setItem("lms_token", data.token);
      onLogin(data.user, data.token);
    } catch (err) { setRegError(err.message); setRegOtpKey(k => k + 1); }
    setRegLoading(false);
  };

  const handleRegResend = async () => {
    setRegResending(true); setRegError(""); setRegSuccess("");
    try {
      await api("/auth/register/resend-otp", { method:"POST", body:JSON.stringify({ email:regEmail }) });
      setRegOtpExpired(false); setRegOtpKey(k => k + 1);
      setRegSuccess("New OTP sent! Check your inbox.");
    } catch (err) { setRegError(err.message); }
    setRegResending(false);
  };

  const handleLoginSendOTP = async () => {
    setLoginError(""); setLoginLoading(true);
    try {
      const data = await api("/auth/login/send-otp", { method:"POST", body:JSON.stringify(loginForm) });
      setLoginEmail(data.email); setLoginName(data.name||"");
      setLoginOtpExpired(false); setLoginOtpKey(k => k + 1);
      setLoginStep("otp");
    } catch (err) { setLoginError(err.message); }
    setLoginLoading(false);
  };

  const handleLoginVerifyOTP = async (otp) => {
    if (!otp || otp.length < 6) { setLoginError("Please enter all 6 digits"); return; }
    setLoginError(""); setLoginLoading(true);
    try {
      const data = await api("/auth/login/verify-otp", { method:"POST", body:JSON.stringify({ email:loginEmail, otp }) });
      localStorage.setItem("lms_token", data.token);
      onLogin(data.user, data.token);
    } catch (err) { setLoginError(err.message); setLoginOtpKey(k => k + 1); }
    setLoginLoading(false);
  };

  const handleLoginResend = async () => {
    setLoginResending(true); setLoginError("");
    try {
      await api("/auth/login/resend-otp", { method:"POST", body:JSON.stringify({ email:loginEmail }) });
      setLoginOtpExpired(false); setLoginOtpKey(k => k + 1);
    } catch (err) { setLoginError(err.message); }
    setLoginResending(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-bg" />
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon"><Icon name="book" size={22} /></div>
          <div className="auth-logo-text">Libraria</div>
        </div>

        <div className="auth-tabs">
          <div className={`auth-tab${view==="login"?" active":""}`} onClick={() => switchView("login")}>Sign In</div>
          <div className={`auth-tab${view==="register"?" active":""}`} onClick={() => switchView("register")}>Register</div>
        </div>

        {/* ── REGISTER ── */}
        {view === "register" && regStep === "form" && (
          <>
            <div className="role-tabs">
              <div className={`role-tab${regRole==="student"?" active":""}`} onClick={() => setRegRole("student")}><Icon name="user" size={13}/> Student</div>
              <div className={`role-tab${regRole==="admin"?" active":""}`} onClick={() => setRegRole("admin")}><Icon name="shield" size={13}/> Admin</div>
            </div>
            {regError && <div className="auth-err"><Icon name="alert" size={15}/>{regError}</div>}
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div className="input-with-icon"><span className="input-icon"><Icon name="user" size={15}/></span>
                <input className="form-input" placeholder="Your full name" value={regForm.name} onChange={e => setReg("name", e.target.value)} autoComplete="name" />
              </div>
            </div>
            {regRole === "student" && (
              <div className="form-group">
                <label className="form-label">Student ID <span style={{ color:"var(--text3)", fontWeight:400 }}>(optional)</span></label>
                <div className="input-with-icon"><span className="input-icon"><Icon name="id" size={15}/></span>
                  <input className="form-input" placeholder="e.g. CS2024001" value={regForm.studentId} onChange={e => setReg("studentId", e.target.value)} autoComplete="off" />
                </div>
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <div className="input-with-icon"><span className="input-icon"><Icon name="phone" size={15}/></span>
                <input className="form-input" placeholder="10-digit number" value={regForm.phone} onChange={e => setReg("phone", e.target.value)} autoComplete="tel" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-with-icon"><span className="input-icon"><Icon name="mail" size={15}/></span>
                <input className="form-input" type="email" placeholder="your@email.com" value={regForm.email} onChange={e => setReg("email", e.target.value)} autoComplete="off" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <PasswordInput
                placeholder="Min. 6 characters"
                value={regForm.password}
                onChange={e => setReg("password", e.target.value)}
                onKeyDown={e => e.key==="Enter" && handleRegSendOTP()}
                autoComplete="new-password"
              />
            </div>
            {regRole === "admin" && (
              <div className="form-group">
                <label className="form-label">Admin Secret Code</label>
                <div className="input-with-icon"><span className="input-icon"><Icon name="shield" size={15}/></span>
                  <input className="form-input" type="password" placeholder="Ask your librarian" value={regForm.adminSecret} onChange={e => setReg("adminSecret", e.target.value)} autoComplete="off" />
                </div>
                <div style={{ fontSize:11, color:"var(--text3)", marginTop:4 }}>Default: ADMIN2024</div>
              </div>
            )}
            <button className="btn btn-primary" style={{ width:"100%", justifyContent:"center", padding:"12px", fontSize:14, marginTop:4 }} onClick={handleRegSendOTP} disabled={regLoading}>
              {regLoading ? <><Icon name="spinner" size={15}/>Sending OTP…</> : <><Icon name="mail" size={15}/>Send Verification OTP</>}
            </button>
            <div className="auth-footer">Already have an account? <span className="auth-link" onClick={() => switchView("login")}>Sign in</span></div>
          </>
        )}

        {view === "register" && regStep === "otp" && (
          <>
            <div style={{ textAlign:"center", marginBottom:4 }}>
              <div style={{ width:56, height:56, borderRadius:"50%", background:"var(--accent-soft)", border:"2px solid var(--accent)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px", color:"var(--accent)" }}>
                <Icon name="mail" size={24}/>
              </div>
              <div style={{ fontFamily:"var(--font-display)", fontSize:18, fontWeight:700 }}>Check your inbox</div>
              <div style={{ fontSize:13, color:"var(--text3)", marginTop:4 }}>
                6-digit OTP sent to<br/><strong style={{ color:"var(--accent)" }}>{regEmail}</strong>
              </div>
            </div>
            {regSuccess && <div className="auth-success"><Icon name="check" size={14}/>{regSuccess}</div>}
            {regError && <div className="auth-err"><Icon name="alert" size={15}/>{regError}</div>}

            <OTPInput key={regOtpKey} onComplete={handleRegVerifyOTP} />

            {!regOtpExpired
              ? <OTPTimer seconds={600} onExpire={() => setRegOtpExpired(true)} />
              : <div style={{ textAlign:"center", fontSize:13, color:"var(--red)", margin:"8px 0" }}>OTP expired. Please resend.</div>
            }

            <div style={{ display:"flex", gap:8, marginTop:12 }}>
              <button className="btn btn-ghost" style={{ flex:1, justifyContent:"center" }} onClick={() => { setRegStep("form"); setRegError(""); setRegSuccess(""); }}>
                ← Back
              </button>
              <button className="btn btn-ghost" style={{ flex:1, justifyContent:"center" }} onClick={handleRegResend} disabled={regResending}>
                {regResending ? <><Icon name="spinner" size={13}/>Sending…</> : <><Icon name="refresh" size={13}/>Resend OTP</>}
              </button>
            </div>
          </>
        )}

        {/* ── LOGIN ── */}
        {view === "login" && loginStep === "creds" && (
          <>
            {loginError && <div className="auth-err"><Icon name="alert" size={15}/>{loginError}</div>}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-with-icon"><span className="input-icon"><Icon name="mail" size={15}/></span>
                <input className="form-input" type="email" placeholder="your@email.com" value={loginForm.email} onChange={e => setLogin("email", e.target.value)} onKeyDown={e => e.key==="Enter" && handleLoginSendOTP()} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <PasswordInput
                placeholder="••••••••"
                value={loginForm.password}
                onChange={e => setLogin("password", e.target.value)}
                onKeyDown={e => e.key==="Enter" && handleLoginSendOTP()}
                autoComplete="current-password"
              />
            </div>
            <button className="btn btn-primary" style={{ width:"100%", justifyContent:"center", padding:"12px", fontSize:14, marginTop:4 }} onClick={handleLoginSendOTP} disabled={loginLoading}>
              {loginLoading ? <><Icon name="spinner" size={15}/>Sending OTP…</> : <><Icon name="arrow" size={15}/>Continue with OTP</>}
            </button>
            <div className="auth-footer">New here? <span className="auth-link" onClick={() => switchView("register")}>Create account</span></div>
          </>
        )}

        {view === "login" && loginStep === "otp" && (
          <>
            <div style={{ textAlign:"center", marginBottom:4 }}>
              <div style={{ width:56, height:56, borderRadius:"50%", background:"rgba(40,104,184,0.12)", border:"2px solid var(--blue)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px", color:"var(--blue)" }}>
                <Icon name="lock" size={24}/>
              </div>
              <div style={{ fontFamily:"var(--font-display)", fontSize:18, fontWeight:700 }}>Enter login OTP</div>
              <div style={{ fontSize:13, color:"var(--text3)", marginTop:4 }}>
                {loginName && <span>Hi <strong style={{ color:"var(--text)" }}>{loginName}</strong>! </span>}
                OTP sent to<br/><strong style={{ color:"var(--blue)" }}>{loginEmail}</strong>
              </div>
            </div>
            {loginError && <div className="auth-err"><Icon name="alert" size={15}/>{loginError}</div>}

            <OTPInput key={loginOtpKey} onComplete={handleLoginVerifyOTP} />

            {!loginOtpExpired
              ? <OTPTimer seconds={600} onExpire={() => setLoginOtpExpired(true)} />
              : <div style={{ textAlign:"center", fontSize:13, color:"var(--red)", margin:"8px 0" }}>OTP expired. Please resend.</div>
            }

            <div style={{ display:"flex", gap:8, marginTop:12 }}>
              <button className="btn btn-ghost" style={{ flex:1, justifyContent:"center" }} onClick={() => { setLoginStep("creds"); setLoginError(""); }}>
                ← Back
              </button>
              <button className="btn btn-ghost" style={{ flex:1, justifyContent:"center" }} onClick={handleLoginResend} disabled={loginResending}>
                {loginResending ? <><Icon name="spinner" size={13}/>Sending…</> : <><Icon name="refresh" size={13}/>Resend OTP</>}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Dashboard (Admin) ────────────────────────
function DashboardPage({ token }) {
  const [stats, setStats] = useState(null);
  const [txs, setTxs] = useState([]);
  const [books, setBooks] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [st, t, b] = await Promise.all([
          api("/users/stats/overview", {}, token),
          api("/transactions", {}, token),
          api("/books", {}, token),
        ]);
        setStats(st); setTxs(t); setBooks(b);
      } catch {}
    };
    load();
  }, [token]);

  if (!stats) return <Spinner />;

  const genreCounts = books.reduce((acc, b) => { acc[b.genre] = (acc[b.genre]||0)+(b.totalCopies||0); return acc; }, {});
  const genreEntries = Object.entries(genreCounts);
  const maxGenre = Math.max(...genreEntries.map(e => e[1]), 1);
  const totalBooks = books.reduce((s, b) => s+(b.totalCopies||0), 0);
  const totalAvail = books.reduce((s, b) => s+(b.availableCopies||0), 0);
  const recentTx = txs.slice(0, 6);

  return (
    <div>
      <div className="stats-grid">
        {[
          { icon:"book", label:"Total Books", val:totalBooks, color:"var(--blue)", bg:"rgba(40,104,184,0.15)", trend:`${books.length} titles` },
          { icon:"arrow", label:"Borrowed", val:stats.totalActive, color:"var(--accent)", bg:"var(--accent-soft)", trend:"Active loans" },
          { icon:"clock", label:"Overdue", val:stats.totalOverdue, color:"var(--red)", bg:"rgba(192,57,43,0.15)", trend:stats.totalOverdue>0?"Needs attention":"All clear" },
          { icon:"money", label:"Unpaid Fines (₹)", val:stats.unpaidFines, color:"var(--orange)", bg:"rgba(192,104,32,0.15)", trend:`₹${stats.totalFines} total` },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon" style={{ background:s.bg, color:s.color }}><Icon name={s.icon} size={20}/></div>
            <div className="stat-val">{s.val}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-trend" style={{ color:s.color }}>{s.trend}</div>
          </div>
        ))}
      </div>
      <div className="chart-row">
        <div className="chart-card">
          <div className="chart-title">Books by Genre</div>
          <div className="bar-chart">
            {genreEntries.map(([genre, count]) => (
              <div key={genre} className="bar-col">
                <div className="bar-fill" style={{ height:`${(count/maxGenre)*80}px`, background:genreColors[genre]||"var(--accent)" }} />
                <div className="bar-label">{genre.slice(0,5)}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-title">Inventory Status</div>
          <div className="donut-wrap">
            <svg width="100" height="100" viewBox="0 0 100 100">
              {(() => {
                const borr = totalBooks - totalAvail, res = stats.totalReserved, avail = totalAvail;
                const segs = [{ val:avail, color:"var(--green)" },{ val:borr, color:"var(--accent)" },{ val:res, color:"var(--purple)" }];
                let offset = 0;
                return segs.map((seg, i) => {
                  const pct = totalBooks>0 ? (seg.val/totalBooks)*100 : 0;
                  offset += pct;
                  return <circle key={i} cx="50" cy="50" r="15.9" fill="none" stroke={seg.color} strokeWidth="8" strokeDasharray={`${pct} ${100-pct}`} strokeDashoffset={-(offset-pct)+25} className="progress-ring" style={{ transform:"rotate(-90deg)", transformOrigin:"50px 50px" }} />;
                });
              })()}
              <text x="50" y="54" textAnchor="middle" fill="var(--text)" fontSize="13" fontFamily="var(--font-display)" fontWeight="700">{totalBooks}</text>
            </svg>
            <div className="donut-legend">
              {[["Available","var(--green)"],["Borrowed","var(--accent)"],["Reserved","var(--purple)"]].map(([l,c]) => (
                <div key={l} className="legend-item"><div className="legend-dot" style={{ background:c }}/>{l}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div style={{ marginTop:24 }}>
        <div className="section-header"><div className="section-title">Recent Activity</div></div>
        <div className="table-wrap">
          {recentTx.length===0
            ? <div className="empty-state" style={{ padding:"30px" }}>No activity yet</div>
            : recentTx.map(tx => (
              <div key={tx._id} className="tx-row">
                <div className="tx-icon" style={{ background:tx.type==="borrow"?"var(--accent-soft)":"rgba(112,64,192,0.15)", color:tx.type==="borrow"?"var(--accent)":"var(--purple)" }}>
                  <Icon name={tx.type==="borrow"?"arrow":"bookmark"} size={16}/>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13.5, fontWeight:600 }}>{tx.user?.name}</div>
                  <div style={{ fontSize:12, color:"var(--text3)" }}>{tx.type==="borrow"?"borrowed":"reserved"} · {tx.book?.title}</div>
                </div>
                <div style={{ fontSize:12, color:"var(--text3)" }}>{new Date(tx.createdAt).toLocaleDateString()}</div>
                {tx.isOverdue && <span className="overdue-flag">Overdue</span>}
                {tx.currentFine>0 && <span className="tag tag-red">₹{tx.currentFine} fine</span>}
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

// ─── Books Page ───────────────────────────────


function BooksPage({ token, user }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("All");
  const [view, setView] = useState("grid");
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [myTxs, setMyTxs] = useState([]);
  const [addForm, setAddForm] = useState({ title:"", author:"", genre:"Fiction", isbn:"", year:"", description:"", totalCopies:1, coverImage:"" });
  const [submitting, setSubmitting] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [b, t] = await Promise.all([api("/books",{},token), api("/transactions",{},token)]);
      setBooks(b); setMyTxs(t);
    } catch {}
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const genres = ["All", ...Array.from(new Set(books.map(b => b.genre)))];
  const filtered = books.filter(b => {
    const ms = !search || b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase());
    const mg = genre==="All" || b.genre===genre;
    return ms && mg;
  });

  const isBorrowed = (book) => myTxs.some(t => t.book?._id===book._id && t.type==="borrow" && (t.status==="active"||t.status==="overdue"));
  const isReserved = (book) => myTxs.some(t => t.book?._id===book._id && t.type==="reserve" && t.status==="reserved");
  const getBorrowTx = (book) => myTxs.find(t => t.book?._id===book._id && t.type==="borrow" && (t.status==="active"||t.status==="overdue"));

  const handleBorrow = async (book) => {
    try { await api("/transactions/borrow",{method:"POST",body:JSON.stringify({bookId:book._id})},token); await load(); setSelected(null); }
    catch (err) { alert(err.message); }
  };
  const handleReserve = async (book) => {
    try { await api("/transactions/reserve",{method:"POST",body:JSON.stringify({bookId:book._id})},token); await load(); setSelected(null); }
    catch (err) { alert(err.message); }
  };
  const handleReturn = async (book) => {
    const tx = getBorrowTx(book); if (!tx) return;
    try {
      const res = await api(`/transactions/${tx._id}/return`,{method:"PUT"},token);
      if (res.fineAmount>0) alert(`Book returned! Fine: ₹${res.fineAmount}. Please pay at the library.`);
      await load(); setSelected(null);
    } catch (err) { alert(err.message); }
  };
  const handleDelete = async (book) => {
    if (!window.confirm(`Remove "${book.title}"?`)) return;
    try { await api(`/books/${book._id}`,{method:"DELETE"},token); await load(); setSelected(null); }
    catch (err) { alert(err.message); }
  };
  const handleAddBook = async () => {
    setSubmitting(true);
    try {
      await api("/books",{method:"POST",body:JSON.stringify({...addForm,totalCopies:+addForm.totalCopies,year:+addForm.year||undefined})},token);
      await load(); setShowAdd(false); setAddForm({title:"",author:"",genre:"Fiction",isbn:"",year:"",description:"",totalCopies:1,coverImage:""});
    } catch (err) { alert(err.message); }
    setSubmitting(false);
  };
  const setAdd = (k, v) => setAddForm(p => ({ ...p, [k]:v }));


  if (loading) return <Spinner />;

  return (
    <div>
      <div className="filter-row">
        <div className="search-wrap">
          <span className="search-icon"><Icon name="search" size={15}/></span>
          <input className="search-input" placeholder="Search books, authors…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {genres.map(g => <button key={g} className={`filter-chip${genre===g?" active":""}`} onClick={() => setGenre(g)}>{g}</button>)}
        <div className="view-toggle">
          <button className={`view-btn${view==="grid"?" active":""}`} onClick={() => setView("grid")}><Icon name="grid" size={14}/></button>
          <button className={`view-btn${view==="list"?" active":""}`} onClick={() => setView("list")}><Icon name="list" size={14}/></button>
        </div>
        {user.role==="admin" && (
          <>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}><Icon name="plus" size={14}/>Add Book</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowImport(true)}>
              <Icon name="upload" size={14}/>Import Books
            </button>
          </>
        )}
      </div>



      {filtered.length===0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Icon name="book" size={28}/></div>
          <div className="empty-state-title">No books found</div>
          <div style={{ fontSize:13 }}>
            {books.length === 0 && user.role === "admin"
              ? <span>Click <strong>"Import Books"</strong> above to upload a file and add books</span>
              : "Try adjusting your search or filters"}
          </div>
        </div>
      ) : view==="grid" ? (
        <div className="books-grid">
          {filtered.map(book => (
            <div key={book._id} className="book-card" onClick={() => setSelected(book)}>
              <div className="book-cover"><BookCover book={book}/><AvailBadge book={book}/></div>
              <div className="book-info">
                <div className="book-title">{book.title}</div>
                <div className="book-author">{book.author}</div>
                <span className="book-genre">{book.genre}</span>
                {user.role==="student" && (
                  <div className="book-actions" onClick={e => e.stopPropagation()}>
                    {isBorrowed(book)
                      ? <button className="btn btn-secondary btn-sm" style={{ flex:1 }} onClick={() => handleReturn(book)}><Icon name="refresh" size={12}/>Return</button>
                      : <>
                          <button className="btn btn-primary btn-sm" style={{ flex:1 }} onClick={() => handleBorrow(book)} disabled={book.availableCopies===0}><Icon name="arrow" size={12}/>Borrow</button>
                          {book.availableCopies===0 && !isReserved(book) && <button className="btn btn-ghost btn-sm" onClick={() => handleReserve(book)}><Icon name="bookmark" size={12}/></button>}
                        </>
                    }
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="books-list">
          {filtered.map(book => (
            <div key={book._id} className="book-list-item" onClick={() => setSelected(book)}>
              <div className="book-list-cover"><BookCover book={book}/></div>
              <div className="book-list-info">
                <div className="book-list-title">{book.title}</div>
                <div className="book-list-meta"><span>{book.author}</span><span>{book.genre}</span><span>{book.year}</span></div>
                <InvBar book={book}/>
              </div>
              {user.role==="student" && (
                <div onClick={e => e.stopPropagation()}>
                  {isBorrowed(book)
                    ? <button className="btn btn-secondary btn-sm" onClick={() => handleReturn(book)}><Icon name="refresh" size={12}/>Return</button>
                    : <button className="btn btn-primary btn-sm" onClick={() => handleBorrow(book)} disabled={book.availableCopies===0}><Icon name="arrow" size={12}/>Borrow</button>
                  }
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><div className="modal-title">{selected.title}</div><div className="modal-close" onClick={() => setSelected(null)}><Icon name="x" size={14}/></div></div>
            <div className="modal-body">
              <div className="book-detail-cover"><BookCover book={selected}/></div>
              <p style={{ fontSize:13.5, color:"var(--text2)", marginBottom:16, lineHeight:1.6 }}>{selected.description||"No description available."}</p>
              {[["Author",selected.author],["Genre",selected.genre],["Year",selected.year||"—"],["ISBN",selected.isbn||"—"]].map(([l,v]) => (
                <div key={l} className="detail-row"><span className="detail-label">{l}</span><span className="detail-val">{v}</span></div>
              ))}
              <div style={{ marginTop:16 }}><InvBar book={selected}/></div>
              <div style={{ display:"flex", gap:8, marginTop:20 }}>
                {user.role==="student" && (isBorrowed(selected)
                  ? <button className="btn btn-secondary" style={{ flex:1 }} onClick={() => handleReturn(selected)}><Icon name="refresh" size={14}/>Return Book</button>
                  : <><button className="btn btn-primary" style={{ flex:1 }} onClick={() => handleBorrow(selected)} disabled={selected.availableCopies===0}><Icon name="arrow" size={14}/>Borrow</button>
                     {selected.availableCopies===0 && <button className="btn btn-ghost" onClick={() => handleReserve(selected)} disabled={isReserved(selected)}><Icon name="bookmark" size={14}/>Reserve</button>}</>
                )}
                {user.role==="admin" && <button className="btn btn-danger" onClick={() => handleDelete(selected)}><Icon name="trash" size={14}/>Remove</button>}
              </div>
            </div>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><div className="modal-title">Add New Book</div><div className="modal-close" onClick={() => setShowAdd(false)}><Icon name="x" size={14}/></div></div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group"><label className="form-label">Title *</label><input className="form-input" placeholder="Book title" value={addForm.title} onChange={e => setAdd("title",e.target.value)}/></div>
                <div className="form-group"><label className="form-label">Author *</label><input className="form-input" placeholder="Author name" value={addForm.author} onChange={e => setAdd("author",e.target.value)}/></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Genre *</label>
                  <select className="form-input" value={addForm.genre} onChange={e => setAdd("genre",e.target.value)}>
                    {Object.keys(genreColors).map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Year</label><input className="form-input" type="number" placeholder="e.g. 2023" value={addForm.year} onChange={e => setAdd("year",e.target.value)}/></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">ISBN</label><input className="form-input" placeholder="ISBN" value={addForm.isbn} onChange={e => setAdd("isbn",e.target.value)}/></div>
                <div className="form-group"><label className="form-label">Total Copies *</label><input className="form-input" type="number" min="1" value={addForm.totalCopies} onChange={e => setAdd("totalCopies",e.target.value)}/></div>
              </div>
              <div className="form-group"><label className="form-label">Description</label><textarea className="form-input" rows={3} style={{ resize:"vertical" }} placeholder="Short description" value={addForm.description} onChange={e => setAdd("description",e.target.value)}/></div>
              <div className="form-group">
                <label className="form-label">Cover Image <span style={{ color:"var(--text3)", fontWeight:400, textTransform:"none" }}>(URL or leave blank)</span></label>
                <div style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                  <input className="form-input" placeholder="https://... or paste image URL" value={addForm.coverImage} onChange={e => setAdd("coverImage",e.target.value)} style={{ flex:1 }}/>
                  {addForm.coverImage && (
                    <img src={addForm.coverImage} alt="preview" style={{ width:48, height:64, objectFit:"cover", borderRadius:4, border:"1px solid var(--border)", flexShrink:0 }}
                      onError={e => e.target.style.display="none"}/>
                  )}
                </div>
                <div style={{ fontSize:11, color:"var(--text3)", marginTop:4 }}>
                  Tip: Search "{addForm.title || "book name"}" on Google Images → right-click → Copy image address
                </div>
              </div>
              <div className="form-actions">
                <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleAddBook} disabled={!addForm.title||!addForm.author||submitting}>{submitting?<Icon name="spinner" size={14}/>:<Icon name="plus" size={14}/>}Add Book</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showImport && (
        <ImportBooksModal
          token={token}
          onClose={() => setShowImport(false)}
          onImported={() => { load(); setShowImport(false); }}
        />
      )}
    </div>
  );
}

// ─── My Books (Student) ───────────────────────
function MyBooksPage({ token }) {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { setLoading(true); try { setTxs(await api("/transactions",{},token)); } catch {} setLoading(false); }, [token]);
  useEffect(() => { load(); }, [load]);

  const handleReturn = async (tx) => {
    try { const r = await api(`/transactions/${tx._id}/return`,{method:"PUT"},token); if (r.fineAmount>0) alert(`Fine: ₹${r.fineAmount}. Pay at the library.`); await load(); }
    catch (err) { alert(err.message); }
  };
  const handleCancelReserve = async (tx) => {
    try { await api(`/transactions/${tx._id}/cancel-reserve`,{method:"PUT"},token); await load(); }
    catch (err) { alert(err.message); }
  };

  if (loading) return <Spinner />;
  const borrowed = txs.filter(t => t.type==="borrow"&&(t.status==="active"||t.status==="overdue"));
  const reserved = txs.filter(t => t.type==="reserve"&&t.status==="reserved");
  const totalFine = borrowed.reduce((s,t) => s+(t.currentFine||0), 0);

  return (
    <div>
      {totalFine>0 && (
        <div className="fine-banner">
          <div style={{ width:36,height:36,borderRadius:10,background:"rgba(192,57,43,0.2)",color:"var(--red)",display:"flex",alignItems:"center",justifyContent:"center" }}><Icon name="alert" size={18}/></div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:600,color:"var(--red)" }}>Outstanding Fine: ₹{totalFine}</div>
            <div style={{ fontSize:12,color:"var(--text3)" }}>Pay at the library counter to borrow more books.</div>
          </div>
        </div>
      )}
      {[{ title:"Borrowed Books", items:borrowed, type:"borrow" },{ title:"Reserved Books", items:reserved, type:"reserve" }].map(({ title,items,type }) => (
        <div key={type} style={{ marginBottom:28 }}>
          <div className="section-header">
            <div className="section-title">{title} <span style={{ fontSize:14,color:"var(--text3)",fontFamily:"var(--font-body)" }}>({items.length})</span></div>
          </div>
          {items.length===0
            ? <div className="empty-state" style={{ padding:"30px 20px" }}><div className="empty-state-icon"><Icon name={type==="borrow"?"book":"bookmark"} size={22}/></div><div className="empty-state-title" style={{ fontSize:15 }}>No {type==="borrow"?"borrowed":"reserved"} books</div></div>
            : <div className="table-wrap">
                {items.map(tx => (
                  <div key={tx._id} className="tx-row">
                    <div className="tx-icon" style={{ background:tx.isOverdue?"rgba(192,57,43,0.15)":type==="borrow"?"var(--accent-soft)":"rgba(112,64,192,0.15)", color:tx.isOverdue?"var(--red)":type==="borrow"?"var(--accent)":"var(--purple)" }}>
                      <Icon name={tx.isOverdue?"alert":type==="borrow"?"book":"bookmark"} size={15}/>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14,fontWeight:700,fontFamily:"var(--font-display)" }}>{tx.book?.title}</div>
                      <div style={{ fontSize:12,color:"var(--text3)" }}>{tx.book?.author} · {tx.book?.genre}</div>
                    </div>
                    <div style={{ textAlign:"right",marginRight:12 }}>
                      {type==="borrow"
                        ? <><div style={{ fontSize:12,color:"var(--text3)" }}>Due: <span style={{ color:tx.isOverdue?"var(--red)":"var(--text2)",fontWeight:600 }}>{tx.dueDate?new Date(tx.dueDate).toLocaleDateString():"—"}</span></div>
                           {tx.isOverdue&&<div style={{ fontSize:11,color:"var(--red)" }}>{tx.overdueDays}d · ₹{tx.currentFine}</div>}</>
                        : <div style={{ fontSize:12,color:"var(--text3)" }}>Reserved {new Date(tx.createdAt).toLocaleDateString()}</div>
                      }
                    </div>
                    <button className={`btn btn-sm ${type==="borrow"?"btn-primary":"btn-danger"}`} onClick={() => type==="borrow"?handleReturn(tx):handleCancelReserve(tx)}>
                      <Icon name={type==="borrow"?"refresh":"x"} size={12}/>{type==="borrow"?"Return":"Cancel"}
                    </button>
                  </div>
                ))}
              </div>
          }
        </div>
      ))}
    </div>
  );
}

// ─── Transactions Page ────────────────────────
function TransactionsPage({ token, user }) {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const load = useCallback(async () => { setLoading(true); try { setTxs(await api("/transactions",{},token)); } catch {} setLoading(false); }, [token]);
  useEffect(() => { load(); }, [load]);

  const handleReturn = async (tx) => {
    try { const r = await api(`/transactions/${tx._id}/return`,{method:"PUT"},token); if(r.fineAmount>0) alert(`Fine: ₹${r.fineAmount}`); await load(); }
    catch (err) { alert(err.message); }
  };
  const handlePayFine = async (tx) => {
    try { await api(`/transactions/${tx._id}/pay-fine`,{method:"PUT"},token); await load(); }
    catch (err) { alert(err.message); }
  };

  if (loading) return <Spinner />;
  const displayed = txs.filter(t => {
    if (filter==="all") return true;
    if (filter==="overdue") return t.isOverdue;
    if (filter==="fines") return t.fineAmount>0;
    if (filter==="returned") return t.status==="returned";
    return t.type===filter||t.status===filter;
  });

  return (
    <div>
      <div className="filter-row">
        {["all","borrow","reserve","overdue","fines","returned"].map(f => (
          <button key={f} className={`filter-chip${filter===f?" active":""}`} onClick={() => setFilter(f)}>{f.charAt(0).toUpperCase()+f.slice(1)}</button>
        ))}
        <div style={{ marginLeft:"auto",fontSize:12,color:"var(--text3)" }}>{displayed.length} records</div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Type</th><th>Book</th>{user.role==="admin"&&<th>Student</th>}<th>Borrow Date</th><th>Due Date</th><th>Status</th><th>Fine</th><th></th></tr></thead>
          <tbody>
            {displayed.length===0
              ? <tr><td colSpan={8} style={{ textAlign:"center",padding:"40px",color:"var(--text3)" }}>No transactions found</td></tr>
              : displayed.map(tx => (
                <tr key={tx._id}>
                  <td>
                    <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                      <div style={{ width:28,height:28,borderRadius:7,background:tx.type==="borrow"?"var(--accent-soft)":"rgba(112,64,192,0.15)",color:tx.type==="borrow"?"var(--accent)":"var(--purple)",display:"flex",alignItems:"center",justifyContent:"center" }}>
                        <Icon name={tx.type==="borrow"?"arrow":"bookmark"} size={13}/>
                      </div>
                      <span style={{ fontSize:12,textTransform:"capitalize",fontWeight:600 }}>{tx.type}</span>
                    </div>
                  </td>
                  <td><div style={{ fontWeight:600 }}>{tx.book?.title}</div><div style={{ fontSize:11,color:"var(--text3)" }}>{tx.book?.author}</div></td>
                  {user.role==="admin"&&<td><div style={{ fontWeight:500 }}>{tx.user?.name}</div><div style={{ fontSize:11,color:"var(--text3)" }}>{tx.user?.email}</div></td>}
                  <td style={{ color:"var(--text3)",fontSize:13 }}>{tx.borrowDate?new Date(tx.borrowDate).toLocaleDateString():"—"}</td>
                  <td style={{ fontSize:13,color:tx.isOverdue?"var(--red)":"var(--text2)" }}>{tx.dueDate?new Date(tx.dueDate).toLocaleDateString():"—"}</td>
                  <td>
                    {tx.status==="returned"?<span className="tag tag-green"><Icon name="check" size={10}/>Returned</ span>
                      :tx.isOverdue?<span className="tag tag-red">Overdue {tx.overdueDays}d</span>
                      :tx.type==="borrow"?<span className="tag tag-gold">Active</span>
                      :tx.status==="reserved"?<span className="tag tag-blue">Reserved</span>
                      :<span className="tag tag-purple">{tx.status}</span>}
                  </td>
                  <td>
                    {(tx.fineAmount>0||tx.currentFine>0)
                      ? <div><div style={{ color:"var(--red)",fontWeight:600,fontSize:13 }}>₹{tx.currentFine||tx.fineAmount}</div>{tx.finePaid?<span className="tag tag-green" style={{ fontSize:10 }}>Paid</span>:<span className="tag tag-red" style={{ fontSize:10 }}>Unpaid</span>}</div>
                      : <span style={{ color:"var(--text3)",fontSize:12 }}>—</span>}
                  </td>
                  <td>
                    <div style={{ display:"flex",gap:4 }}>
                      {tx.status!=="returned"&&tx.type==="borrow"&&<button className="btn btn-secondary btn-sm" onClick={() => handleReturn(tx)}><Icon name="refresh" size={12}/>Return</button>}
                      {user.role==="admin"&&tx.fineAmount>0&&!tx.finePaid&&<button className="btn btn-green btn-sm" onClick={() => handlePayFine(tx)}><Icon name="check" size={12}/>Pay</button>}
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Members Page (Admin) ─────────────────────
function MembersPage({ token }) {
  const [users, setUsers] = useState([]);
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try { const [u,t] = await Promise.all([api("/users",{},token),api("/transactions",{},token)]); setUsers(u); setTxs(t); }
      catch {} setLoading(false);
    };
    load();
  }, [token]);

  if (loading) return <Spinner />;
  const filtered = users.filter(u => !search||u.name.toLowerCase().includes(search.toLowerCase())||u.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="filter-row">
        <div className="search-wrap"><span className="search-icon"><Icon name="search" size={15}/></span>
          <input className="search-input" placeholder="Search members…" value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <div style={{ marginLeft:"auto",fontSize:12,color:"var(--text3)" }}>{filtered.length} members</div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Member</th><th>Student ID</th><th>Phone</th><th>Borrowed</th><th>Fine</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {filtered.map(u => {
              const userTxs = txs.filter(t => t.user?._id===u._id||t.user===u._id);
              const activeBorrow = userTxs.filter(t => t.type==="borrow"&&(t.status==="active"||t.status==="overdue")).length;
              const hasOverdue = userTxs.some(t => t.isOverdue);
              const totalFine = userTxs.reduce((s,t) => s+(t.fineAmount||0), 0);
              return (
                <tr key={u._id}>
                  <td>
                    <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                      <div className="user-avatar" style={{ width:32,height:32,fontSize:11 }}>{u.name.split(" ").map(n=>n[0]).join("")}</div>
                      <div><div style={{ fontWeight:600 }}>{u.name}</div><div style={{ fontSize:11,color:"var(--text3)" }}>{u.email}</div></div>
                    </div>
                  </td>
                  <td style={{ color:"var(--text3)",fontSize:12 }}>{u.studentId||"—"}</td>
                  <td style={{ color:"var(--text3)",fontSize:12 }}>{u.phone}</td>
                  <td><span className="tag tag-gold">{activeBorrow}</span></td>
                  <td>{totalFine>0?<span className="tag tag-red">₹{totalFine}</span>:<span style={{ color:"var(--text3)",fontSize:12 }}>—</span>}</td>
                  <td>{hasOverdue?<span className="tag tag-red">Overdue</span>:<span className="tag tag-green">Active</span>}</td>
                  <td><button className="btn btn-ghost btn-sm" onClick={() => setSelected(u)}><Icon name="eye" size={12}/>View</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><div className="modal-title">{selected.name}</div><div className="modal-close" onClick={() => setSelected(null)}><Icon name="x" size={14}/></div></div>
            <div className="modal-body">
              <div style={{ background:"var(--surface2)",borderRadius:"var(--radius-sm)",padding:16,marginBottom:20,display:"flex",gap:14,alignItems:"center" }}>
                <div className="user-avatar" style={{ width:48,height:48,fontSize:18 }}>{selected.name.split(" ").map(n=>n[0]).join("")}</div>
                <div>
                  <div style={{ fontFamily:"var(--font-display)",fontSize:17,fontWeight:700 }}>{selected.name}</div>
                  <div style={{ fontSize:12,color:"var(--text3)",marginTop:2 }}>{selected.email}</div>
                  <div style={{ fontSize:12,color:"var(--text3)" }}>{selected.phone}</div>
                </div>
              </div>
              {[["Student ID",selected.studentId||"—"],["Joined",new Date(selected.createdAt).toLocaleDateString()],["Total Fine",`₹${selected.totalFine||0}`]].map(([l,v]) => (
                <div key={l} className="detail-row"><span className="detail-label">{l}</span><span className="detail-val">{v}</span></div>
              ))}
              <div style={{ marginTop:16,fontFamily:"var(--font-display)",fontSize:15,fontWeight:700,marginBottom:10 }}>Active Transactions</div>
              {txs.filter(t => (t.user?._id===selected._id||t.user===selected._id)&&t.status!=="returned"&&t.status!=="cancelled").map(tx => (
                <div key={tx._id} className="detail-row">
                  <div><div style={{ fontSize:13,fontWeight:600 }}>{tx.book?.title}</div><div style={{ fontSize:11,color:"var(--text3)" }}>{tx.type} · Due: {tx.dueDate?new Date(tx.dueDate).toLocaleDateString():"—"}</div></div>
                  <div style={{ display:"flex",gap:6,alignItems:"center" }}>
                    {tx.isOverdue&&<span className="tag tag-red">₹{tx.currentFine}</span>}
                    <span className={`tag ${tx.isOverdue?"tag-red":tx.type==="borrow"?"tag-gold":"tag-blue"}`}>{tx.isOverdue?"Overdue":tx.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Inventory Page (Admin) ───────────────────
function InventoryPage({ token }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState(null);
  const [editVal, setEditVal] = useState({});
  const load = useCallback(async () => { setLoading(true); try { setBooks(await api("/books",{},token)); } catch {} setLoading(false); }, [token]);
  useEffect(() => { load(); }, [load]);

  const handleSave = async (book) => {
    try {
      await api(`/books/${book._id}`,{method:"PUT",body:JSON.stringify({totalCopies:+editVal.totalCopies,availableCopies:Math.min(+editVal.totalCopies,Math.max(0,+editVal.availableCopies))})},token);
      await load(); setEditId(null);
    } catch (err) { alert(err.message); }
  };

  if (loading) return <Spinner />;
  const filtered = books.filter(b => !search||b.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="filter-row">
        <div className="search-wrap"><span className="search-icon"><Icon name="search" size={15}/></span>
          <input className="search-input" placeholder="Search inventory…" value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <div style={{ marginLeft:"auto",fontSize:12,color:"var(--text3)" }}>
          {books.reduce((s,b)=>s+(b.totalCopies||0),0)} total · {books.reduce((s,b)=>s+(b.availableCopies||0),0)} available
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Book</th><th>Genre</th><th>Total</th><th>Available</th><th>Borrowed</th><th>Availability</th><th></th></tr></thead>
          <tbody>
            {filtered.map(book => (
              <tr key={book._id}>
                <td><div style={{ fontWeight:600,fontFamily:"var(--font-display)" }}>{book.title}</div><div style={{ fontSize:12,color:"var(--text3)" }}>{book.author}</div></td>
                <td><span className="tag" style={{ background:`${genreColors[book.genre]||"#9a96a0"}22`,color:genreColors[book.genre]||"#9a96a0" }}>{book.genre}</span></td>
                <td>{editId===book._id?<input className="form-input" type="number" style={{ width:70,padding:"4px 8px",fontSize:13 }} value={editVal.totalCopies} onChange={e=>setEditVal(p=>({...p,totalCopies:e.target.value}))}/>:book.totalCopies}</td>
                <td>{editId===book._id?<input className="form-input" type="number" style={{ width:70,padding:"4px 8px",fontSize:13 }} value={editVal.availableCopies} onChange={e=>setEditVal(p=>({...p,availableCopies:e.target.value}))}/>:<span style={{ color:book.availableCopies===0?"var(--red)":book.availableCopies<=2?"var(--orange)":"var(--green)",fontWeight:600 }}>{book.availableCopies}</span>}</td>
                <td style={{ color:"var(--accent)" }}>{(book.totalCopies||0)-(book.availableCopies||0)}</td>
                <td style={{ minWidth:120 }}><InvBar book={book}/></td>
                <td>{editId===book._id
                  ?<div style={{ display:"flex",gap:6 }}><button className="btn btn-primary btn-sm" onClick={() => handleSave(book)}><Icon name="check" size={12}/></button><button className="btn btn-ghost btn-sm" onClick={() => setEditId(null)}><Icon name="x" size={12}/></button></div>
                  :<button className="btn btn-ghost btn-sm" onClick={() => { setEditId(book._id); setEditVal({totalCopies:book.totalCopies,availableCopies:book.availableCopies}); }}>Edit</button>
                }</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [page, setPage] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("lms_theme");
    return saved ? saved === "dark" : true; // default dark
  });

  const toggleTheme = () => {
    setIsDark(d => {
      const next = !d;
      localStorage.setItem("lms_theme", next ? "dark" : "light");
      return next;
    });
  };

  useEffect(() => {
    const savedToken = localStorage.getItem("lms_token");
    if (savedToken) {
      api("/auth/me", {}, savedToken)
        .then(data => { setUser(data.user); setToken(savedToken); })
        .catch(() => localStorage.removeItem("lms_token"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) setPage(user.role === "admin" ? "dashboard" : "books");
  }, [user]);

  const handleLogin = (u, t) => { setUser(u); setToken(t); };
  const handleLogout = () => { localStorage.removeItem("lms_token"); setUser(null); setToken(null); setPage(null); };

  const addToast = (message, type = "success") => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3200);
  };

  const styles = getStyles(isDark);

  if (loading) return (
    <>
      <style>{styles}</style>
      <div style={{ minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--bg)",color:"var(--text3)",gap:12 }}>
        <Icon name="spinner" size={24}/><span style={{ fontSize:16 }}>Loading Libraria…</span>
      </div>
    </>
  );

  if (!user) return (
    <>
      <style>{styles}</style>
      <AuthPage onLogin={handleLogin} />
      {/* Theme toggle on auth page */}
      <button onClick={toggleTheme} style={{ position:"fixed",top:16,right:16,width:40,height:40,borderRadius:"50%",background:"var(--surface)",border:"1px solid var(--border)",color:"var(--text2)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all 0.2s",zIndex:10 }}>
        <Icon name={isDark?"sun":"moon"} size={17}/>
      </button>
    </>
  );

  const adminNav = [
    { id:"dashboard", label:"Dashboard", icon:"bar" },
    { id:"books", label:"Book Catalogue", icon:"book" },
    { id:"inventory", label:"Inventory", icon:"grid" },
    { id:"members", label:"Members", icon:"user" },
    { id:"transactions", label:"Transactions", icon:"list" },
  ];
  const studentNav = [
    { id:"books", label:"Browse Books", icon:"book" },
    { id:"mybooks", label:"My Books", icon:"bookmark" },
    { id:"transactions", label:"My History", icon:"list" },
  ];
  const nav = user.role === "admin" ? adminNav : studentNav;
  const titles = {
    dashboard:"Dashboard", books:user.role==="admin"?"Book Catalogue":"Browse Books",
    inventory:"Inventory", members:"Members",
    transactions:user.role==="admin"?"All Transactions":"My History", mybooks:"My Books",
  };

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        {/* Sidebar */}
        <div className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-icon"><Icon name="book" size={18}/></div>
            <div><div className="logo-text">Libraria</div><div className="logo-sub">Management System</div></div>
          </div>

          <nav className="sidebar-nav">
            <div className="nav-section">Navigation</div>
            {nav.map(item => (
              <div key={item.id} className={`nav-item${page===item.id?" active":""}`} onClick={() => setPage(item.id)}>
                <Icon name={item.icon} size={16}/>{item.label}
              </div>
            ))}
          </nav>

          {/* Role badge */}
          <div style={{ padding:"12px 16px", borderTop:"1px solid var(--border)" }}>
            <div style={{ fontSize:11,color:"var(--text3)",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:600 }}>Signed in as</div>
            <div style={{ fontSize:12,color:"var(--accent)",fontWeight:600,padding:"5px 8px",background:"var(--accent-soft)",borderRadius:6,display:"flex",alignItems:"center",gap:6 }}>
              <Icon name={user.role==="admin"?"shield":"user"} size={12}/>
              {user.role==="admin"?"Administrator":"Student"}
            </div>
          </div>

          {/* Theme Toggle */}
          <div className="theme-toggle-wrap">
            <div className="theme-toggle-label">Appearance</div>
            <div className="theme-toggle">
              <div className={`theme-btn${isDark?" active":""}`} onClick={() => !isDark && toggleTheme()}>
                <Icon name="moon" size={12}/> Dark
              </div>
              <div className={`theme-btn${!isDark?" active":""}`} onClick={() => isDark && toggleTheme()}>
                <Icon name="sun" size={12}/> Light
              </div>
            </div>
          </div>

          {/* User / Logout */}
          <div className="sidebar-user" onClick={handleLogout}>
            <div className="user-avatar">{user.name.split(" ").map(n=>n[0]).join("").slice(0,2)}</div>
            <div style={{ flex:1,minWidth:0 }}>
              <div className="user-name" style={{ overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{user.name}</div>
              <div className="user-role">Click to logout</div>
            </div>
            <div style={{ color:"var(--text3)" }}><Icon name="logout" size={15}/></div>
          </div>
        </div>

        {/* Main */}
        <div className="main">
          <div className="topbar">
            <div className="topbar-title">{titles[page]||"Libraria"}</div>
            <div className="topbar-actions">
              {/* Theme toggle button in topbar */}
              <button onClick={toggleTheme} className="icon-btn" title={isDark?"Switch to Light Mode":"Switch to Dark Mode"}>
                <Icon name={isDark?"sun":"moon"} size={15}/>
              </button>
              <div className="icon-btn" style={{ background:"var(--accent-soft)",borderColor:"rgba(184,134,11,0.25)",color:"var(--accent)" }}>
                <Icon name={user.role==="admin"?"shield":"user"} size={15}/>
              </div>
            </div>
          </div>

          <div className="content" key={page}>
            {page==="dashboard"&&user.role==="admin"&&<DashboardPage token={token}/>}
            {page==="books"&&<BooksPage token={token} user={user}/>}
            {page==="mybooks"&&user.role==="student"&&<MyBooksPage token={token}/>}
            {page==="inventory"&&user.role==="admin"&&<InventoryPage token={token}/>}
            {page==="members"&&user.role==="admin"&&<MembersPage token={token}/>}
            {page==="transactions"&&<TransactionsPage token={token} user={user}/>}
          </div>
        </div>
      </div>
      <Toast toasts={toasts}/>
    </>
  );
}

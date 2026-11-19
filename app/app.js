// Leonida Trophy Guide: checklist, filters, spoiler mode, roadmap and export/import.
// Progress lives in localStorage under one key; nothing is sent anywhere.
const STORE_KEY = 'leonida-trophy-progress-v1';
const listEl = document.getElementById('trophyList');
const detailEl = document.getElementById('detail');
const searchBox = document.getElementById('searchBox');
const kindFilter = document.getElementById('kindFilter');
const gradeFilter = document.getElementById('gradeFilter');
const hideEarnedBox = document.getElementById('hideEarned');
const spoilerBox = document.getElementById('spoilerToggle');

// The trophy data is a JSON module imported by the page, so the guide loads
// the same way from a static server and from a file:// URL in desktop Chrome
// (fetch() of a local file is blocked on file://, an import is not).
import trophyDoc from './data/trophies.json' with { type: 'json' };
const doc = trophyDoc;
const trophies = doc.trophies;
const roadmap = doc.roadmap ?? [];
const sourceIndex = new Map((doc.sources ?? []).map((s) => [s.name, s]));

let earned = new Set(readEarned());
let selectedId = null;

function readEarned() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) ?? '[]');
    return Array.isArray(raw) ? raw.filter((n) => typeof n === 'string') : [];
  } catch {
    return [];
  }
}

function saveEarned() {
  localStorage.setItem(STORE_KEY, JSON.stringify([...earned].sort()));
}

function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

function isSpoilerHidden(trophy) {
  return spoilerBox.checked && trophy.kind === 'story' && !earned.has(trophy.name);
}

function visibleTrophies() {
  const q = searchBox.value.trim().toLowerCase();
  return trophies.filter((t) => {
    if (kindFilter.value === 'missable' && !t.missable) return false;
    if (kindFilter.value === 'online') return false; // no online trophies exist
    if (kindFilter.value !== 'all' && kindFilter.value !== 'missable' && t.kind !== kindFilter.value) return false;
    if (gradeFilter.value !== 'all' && t.grade !== gradeFilter.value) return false;
    if (hideEarnedBox.checked && earned.has(t.name)) return false;
    if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))) return false;
    return true;
  });
}

function renderProgress() {
  const done = earned.size;
  const total = trophies.length;
  document.getElementById('earnedCount').textContent = done;
  document.getElementById('totalCount').textContent = total;
  document.getElementById('progressFill').style.width = `${Math.round((done / total) * 100)}%`;
  const byGrade = {};
  for (const t of trophies) {
    if (!earned.has(t.name)) continue;
    byGrade[t.grade] = (byGrade[t.grade] ?? 0) + 1;
  }
  const totals = {};
  for (const t of trophies) totals[t.grade] = (totals[t.grade] ?? 0) + 1;
  document.getElementById('gradeCounts').textContent =
    ['platinum', 'gold', 'silver', 'bronze'].map((g) => `${byGrade[g] ?? 0}/${totals[g]} ${g}`).join(' · ');
  document.getElementById('progressNote').textContent =
    done === total
      ? 'Platinum earned — Vice Got a Price! is yours. Leonida Legend.'
      : done === 0
        ? 'Start with the story: Gone Fishing, then Chapter 1. Meditate at Lucia’s balcony spot in Chapter 1 — it is the one missable trophy.'
        : `${total - done} to go. Next up: finish the story, then the stranger strands.`;
}

function renderList() {
  const shown = visibleTrophies();
  listEl.replaceChildren();
  const note = document.getElementById('filterNote');
  if (kindFilter.value === 'online') {
    note.textContent = 'Online: 0 trophies. All 55 are single-player — there is nothing online to earn (KeenGamer).';
  } else if (shown.length === 0) {
    note.textContent = 'No trophies match these filters.';
  } else {
    note.textContent = `Showing ${shown.length} of ${trophies.length} trophies.`;
  }
  for (const t of shown) {
    const li = document.createElement('li');
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'trophy-card' + (earned.has(t.name) ? ' earned' : '') + (selectedId === t.id ? ' selected' : '');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.name);
    box.setAttribute('aria-label', `Mark ${t.name} earned`);
    box.addEventListener('click', (event) => event.stopPropagation());
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.name);
      else earned.delete(t.name);
      saveEarned();
      renderProgress();
      renderList();
      renderDetail();
      renderRoadmap();
    });
    const body = document.createElement('span');
    const name = document.createElement('span');
    name.className = 'trophy-name';
    name.textContent = isSpoilerHidden(t) ? 'Hidden story trophy' : t.name;
    const desc = document.createElement('span');
    desc.className = 'trophy-desc';
    desc.textContent = isSpoilerHidden(t) ? 'Spoiler hidden until earned — turn off “Hide story spoilers” to reveal it.' : t.description;
    const flags = document.createElement('span');
    flags.className = 'trophy-flags';
    const gradePill = document.createElement('span');
    gradePill.className = `pill ${t.grade}`;
    gradePill.textContent = gradeLabel(t.grade);
    flags.append(gradePill);
    const kindPill = document.createElement('span');
    kindPill.className = 'pill kind';
    kindPill.textContent = t.kind;
    flags.append(kindPill);
    if (t.missable) {
      const m = document.createElement('span');
      m.className = 'pill missable';
      m.textContent = 'Missable';
      flags.append(m);
    }
    if (t.hidden) {
      const h = document.createElement('span');
      h.className = 'pill hidden';
      h.textContent = 'Hidden on PS';
      flags.append(h);
    }
    body.append(name, document.createElement('br'), desc, flags);
    const earnedTag = document.createElement('span');
    earnedTag.className = 'pill';
    earnedTag.textContent = earned.has(t.name) ? '✓ Earned' : 'Not earned';
    card.append(box, body, earnedTag);
    card.addEventListener('click', () => {
      selectedId = t.id;
      renderList();
      renderDetail();
      detailEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    li.append(card);
    listEl.append(li);
  }
}

function renderDetail() {
  const t = trophies.find((x) => x.id === selectedId);
  if (!t) {
    detailEl.innerHTML = '<p class="detail-empty">Select a trophy to read its guide and sources.</p>';
    return;
  }
  detailEl.replaceChildren();
  const title = document.createElement('h2');
  title.textContent = isSpoilerHidden(t) ? 'Hidden story trophy' : t.name;
  const official = document.createElement('p');
  official.className = 'official';
  official.textContent = isSpoilerHidden(t)
    ? 'Official name and description hidden until earned.'
    : `Official: “${t.description}” — ${gradeLabel(t.grade)}`;
  detailEl.append(title, official);
  if (t.missable && t.missable_note) {
    const warn = document.createElement('p');
    warn.className = 'missable-note';
    warn.textContent = t.missable_note;
    detailEl.append(warn);
  }
  const guideHeading = document.createElement('h3');
  guideHeading.textContent = 'Guide';
  const guide = document.createElement('div');
  guide.className = 'guide-text';
  const para = document.createElement('p');
  para.textContent = t.guide;
  guide.append(para);
  detailEl.append(guideHeading, guide);
  const srcHeading = document.createElement('h3');
  srcHeading.textContent = 'Sources';
  const srcList = document.createElement('ul');
  for (const name of t.sources ?? []) {
    const li = document.createElement('li');
    const known = sourceIndex.get(name);
    if (known?.url) {
      const a = document.createElement('a');
      a.href = known.url;
      a.textContent = name;
      a.rel = 'noreferrer';
      li.append(a);
    } else {
      li.textContent = name;
    }
    srcList.append(li);
  }
  detailEl.append(srcHeading, srcList);
  const state = document.createElement('p');
  state.textContent = earned.has(t.name) ? 'Status: earned ✓' : 'Status: not earned yet.';
  detailEl.append(state);
}

function renderRoadmap() {
  const list = document.getElementById('roadmapList');
  list.replaceChildren();
  for (const stage of roadmap) {
    const li = document.createElement('li');
    const title = document.createElement('h3');
    title.textContent = stage.title;
    const text = document.createElement('p');
    text.textContent = stage.text;
    const doneCount = stage.trophies.filter((id) => {
      const t = trophies.find((x) => x.id === id);
      return t && earned.has(t.name);
    }).length;
    const meta = document.createElement('p');
    meta.className = 'stage-trophies';
    const doneSpan = document.createElement('span');
    doneSpan.className = 'stage-done';
    doneSpan.textContent = `${doneCount}/${stage.trophies.length} earned in this stage. `;
    const names = document.createElement('span');
    names.textContent = stage.trophies.map((id) => trophies.find((x) => x.id === id)?.name ?? '').join(' · ');
    meta.append(doneSpan, names);
    li.append(title, text, meta);
    list.append(li);
  }
}

function renderSources() {
  const host = document.getElementById('sourceList');
  const ul = document.createElement('ul');
  for (const s of doc.sources ?? []) {
    const li = document.createElement('li');
    const strong = document.createElement('strong');
    strong.textContent = s.name;
    li.append(strong);
    if (s.url) {
      li.append(document.createElement('br'));
      const a = document.createElement('a');
      a.href = s.url;
      a.textContent = s.url;
      a.rel = 'noreferrer';
      li.append(a);
    }
    if (s.note) {
      li.append(document.createElement('br'));
      li.append(document.createTextNode(s.note));
    }
    ul.append(li);
  }
  host.replaceChildren(ul);
}

function switchView(name) {
  for (const button of document.querySelectorAll('.tab')) {
    const active = button.dataset.view === name;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
    document.getElementById(`view-${button.dataset.view}`).hidden = !active;
  }
}

for (const button of document.querySelectorAll('.tab')) {
  button.addEventListener('click', () => switchView(button.dataset.view));
}
searchBox.addEventListener('input', renderList);
kindFilter.addEventListener('change', renderList);
gradeFilter.addEventListener('change', renderList);
hideEarnedBox.addEventListener('change', renderList);
spoilerBox.addEventListener('change', () => { renderList(); renderDetail(); });

document.getElementById('exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ app: 'leonida-trophy-guide', earned: [...earned].sort() }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});

document.getElementById('importFile').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const names = Array.isArray(data) ? data : data.earned;
    if (!Array.isArray(names)) throw new Error('bad file');
    const known = new Set(trophies.map((t) => t.name));
    earned = new Set(names.filter((n) => known.has(n)));
    saveEarned();
    renderProgress();
    renderList();
    renderDetail();
    renderRoadmap();
  } catch {
    alert('That file is not a trophy-progress export from this guide.');
  }
  event.target.value = '';
});

document.getElementById('resetBtn').addEventListener('click', () => {
  if (!confirm('Clear all earned ticks?')) return;
  earned = new Set();
  saveEarned();
  renderProgress();
  renderList();
  renderDetail();
  renderRoadmap();
});

renderProgress();
renderList();
renderDetail();
renderRoadmap();
renderSources();

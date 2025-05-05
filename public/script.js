const socket = new WebSocket('ws://localhost:8081');
const container = document.getElementById('mementos');
const sourceFilter = document.getElementById('sourceFilter');
const startDate = document.getElementById('startDate');
const endDate = document.getElementById('endDate');

let allMementos = [];
let isLive = true;

socket.onopen = () => {
  console.log('✅ Connected to WebSocket server');
};

socket.onmessage = async (event) => {
  if (!isLive) return;

  const raw = await event.data.text();
  const data = JSON.parse(raw);
  const mementos = Array.isArray(data) ? data : [data];

  mementos.forEach(m => {
    allMementos.push(m);
    addToSourceFilter(m.source);
  });

  renderMementos();
};

function addToSourceFilter(source) {
  if (!source) return;
  if (![...sourceFilter.options].some(opt => opt.value === source)) {
    const option = document.createElement('option');
    option.value = source;
    option.text = source;
    sourceFilter.appendChild(option);
  }
}

function renderMementos() {
  container.innerHTML = '';
  const selectedSource = sourceFilter.value;
  const start = new Date(startDate.value);
  const end = new Date(endDate.value);

  const filtered = allMementos.filter(m => {
    const mDate = new Date(m.datetime);
    const matchesSource = selectedSource === 'all' || m.source === selectedSource;
    const inRange = (!startDate.value || mDate >= start) &&
                    (!endDate.value || mDate <= end);
    return matchesSource && inRange;
  });

  filtered.reverse().forEach(addMementoToUI);
}

function addMementoToUI(m) {
  const div = document.createElement('div');
  div.className = 'memento';
  div.innerHTML = `
    <div class="datetime">${m.datetime}</div>
    <div><a href="${m.uri}" target="_blank">${m.uri}</a></div>
    <div class="source">Source: ${m.source || 'unknown'}</div>
  `;
  container.appendChild(div);
}

sourceFilter.addEventListener('change', renderMementos);
startDate.addEventListener('change', renderMementos);
endDate.addEventListener('change', renderMementos);

function downloadMementos() {
  const blob = new Blob([JSON.stringify(allMementos, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = "mementos.json";
  a.click();
  URL.revokeObjectURL(url);
}

function toggleLive() {
  isLive = !isLive;
  document.getElementById("toggleBtn").innerText = isLive ? "⏸ Pause" : "▶️ Resume";
}

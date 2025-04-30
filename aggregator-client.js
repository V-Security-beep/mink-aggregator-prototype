const WebSocket = require('ws');
const fetch = require('node-fetch');

const testUrl = "https://cnn.com";
const TIMEOUT_MS = 4000;
const timemapIndexUrl = `http://timetravel.mementoweb.org/timemap/json/${testUrl}`;


const ws = new WebSocket('ws://localhost:8081');


ws.on('message', (data) => {
  const mementos = JSON.parse(data);
  console.log(' Received mementos from another Mink client:');
  console.dir(mementos.slice(0, 3), { depth: null });
});

function parseLinkFormatTimemap(text, sourceName) {
  const mementos = [];
  const lines = text.split('\n');

  for (let line of lines) {
    line = line.trim();
    if (line.includes('rel="memento"')) {
      const uriMatch = line.match(/<([^>]+)>/);
      const datetimeMatch = line.match(/datetime="([^"]+)"/);
      if (uriMatch && datetimeMatch) {
        mementos.push({
          uri: uriMatch[1],
          datetime: datetimeMatch[1],
          source: sourceName
        });
      }
    }
  }

  return mementos;
}

async function fetchWithTimeout(url, archiveName) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    const data = await response.text();
    clearTimeout(timeout);
    return parseLinkFormatTimemap(data, archiveName);
  } catch (error) {
    clearTimeout(timeout);
    console.log(` ${archiveName} failed:`, error.message);
    return [];
  }
}

async function runAggregator() {
  console.log(` Fetching TimeMap index for ${testUrl}`);
  const raw = await fetch(timemapIndexUrl);
  const data = await raw.json();
  const timemapList = data.timemap_index || [];

  let allMementos = [];

  for (const entry of timemapList) {
    const { uri, archive_id } = entry;
    const mementos = await fetchWithTimeout(uri, archive_id);
    console.log(` ${archive_id}: ${mementos.length} mementos`);
    allMementos.push(...mementos);
  }

  console.log(` Sending ${allMementos.length} mementos to WebSocket server`);
  ws.send(JSON.stringify(allMementos));
}

ws.on('open', () => {
  console.log(' Connected to WebSocket server!');
  runAggregator();
});

const fetch = require('node-fetch');
const testUrl = "https://cnn.com";
const TIMEOUT_MS = 4000;


const timemapIndexUrl = `http://web.archive.org/web/timemap/json/${testUrl}`;

async function fetchWithTimeout(url, name) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    const data = await response.text();
    clearTimeout(timeout);
    return data;
  } catch (error) {
    console.log(` ${name} failed: ${error.message}`);
    clearTimeout(timeout);
    return null;
  }
}

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

async function runAggregator() {
  console.log(` Fetching TimeMap index from Internet Archive for: ${testUrl}`);
  const jsonRaw = await fetchWithTimeout(timemapIndexUrl, "IA TimeMap Index");
  if (!jsonRaw) return;

  const data = JSON.parse(jsonRaw);
  const timemapList = data.timemap_index || [];

  let allMementos = [];

  for (const entry of timemapList) {
    const { uri, archive_id } = entry;
    console.log(` Fetching detailed TimeMap from ${archive_id}...`);
    const raw = await fetchWithTimeout(uri, archive_id);
    if (raw) {
      const mementos = parseLinkFormatTimemap(raw, archive_id);
      console.log(` Found ${mementos.length} mementos from ${archive_id}`);
      allMementos.push(...mementos);
    }
  }

  console.log("\n FINAL RESULT (first 5 mementos):");
  console.dir(allMementos.slice(0, 5), { depth: null });

  // Optional: save to file (uncomment if needed)
  const fs = require('fs');
  fs.writeFileSync("results.json", JSON.stringify(allMementos, null, 2));
}

runAggregator();
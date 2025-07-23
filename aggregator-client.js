const WebSocket = require('ws');
const fetch = require('node-fetch');

const testUrl = "https://cnn.com";
const TIMEOUT_MS = 10000; // Increased timeout
const timemapIndexUrl = `http://web.archive.org/web/timemap/json/${testUrl}`;

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

// Enhanced fetch with better error handling
async function fetchWithTimeout(url, archiveName) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  
  try {
    console.log(`  Fetching from ${archiveName}: ${url}`);
    const response = await fetch(url, { 
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MinkAggregator/1.0)',
        'Accept': 'application/json, text/plain, */*'
      }
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.text();
    console.log(`  ${archiveName} returned ${data.length} characters`);
    return parseLinkFormatTimemap(data, archiveName);
    
  } catch (error) {
    clearTimeout(timeout);
    if (error.name === 'AbortError') {
      console.log(`  ${archiveName} timed out after ${TIMEOUT_MS}ms`);
    } else {
      console.log(`  ${archiveName} failed: ${error.message}`);
    }
    return [];
  }
}

// Enhanced fetch for initial timemap index with better error handling
async function fetchTimemapIndex(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  
  try {
    console.log(`Fetching TimeMap index: ${url}`);
    const response = await fetch(url, { 
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MinkAggregator/1.0)',
        'Accept': 'application/json, text/plain, */*'
      }
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type') || '';
    console.log(`Response Content-Type: ${contentType}`);
    console.log(`Response Status: ${response.status}`);
    
    // Get raw text first to debug
    const rawText = await response.text();
    console.log(`Raw response length: ${rawText.length} characters`);
    console.log(`First 300 chars: ${rawText.substring(0, 300)}`);
    console.log(`Last 100 chars: ${rawText.substring(Math.max(0, rawText.length - 100))}`);
    
    // Try to parse as JSON
    if (rawText.trim().length === 0) {
      console.log('Empty response received');
      return null;
    }
    
    try {
      const data = JSON.parse(rawText);
      console.log(`Successfully parsed JSON. Keys:`, Object.keys(data));
      return data;
    } catch (jsonError) {
      console.log(`JSON parse failed: ${jsonError.message}`);
      console.log('Treating as text/link format response');
      return { text_response: rawText };
    }
    
  } catch (error) {
    clearTimeout(timeout);
    if (error.name === 'AbortError') {
      console.error(`TimeMap index fetch timed out after ${TIMEOUT_MS}ms`);
    } else {
      console.error(`TimeMap index fetch failed: ${error.message}`);
    }
    return null;
  }
}

// Alternative function to try CDX API directly
async function fetchViaCDX(url) {
  const cdxUrl = `http://web.archive.org/cdx/search/cdx?url=${url}&output=json&limit=50`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  
  try {
    console.log(`Trying CDX API: ${cdxUrl}`);
    const response = await fetch(cdxUrl, { 
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MinkAggregator/1.0)',
        'Accept': 'application/json'
      }
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`CDX API returned ${data.length} results`);
    
    if (data.length <= 1) {
      console.log('No results from CDX API');
      return [];
    }
    
    // CDX format: [urlkey, timestamp, original, mimetype, statuscode, digest, length]
    // Skip header row
    const mementos = data.slice(1).map(row => ({
      uri: `http://web.archive.org/web/${row[1]}/${row[2]}`,
      datetime: row[1],
      source: 'web.archive.org'
    }));
    
    console.log(`Converted to ${mementos.length} mementos`);
    return mementos;
    
  } catch (error) {
    clearTimeout(timeout);
    console.error(`CDX API failed: ${error.message}`);
    return [];
  }
}

async function runAggregator() {
  console.log(` Fetching TimeMap index for ${testUrl}`);
  
  // Try the direct CDX API first (more reliable)
  console.log('\n=== Trying CDX API first ===');
  let allMementos = await fetchViaCDX(testUrl);
  
  if (allMementos.length === 0) {
    console.log('\n=== CDX failed, trying TimeMap JSON API ===');
    const data = await fetchTimemapIndex(timemapIndexUrl);
    
    if (!data) {
      console.error('Both CDX and TimeMap APIs failed');
      return;
    }

    // Check if we got a JSON response with timemap_index
    if (data.timemap_index && Array.isArray(data.timemap_index)) {
      console.log(`Found ${data.timemap_index.length} timemap entries`);
      
      for (const entry of data.timemap_index) {
        const { uri, archive_id } = entry;
        console.log(`Processing ${archive_id}...`);
        const mementos = await fetchWithTimeout(uri, archive_id);
        console.log(` ${archive_id}: ${mementos.length} mementos`);
        allMementos.push(...mementos);
      }
    } 
    // Check if we got direct memento data
    else if (data.mementos && data.mementos.list) {
      console.log(`Direct memento list found with ${data.mementos.list.length} entries`);
      allMementos = data.mementos.list.map(memento => ({
        uri: memento.uri,
        datetime: memento.datetime,
        source: 'web.archive.org'
      }));
    }
    // Check if we got a text response (link format)
    else if (data.text_response) {
      console.log('Processing link format response...');
      allMementos = parseLinkFormatTimemap(data.text_response, 'web.archive.org');
    }
    else {
      console.log('Unexpected response format:', Object.keys(data));
    }
  }

  console.log(` Total collected: ${allMementos.length} mementos`);
  
  if (allMementos.length > 0) {
    console.log('\n=== Sample mementos ===');
    console.dir(allMementos.slice(0, 3), { depth: null });
    
    console.log(`\n Sending ${allMementos.length} mementos to WebSocket server`);
    ws.send(JSON.stringify(allMementos));
  } else {
    console.log('\n No mementos found from any source!');
    
    // Let's try one more alternative - the link format API
    console.log('\n=== Trying link format API as last resort ===');
    const linkUrl = `http://web.archive.org/web/timemap/link/${testUrl}`;
    try {
      const response = await fetch(linkUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MinkAggregator/1.0)' }
      });
      if (response.ok) {
        const linkText = await response.text();
        console.log(`Link format response: ${linkText.length} characters`);
        const linkMementos = parseLinkFormatTimemap(linkText, 'web.archive.org');
        if (linkMementos.length > 0) {
          console.log(`Found ${linkMementos.length} mementos via link format!`);
          ws.send(JSON.stringify(linkMementos));
        }
      }
    } catch (linkError) {
      console.error('Link format API also failed:', linkError.message);
    }
  }
}

ws.on('open', () => {
  console.log(' Connected to WebSocket server!');
  runAggregator().catch(error => {
    console.error('Aggregator failed:', error);
  });
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});

ws.on('close', () => {
  console.log('WebSocket connection closed');
});
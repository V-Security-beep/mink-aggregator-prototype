# mink-aggregator-prototype


This repository contains a research prototype that fulfills two key goals as outlined by the supervising professor:

1. Client-side aggregator functionality (MemGator-inspired)  
2. Mink-to-Mink communication via WebSockets

The implementation is designed in Node.js to first explore and demonstrate core functionality before adapting it into the browser-based Mink Chrome extension.



# Background

[Mink](https://github.com/machawk1/Mink) is a Chrome extension that uses the [Memento protocol (RFC 7089)](https://tools.ietf.org/html/rfc7089) to access archived web pages. This prototype explores how to enhance Mink by:

- Fetching mementos directly from multiple web archives client-side
- Allowing communication between Mink instances to share mementos collaboratively

---

# Project Structure

The prototype consists of a few key files, each serving a specific role in fulfilling the research objectives. 
The aggregator-client.js script is the primary client-side component that performs multiple tasks: it queries various Memento-compliant web archives for TimeMaps, parses the link-format responses to extract memento data (such as URI, datetime, and archive source), and broadcasts the aggregated results to other clients using WebSockets.
The server.js file establishes a WebSocket server that acts as a relay  it accepts connections from multiple clients and ensures that memento data shared by one client is broadcast to all others in real time. 
The package.json file contains the project's configuration, including dependencies like node-fetch for making HTTP requests and ws for WebSocket communication. 
Additionally, the script can optionally save the retrieved memento data into a file named results.json, which serves as a local snapshot of the aggregated results during a single run.
---

# Goal 1: Client-Side Aggregator

# Features
- Fetches TimeMaps from **multiple Memento-compliant archives**
- Handles **timeouts** 
- Parses **link-format TimeMaps**
- Extracts and normalizes:
  - Archived URI (`uri`)
  - Capture datetime (`datetime`)
  - Source archive (`source`)
- Logs and optionally saves results as JSON

# Archives Queried
- Internet Archive
- Archive-It
- Archive.is
- Arquivo.pt
- YorkU Web Archive
- NRS
- WARP
- Others via `timemap_index`

---

#  Goal 2: Mink-to-Mink Communication

### Features
- Establishes a **WebSocket server** using Node.js
- Allows multiple `aggregator-client` instances to:
  - Broadcast fetched mementos
  - Receive and display mementos sent by other instances
- Simulates future **client-to-client sharing** in a live Mink environment

### Demo Flow
1. Run `server.js` to start the relay server
2. Run `aggregator-client.js` in two terminals
3. Each client fetches and sends its mementos to the server
4. Each client receives and logs the other's results

---

## How to Run

### 1. Clone and Install
```bash
git clone https://github.com/V-Security-beep/mink-aggregator-prototype.git
cd mink-aggregator-prototype
npm install

### Start WebSocket Server
node server.js

### In Two Separate Terminals, Run Clients
node aggregator-client.js

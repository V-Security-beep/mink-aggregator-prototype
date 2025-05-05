# Mink Aggregator Prototype (Client-side)
This project is a prototype extension of the Mink Chrome extension. It adds client-side Memento aggregator functionality, allowing clients to:

Query multiple web archives for mementos of a URL,

Share results in real time via WebSocket communication, and

Interact with results through a simple web-based UI.

This repository contains a research prototype that fulfills two key goals as outlined by the supervising professor:

1. Client-side aggregator functionality (MemGator-inspired)  
2. Mink-to-Mink communication via WebSockets

The implementation is designed in Node.js to explore and demonstrate core functionality before adapting it into the browser-based Mink Chrome extension.



# Background

[Mink](https://github.com/machawk1/Mink) is a Chrome extension that uses the [Memento protocol (RFC 7089)](https://tools.ietf.org/html/rfc7089) to access archived web pages. This prototype explores how to enhance Mink by:

- Fetching mementos directly from multiple web archives client-side
- Allowing communication between Mink instances to share mementos collaboratively

---


---

# Features
 Query TimeMap endpoints from multiple web archives for any given URL.

 Uses WebSocket for real-time sharing of memento data between clients.

 Provides a clean, browser-based UI to show incoming mementos live.

 Lays the foundation for client-to-client communication in Mink.
 
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

### Install Dependencies
npm install ws node-fetch

### Start WebSocket Server
node server.js
Runs a WebSocket server on ws://localhost:8081.

### Serve the Web UI
node serve-ui.js
http://localhost:3000

### In Two Separate Terminals, Run Clients
node aggregator-client.js
This will query TimeMap endpoints for the target URL and broadcast results via WebSocket.

You can change the target URL by modifying the value of targetUrl inside aggregator-client.js.

###What the UI Shows
Displays a list of archived mementos as they arrive in real time.

Allows testing the full pipeline from client-side fetch → WebSocket broadcast, → frontend rendering.

### Video Walkthrough
Coming soon! A short demo video will explain:

How the backend works.

What the aggregator script does.

How the UI receives and displays mementos.


const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const https = require("https");

admin.initializeApp();

// ── Cloud Function: accept family invitation ──
// Triggered when an invitation status changes to 'accepted'
// Adds the accepting user's UID to the owner's garage sharedWith[]
exports.onInvitationAccepted = onDocumentUpdated({ document: "invitations/{inviteId}", region: "europe-west1" }, async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();

  if (before.status !== 'pending' || after.status !== 'accepted') return;

  const acceptedByUid = after.acceptedByUid;
  const ownerUid = after.fromUid;
  if (!acceptedByUid || !ownerUid) return;

  const garageRef = admin.firestore().doc(`garages/${ownerUid}`);
  await garageRef.update({
    sharedWith: admin.firestore.FieldValue.arrayUnion(acceptedByUid)
  });
  console.log(`Added ${acceptedByUid} to sharedWith of garages/${ownerUid}`);
});

// ── Cloud Function: nearby stations proxy ──
// Proxy for prix-carburant open data API (CORS bypass + geo filtering)
const ALLOWED_ORIGINS = [
  "https://gestion-vehicules-1a58c.web.app",
  "https://gestion-vehicules-1a58c.firebaseapp.com",
  "http://localhost:3000"
];

exports.nearbyStations = onRequest({
  cors: ALLOWED_ORIGINS,
  region: "europe-west1",
  maxInstances: 10
}, async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);
  const radius = Math.min(parseFloat(req.query.radius) || 10, 50);

  if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    res.status(400).json({ error: "Valid lat (-90..90) and lon (-180..180) required" });
    return;
  }

  const FUEL_FIELDS = ["gazole", "sp95", "sp98", "e10", "e85", "gplc"];

  try {
    const selectFields = "id,adresse,ville,cp,latitude,longitude," + FUEL_FIELDS.map(f => f + "_prix," + f + "_maj").join(",");
    const apiUrl = `https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/records?select=${selectFields}&where=within_distance(geom,geom'POINT(${lon} ${lat})',${radius}km)&order_by=distance(geom,geom'POINT(${lon} ${lat})')&limit=30`;

    const data = await new Promise((resolve, reject) => {
      const request = https.get(apiUrl, { timeout: 10000 }, (resp) => {
        let body = "";
        resp.on("data", chunk => body += chunk);
        resp.on("end", () => {
          try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
        });
        resp.on("error", reject);
      });
      request.on("error", reject);
      request.on("timeout", () => { request.destroy(); reject(new Error("API timeout")); });
    });

    const stations = (data.results || []).map(rec => {
      const prices = {};
      for (const f of FUEL_FIELDS) {
        const prix = rec[f + "_prix"];
        if (prix != null) {
          prices[f] = { value: parseFloat(prix), updated: rec[f + "_maj"] || "" };
        }
      }
      return {
        id: rec.id, address: rec.adresse || "", city: rec.ville || "",
        cp: rec.cp || "", lat: parseFloat(rec.latitude), lon: parseFloat(rec.longitude), prices
      };
    });

    res.json({ stations, count: stations.length });
  } catch (e) {
    console.error("nearbyStations error:", e);
    res.status(500).json({ error: "Failed to fetch station data" });
  }
});

// ── Cloud Function: plate lookup proxy ──
// Proxies RapidAPI plate lookup to avoid exposing API key client-side
exports.lookupPlate = onRequest({
  cors: ALLOWED_ORIGINS,
  region: "europe-west1",
  maxInstances: 10
}, async (req, res) => {
  const uid = req.query.uid;
  if (!uid) { res.status(401).json({ error: "Auth required" }); return; }

  const plate = (req.query.plate || "").trim().toUpperCase();
  if (!plate) { res.status(400).json({ error: "plate parameter required" }); return; }

  try {
    const snap = await admin.firestore().doc("config/api_keys").get();
    const token = snap.exists ? snap.data().plateApiToken : null;
    if (!token) { res.status(500).json({ error: "API key not configured" }); return; }

    const url = "https://api-de-plaque-d-immatriculation-france.p.rapidapi.com/?plaque=" + encodeURIComponent(plate);
    const data = await new Promise((resolve, reject) => {
      const request = https.get(url, {
        timeout: 10000,
        headers: {
          "Content-Type": "application/json",
          "plaque": plate,
          "x-rapidapi-host": "api-de-plaque-d-immatriculation-france.p.rapidapi.com",
          "x-rapidapi-key": token
        }
      }, (resp) => {
        let body = "";
        resp.on("data", chunk => body += chunk);
        resp.on("end", () => { try { resolve(JSON.parse(body)); } catch (e) { reject(e); } });
        resp.on("error", reject);
      });
      request.on("error", reject);
      request.on("timeout", () => { request.destroy(); reject(new Error("API timeout")); });
    });

    res.json(data);
  } catch (e) {
    console.error("lookupPlate error:", e);
    res.status(500).json({ error: "Plate lookup failed" });
  }
});

// ── Cloud Function: Groq AI proxy ──
// Proxies Groq LLM calls to avoid exposing API key client-side
exports.groqProxy = onRequest({
  cors: ALLOWED_ORIGINS,
  region: "europe-west1",
  maxInstances: 10
}, async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ error: "POST required" }); return; }

  const uid = req.query.uid;
  if (!uid) { res.status(401).json({ error: "Auth required" }); return; }

  const { prompt, temperature, max_tokens } = req.body || {};
  if (!prompt) { res.status(400).json({ error: "prompt required" }); return; }

  try {
    const snap = await admin.firestore().doc("config/api_keys").get();
    const apiKey = snap.exists ? snap.data().groqApiKey : null;
    if (!apiKey) { res.status(500).json({ error: "Groq API key not configured" }); return; }

    const postData = JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: temperature || 0.3,
      max_tokens: Math.min(max_tokens || 2000, 4000)
    });

    const data = await new Promise((resolve, reject) => {
      const request = https.request("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        timeout: 30000,
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + apiKey,
          "Content-Length": Buffer.byteLength(postData)
        }
      }, (resp) => {
        let body = "";
        resp.on("data", chunk => body += chunk);
        resp.on("end", () => { try { resolve(JSON.parse(body)); } catch (e) { reject(e); } });
        resp.on("error", reject);
      });
      request.on("error", reject);
      request.on("timeout", () => { request.destroy(); reject(new Error("Groq API timeout")); });
      request.write(postData);
      request.end();
    });

    res.json(data);
  } catch (e) {
    console.error("groqProxy error:", e);
    res.status(500).json({ error: "Groq request failed" });
  }
});

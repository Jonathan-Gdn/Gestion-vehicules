const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const https = require("https");

admin.initializeApp();

// ── Cloud Function: accept family invitation ──
// Triggered when an invitation status changes to 'accepted'
// Adds the accepting user's UID to the owner's garage sharedWith[]
exports.onInvitationAccepted = onDocumentUpdated("invitations/{inviteId}", async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();

  if (before.status !== 'pending' || after.status !== 'accepted') return;

  const acceptedByUid = after.acceptedByUid;
  const ownerUid = after.fromUid;
  if (!acceptedByUid || !ownerUid) return;

  const garageRef = admin.firestore().doc(`garages/${ownerUid}`);
  const garageSnap = await garageRef.get();
  const currentShared = garageSnap.exists ? (garageSnap.data().sharedWith || []) : [];

  if (!currentShared.includes(acceptedByUid)) {
    currentShared.push(acceptedByUid);
    await garageRef.update({ sharedWith: currentShared });
    console.log(`Added ${acceptedByUid} to sharedWith of garages/${ownerUid}`);
  }
});

// ── Cloud Function: nearby stations proxy ──
// Proxy for prix-carburant open data API (CORS bypass + geo filtering)
const ALLOWED_ORIGINS = [
  /^https:\/\/.*\.web\.app$/,
  /^https:\/\/.*\.firebaseapp\.com$/,
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

  try {
    const apiUrl = `https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/records?select=id,adresse,ville,cp,latitude,longitude,prix_nom,prix_valeur,prix_maj&where=within_distance(geom,geom'POINT(${lon} ${lat})',${radius}km)&order_by=distance(geom,geom'POINT(${lon} ${lat})')&limit=30`;

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

    const stationsMap = {};
    for (const rec of (data.results || [])) {
      const sid = rec.id;
      if (!stationsMap[sid]) {
        stationsMap[sid] = {
          id: sid, address: rec.adresse || "", city: rec.ville || "",
          cp: rec.cp || "", lat: rec.latitude, lon: rec.longitude, prices: {}
        };
      }
      if (rec.prix_nom && rec.prix_valeur) {
        stationsMap[sid].prices[rec.prix_nom.toLowerCase()] = {
          value: rec.prix_valeur, updated: rec.prix_maj || ""
        };
      }
    }

    const stations = Object.values(stationsMap);
    res.json({ stations, count: stations.length });
  } catch (e) {
    console.error("nearbyStations error:", e);
    res.status(500).json({ error: "Failed to fetch station data" });
  }
});

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

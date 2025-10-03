const map = L.map('map').setView([20, 0], 2);
L.tileLayer('https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}', {
  maxZoom: 20, attribution: 'USGS'
}).addTo(map);

const asteroidSelect = document.getElementById("asteroidSelect");
const astName = document.getElementById("astName");
const locEl = document.getElementById("loc");
const diamEl = document.getElementById("diameter");
const velEl = document.getElementById("velocity");
const eEl = document.getElementById("energy");
const cEl = document.getElementById("crater");
const sEl = document.getElementById("shock");
const seiEl = document.getElementById("seismic");
const gEl = document.getElementById("global");

let asteroidData = [];
const apiKey = "g9lgd6tg8kCLb0klT33zqyY0JxfDQKXIDGLkakvi"; // ✅ Your NASA API Key

// Fetch asteroid data
fetch(`https://api.nasa.gov/neo/rest/v1/neo/browse?api_key=${apiKey}`)
  .then(res => res.json())
  .then(data => {
    asteroidData = data.near_earth_objects;
    asteroidSelect.innerHTML = asteroidData.map(a =>
      `<option value="${a.id}">${a.name}</option>`
    ).join("");
  })
  .catch(err => {
    asteroidSelect.innerHTML = "<option>Error loading data</option>";
    console.error(err);
  });

// Sound & Explosion Effects
function playExplosion(latlng) {
  const sound = document.getElementById("sound-explosion");
  const rumble = document.getElementById("sound-rumble");

  sound.currentTime = 0;
  sound.play().catch(err => console.warn("Explosion sound blocked:", err));

  rumble.currentTime = 0;
  rumble.play().catch(err => console.warn("Rumble sound blocked:", err));
  setTimeout(() => rumble.pause(), 4000);

  const p = map.latLngToContainerPoint(latlng);
  const exp = document.createElement("div");
  exp.className = "explosion";
  exp.style.left = (p.x - 40) + "px";
  exp.style.top = (p.y - 40) + "px";
  document.body.appendChild(exp);
  setTimeout(() => exp.remove(), 1500);

  const fall = document.createElement("div");
  fall.className = "falling";
  fall.style.left = (p.x - 20) + "px";
  fall.style.top = (p.y - 200) + "px";
  document.body.appendChild(fall);
  setTimeout(() => fall.remove(), 1000);

  document.body.classList.add("shake");
  setTimeout(() => document.body.classList.remove("shake"), 700);
}

// Impact Calculation
function calcImpact(diameter, velocity) {
  const mass = (4 / 3) * Math.PI * Math.pow(diameter / 2, 3) * 3000;
  const joules = 0.5 * mass * (velocity * 1000) ** 2;
  const mt = joules / 4.184e15;
  return {
    energy: mt.toFixed(2),
    crater: (1.8 * Math.pow(mt, 0.25) * 1000).toFixed(0),
    shock: (0.35 * Math.pow(joules / 4.184e12, 1 / 3) * 1000).toFixed(0),
    seismic: (50 * Math.pow(mt, 0.17)).toFixed(0),
    global: (mt > 1000 ? (mt / 100).toFixed(0) : 0)
  };
}

let impactMarker, craterCircle, shockCircle;

// Simulation
function simulate(lat, lng) {
  const selectedId = asteroidSelect.value;
  const asteroid = asteroidData.find(a => a.id === selectedId);
  if (!asteroid) return alert("Asteroid data not loaded.");

  const d = asteroid.estimated_diameter.meters.estimated_diameter_max.toFixed(0);
  const v = (Math.random() * 30 + 10).toFixed(1);

  const res = calcImpact(d, v);
  astName.textContent = asteroid.name;
  locEl.textContent = lat.toFixed(2) + ", " + lng.toFixed(2);
  diamEl.textContent = d;
  velEl.textContent = v;
  eEl.textContent = res.energy;
  cEl.textContent = res.crater;
  sEl.textContent = res.shock;
  seiEl.textContent = res.seismic;
  gEl.textContent = res.global;

  if (impactMarker) map.removeLayer(impactMarker);
  [craterCircle, shockCircle].forEach(c => c && map.removeLayer(c));

  impactMarker = L.marker([lat, lng]).addTo(map);
  craterCircle = L.circle([lat, lng], { radius: res.crater / 2, color: "red", fillOpacity: 0.3 }).addTo(map);
  shockCircle = L.circle([lat, lng], { radius: res.shock, color: "yellow", fillOpacity: 0.25 }).addTo(map);

  playExplosion({ lat, lng });
}

// Events
map.on("click", e => simulate(e.latlng.lat, e.latlng.lng));

document.getElementById("resetBtn").onclick = () => {
  if (impactMarker) map.removeLayer(impactMarker);
  [craterCircle, shockCircle].forEach(c => c && map.removeLayer(c));
  astName.textContent = locEl.textContent = diamEl.textContent = velEl.textContent =
    eEl.textContent = cEl.textContent = sEl.textContent = seiEl.textContent = gEl.textContent = "--";
};

document.getElementById("randomBtn").onclick = () => {
  const lat = (Math.random() * 180) - 90;
  const lng = (Math.random() * 360) - 180;
  simulate(lat, lng);
  map.setView([lat, lng], 4);
};

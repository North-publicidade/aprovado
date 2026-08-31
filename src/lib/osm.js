const ANAPOLIS_BBOX = "-16.4859870,-49.1940000,-16.1240000,-48.7500000"; // south,west,north,east

// O servidor público do Overpass é gratuito e comunitário — vive sobrecarregado
// e limita ~2 requisições simultâneas por IP (429/502/504 são comuns). A busca
// roda direto no navegador de quem clica "Importar" (em vez de por trás de uma
// function do servidor) porque serviços de nuvem costumam ser barrados por lá.
const OVERPASS_ATTEMPTS = [
  { url: "https://overpass-api.de/api/interpreter", timeout: 12000 },
  { url: "https://overpass.kumi.systems/api/interpreter", timeout: 12000 },
  { url: "https://overpass-api.de/api/interpreter", timeout: 12000 },
];

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function guessCategory(tags) {
  const cuisine = (tags.cuisine || "").toLowerCase();
  const amenity = tags.amenity;
  const shop = tags.shop;

  if (cuisine.includes("pizza")) return "Pizzaria";
  if (cuisine.includes("burger")) return "Hamburgueria";
  if (cuisine.includes("japanese") || cuisine.includes("sushi")) return "Japonês";
  if (shop === "bakery" || shop === "pastry" || shop === "confectionery" || shop === "chocolate") return "Doceria";
  if (amenity === "ice_cream" || cuisine.includes("ice_cream") || cuisine.includes("dessert")) return "Doceria";
  if (amenity === "cafe" || cuisine.includes("coffee_shop")) return "Cafeteria";
  return "Comida brasileira";
}

function formatAddress(tags) {
  const street = tags["addr:street"];
  const number = tags["addr:housenumber"];
  const suburb = tags["addr:suburb"];
  const parts = [];
  if (street) parts.push(number ? `${street}, ${number}` : street);
  if (suburb) parts.push(suburb);
  return parts.join(" - ");
}

async function queryOverpass(query) {
  let lastError;
  for (let i = 0; i < OVERPASS_ATTEMPTS.length; i++) {
    const { url, timeout: ms } = OVERPASS_ATTEMPTS[i];
    if (i > 0) await wait(1500);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), ms);
      const res = await fetch(url + "?data=" + encodeURIComponent(query), { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`Overpass respondeu ${res.status}`);
      return await res.json();
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error("Nenhum endpoint do Overpass respondeu");
}

export async function fetchAnapolisPlaces() {
  // "nwr" pega estabelecimentos mapeados como ponto, área (prédio) ou relação —
  // pontos isolados (node) são o mais comum, mas alguns lugares só aparecem
  // marcados como área no mapa.
  const query = `[out:json][timeout:25];(nwr["amenity"~"^(restaurant|cafe|fast_food|bar|pub|ice_cream|food_court|biergarten)$"](${ANAPOLIS_BBOX});nwr["shop"~"^(bakery|confectionery|pastry|deli|chocolate)$"](${ANAPOLIS_BBOX}););out center 400;`;

  let data;
  try {
    data = await queryOverpass(query);
  } catch {
    throw new Error("Não foi possível consultar o OpenStreetMap agora (servidor público sobrecarregado). Tente de novo em alguns minutos.");
  }

  return data.elements
    .filter((el) => el.tags && el.tags.name)
    .map((el) => ({
      osmId: `osm-${el.type}-${el.id}`,
      name: el.tags.name,
      category: guessCategory(el.tags),
      address: formatAddress(el.tags),
      phone: el.tags.phone || el.tags["contact:phone"] || "",
      instagram: el.tags["contact:instagram"] || null,
      bairro: el.tags["addr:suburb"] || "Anápolis",
      lat: el.lat ?? el.center?.lat ?? null,
      lon: el.lon ?? el.center?.lon ?? null,
    }));
}

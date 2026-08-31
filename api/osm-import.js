// Vercel Serverless Function.
// O Overpass API (OpenStreetMap) não libera CORS para chamadas vindas do navegador,
// então essa busca precisa passar pelo servidor em vez de rodar direto no app.

const ANAPOLIS_BBOX = "-16.4859870,-49.1940000,-16.1240000,-48.7500000"; // south,west,north,east

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

function guessCategory(tags) {
  const cuisine = (tags.cuisine || "").toLowerCase();
  const amenity = tags.amenity;
  const shop = tags.shop;

  if (cuisine.includes("pizza")) return "Pizzaria";
  if (cuisine.includes("burger")) return "Hamburgueria";
  if (cuisine.includes("japanese") || cuisine.includes("sushi")) return "Japonês";
  if (shop === "bakery" || shop === "pastry" || shop === "confectionery") return "Doceria";
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
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      const res = await fetch(endpoint + "?data=" + encodeURIComponent(query), { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`Overpass respondeu ${res.status}`);
      return await res.json();
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error("Nenhum endpoint do Overpass respondeu");
}

export default async function handler(req, res) {
  try {
    const query = `[out:json][timeout:25];(node["amenity"~"^(restaurant|cafe|fast_food|bar|pub|ice_cream)$"](${ANAPOLIS_BBOX});node["shop"~"^(bakery|confectionery|pastry)$"](${ANAPOLIS_BBOX}););out body 200;`;
    const data = await queryOverpass(query);

    const places = data.elements
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

    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
    res.status(200).json({ places });
  } catch (err) {
    res.status(502).json({ error: "Não foi possível consultar o OpenStreetMap agora.", detail: String(err) });
  }
}

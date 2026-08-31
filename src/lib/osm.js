export async function fetchAnapolisPlaces() {
  const res = await fetch("/api/osm-import");
  const contentType = res.headers.get("content-type") || "";
  if (!res.ok || !contentType.includes("application/json")) {
    throw new Error("Essa função só funciona no site publicado (Vercel), não no ambiente local (npm run dev).");
  }
  const data = await res.json();
  return data.places || [];
}

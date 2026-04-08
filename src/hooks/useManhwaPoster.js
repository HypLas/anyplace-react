import { useState, useEffect } from "react";

const cache = new Map();

function slugify(title) {
  return (title || "").toLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").replace(/[\u0027\u0060\u00b4\u2018\u2019\u201a\u201b]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function probeLocalCover(title) {
  if (cache.has(title)) return cache.get(title);
  const full  = slugify(title);
  const short = full.split("-").slice(0, 4).join("-");
  for (const p of [...new Set([full, short])]) {
    for (const e of ["webp", "jpg", "png"]) {
      try {
        const r = await fetch(`/covers/${p}.${e}`);
        const ct = r.headers.get("content-type") || "";
        if (r.ok && ct.startsWith("image/")) {
          cache.set(title, `/covers/${p}.${e}`);
          return `/covers/${p}.${e}`;
        }
      } catch {}
    }
  }
  cache.set(title, null);
  return null;
}

export default function useManhwaPoster(title) {
  const [poster, setPoster] = useState(null);

  useEffect(() => {
    if (!title) return;
    probeLocalCover(title).then(src => setPoster(src));
  }, [title]);

  return poster;
}

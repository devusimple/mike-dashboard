export {};
const pages = ["/login", "/overview", "/products", "/orders"];
for (let i = 0; i < 20; i++) {
  try {
    let ok = true;
    for (const p of pages) {
      const r = await fetch(`http://localhost:3001${p}`);
      const text = await r.text();
      console.log(p, "->", r.status, "bytes:", text.length);
      ok &&= r.status === 200;
    }
    process.exit(ok ? 0 : 1);
  } catch {
    await new Promise((r) => setTimeout(r, 2000));
  }
}
console.log("DASHBOARD NOT UP");
process.exit(1);

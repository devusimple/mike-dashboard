export {};
const pages = ["/products", "/products/new", "/products/abc123"];
for (let i = 0; i < 20; i++) {
  try {
    let ok = true;
    for (const p of pages) {
      const r = await fetch(`http://localhost:3001${p}`);
      console.log(p, "->", r.status);
      ok &&= r.status === 200;
    }
    process.exit(ok ? 0 : 1);
  } catch {
    await new Promise((r) => setTimeout(r, 2000));
  }
}
console.log("NOT UP");
process.exit(1);

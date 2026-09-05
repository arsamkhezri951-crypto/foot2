import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { deflateRawSync } from "node:zlib";

/* ---------- ZIP (deflate) helpers — produces netlify-deploy.zip ---------- */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/**
 * After every production build, packs the CONTENTS of dist/ into
 * netlify-deploy.zip (files at the archive root — no outer "dist" folder),
 * ready for manual Netlify Drag & Drop.
 */
function netlifyZipPlugin() {
  return {
    name: "netlify-deploy-zip",
    apply: "build",
    closeBundle() {
      const distDir = join(process.cwd(), "dist");
      const files = [];
      const walk = (dir) => {
        for (const name of readdirSync(dir).sort()) {
          const full = join(dir, name);
          if (statSync(full).isDirectory()) walk(full);
          else files.push(full);
        }
      };
      walk(distDir);

      const localParts = [];
      const centralParts = [];
      let offset = 0;
      const DOS_DATE = 22561; // fixed timestamp (2024-01-01)

      for (const full of files) {
        const rel = relative(distDir, full).split(/[\\/]/g).join("/");
        const data = readFileSync(full);
        const crc = crc32(data);
        const comp = deflateRawSync(data, { level: 9 });
        const nameBuf = Buffer.from(rel, "utf8");

        const lh = Buffer.alloc(30);
        lh.writeUInt32LE(0x04034b50, 0); // local file header signature
        lh.writeUInt16LE(20, 4); // version needed
        lh.writeUInt16LE(0, 6); // flags
        lh.writeUInt16LE(8, 8); // method: deflate
        lh.writeUInt16LE(0, 10); // mod time
        lh.writeUInt16LE(DOS_DATE, 12); // mod date
        lh.writeUInt32LE(crc, 14);
        lh.writeUInt32LE(comp.length, 18);
        lh.writeUInt32LE(data.length, 22);
        lh.writeUInt16LE(nameBuf.length, 26);
        lh.writeUInt16LE(0, 28); // extra len
        localParts.push(lh, nameBuf, comp);

        const ch = Buffer.alloc(46);
        ch.writeUInt32LE(0x02014b50, 0); // central dir signature
        ch.writeUInt16LE(20, 4); // version made by
        ch.writeUInt16LE(20, 6); // version needed
        ch.writeUInt16LE(0, 8);
        ch.writeUInt16LE(8, 10);
        ch.writeUInt16LE(0, 12);
        ch.writeUInt16LE(DOS_DATE, 14);
        ch.writeUInt32LE(crc, 16);
        ch.writeUInt32LE(comp.length, 20);
        ch.writeUInt32LE(data.length, 24);
        ch.writeUInt16LE(nameBuf.length, 28);
        ch.writeUInt16LE(0, 30); // extra len
        ch.writeUInt16LE(0, 32); // comment len
        ch.writeUInt16LE(0, 34); // disk number
        ch.writeUInt16LE(0, 36); // internal attrs
        ch.writeUInt32LE(0o644 << 16, 38); // external attrs
        ch.writeUInt32LE(offset, 42); // local header offset
        centralParts.push(ch, nameBuf);

        offset += lh.length + nameBuf.length + comp.length;
      }

      const cdSize = centralParts.reduce((a, b) => a + b.length, 0);
      const eocd = Buffer.alloc(22);
      eocd.writeUInt32LE(0x06054b50, 0); // EOCD signature
      eocd.writeUInt16LE(0, 4);
      eocd.writeUInt16LE(0, 6);
      eocd.writeUInt16LE(files.length, 8);
      eocd.writeUInt16LE(files.length, 10);
      eocd.writeUInt32LE(cdSize, 12);
      eocd.writeUInt32LE(offset, 16);
      eocd.writeUInt16LE(0, 20);

      const out = join(process.cwd(), "netlify-deploy.zip");
      const zipBuf = Buffer.concat([...localParts, ...centralParts, eocd]);
      // sanity check: EOCD signature must be at the very end
      if (zipBuf.readUInt32LE(zipBuf.length - 22) !== 0x06054b50)
        throw new Error("netlify-deploy.zip failed self-check (EOCD)");
      writeFileSync(out, zipBuf);
      const kb = (statSync(out).size / 1024).toFixed(1);
      const entries = files.map((full) => relative(distDir, full).split(/[\\/]/g).join("/"));
      writeFileSync(
        join(process.cwd(), "netlify-deploy.manifest.txt"),
        [
          `netlify-deploy.zip — ${entries.length} files, ${kb} KB (deflate, entries at archive root)`,
          ...entries.map((e) => `  ${e}`),
        ].join("\n") + "\n"
      );
      console.log(
        `\n  \u2713 netlify-deploy.zip \u2192 ${entries.length} files, ${kb} KB (contents of dist/, ready for Netlify drag & drop)`
      );
      for (const e of entries) console.log(`      - ${e}`);
    },
  };
}

export default defineConfig({
  base: "/", // absolute asset paths — correct for a Netlify root deployment
  plugins: [react(), tailwindcss(), netlifyZipPlugin()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    hmr: {
      port: 3000,
    },
  },
});

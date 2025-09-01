import { computeVirtual4, type Bit} from "../calc/virtual_adder.js";

function bitsToString(xs: Bit[]): string {
  // prints MSB..LSB
  return xs.slice().reverse().join("");
}

function dumpPrefixes<T extends Record<SpanKey, 0|1>>(label: string, r: T) {
  const keys = Object.keys(r) as SpanKey[];    // narrow from string[]
  keys.sort(compareSpanKey);
  console.log(`- ${label}:`);
  for (const k of keys) {
    const v = r[k];                            // type is Bit, not possibly undefined
    console.log(`  ${k.padStart(4)} = ${v}`);
  }
}

type SpanKey = `${number}:${number}`; // keep consistent with your calc module

function parseSpanKey(k: string): [number, number] {
  const m = /^(\d+):(\d+)$/.exec(k);
  if (!m) throw new Error(`Bad span key: ${k}`);
  return [Number(m[1]), Number(m[2])];
}

function compareSpanKey(a: SpanKey, b: SpanKey): number {
  const [ah, al] = parseSpanKey(a);
  const [bh, bl] = parseSpanKey(b);
  return ah === bh ? al - bl : ah - bh;
}

function main() {
  // Usage: node dist/dev/print_virtual.js <A> <B> [C0]
  const [, , aStr, bStr, c0Str] = process.argv;
  if (!aStr || !bStr) {
    console.error("Usage: node dist/dev/print_virtual.js <A> <B> [C0]");
    process.exit(1);
  }
  const A = Number(aStr);
  const B = Number(bStr);
  const C0 = c0Str ? (Number(c0Str) & 1) as Bit : 0;

  const snap = computeVirtual4(A, B, { c0: C0 });

  console.log(`A=${A} B=${B} C0=${C0}`);
  console.log(`A bits (MSB..LSB): ${bitsToString(snap.A)}`);
  console.log(`B bits (MSB..LSB): ${bitsToString(snap.B)}`);
  console.log(`P bits (MSB..LSB): ${bitsToString(snap.P)}`);
  console.log(`G bits (MSB..LSB): ${bitsToString(snap.G)}`);
  console.log(`C bits (C4..C0):   ${snap.C.slice().reverse().join("")}`);
  console.log(`S bits (MSB..LSB): ${bitsToString(snap.S)}`);

  dumpPrefixes("prefixP", snap.prefixP);
  dumpPrefixes("prefixG", snap.prefixG);

  //Step log
  console.dir(snap.steps, { depth: null });
}

main();

import { runCLA4Demo } from "./demo/cla4_pipeline.js";

console.log(process.argv);

const [,, aStr, bStr, c0Str] = process.argv;
const a = Number(aStr);
const b = Number(bStr);
const c0 = (Number(c0Str ?? 0) ? 1 : 0) as 0|1;
console.log('Ants will add numbers with carry: ',a,b,c0);

runCLA4Demo(a,b,c0).catch(e=>{
    console.error(e);
    process.exit(1);
});
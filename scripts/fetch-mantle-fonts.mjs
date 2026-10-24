import fs from "node:fs/promises";
const fonts=[
 ['instrument-sans','https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400..600&display=swap','instrumentsans'],
 ['instrument-serif-italic','https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@1&display=swap','instrumentserif'],
 ['jetbrains-mono','https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400..500&display=swap','jetbrainsmono']
];
for(const [name,url,licenseDir] of fonts){
 const response=await fetch(url,{signal:AbortSignal.timeout(15000),headers:{'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}});
 if(!response.ok)throw new Error(`Font CSS HTTP ${response.status}`);
 const css=await response.text();const candidates=[...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)];const source=candidates.at(-1)?.[1];if(!source)throw new Error('No font source');
 const font=await fetch(source,{signal:AbortSignal.timeout(15000)});if(!font.ok)throw new Error(`Font HTTP ${font.status}`);
 await fs.writeFile(`src/lib/mantle/font-files/${name}.woff2`,new Uint8Array(await font.arrayBuffer()));
 const license=await fetch(`https://raw.githubusercontent.com/google/fonts/main/ofl/${licenseDir}/OFL.txt`,{signal:AbortSignal.timeout(15000)});if(!license.ok)throw new Error(`Font license HTTP ${license.status}`);
 await fs.writeFile(`src/lib/mantle/font-files/${name}-OFL.txt`,await license.text());
 console.log(`${name}: local font and OFL license saved`);
}

/**
 * check-modules.js
 * Valida el grafo de módulos ES del proyecto sin dependencias externas:
 *   - que cada ruta importada exista en disco
 *   - que cada nombre importado esté realmente exportado por el archivo destino
 *   - que no haya declaraciones duplicadas de nivel superior
 *
 * Uso:  node scripts/check-modules.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (entry.name.endsWith('.js')) acc.push(full);
  }
  return acc;
}

function collectExports(source) {
  const names = new Set();
  const re = /export\s+(?:async\s+)?(?:const|let|var|function|class)\s+([A-Za-z0-9_$]+)/g;
  let m;
  while ((m = re.exec(source))) names.add(m[1]);

  // export { a, b as c }
  const reList = /export\s*\{([^}]*)\}/g;
  while ((m = reList.exec(source))) {
    m[1].split(',').forEach((part) => {
      const seg = part.trim();
      if (!seg) return;
      const alias = seg.split(/\s+as\s+/);
      names.add((alias[1] || alias[0]).trim());
    });
  }

  if (/export\s+default/.test(source)) names.add('default');
  return names;
}

function collectImports(source) {
  const imports = [];
  const re = /import\s+([^'"]*?)\s*from\s*['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(source))) {
    const clause = m[1].trim();
    const spec = m[2];
    const names = [];
    const braces = clause.match(/\{([^}]*)\}/);
    if (braces) {
      braces[1].split(',').forEach((part) => {
        const seg = part.trim();
        if (!seg) return;
        const alias = seg.split(/\s+as\s+/);
        names.push({ imported: alias[0].trim(), local: (alias[1] || alias[0]).trim() });
      });
    }
    imports.push({ spec, names });
  }
  return imports;
}

function countTopLevelDeclarations(source) {
  // Detección simple de `function nombre(` a nivel de columna 0
  const counts = new Map();
  const re = /^(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_$]+)/gm;
  let m;
  while ((m = re.exec(source))) counts.set(m[1], (counts.get(m[1]) || 0) + 1);
  return counts;
}

const files = walk(ROOT);
let errors = 0;

for (const file of files) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  const source = fs.readFileSync(file, 'utf8');

  for (const { spec, names } of collectImports(source)) {
    if (!spec.startsWith('.')) continue; // paquetes externos: se omiten

    const target = path.resolve(path.dirname(file), spec);
    if (!fs.existsSync(target)) {
      console.error(`ERROR  ${rel}: no existe el módulo importado '${spec}'`);
      errors++;
      continue;
    }

    const targetExports = collectExports(fs.readFileSync(target, 'utf8'));
    for (const { imported } of names) {
      if (!targetExports.has(imported)) {
        console.error(`ERROR  ${rel}: importa '${imported}' pero no está exportado en '${spec}'`);
        errors++;
      }
    }
  }

  for (const [name, count] of countTopLevelDeclarations(source)) {
    if (count > 1) {
      console.error(`ERROR  ${rel}: '${name}' está declarado ${count} veces`);
      errors++;
    }
  }
}

if (errors === 0) {
  console.log(`OK  ${files.length} archivos JS verificados: imports/exports y declaraciones correctos.`);
} else {
  console.error(`\n${errors} problema(s) encontrado(s).`);
  process.exit(1);
}

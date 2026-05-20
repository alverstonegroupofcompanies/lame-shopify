/**
 * Adds any keys from locales/en.default.json that are missing from
 * locales/en.default.schema.json (schema locale "defaults" must be a superset
 * for MatchingTranslations vs *.schema.json locales).
 */
import { readFileSync, writeFileSync } from 'fs';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function deepMergeMissing(target, source) {
  if (source === null || typeof source !== 'object' || Array.isArray(source)) return target;
  if (!target || typeof target !== 'object' || Array.isArray(target))
    return JSON.parse(JSON.stringify(source));
  for (const k of Object.keys(source)) {
    if (target[k] === undefined) target[k] = JSON.parse(JSON.stringify(source[k]));
    else if (
      source[k] !== null &&
      typeof source[k] === 'object' &&
      !Array.isArray(source[k]) &&
      typeof target[k] === 'object' &&
      !Array.isArray(target[k])
    )
      deepMergeMissing(target[k], source[k]);
  }
  return target;
}

function parseJson5(relPath) {
  const full = join(root, relPath);
  const r = spawnSync('npx', ['--yes', 'json5', full], {
    shell: true,
    encoding: 'utf8',
    maxBuffer: 80 * 1024 * 1024,
  });
  if (r.status !== 0) throw new Error(r.stderr || 'json5 failed');
  return JSON.parse(r.stdout);
}

const schemaPath = join(root, 'locales/en.default.schema.json');
const rawSchema = readFileSync(schemaPath, 'utf8');
const schema = parseJson5('locales/en.default.schema.json');
const enMain = parseJson5('locales/en.default.json');

deepMergeMissing(schema, enMain);

const banner = rawSchema.match(/^\/\*[\s\S]*?\*\//);
const out =
  (banner ? banner[0] + '\n' : '') + JSON.stringify(schema, null, 2) + '\n';
writeFileSync(schemaPath, out);
console.log('Updated', schemaPath);
console.log('Top-level keys:', Object.keys(schema).sort().join(', '));

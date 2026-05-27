const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const fs = require('fs');
const path = require('path');

const schema = require('../schema.json');
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const validate = ajv.compile(schema);

const examplesDir = path.join(__dirname, '..', 'examples');
const examples = fs.readdirSync(examplesDir).filter(f => f.endsWith('.json'));

/**
 * Collect all item IDs from a checklist (including nested items)
 */
function collectIds(item, ids = []) {
  if (item.id) ids.push(item.id);
  if (item.items) {
    item.items.forEach(child => collectIds(child, ids));
  }
  return ids;
}

/**
 * Collect all after references from a checklist
 */
function collectAfterRefs(item, refs = []) {
  if (item.after) refs.push({ id: item.id, after: item.after });
  if (item.items) {
    item.items.forEach(child => collectAfterRefs(child, refs));
  }
  return refs;
}

/**
 * Check for circular dependencies using DFS cycle detection
 */
function hasCycle(item, idMap, visited = new Set(), recursionStack = new Set()) {
  const id = item.id;
  if (!id) return false;

  visited.add(id);
  recursionStack.add(id);

  if (item.after) {
    const afterId = item.after;
    if (!idMap.has(afterId)) {
      // Invalid reference - will be caught by referential integrity check
    } else if (recursionStack.has(afterId)) {
      return true; // Cycle detected
    } else {
      const afterItem = idMap.get(afterId);
      if (afterItem && hasCycle(afterItem, idMap, visited, recursionStack)) {
        return true;
      }
    }
  }

  recursionStack.delete(id);

  if (item.items) {
    for (const child of item.items) {
      if (hasCycle(child, idMap, visited, recursionStack)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Validate a single checklist
 */
function validateChecklist(name, data) {
  const errors = [];
  const schemaValid = validate(data);

  if (!schemaValid) {
    validate.errors.forEach(e => {
      errors.push(`Schema: ${e.instancePath}: ${e.message}`);
    });
  }

  // Build ID map for semantic validation
  const allIds = collectIds(data);
  const uniqueIds = new Set(allIds);
  const duplicates = allIds.filter(id => !uniqueIds.delete(id));

  if (duplicates.length > 0) {
    errors.push(`Duplicate IDs: ${[...new Set(duplicates)].join(', ')}`);
  }

  // Check referential integrity
  const idMap = new Map();
  function buildIdMap(item) {
    if (item.id) idMap.set(item.id, item);
    if (item.items) item.items.forEach(buildIdMap);
  }
  buildIdMap(data);

  const afterRefs = collectAfterRefs(data);
  const invalidRefs = afterRefs.filter(ref => !idMap.has(ref.after));
  if (invalidRefs.length > 0) {
    errors.push(`Invalid after references: ${invalidRefs.map(r => `${r.id}→${r.after}`).join(', ')}`);
  }

  // Check for cycles
  if (hasCycle(data, idMap)) {
    errors.push('Circular dependency detected in after chains');
  }

  return { name, pass: errors.length === 0, errors };
}

const results = [];
let allPass = true;

examples.forEach(name => {
  const filePath = path.join(examplesDir, name);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const result = validateChecklist(name, data);
  results.push(result);
  if (!result.pass) allPass = false;
});

console.log('Validating examples...\n');
results.forEach(r => {
  console.log(`${r.pass ? '✅' : '❌'} ${r.name}: ${r.pass ? 'PASS' : 'FAIL'}`);
  if (r.errors) {
    r.errors.forEach(e => console.log(`   ${e}`));
  }
});

console.log('');
if (allPass) {
  console.log('All examples valid!');
  process.exit(0);
} else {
  console.log('Some examples failed validation.');
  process.exit(1);
}

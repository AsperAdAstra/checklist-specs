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

let allPass = true;
const results = [];

examples.forEach(name => {
  const filePath = path.join(examplesDir, name);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const valid = validate(data);
  if (!valid) {
    results.push({ name, pass: false, errors: validate.errors });
    allPass = false;
  } else {
    results.push({ name, pass: true });
  }
});

console.log('Validating examples against schema...\n');
results.forEach(r => {
  console.log(`${r.pass ? '✅' : '❌'} ${r.name}: ${r.pass ? 'PASS' : 'FAIL'}`);
  if (r.errors) {
    r.errors.forEach(e => console.log(`   ${e.instancePath}: ${e.message}`));
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

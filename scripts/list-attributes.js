#!/usr/bin/env node

/**
 * Lists all attributes and their IDs from your Duro library, grouped by category.
 * Usage:   npm run list-attributes
 * Filter:  npm run list-attributes -- "part number"
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Load .env.local if present
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length) process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

const API_KEY = process.env.DURO_LIBRARY_API_KEY;
if (!API_KEY) {
  console.error('Error: DURO_LIBRARY_API_KEY not set. Create a .env.local file or set the environment variable.');
  process.exit(1);
}

const nameFilter = process.argv[2]?.toLowerCase();

async function graphqlRequest(query) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query });
    const options = {
      hostname: 'api.durohub.com',
      port: 443,
      path: '/graphql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data, 'utf8'),
        'x-api-key': API_KEY
      }
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.errors) reject(new Error(JSON.stringify(parsed.errors, null, 2)));
          else resolve(parsed.data);
        } catch (e) {
          reject(new Error(`Failed to parse response: ${body}`));
        }
      });
    });
    req.on('error', e => reject(e));
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('Fetching attributes from Duro library...\n');

  // Step 1: get libraryId from the API key context
  const libData = await graphqlRequest(`query { library { current { id name } } }`);
  const libraryId = libData.library.current.id;
  console.log(`Library: ${libData.library.current.name} (${libraryId})\n`);

  // Step 2: fetch all attributes for this library
  const data = await graphqlRequest(`
    query {
      attribute {
        findAll(libraryId: "${libraryId}") {
          id
          name
        }
      }
    }
  `);

  const attrs = data.attribute.findAll.sort((a, b) => a.name.localeCompare(b.name));

  // Save full list to attributes.json
  const outputPath = path.join(__dirname, '..', 'attributes.json');
  const json = {
    library: { id: libraryId, name: libData.library.current.name },
    generatedAt: new Date().toISOString(),
    attributes: attrs.map(a => ({ name: a.name, id: a.id }))
  };
  fs.writeFileSync(outputPath, JSON.stringify(json, null, 2));
  console.log(`Saved ${attrs.length} attribute(s) to attributes.json\n`);

  // Print to console (filtered or full)
  const display = nameFilter
    ? attrs.filter(a => a.name.toLowerCase().includes(nameFilter))
    : attrs;

  if (display.length === 0) {
    console.log(`No attributes matching "${nameFilter}"`);
    return;
  }

  console.log('Name                           ID');
  console.log('─'.repeat(70));
  for (const attr of display) {
    console.log(`${attr.name.padEnd(31)}${attr.id}`);
  }
  if (!nameFilter) console.log(`\nTotal: ${attrs.length} attribute(s)`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});

#!/usr/bin/env node

/**
 * Lists all category attributes and their IDs from your Duro library.
 * Usage: npm run list-attributes
 * Optional filter: npm run list-attributes -- capacitor
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

const categoryFilter = process.argv[2]?.toLowerCase();

async function graphqlRequest(query, variables = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query, variables });
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
  console.log('Fetching category attributes from Duro library...\n');

  const data = await graphqlRequest(`
    query ListAttributes {
      attribute {
        list {
          edges {
            node {
              id
              name
            }
          }
        }
      }
    }
  `);

  const attrs = data.attribute.list.edges.map(e => e.node);

  const filtered = categoryFilter
    ? attrs.filter(a => a.name.toLowerCase().includes(categoryFilter))
    : attrs;

  if (filtered.length === 0) {
    console.log(categoryFilter ? `No attributes matching "${categoryFilter}"` : 'No attributes found.');
    return;
  }

  console.log('Name                           ID');
  console.log('─'.repeat(70));
  for (const attr of filtered.sort((a, b) => a.name.localeCompare(b.name))) {
    console.log(`${attr.name.padEnd(31)}${attr.id}`);
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});

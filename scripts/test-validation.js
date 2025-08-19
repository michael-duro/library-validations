#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Get validation file from command line
const validationFile = process.argv[2];

if (!validationFile) {
  console.error('Usage: npm test <validation-file>');
  console.error('Example: npm test validations/example-validation.js');
  process.exit(1);
}

// Read validation file
const filePath = path.resolve(validationFile);
if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

const code = fs.readFileSync(filePath, 'utf8');

// Mock console for capturing logs
const logs = {
  info: [],
  log: [],
  warn: [],
  error: []
};

const mockConsole = {
  info: (...args) => {
    console.info(...args);
    logs.info.push(args.join(' '));
  },
  log: (...args) => {
    console.log(...args);
    logs.log.push(args.join(' '));
  },
  warn: (...args) => {
    console.warn(...args);
    logs.warn.push(args.join(' '));
  },
  error: (...args) => {
    console.error(...args);
    logs.error.push(args.join(' '));
  }
};

// Test data - Rich validation structure
const testData = {
  change_order: {
    // Basic Information
    id: 'test-co-001',
    name: 'TEST-CO-2024-01',
    description: 'Test change order for validation testing',
    status: 'draft',
    resolution: 'pending',
    libraryId: 'test-library-001',
    isValid: true,
    
    // Timestamps
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T14:30:00Z'),
    
    // User Information
    createdBy: {
      id: 'user-001',
      name: 'John Doe',
      primaryEmail: 'john.doe@example.com'
    },
    updatedBy: {
      id: 'user-001',
      name: 'John Doe',
      primaryEmail: 'john.doe@example.com'
    },
    
    // Dynamic Content Fields
    contents: [
      {
        id: 'field-001',
        name: 'cost_impact',
        label: 'Cost Impact',
        values: ['5000'],
        order: 1,
        isRequired: true,
        placeholder: 'Enter cost impact',
        description: 'Estimated cost impact in USD',
        min: 0,
        max: 1000000,
        type: 'currency',
        multipleSelect: false,
        groupName: 'Financial'
      },
      {
        id: 'field-002',
        name: 'justification',
        label: 'Change Justification',
        values: ['Required for customer compliance'],
        order: 2,
        isRequired: true,
        placeholder: 'Explain why this change is needed',
        description: 'Detailed justification for the change',
        type: 'longtext',
        multipleSelect: false,
        groupName: 'Documentation'
      }
    ],
    
    // Approval Stages
    stages: [
      {
        id: 'stage-001',
        name: 'Engineering Review',
        order: 1,
        decisionState: 'pending',
        decisionMethod: 'majority',
        decisionMinimumCount: null,
        
        reviewers: [
          {
            id: 'reviewer-001',
            decisionState: 'pending',
            note: null,
            decidedAt: null,
            user: {
              id: 'user-002',
              name: 'Jane Smith',
              primaryEmail: 'jane.smith@example.com'
            }
          },
          {
            id: 'reviewer-002',
            decisionState: 'pending',
            note: null,
            decidedAt: null,
            user: {
              id: 'user-003',
              name: 'Bob Johnson',
              primaryEmail: 'bob.johnson@example.com'
            }
          }
        ],
        
        notifyList: [
          {
            id: 'notify-001',
            email: 'team@example.com',
            user: null
          }
        ]
      }
    ]
  },
  
  // Items array - combines change order item data with component information
  items: [
    {
      // Change order item fields
      id: 'item-001',
      itemId: 'comp-001',
      itemVersion: 2,
      proposedRevision: 'B',
      proposedStatusId: 'status-002',
      
      // Component data
      name: 'Test Component 1',
      description: 'Critical electronic component',
      type: 'PART',
      eid: 'EXT-001',
      
      // Status Information
      statusId: 'status-001',
      status: {
        id: 'status-001',
        name: 'Production',
        mapsTo: 'production',
        color: '#00FF00'
      },
      
      // Category Information
      categoryId: 'cat-001',
      category: {
        id: 'cat-001',
        name: 'Electronics'
      },
      
      // Version and Revision
      version: 2,
      revisionValue: 'A',
      revisionType: 'REV',
      state: 'RELEASED',
      
      // Timestamps
      releasedAt: new Date('2024-01-01T00:00:00Z'),
      createdAt: new Date('2023-12-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
      
      // Custom Attributes
      attributeValues: {
        quantity: 10,
        unit_cost: 25.50,
        supplier: 'ACME Corp',
        supplier_part_number: 'ACME-123',
        rohs_compliant: 'yes'
      },
      
      // Proposed status details
      proposedStatus: {
        id: 'status-002',
        name: 'Obsolete'
      }
    },
    {
      id: 'item-002',
      itemId: 'comp-002',
      itemVersion: 1,
      proposedRevision: '1',
      proposedStatusId: 'status-001',
      
      name: 'Test Component 2',
      description: 'Mechanical assembly',
      type: 'ASSEMBLY',
      eid: 'EXT-002',
      
      statusId: 'status-003',
      status: {
        id: 'status-003',
        name: 'Design',
        mapsTo: 'design',
        color: '#FFFF00'
      },
      
      categoryId: 'cat-002',
      category: {
        id: 'cat-002',
        name: 'Mechanical'
      },
      
      version: 1,
      revisionValue: null,
      revisionType: 'REV',
      state: 'MODIFIED',
      
      releasedAt: null,
      createdAt: new Date('2024-01-10T00:00:00Z'),
      updatedAt: new Date('2024-01-15T00:00:00Z'),
      
      attributeValues: {
        quantity: 0,
        unit_cost: 150.00,
        supplier: null,
        supplier_part_number: null
      },
      
      proposedStatus: {
        id: 'status-001',
        name: 'Production'
      }
    },
    {
      id: 'item-003',
      itemId: 'comp-003',
      itemVersion: 3,
      proposedRevision: '3',
      proposedStatusId: 'status-001',
      
      name: 'Test Component 3',
      description: 'Software module',
      type: 'SOFTWARE',
      eid: 'EXT-003',
      
      statusId: 'status-001',
      status: {
        id: 'status-001',
        name: 'Production',
        mapsTo: 'production',
        color: '#00FF00'
      },
      
      categoryId: 'cat-003',
      category: {
        id: 'cat-003',
        name: 'Software'
      },
      
      version: 3,
      revisionValue: '2',
      revisionType: 'VER',
      state: 'RELEASED',
      
      releasedAt: new Date('2024-01-05T00:00:00Z'),
      createdAt: new Date('2023-11-01T00:00:00Z'),
      updatedAt: new Date('2024-01-05T00:00:00Z'),
      
      attributeValues: {
        quantity: 5,
        license_type: 'MIT',
        version: '2.1.0'
      },
      
      proposedStatus: {
        id: 'status-001',
        name: 'Production'
      }
    }
  ]
};

// Mock fetch for network requests (like AI Summary)
const mockFetch = async (url, options) => {
  console.log(`🌐 Mock fetch called to: ${url}`);
  console.log(`   Method: ${options?.method || 'GET'}`);
  if (options?.body) {
    console.log(`   Payload size: ${options.body.length} bytes`);
  }
  
  // Return mock response for AI Summary webhook
  if (url.includes('durolabs.app.n8n.cloud')) {
    return {
      ok: true,
      status: 200,
      json: async () => ({
        summary: 'AI Summary: This change order TEST-CO-2024-01 contains 3 items with a total estimated cost impact of $5000. The change includes transitioning Test Component 1 from Production to Obsolete status, moving Test Component 2 from Design to Production status, and maintaining Test Component 3 in Production status. The justification provided is "Required for customer compliance". The change is currently in draft status pending Engineering Review.'
      })
    };
  }
  
  // Default mock response
  return {
    ok: false,
    status: 404,
    json: async () => ({ error: 'Not found' })
  };
};

async function testValidation() {
  console.log('🧪 Testing validation:', path.basename(validationFile));
  console.log('━'.repeat(50));
  
  try {
    // Create sandbox context
    const sandbox = {
      exports: {},
      console: mockConsole,
      data: testData,
      fetch: fetch,  // TEMPORARILY using real fetch for webhook testing
      // fetch: mockFetch,  // Uncomment to re-enable mock
      setTimeout,
      setInterval,
      clearTimeout,
      clearInterval
    };
    
    // Execute validation code
    const script = new vm.Script(code);
    const context = vm.createContext(sandbox);
    script.runInContext(context);
    
    // Check if validate function exists
    if (!sandbox.exports.validate) {
      throw new Error('Validation must export a validate function');
    }
    
    // Run validation
    console.log('\n📊 Test Data:');
    console.log(`   Change Order: ${testData.change_order.name}`);
    console.log(`   Status: ${testData.change_order.status}`);
    console.log(`   Resolution: ${testData.change_order.resolution}`);
    console.log(`   Items: ${testData.items.length} items`);
    console.log(`   Item names: ${testData.items.map(i => i.name).join(', ')}`);
    console.log(`   Current statuses: ${testData.items.map(i => i.status.name).join(', ')}`);
    console.log(`   Proposed statuses: ${testData.items.map(i => i.proposedStatus.name).join(', ')}`);
    console.log(`   Cost Impact: $${testData.change_order.contents[0].values[0]}`);
    
    console.log('\n🔄 Running validation...\n');
    const result = await sandbox.exports.validate(testData);
    
    console.log('\n' + '━'.repeat(50));
    console.log('📋 Validation Result:');
    console.log(`   Valid: ${result.valid ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Message: ${result.message || '(no message)'}`);
    
    if (logs.info.length > 0 || logs.log.length > 0 || logs.warn.length > 0 || logs.error.length > 0) {
      console.log('\n📝 Captured Logs:');
      if (logs.info.length > 0) console.log(`   Info: ${logs.info.length} messages`);
      if (logs.log.length > 0) console.log(`   Log: ${logs.log.length} messages`);
      if (logs.warn.length > 0) console.log(`   Warn: ${logs.warn.length} messages`);
      if (logs.error.length > 0) console.log(`   Error: ${logs.error.length} messages`);
    }
    
    console.log('\n✅ Validation executed successfully!');
    
  } catch (error) {
    console.error('\n❌ Validation test failed:');
    console.error(`   ${error.message}`);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

testValidation();
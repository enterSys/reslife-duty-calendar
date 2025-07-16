const https = require('https');
const fs = require('fs');

// Google Sheets CSV URL
const SHEETS_CSV_URL = 'https://docs.google.com/spreadsheets/d/14fHBMCIw_iZDbx0JwaNXiLzghV0VpY6rvdzqvsvRtNc/export?format=csv';

// User mapping
const userMapping = {
  'Emile C': 3,
  'Sarah P': 4,
  'Mahzyar M': 5,
  'Anmol': 6,
  'Catalina D': 7,
  'Tasnim S': 8,
  'Gloria R': 9
};

async function fetchGoogleSheetsData() {
  return new Promise((resolve, reject) => {
    https.get(SHEETS_CSV_URL, (res) => {
      if (res.statusCode === 307 || res.statusCode === 302) {
        const redirectUrl = res.headers.location;
        console.log('Following redirect to:', redirectUrl);
        
        https.get(redirectUrl, (redirectRes) => {
          let data = '';
          redirectRes.on('data', (chunk) => data += chunk);
          redirectRes.on('end', () => resolve(data));
        }).on('error', reject);
      } else {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => resolve(data));
      }
    }).on('error', reject);
  });
}

function parseCSV(csvData) {
  const lines = csvData.trim().split('\n');
  const result = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const fields = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
    const cleanFields = fields.map(field => field.replace(/^"|"$/g, '').trim());
    
    if (cleanFields.length >= 2) {
      const dateStr = cleanFields[0];
      const name = cleanFields[1];
      
      if (dateStr && name && name !== 'Name' && name !== 'Date' && name !== 'Ashburne & Sheavyn') {
        result.push({ date: dateStr, name: name });
      }
    }
  }
  
  return result;
}

function parseDate(dateStr) {
  // Remove day name if present (e.g., "Tue 01/07/25" -> "01/07/25")
  const cleanDate = dateStr.replace(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+/, '');
  
  // Parse DD/MM/YY format
  const match = cleanDate.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (match) {
    const day = parseInt(match[1]);
    const month = parseInt(match[2]);
    let year = parseInt(match[3]);
    
    // Convert 2-digit year to 4-digit
    if (year < 50) {
      year += 2000;
    } else if (year < 100) {
      year += 1900;
    }
    
    return new Date(year, month - 1, day);
  }
  
  return null;
}

function getDutyType(date) {
  const dayOfWeek = date.getDay();
  return (dayOfWeek === 0 || dayOfWeek === 6) ? 'weekend' : 'weekday';
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

async function main() {
  try {
    console.log('🚀 Generating duty INSERT statements...\n');
    
    // Fetch and parse data
    console.log('📥 Fetching Google Sheets data...');
    const csvData = await fetchGoogleSheetsData();
    
    console.log('📊 Parsing CSV data...');
    const parsedData = parseCSV(csvData);
    console.log(`✅ Parsed ${parsedData.length} entries`);
    
    // Generate SQL statements
    console.log('\n📝 Generating SQL statements...');
    const sqlStatements = [];
    let processedCount = 0;
    
    for (const entry of parsedData) {
      const date = parseDate(entry.date);
      if (!date) {
        console.warn(`⚠️ Could not parse date: ${entry.date}`);
        continue;
      }
      
      const userId = userMapping[entry.name];
      if (!userId) {
        console.warn(`⚠️ Unknown user: ${entry.name}`);
        continue;
      }
      
      const dutyType = getDutyType(date);
      const formattedDate = formatDate(date);
      
      // Check if we already processed this date for this user to avoid duplicates
      const isDuplicate = sqlStatements.some(stmt => 
        stmt.includes(`user_id, duty_date, duty_type`) && 
        stmt.includes(`${userId}, '${formattedDate}', '${dutyType}'`)
      );
      
      if (!isDuplicate) {
        sqlStatements.push(
          `INSERT INTO duties (user_id, duty_date, duty_type, notes, created_at, updated_at) 
           VALUES (${userId}, '${formattedDate}', '${dutyType}', 'Imported from Google Sheets', NOW(), NOW())
           ON CONFLICT (user_id, duty_date) DO NOTHING`
        );
        processedCount++;
      }
    }
    
    console.log(`✅ Generated ${sqlStatements.length} SQL statements`);
    
    // Save to file
    const outputFile = 'scripts/duty-inserts.sql';
    fs.writeFileSync(outputFile, sqlStatements.join(';\n\n') + ';');
    console.log(`📄 Saved SQL statements to: ${outputFile}`);
    
    // Create batches for execution
    const batchSize = 50;
    const batches = [];
    
    for (let i = 0; i < sqlStatements.length; i += batchSize) {
      batches.push(sqlStatements.slice(i, i + batchSize));
    }
    
    console.log(`\n🎯 Ready to execute ${batches.length} batches of ${batchSize} statements each`);
    console.log(`📊 Total unique duty assignments: ${processedCount}`);
    
    // Save batch execution script
    const batchScript = `
// Batch execution script for duty inserts
const batches = ${JSON.stringify(batches, null, 2)};

console.log('Execute these batches using Neon MCP run_sql_transaction:');
batches.forEach((batch, index) => {
  console.log(\`\\nBatch \${index + 1}:\`);
  console.log(JSON.stringify(batch, null, 2));
});
`;
    
    fs.writeFileSync('scripts/execute-batches.js', batchScript);
    console.log('📄 Saved batch execution script to: scripts/execute-batches.js');
    
    return {
      totalStatements: sqlStatements.length,
      batchCount: batches.length,
      batchSize: batchSize,
      batches: batches
    };
    
  } catch (error) {
    console.error('❌ Error generating duty inserts:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
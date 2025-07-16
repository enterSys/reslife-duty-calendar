// Import script to process Google Sheets data and populate Neon database
const https = require('https');
const crypto = require('crypto');

// Google Sheets CSV URL
const SHEETS_CSV_URL = 'https://docs.google.com/spreadsheets/d/14fHBMCIw_iZDbx0JwaNXiLzghV0VpY6rvdzqvsvRtNc/export?format=csv';

// Neon database configuration
const NEON_CONFIG = {
  projectId: 'small-sky-71229597',
  database: 'neondb'
};

// Function to fetch CSV data from Google Sheets
async function fetchGoogleSheetsData() {
  return new Promise((resolve, reject) => {
    https.get(SHEETS_CSV_URL, (res) => {
      if (res.statusCode === 307 || res.statusCode === 302) {
        // Handle redirect
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

// Function to parse CSV data
function parseCSV(csvData) {
  const lines = csvData.trim().split('\n');
  const result = [];
  
  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Parse CSV line (handle commas in quotes)
    const fields = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
    const cleanFields = fields.map(field => field.replace(/^"|"$/g, '').trim());
    
    if (cleanFields.length >= 2) {
      const dateStr = cleanFields[0];
      const name = cleanFields[1];
      
      if (dateStr && name && name !== 'Name') {
        result.push({ date: dateStr, name: name });
      }
    }
  }
  
  return result;
}

// Function to parse date from DD/MM/YY format
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

// Function to extract unique names
function extractUniqueNames(data) {
  const names = new Set();
  data.forEach(entry => {
    if (entry.name && entry.name.trim()) {
      names.add(entry.name.trim());
    }
  });
  return Array.from(names);
}

// Function to generate email from name
function generateEmail(name) {
  const cleanName = name.toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, '.')
    .replace(/\.$/, '');
  
  return `${cleanName}@reslife.com`;
}

// Function to generate a simple password hash
function generatePasswordHash(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Function to determine duty type based on date
function getDutyType(date) {
  const dayOfWeek = date.getDay();
  return (dayOfWeek === 0 || dayOfWeek === 6) ? 'weekend' : 'weekday';
}

async function main() {
  try {
    console.log('🚀 Starting Google Sheets import process...\n');
    
    // Step 1: Fetch Google Sheets data
    console.log('📥 Fetching Google Sheets data...');
    const csvData = await fetchGoogleSheetsData();
    console.log('✅ Successfully fetched CSV data');
    
    // Step 2: Parse CSV data
    console.log('📊 Parsing CSV data...');
    const parsedData = parseCSV(csvData);
    console.log(`✅ Parsed ${parsedData.length} entries`);
    
    // Step 3: Extract unique names
    console.log('👥 Extracting unique names...');
    const uniqueNames = extractUniqueNames(parsedData);
    console.log(`✅ Found ${uniqueNames.length} unique names:`);
    uniqueNames.forEach(name => console.log(`  - ${name}`));
    
    // Step 4: Prepare user data for database import
    console.log('\n🔧 Preparing user data for database...');
    const userData = uniqueNames.map(name => {
      const email = generateEmail(name);
      const passwordHash = generatePasswordHash('defaultPassword123'); // Default password
      
      return {
        name: name,
        email: email,
        passwordHash: passwordHash,
        role: 'member',
        allocatedBuilding: 'Ashburne & Sheavyn'
      };
    });
    
    console.log('✅ User data prepared:');
    userData.forEach(user => console.log(`  - ${user.name} (${user.email})`));
    
    // Step 5: Prepare duty data
    console.log('\n📅 Preparing duty data...');
    const dutyData = parsedData.map(entry => {
      const date = parseDate(entry.date);
      if (!date) {
        console.warn(`⚠️ Could not parse date: ${entry.date}`);
        return null;
      }
      
      return {
        memberName: entry.name,
        date: date,
        dutyType: getDutyType(date),
        notes: `Duty assignment from import`
      };
    }).filter(Boolean);
    
    console.log(`✅ Prepared ${dutyData.length} duty assignments`);
    
    // Step 6: Display sample data
    console.log('\n📋 Sample duty data:');
    dutyData.slice(0, 5).forEach(duty => {
      console.log(`  - ${duty.memberName}: ${duty.date.toISOString().split('T')[0]} (${duty.dutyType})`);
    });
    
    // Step 7: Generate SQL statements
    console.log('\n🔧 Generating SQL statements...');
    
    // Generate user INSERT statements
    const userInserts = userData.map(user => {
      return `INSERT INTO users (email, password_hash, full_name, role, allocated_building, created_at, updated_at) 
VALUES ('${user.email}', '${user.passwordHash}', '${user.name}', '${user.role}', '${user.allocatedBuilding}', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET 
  full_name = EXCLUDED.full_name,
  allocated_building = EXCLUDED.allocated_building,
  updated_at = NOW();`;
    });
    
    console.log(`✅ Generated ${userInserts.length} user INSERT statements`);
    
    console.log('\n🎯 READY TO IMPORT TO DATABASE');
    console.log('Next steps:');
    console.log('1. Execute user INSERT statements');
    console.log('2. Execute duty INSERT statements after getting user IDs');
    console.log('3. Verify data integrity');
    
    // Return data for further processing
    return {
      userData,
      dutyData,
      userInserts,
      stats: {
        totalEntries: parsedData.length,
        uniqueNames: uniqueNames.length,
        dutyAssignments: dutyData.length
      }
    };
    
  } catch (error) {
    console.error('❌ Error during import process:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, parseCSV, parseDate, extractUniqueNames, generateEmail };
const { PrismaClient } = require('@prisma/client');
const https = require('https');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

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

async function main() {
  try {
    console.log('🚀 Starting duty population process...\n');
    
    // Fetch and parse data
    console.log('📥 Fetching Google Sheets data...');
    const csvData = await fetchGoogleSheetsData();
    
    console.log('📊 Parsing CSV data...');
    const parsedData = parseCSV(csvData);
    console.log(`✅ Parsed ${parsedData.length} entries`);
    
    // Process duty assignments
    console.log('\n📅 Processing duty assignments...');
    const dutyAssignments = [];
    
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
      
      dutyAssignments.push({
        userId: userId,
        dutyDate: date,
        dutyType: getDutyType(date),
        notes: 'Imported from Google Sheets'
      });
    }
    
    console.log(`✅ Processed ${dutyAssignments.length} duty assignments`);
    
    // Insert duty assignments
    console.log('\n💾 Inserting duty assignments into database...');
    let inserted = 0;
    let skipped = 0;
    
    for (const duty of dutyAssignments) {
      try {
        // Check if duty already exists
        const existingDuty = await prisma.duty.findFirst({
          where: {
            userId: duty.userId,
            dutyDate: duty.dutyDate
          }
        });
        
        if (existingDuty) {
          skipped++;
          continue;
        }
        
        // Create new duty
        await prisma.duty.create({
          data: duty
        });
        
        inserted++;
        
        if (inserted % 50 === 0) {
          console.log(`  📝 Inserted ${inserted} duties...`);
        }
        
      } catch (error) {
        console.error(`❌ Error inserting duty for ${duty.userId} on ${duty.dutyDate.toISOString().split('T')[0]}:`, error.message);
      }
    }
    
    console.log(`\n✅ Import complete!`);
    console.log(`📊 Summary:`);
    console.log(`  - Inserted: ${inserted} duties`);
    console.log(`  - Skipped: ${skipped} duties`);
    console.log(`  - Total processed: ${dutyAssignments.length}`);
    
    // Verify data
    console.log('\n🔍 Verifying data...');
    const totalUsers = await prisma.user.count();
    const totalDuties = await prisma.duty.count();
    
    console.log(`👥 Total users: ${totalUsers}`);
    console.log(`📅 Total duties: ${totalDuties}`);
    
  } catch (error) {
    console.error('❌ Error during duty population:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
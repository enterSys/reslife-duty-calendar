// Google Sheets integration utility
// In production, this would use the Google Sheets API with proper authentication

export interface SheetData {
  date: string
  memberName: string
}

/**
 * Fetches duty roster data from Google Sheets
 * @param spreadsheetId The ID of the Google Sheets document
 * @param range The range to fetch (e.g., "A:B")
 * @returns Array of duty assignments
 */
export async function fetchGoogleSheetsData(
  spreadsheetId: string,
  range: string = "A:B"
): Promise<SheetData[]> {
  // In production, this would:
  // 1. Authenticate with Google Sheets API using service account or OAuth
  // 2. Fetch data from the specified spreadsheet and range
  // 3. Parse and return the data
  
  // For demonstration purposes, return sample data
  // The actual implementation would look like:
  /*
  const sheets = google.sheets({ version: 'v4', auth });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });
  
  const rows = response.data.values || [];
  return rows.slice(1).map(row => ({
    date: row[0] || '',
    memberName: row[1] || '',
  })).filter(row => row.date && row.memberName);
  */
  
  // Sample data matching the expected format
  return [
    { date: "1/2/2024", memberName: "John Doe" },
    { date: "1/3/2024", memberName: "Jane Smith" },
    { date: "1/4/2024", memberName: "Robert Johnson" },
    { date: "1/5/2024", memberName: "Emily Davis" },
    { date: "1/6/2024", memberName: "Michael Brown" },
    { date: "1/7/2024", memberName: "Sarah Wilson" },
    { date: "1/8/2024", memberName: "David Martinez" },
    { date: "1/9/2024", memberName: "Lisa Anderson" },
    { date: "1/10/2024", memberName: "James Taylor" },
    { date: "1/11/2024", memberName: "Mary Thomas" },
  ]
}

/**
 * Extracts the spreadsheet ID from a Google Sheets URL
 * @param url The full Google Sheets URL
 * @returns The spreadsheet ID or null if invalid
 */
export function extractSpreadsheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  return match ? match[1] : null
}
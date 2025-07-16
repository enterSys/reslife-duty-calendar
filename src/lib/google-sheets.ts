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
  
  // This function is deprecated - use direct CSV import or API integration instead
  return []
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
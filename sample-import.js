/**
 * Sample Excel Import Script
 * Untuk membuat contoh file Excel gunakan library seperti xlsx atau openpyxl
 * 
 * Berikut script untuk generate file contoh:
 */

const XLSX = require('xlsx');

// Create sample workbook
const wb = XLSX.utils.book_new();

// Sample data 1
const data1 = [
  ['SPK', 'RAK'],
  ['15052', 'N1'],
  ['15239', 'L10'],
  ['15250', 'K25'],
  ['15097', 'J16'],
  ['14543', 'I7'],
];

const ws1 = XLSX.utils.aoa_to_sheet(data1);
XLSX.utils.book_append_sheet(wb, ws1, 'Sheet1');

// Sample data 2 (alternative format)
const data2 = [
  ['No. SPK', 'Lokasi RAK'],
  ['15245', 'N4'],
  ['15238', 'L16'],
  ['15241', 'K25'],
  ['15245', 'J19'],
  ['14831', 'I9'],
];

const ws2 = XLSX.utils.aoa_to_sheet(data2);
XLSX.utils.book_append_sheet(wb, ws2, 'Sheet2');

// Write file
XLSX.writeFile(wb, 'sample-import.xlsx');

console.log('Sample Excel file created: sample-import.xlsx');

import { Student } from '../types';

/**
 * Parses raw text or CSV content into an array of Student objects.
 * Supports:
 * - Direct pasting of names separated by newlines, commas, tabs, spaces
 * - Standard CSV files with or without headers (e.g. 座號, 姓名 or Name, ID)
 * - Numbered lines (e.g. "1. 陳小明" or "05 王大同")
 */
export function parseStudentsFromText(rawText: string): { students: Student[]; warnings: string[] } {
  const warnings: string[] = [];
  if (!rawText || !rawText.trim()) {
    return { students: [], warnings: [] };
  }

  // Strip BOM if present
  let cleanText = rawText.replace(/^\uFEFF/, '').trim();
  const lines = cleanText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  if (lines.length === 0) {
    return { students: [], warnings: [] };
  }

  // Check if first line appears to be CSV header
  const firstLine = lines[0];
  const isDelimited = firstLine.includes(',') || firstLine.includes('\t') || firstLine.includes(';');

  const students: Student[] = [];

  if (isDelimited) {
    // Delimiter detection
    const delimiter = firstLine.includes('\t') ? '\t' : (firstLine.includes(';') ? ';' : ',');
    
    // Parse CSV rows handling simple quotes
    const rows = lines.map(line => parseCsvLine(line, delimiter));

    if (rows.length > 0) {
      const headerRow = rows[0].map(c => c.trim().toLowerCase());
      
      // Look for name column index
      let nameIndex = headerRow.findIndex(h => 
        h.includes('名') || h.includes('name') || h.includes('學生') || h.includes('student')
      );
      let seatIndex = headerRow.findIndex(h => 
        h.includes('座號') || h.includes('號') || h.includes('seat') || h.includes('no') || h.includes('編號') || h.includes('學號')
      );

      let startRow = 0;
      if (nameIndex !== -1) {
        // First line is indeed a header
        startRow = 1;
      } else {
        // No obvious header keyword, detect columns
        // If 2 columns, check if first column is numeric (likely seat number)
        if (rows[0].length >= 2) {
          const col0IsNum = /^\d+$/.test(rows[0][0].trim());
          if (col0IsNum) {
            seatIndex = 0;
            nameIndex = 1;
          } else {
            nameIndex = 0;
            seatIndex = 1;
          }
        } else {
          nameIndex = 0;
        }
      }

      for (let i = startRow; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        const rawName = row[nameIndex]?.trim();
        const rawSeat = seatIndex !== -1 && row[seatIndex] ? row[seatIndex].trim() : undefined;

        if (rawName) {
          students.push({
            id: `stu_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${i}`,
            name: rawName,
            seatNumber: rawSeat,
          });
        }
      }
    }
  }

  // If no students parsed yet (e.g. Plain text lines or space/comma list)
  if (students.length === 0) {
    let indexCounter = 1;
    for (const line of lines) {
      // If line contains multiple comma or space separated names
      const tokens = line.includes(',') 
        ? line.split(',').map(s => s.trim()).filter(Boolean)
        : (line.includes('、') ? line.split('、').map(s => s.trim()).filter(Boolean) : [line]);

      for (const token of tokens) {
        if (!token) continue;
        
        // Check if prefixed with number like "1. 王小明" or "01 王小明" or "1、王小明"
        const match = token.match(/^(\d+)[.、\s\t-]+\s*(.+)$/);
        if (match) {
          students.push({
            id: `stu_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${indexCounter++}`,
            name: match[2].trim(),
            seatNumber: match[1].trim(),
          });
        } else {
          students.push({
            id: `stu_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${indexCounter++}`,
            name: token.trim(),
          });
        }
      }
    }
  }

  return { students, warnings };
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

/**
 * Pre-set sample class dataset with realistic Taiwanese student names and seat numbers
 */
export const SAMPLE_STUDENTS: Student[] = [
  { id: 's01', seatNumber: '01', name: '陳子安' },
  { id: 's02', seatNumber: '02', name: '林冠宇' },
  { id: 's03', seatNumber: '03', name: '黃品妍' },
  { id: 's04', seatNumber: '04', name: '張哲維' },
  { id: 's05', seatNumber: '05', name: '李宣妤' },
  { id: 's06', seatNumber: '06', name: '王俊傑' },
  { id: 's07', seatNumber: '07', name: '吳佩珊' },
  { id: 's08', seatNumber: '08', name: '劉宇廷' },
  { id: 's09', seatNumber: '09', name: '蔡宜庭' },
  { id: 's10', seatNumber: '10', name: '楊承翰' },
  { id: 's11', seatNumber: '11', name: '許家瑋' },
  { id: 's12', seatNumber: '12', name: '鄭恩綺' },
  { id: 's13', seatNumber: '13', name: '謝宗佑' },
  { id: 's14', seatNumber: '14', name: '洪語婕' },
  { id: 's15', seatNumber: '15', name: '邱柏均' },
  { id: 's16', seatNumber: '16', name: '曾雅婷' },
  { id: 's17', seatNumber: '17', name: '廖偉成' },
  { id: 's18', seatNumber: '18', name: '賴品希' },
  { id: 's19', seatNumber: '19', name: '徐晨皓' },
  { id: 's20', seatNumber: '20', name: '周佳蓉' },
  { id: 's21', seatNumber: '21', name: '葉書帆' },
  { id: 's22', seatNumber: '22', name: '蘇靖雯' },
  { id: 's23', seatNumber: '23', name: '莊凱元' },
  { id: 's24', seatNumber: '24', name: '江心悅' },
];

/**
 * Generates downloadable CSV content with UTF-8 BOM so Excel opens Chinese properly.
 */
export function exportGroupsToCsv(groups: { name: string; members: Student[] }[]): string {
  let csv = '\uFEFF組別,組員座號,組員姓名\n';
  groups.forEach(group => {
    group.members.forEach(member => {
      csv += `"${group.name}","${member.seatNumber || ''}","${member.name}"\n`;
    });
  });
  return csv;
}


import { RowData } from '../types';

declare const XLSX: any;

export const parseExcelFile = (file: File): Promise<RowData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

        const normalizedData = jsonData.map(row => {
          const originalKey = Object.keys(row).find(key => key.toLowerCase() === 'original');
          const duplicatesKey = Object.keys(row).find(key => key.toLowerCase() === 'duplicates');

          if (!originalKey || !duplicatesKey) {
            throw new Error('File must contain "Original" and "Duplicates" columns.');
          }

          return {
            Original: String(row[originalKey]),
            Duplicates: String(row[duplicatesKey]),
          };
        });

        resolve(normalizedData as RowData[]);
      } catch (error) {
        if (error instanceof Error) {
            reject(new Error(`Error parsing file: ${error.message}`));
        } else {
            reject(new Error('An unknown error occurred during file parsing.'));
        }
      }
    };
    reader.onerror = (error) => reject(new Error('Error reading file.'));
    reader.readAsBinaryString(file);
  });
};

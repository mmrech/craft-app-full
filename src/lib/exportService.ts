import * as XLSX from 'xlsx';

export interface ExtractionData {
  id: string;
  documentName: string;
  extractedDate: string;
  stepNumber: number;
  fieldName: string;
  extractedText: string;
  pageNumber: number;
  method: string;
}

export interface DocumentExportData {
  documentId: string;
  documentName: string;
  createdAt: string;
  totalPages: number;
  fileSize: number;
  formData: any;
  extractions: ExtractionData[];
}

export class ExportService {
  static exportToCSV(data: DocumentExportData[], filename: string = 'extractions.csv') {
    const rows: any[] = [];
    
    data.forEach(doc => {
      doc.extractions.forEach(extraction => {
        rows.push({
          'Document Name': doc.documentName,
          'Extraction Date': doc.createdAt,
          'Total Pages': doc.totalPages,
          'File Size (MB)': (doc.fileSize / (1024 * 1024)).toFixed(2),
          'Step Number': extraction.stepNumber,
          'Field Name': extraction.fieldName,
          'Extracted Text': extraction.extractedText,
          'Page Number': extraction.pageNumber,
          'Method': extraction.method
        });
      });
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    this.downloadBlob(blob, filename);
  }

  static exportToExcel(data: DocumentExportData[], filename: string = 'extractions.xlsx') {
    const workbook = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = data.map(doc => ({
      'Document Name': doc.documentName,
      'Created Date': doc.createdAt,
      'Total Pages': doc.totalPages,
      'File Size (MB)': (doc.fileSize / (1024 * 1024)).toFixed(2),
      'Total Extractions': doc.extractions.length,
      'Unique Fields': new Set(doc.extractions.map(e => e.fieldName)).size
    }));
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    this.styleSheet(summarySheet);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Extractions Sheet
    const extractionsData: any[] = [];
    data.forEach(doc => {
      doc.extractions.forEach(extraction => {
        extractionsData.push({
          'Document Name': doc.documentName,
          'Extraction Date': doc.createdAt,
          'Step Number': extraction.stepNumber,
          'Field Name': extraction.fieldName,
          'Extracted Text': extraction.extractedText,
          'Page Number': extraction.pageNumber,
          'Method': extraction.method
        });
      });
    });
    const extractionsSheet = XLSX.utils.json_to_sheet(extractionsData);
    this.styleSheet(extractionsSheet);
    XLSX.utils.book_append_sheet(workbook, extractionsSheet, 'Extractions');

    // Form Data Sheet
    const formDataRows: any[] = [];
    data.forEach(doc => {
      if (doc.formData) {
        Object.entries(doc.formData).forEach(([key, value]) => {
          formDataRows.push({
            'Document Name': doc.documentName,
            'Field': key,
            'Value': typeof value === 'object' ? JSON.stringify(value) : value
          });
        });
      }
    });
    if (formDataRows.length > 0) {
      const formDataSheet = XLSX.utils.json_to_sheet(formDataRows);
      this.styleSheet(formDataSheet);
      XLSX.utils.book_append_sheet(workbook, formDataSheet, 'Form Data');
    }

    XLSX.writeFile(workbook, filename);
  }

  static exportToJSON(data: DocumentExportData[], filename: string = 'extractions.json') {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    this.downloadBlob(blob, filename);
  }

  private static styleSheet(sheet: XLSX.WorkSheet) {
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
    
    // Set column widths
    const colWidths: any[] = [];
    for (let C = range.s.c; C <= range.e.c; ++C) {
      let maxWidth = 10;
      for (let R = range.s.r; R <= range.e.r; ++R) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = sheet[cellAddress];
        if (cell && cell.v) {
          const cellLength = cell.v.toString().length;
          maxWidth = Math.max(maxWidth, Math.min(cellLength, 50));
        }
      }
      colWidths.push({ wch: maxWidth });
    }
    sheet['!cols'] = colWidths;
  }

  private static downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  static generateFilename(prefix: string, format: 'csv' | 'xlsx' | 'json'): string {
    const date = new Date().toISOString().split('T')[0];
    return `${prefix}_${date}.${format}`;
  }
}

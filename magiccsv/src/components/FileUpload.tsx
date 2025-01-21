import React, { useState } from 'react';
import { Button, Stack } from '@mui/material';
import Papa, { ParseResult } from 'papaparse';
import * as XLSX from 'xlsx';
import NewCSVDialog from './NewCSVDialog';

export interface MagicTableSheet {
  name: string;
  rows: Record<string, any>[];
}

interface FileUploadProps {
  onFileSelected: (sheets: MagicTableSheet[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelected }) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const parseCsv = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      transformHeader: (header: string) => header.trim(),
      transform: (value: string) => {
        if (value === 'true' || value === 'false') {
          return value;
        }
        return value.toString().trim();
      },
      complete: (results: ParseResult<Record<string, any>>) => {
        const sheet: MagicTableSheet = {
          name: file.name.replace('.csv', ''),
          rows: results.data.map((row, index) => ({
            ...row,
            __rowId: index.toString()
          }))
        };
        onFileSelected([sheet]);
      },
      error: (error: Error) => {
        console.error('Error parsing CSV file:', error);
      },
    });
  };

  const parseExcel = (file: File) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (!evt.target?.result) return;
      
      const arrayBuffer = evt.target.result as ArrayBuffer;
      const data = new Uint8Array(arrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });

      const allSheets: MagicTableSheet[] = workbook.SheetNames.map(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
          defval: '',
        });

        // Add __rowId to each row
        const rowsWithIds = rows.map((row, index) => ({
          ...row,
          __rowId: `${sheetName}_${index}`
        }));

        return {
          name: sheetName,
          rows: rowsWithIds
        };
      });

      onFileSelected(allSheets);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    if (lowerName.endsWith('.csv')) {
      parseCsv(file);
    } else if (lowerName.endsWith('.xls') || lowerName.endsWith('.xlsx')) {
      parseExcel(file);
    }
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <Stack direction="row" spacing={2}>
        <input 
          accept=".csv,.xls,.xlsx" 
          style={{ display: 'none' }} 
          id="open-file" 
          type="file" 
          onChange={handleFileChange} 
        />
        <label htmlFor="open-file">
          <Button
            variant="contained"
            color="primary"
            component="span"
            startIcon={<span style={{ fontSize: '1.2rem' }}>📂</span>}
          >
            Open File
          </Button>
        </label>
        
        <Button
          variant="contained"
          color="secondary"
          onClick={() => setDialogOpen(true)}
          startIcon={<span style={{ fontSize: '1.2rem' }}>✨</span>}
        >
          New Sheet
        </Button>
      </Stack>

      <NewCSVDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreate={(data) => onFileSelected([{
          name: 'New Sheet',
          rows: data.map((row, index) => ({
            ...row,
            __rowId: index.toString()
          }))
        }])}
      />
    </div>
  );
};

export default FileUpload;
// src/components/FileUpload.tsx

import React, { useState } from 'react';
import { Button, Stack } from '@mui/material';
import Papa from 'papaparse';
import NewCSVDialog from './NewCSVDialog';

interface FileUploadProps {
  onFileSelected: (data: any[], columns: string[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelected }) => {
  const [dialogOpen, setDialogOpen] = useState(false);

const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  const selectedFile = event.target.files?.[0];
  if (selectedFile) {
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      transformHeader: (header: string) => header.trim(),
      transform: (value: string) => {
        // Convert all values to strings and preserve true/false as strings
        if (value === 'true' || value === 'false') {
          return value;
        }
        return value.toString().trim();
      },
      complete: (results) => {
        const data = results.data as any[];
        const columns = results.meta.fields || [];
        onFileSelected(data, columns);
      },
      error: (error) => {
        console.error('Error parsing CSV file:', error);
      },
    });
  }
};

  return (
    <div style={{ marginBottom: 16 }}>
      <Stack direction="row" spacing={2}>
        <input 
          accept=".csv" 
          style={{ display: 'none' }} 
          id="open-csv-file" 
          type="file" 
          onChange={handleFileChange} 
        />
        <label htmlFor="open-csv-file">
          <Button
            variant="contained"
            color="primary"
            component="span"
            startIcon={<span style={{ fontSize: '1.2rem' }}>📂</span>}
          >
            Open CSV
          </Button>
        </label>
        
        <Button
          variant="contained"
          color="secondary"
          onClick={() => setDialogOpen(true)}
          startIcon={<span style={{ fontSize: '1.2rem' }}>✨</span>}
        >
          New CSV 
        </Button>
      </Stack>

      <NewCSVDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreate={onFileSelected}
      />
    </div>
  );
};

export default FileUpload;
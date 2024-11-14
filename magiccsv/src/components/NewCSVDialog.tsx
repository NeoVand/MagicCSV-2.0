import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack
} from '@mui/material';

interface NewCSVDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: any[], columns: string[]) => void;
}

const NewCSVDialog: React.FC<NewCSVDialogProps> = ({ open, onClose, onCreate }) => {
  const [rows, setRows] = useState<number>(5);
  const [columns, setColumns] = useState<number>(3);

  const generateExcelColumnName = (index: number): string => {
    let columnName = '';
    while (index >= 0) {
      columnName = String.fromCharCode(65 + (index % 26)) + columnName;
      index = Math.floor(index / 26) - 1;
    }
    return columnName;
  };

  const handleCreate = () => {
    // Generate column headers (A, B, C, ..., AA, AB, etc.)
    const columnHeaders = Array.from({ length: columns }, (_, i) => generateExcelColumnName(i));
    
    // Generate empty rows
    const emptyData = Array.from({ length: rows }, () => 
      Object.fromEntries(columnHeaders.map(header => [header, '']))
    );

    onCreate(emptyData, columnHeaders);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Create New CSV</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 2, minWidth: '300px' }}>
          <TextField
            label="Number of Columns"
            type="number"
            value={columns}
            onChange={(e) => setColumns(Math.max(1, parseInt(e.target.value) || 1))}
            inputProps={{ min: 1 }}
          />
          <TextField
            label="Number of Rows"
            type="number"
            value={rows}
            onChange={(e) => setRows(Math.max(1, parseInt(e.target.value) || 1))}
            inputProps={{ min: 1 }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleCreate} variant="contained">
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewCSVDialog; 
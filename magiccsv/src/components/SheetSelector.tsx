import React from 'react';
import { Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { MagicTableSheet } from './FileUpload';

interface SheetSelectorProps {
  sheets: MagicTableSheet[];
  activeIndex: number;
  onSheetChange: (index: number) => void;
  sx?: any;
}

const SheetSelector: React.FC<SheetSelectorProps> = ({
  sheets,
  activeIndex,
  onSheetChange,
  sx,
}) => {
  if (sheets.length <= 1) return null;

  return (
    <FormControl variant="outlined" size="medium" sx={{ minWidth: 200, ...sx }}>
      <InputLabel id="sheet-select-label">Sheet</InputLabel>
      <Select
        labelId="sheet-select-label"
        value={activeIndex}
        onChange={(e) => onSheetChange(Number(e.target.value))}
        label="Sheet"
      >
        {sheets.map((sheet, index) => (
          <MenuItem key={index} value={index}>
            {sheet.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default SheetSelector;

import React, { useState } from 'react';
import { 
  Popover, 
  Tabs,
  Tab,
  TextField, 
  Stack,
  Typography,
  Button,
  Box,
  Chip,
  IconButton,
  Tooltip,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

interface RangeFunctionPopupProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onSelect: (functionType: string, params: string[]) => void;
  currentRow: number;
  totalRows: number;
}

const RangeFunctionPopup: React.FC<RangeFunctionPopupProps> = React.memo(({
  anchorEl,
  onClose,
  onSelect,
  currentRow,
  totalRows,
}) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const [selectedFunction, setSelectedFunction] = React.useState<string>('range');
  const [params, setParams] = React.useState<string[]>(['', '']);
  const secondInputRef = React.useRef<HTMLInputElement>(null);
  const atInputRef = React.useRef<HTMLInputElement>(null);

  const functions = [
    { 
      name: 'range', 
      label: 'Range', 
      params: ['start', 'end']
    },
    { 
      name: 'at', 
      label: 'At Position', 
      params: ['position'] 
    }
  ];

  const helpText = {
    range: "Range function lets you reference previous rows:\n• Use numbers (1, 2, 3...) for specific positions\n• 'THIS' refers to current row\n• 'THIS+n' or 'THIS-n' for relative positions\n• 'END' refers to last row",
    at: "At function lets you reference a specific row:\n• Use numbers for exact positions\n• 'THIS' refers to current row\n• 'THIS+n' or 'THIS-n' for relative positions\n• 'END' refers to last row"
  };

  const getQuickSelectValues = (paramName: string) => {
    switch (paramName) {
      case 'start':
        return ['1', 'THIS', 'THIS-1'];
      case 'end':
      case 'position':
        return ['THIS-1', 'THIS', 'THIS+1', 'END'];
      default:
        return [];
    }
  };

  const handleParamChange = (index: number, value: string) => {
    const newParams = [...params];
    newParams[index] = value;
    setParams(newParams);
  };

  const handleKeyPress = (event: React.KeyboardEvent, index: number) => {
    if (event.key === 'Enter' && !event.shiftKey && selectedFunction && !params.some(p => p === '')) {
      onSelect(selectedFunction, params);
      onClose();
    } else if (event.key === 'Tab' && !event.shiftKey) {
      event.preventDefault();
      if (selectedFunction === 'range' && index === 0) {
        secondInputRef.current?.focus();
      } else if (selectedFunction === 'range' && index === 1) {
        // Move to the "At" tab
        setSelectedFunction('at');
        setParams(['']);
        setTimeout(() => atInputRef.current?.focus(), 0);
      } else if (selectedFunction === 'at') {
        // Cycle back to first input of range
        setSelectedFunction('range');
        setParams(['', '']);
        // Focus first input of range tab
        const inputs = document.querySelectorAll('input[type="text"]');
        if (inputs[0]) {
          (inputs[0] as HTMLInputElement).focus();
        }
      }
    }
  };


  const renderParamInputs = () => {
    const selectedFuncDef = functions.find(f => f.name === selectedFunction);
    if (!selectedFuncDef) return null;

    return (
      <Stack spacing={1.5} sx={{ p: 1.5 }}>
        {selectedFuncDef.params.map((param, index) => (
          <Stack key={param} spacing={0.5}>
            <TextField
              size="small"
              label={param}
              value={params[index]}
              onChange={(e) => handleParamChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyPress(e, index)}
              inputRef={index === 1 ? secondInputRef : undefined}
              fullWidth
              autoFocus={index === 0}
              sx={{
                '& .MuiInputBase-root': {
                  fontSize: '0.875rem',
                },
                '& .MuiInputLabel-root': {
                  fontSize: '0.875rem',
                }
              }}
            />
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                Quick select:
              </Typography>
              {getQuickSelectValues(param).map((value) => (
                <Chip
                  key={value}
                  label={value}
                  size="small"
                  onClick={() => handleParamChange(index, value)}
                  sx={{ 
                    fontSize: '0.75rem',
                    height: '20px',
                    cursor: 'pointer',
                    '&:hover': { 
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText'
                    }
                  }}
                />
              ))}
            </Stack>
          </Stack>
        ))}
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Button 
            variant="contained"
            size="small"
            disabled={!selectedFunction || params.some(p => p === '')}
            onClick={() => {
              onSelect(selectedFunction, params);
              onClose();
            }}
            sx={{ fontSize: '0.75rem' }}
          >
            Apply
          </Button>
          <Tooltip 
            title={<Typography style={{ whiteSpace: 'pre-line', fontSize: '0.75rem' }}>{helpText[selectedFunction as keyof typeof helpText]}</Typography>}
            placement="left"
          >
            <IconButton size="small" color="primary">
              <HelpOutlineIcon sx={{ fontSize: '1rem' }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
    );
  };

  const handleFocus = () => setIsFocused(true);
  const handleBlur = (e: React.FocusEvent) => {
    // Don't blur if focusing another element within the popup
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    setIsFocused(false);
  };

  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
      sx={{
        '& .MuiPopover-paper': {
          boxShadow: (theme) => theme.shadows[8],
          border: '1px solid',
          borderColor: (theme) => 
            isFocused ? theme.palette.primary.main : theme.palette.divider,
          borderRadius: 1,
          minWidth: 240,
          backgroundColor: 'background.paper',
          mt: 1, // Small gap from the input
          animation: 'dropDown 0.2s ease',
          '@keyframes dropDown': {
            '0%': {
              opacity: 0,
              transform: 'translateY(-8px)'
            },
            '100%': {
              opacity: 1,
              transform: 'translateY(0)'
            }
          }
        }
      }}
    >
      <Box 
        onFocus={handleFocus}
        onBlur={handleBlur}
        sx={{ outline: 'none' }}
      >
        <Box sx={{ 
          borderBottom: 1, 
          borderColor: 'divider',
          backgroundColor: 'background.default'
        }}>
          <Tabs
            value={selectedFunction}
            onChange={(_, value) => {
              setSelectedFunction(value);
              setParams(Array(functions.find(f => f.name === value)?.params.length || 0).fill(''));
            }}
            variant="fullWidth"
            sx={{
              minHeight: 32,
              '& .MuiTab-root': {
                minHeight: 32,
                fontSize: '0.75rem',
                textTransform: 'none'
              }
            }}
          >
            {functions.map(func => (
              <Tab key={func.name} value={func.name} label={func.label} />
            ))}
          </Tabs>
        </Box>
        {renderParamInputs()}
      </Box>
    </Popover>
  );
});

RangeFunctionPopup.displayName = 'RangeFunctionPopup';

export default RangeFunctionPopup;
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { TextField, Button, Typography, LinearProgress, Box, Tooltip, Stack, useTheme, Autocomplete, IconButton, Divider } from '@mui/material';
import { MentionsInput, Mention } from 'react-mentions';
import RangeFunctionPopup from './RangeFunctionPopup';
import { 
  History as HistoryIcon, 
  Undo as UndoIcon, 
  RestartAlt as UndoRunIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Casino as DiceIcon, // For the random seed icon
  AttachFile as AttachFileIcon,
  KeyboardDoubleArrowLeft as AddColumnBeforeIcon,
  KeyboardDoubleArrowRight as AddColumnAfterIcon,
  KeyboardDoubleArrowUp as AddRowBeforeIcon,
  KeyboardDoubleArrowDown as AddRowAfterIcon,
} from '@mui/icons-material';
import { Theme } from '@mui/material/styles';
import { MagicTableSheet } from './FileUpload';
import SheetSelector from './SheetSelector';

interface MagicFormulaProps {
  sheets: MagicTableSheet[];
  activeSheetIndex: number;
  onSheetChange: (index: number) => void;
  onProcess: (data: any) => void;
  onStop: () => void;
  onUndo: () => void;
  isProcessing: boolean;
  canUndo: boolean;
  totalRows: number;
  currentRow: number;
  rangeInput: string;
  setRangeInput: (value: string) => void;
  columnHeaders: string[];
  themeMode: string;
  useRandomSeed: boolean;
  onRandomSeedChange: (value: boolean) => void;
  selectedColumn: string | null;
  onColumnSelect: (value: string) => void;
  onUndoEdit: () => void;
  canUndoEdit: boolean;
  onUndoRun: () => void;
  canUndoRun: boolean;
  onInsertRowBefore: () => void;
  onInsertRowAfter: () => void;
  onInsertColumnBefore: () => void;
  onInsertColumnAfter: () => void;
  selectedRows: number[];
  onRevert: () => void;
  canRevert: boolean;
}

const FormulaToolbar: React.FC<{
  onProcess: () => void;
  onStop: () => void;
  onUndoRun: () => void;
  onUndoEdit: () => void;
  onInsertRowBefore: () => void;
  onInsertRowAfter: () => void;
  onInsertColumnBefore: () => void;
  onInsertColumnAfter: () => void;
  isProcessing: boolean;
  canUndoRun: boolean;
  canUndoEdit: boolean;
  selectedRows: number[];
  selectedColumn: string | null;
  onRevert: () => void;
  canRevert: boolean;
  sx?: any;
}> = ({
  onProcess,
  onStop,
  onUndoRun,
  onUndoEdit,
  onInsertRowBefore,
  onInsertRowAfter,
  onInsertColumnBefore,
  onInsertColumnAfter,
  isProcessing,
  canUndoRun,
  canUndoEdit,
  selectedRows = [],
  selectedColumn,
  onRevert,
  canRevert,
  sx = {},
}) => {
  return (
    <Stack
      direction="row"
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 1,
        p: 0.5,
        border: '1px solid',
        borderColor: 'divider',
        width: '100%',
        gap: 1,
        '& .MuiButton-root': {
          px: 1,
          minWidth: 'auto',
          whiteSpace: 'nowrap',
          flex: 1,
        },
        ...sx,
      }}
    >
      <Button
        color="primary"
        onClick={onProcess}
        disabled={isProcessing}
        startIcon={<PlayIcon />}
        size="small"
      >
        Run
      </Button>
      
      <Button
        color="secondary"
        onClick={onStop}
        disabled={!isProcessing}
        startIcon={<StopIcon />}
        size="small"
      >
        Stop
      </Button>

      <Button
        color="inherit"
        onClick={onInsertRowBefore}
        disabled={selectedRows.length === 0}
        startIcon={<AddRowBeforeIcon />}
        size="small"
      >
        Row Before
      </Button>

      <Button
        color="inherit"
        onClick={onInsertRowAfter}
        disabled={selectedRows.length === 0}
        startIcon={<AddRowAfterIcon />}
        size="small"
      >
        Row After
      </Button>

      <Button
        color="inherit"
        onClick={onInsertColumnBefore}
        disabled={!selectedColumn}
        startIcon={<AddColumnBeforeIcon />}
        size="small"
      >
        Column Before
      </Button>

      <Button
        color="inherit"
        onClick={onInsertColumnAfter}
        disabled={!selectedColumn}
        startIcon={<AddColumnAfterIcon />}
        size="small"
      >
        Column After
      </Button>

      <Button
        color="inherit"
        onClick={onUndoRun}
        disabled={isProcessing || !canUndoRun}
        startIcon={<UndoRunIcon />}
        size="small"
      >
        Undo Run
      </Button>

      <Button
        color="inherit"
        onClick={onUndoEdit}
        disabled={isProcessing || !canUndoEdit}
        startIcon={<HistoryIcon />}
        size="small"
      >
        Undo Edit
      </Button>

      <Button
        color="inherit"
        onClick={onRevert}
        disabled={!canRevert}
        startIcon={<UndoIcon />}
        size="small"
      >
        Revert
      </Button>
    </Stack>
  );
};


const MagicFormula: React.FC<MagicFormulaProps> = ({
  onProcess,
  onStop,
  onUndo,
  isProcessing,
  canUndo,
  totalRows,
  currentRow,
  rangeInput,
  setRangeInput,
  columnHeaders,
  themeMode,
  useRandomSeed,
  onRandomSeedChange,
  selectedColumn,
  onColumnSelect,
  onUndoEdit,
  canUndoEdit,
  onUndoRun,
  canUndoRun,
  onInsertRowBefore,
  onInsertRowAfter,
  onInsertColumnBefore,
  onInsertColumnAfter,
  selectedRows,
  onRevert,
  canRevert,
  sheets,
  activeSheetIndex,
  onSheetChange,
}) => {
  const [promptTemplate, setPromptTemplate] = React.useState('');
  const [startTime, setStartTime] = React.useState<number | null>(null);
  const [rangeAnchorEl, setRangeAnchorEl] = React.useState<HTMLElement | null>(null);
  const [lastMentionRef, setLastMentionRef] = React.useState<string | null>(null);
  const [showRangePopup, setShowRangePopup] = React.useState(false);
  const mentionsInputRef = useRef<HTMLDivElement>(null);

  // Add to state declarations at the top
const attachmentInputRef = useRef<HTMLInputElement>(null);

const handlePromptChange = useCallback((e: any, newValue?: string) => {
  const value = newValue !== undefined ? newValue : e.target.value;
  setPromptTemplate(value);
  
  // Check for range popup trigger
  if (lastMentionRef && value.endsWith(`@[${lastMentionRef}](${lastMentionRef}).`)) {
    setShowRangePopup(true);
    setRangeAnchorEl(mentionsInputRef.current);
  } else {
    setShowRangePopup(false);
  }
}, [lastMentionRef]);

// Remove the separate paste handler and integrate it into handlePromptChange
const processText = useCallback((text: string) => {
  return text.replace(/\[@(\w+)\]/g, (match, columnName) => {
    if (columnHeaders.includes(columnName)) {
      return `@[${columnName}](${columnName})`;
    }
    return match;
  });
}, [columnHeaders]);

const handleAttachmentSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const processedText = processText(text);
    
    // Always append to the end with a new line
    const newText = promptTemplate + (promptTemplate ? '\n' : '') + processedText;
    handlePromptChange(null, newText);
    
    event.target.value = '';
  } catch (error) {
    console.error('Error reading attachment:', error);
  }
};

  useEffect(() => {
    if (showRangePopup && !rangeAnchorEl && mentionsInputRef.current) {
      setRangeAnchorEl(mentionsInputRef.current);
    }
  }, [showRangePopup]);

  const handleProcess = async () => {
    if (!promptTemplate || !selectedColumn) {
      return;
    }
    setStartTime(Date.now());
    await onProcess({
      promptTemplate,
      newColumnName: selectedColumn,
    });
  };

  const getTimeEstimate = () => {
    if (!startTime || currentRow === 0) return null;
    
    const elapsedTime = Date.now() - startTime;
    const timePerRow = elapsedTime / currentRow;
    const remainingRows = totalRows - currentRow;
    const estimatedTimeRemaining = timePerRow * remainingRows;
    
    const minutes = Math.floor(estimatedTimeRemaining / 60000);
    const seconds = Math.floor((estimatedTimeRemaining % 60000) / 1000);
    
    return `${minutes}m ${seconds}s remaining`;
  };

  const progress = totalRows ? (currentRow / totalRows) * 100 : 0;

  // Prepare data for mentions
  const mentionData = columnHeaders.map((col) => ({ id: col, display: col }));
  const muiTheme = useTheme();

  // Custom style for MentionsInput
  const mentionsStyles = {
    control: {
      backgroundColor: 'transparent',
      fontSize: '14px',
      fontWeight: 'normal',
      minHeight: '100px',
      padding: '16px',
      position: 'relative',
      '&multiLine': {
        highlighter: {
          padding: '16px',
          minHeight: '100px',
          border: 'none',
          boxSizing: 'border-box',
          lineHeight: '20px',
        },

      },
    },
    input: {
      margin: 0,
      padding: '16px',
      color: muiTheme.palette.text.primary,
      fontSize: '14px',
      fontFamily: 'inherit',
      border: 'none',
      outline: 'none',
      lineHeight: '21px',
      paste: {
        enabled: false  // Disable default paste behavior
      }
    },
    suggestions: {
      margin: '16px',
      backgroundColor: 'transparent',
      position: 'absolute', // Add this
      zIndex: 100000, // Add this

      list: {
        backgroundColor: muiTheme.palette.background.paper,
        border: `1px solid ${muiTheme.palette.divider}`,
        fontSize: 10,
        boxShadow: muiTheme.shadows[2],
        position: 'relative',
      },
      item: {
        padding: '8px 8px',
        borderBottom: `1px solid ${muiTheme.palette.divider}`,
        '&focused': {
          backgroundColor: muiTheme.palette.action.hover,
        },
      },
    },
  };

  const mentionStyle = {
    backgroundColor: muiTheme.palette.primary.main + '60',
    padding: 0,
    margin: 0,
    display: 'inline',
    color: muiTheme.palette.primary.main,
    lineHeight: 'inherit',
    verticalAlign: 'baseline',
    position: 'relative',
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word'
  };

  // Add new handler for mention addition
  const handleMentionAdded = (id: string | number, display: string) => {
    console.log('Mention added:', display);
    setLastMentionRef(display);
    setRangeAnchorEl(mentionsInputRef.current);
  };

  // Add handler for range function selection
  const handleRangeFunctionSelect = (functionType: string, params: string[]) => {
    if (!lastMentionRef) return;
    
    const functionCall = `${functionType}(${params.join(',')})`;
    setPromptTemplate(prev => {
      const lastDotIndex = prev.lastIndexOf('.');
      if (lastDotIndex === -1) return prev;
      return prev.substring(0, lastDotIndex) + `.${functionCall}`;
    });
    
    setRangeAnchorEl(null);
    setShowRangePopup(false);
    setLastMentionRef(null);
  };

  // Add a handler for closing the popup
  const handleRangePopupClose = () => {
    setShowRangePopup(false);
    setRangeAnchorEl(null);
    setLastMentionRef(null);
  };



  return (
    <div style={{ marginTop: 10 }}>
      <Stack direction="column" sx={{ mb: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Prompt Template
        </Typography>
        <Box 
          sx={(theme) => ({ 
            borderRadius: 1,
            border: '2px solid',
            borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
            transition: 'all 0.2s ease',
            boxSizing: 'border-box',
            position: 'relative',
            '&:hover': {
              borderColor: theme.palette.mode === 'dark' ? '#fff' : '#000'
            },
            '&:focus-within': {
              borderColor: 'primary.main',
            },
            '& .mentions-container': {
              position: 'relative',
            },
            '& .mentions__control': {
              position: 'relative',
              backgroundColor: 'transparent',
              border: 'none',
            },
            '& .mentions__highlighter': {
              boxSizing: 'border-box',
              border: 'none',
              position: 'relative',
              zIndex: 1,
            },
            '& .mentions__input': {
              position: 'relative',
              zIndex: 2,
            }
          })}
        >
          <div className="mentions-container">
            <div ref={mentionsInputRef}>
            <MentionsInput
              value={promptTemplate}
              onChange={handlePromptChange}
              placeholder="Type your prompt here... Use @ to reference columns"
              style={mentionsStyles}
              allowSpaceInQuery
              disabled={isProcessing}
              singleLine={false}
              onPaste={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const text = e.clipboardData.getData('text');
                const processedText = processText(text);
                
                // Always append to the end with a new line
                const newText = promptTemplate + (promptTemplate ? '\n' : '') + processedText;
                
                // Use requestAnimationFrame to ensure we're not conflicting with React's updates
                requestAnimationFrame(() => {
                  handlePromptChange(null, newText);
                });
              }}
            >
              <Mention
                trigger="@"
                data={mentionData}
                displayTransform={(_id, display) => `[@${display}]`}
                style={mentionStyle}
                onAdd={handleMentionAdded}
              />
            </MentionsInput>
            </div>
            
            <Stack 
              direction="row" 
              spacing={1} 
              sx={{ 
                p: 0.5,
                alignItems: 'center'
              }}
            >
              <Tooltip title="Attach file to prompt">
                <IconButton 
                  size="small"
                  onClick={() => attachmentInputRef.current?.click()}
                  sx={{
                    color: 'text.secondary',
                    '&:hover': {
                      color: 'text.primary',
                    },
                  }}
                >
                  <AttachFileIcon sx={{ fontSize: '1rem' }} />
                </IconButton>
              </Tooltip>
              
              <Box sx={{ flex: 1 }} /> {/* Spacer */}

              <Tooltip title={`${useRandomSeed ? 'Disable' : 'Enable'} random seed for consistent results across runs`}>
                <IconButton
                  onClick={() => onRandomSeedChange(!useRandomSeed)}
                  size="small"
                  sx={{
                    color: useRandomSeed ? 'primary.main' : 'text.secondary',
                    '&:hover': {
                      color: useRandomSeed ? 'primary.dark' : 'text.primary',
                    },
                  }}
                >
                  <DiceIcon sx={{ fontSize: '1rem' }} />
                </IconButton>
              </Tooltip>
            </Stack>
          </div>
        </Box>
      </Stack>
      
      <div style={{ display: 'none' }}>
        Debug state: 
        showRangePopup={String(showRangePopup)}, 
        hasAnchor={String(!!rangeAnchorEl)}, 
        lastMentionRef={lastMentionRef || 'none'}
      </div>
      
      {showRangePopup && (
        <RangeFunctionPopup
          anchorEl={rangeAnchorEl}
          onClose={handleRangePopupClose}
          onSelect={(functionType, params) => {
            console.log('Function selected:', functionType, params);
            handleRangeFunctionSelect(functionType, params);
            handleRangePopupClose();
          }}
          currentRow={currentRow}
          totalRows={totalRows}
        />
      )}
      
      <Stack 
  direction={{ xs: 'column', md: 'row' }} 
  spacing={2} 
  sx={{ 
    mt: 2,
    '& .MuiTextField-root': { flex: 1 },
    alignItems: 'center'
  }}
>
  <Autocomplete
    freeSolo
    value={selectedColumn || ''}
    onChange={(event, newValue) => {
      onColumnSelect(newValue || '');
    }}
    onInputChange={(event, newValue) => {
      onColumnSelect(newValue);
    }}
    options={columnHeaders}
    ListboxProps={{
      style: { maxHeight: '200px' }
    }}
    sx={{ flex: 1 }}
    renderInput={(params) => (
      <TextField
        {...params}
        label="Column Name"
        placeholder="Enter column name or select from headers..."
        variant="outlined"
      />
    )}
  />
  {sheets.length > 1 && (
    <SheetSelector
      sheets={sheets}
      activeIndex={activeSheetIndex}
      onSheetChange={onSheetChange}
      sx={{ minWidth: 120 }}
    />
  )}
  <Tooltip title="Specify rows to process. Examples: 'All', '2, 10, 3', '2 to 6'" placement="top">
    <TextField
      label="Rows to Process"
      placeholder="All"
      value={rangeInput}
      onChange={(e) => setRangeInput(e.target.value)}
      disabled={isProcessing}
      variant="outlined"
    />
  </Tooltip>
</Stack>
      <div style={{ marginTop: 10, marginBottom: 0 }}>
      {isProcessing && (
          <Box sx={{ width: '100%', mb: 1, mt: 2}}>
            <LinearProgress variant="determinate" value={progress} />
            <Typography variant="body2" color="text.secondary" align="center">
              Processing {currentRow} of {totalRows} rows
              {startTime && currentRow > 0 && ` • ${getTimeEstimate()}`}
            </Typography>
          </Box>
        )}
      <FormulaToolbar
        onProcess={handleProcess}
        onStop={onStop}
        onUndoRun={onUndoRun}
        onUndoEdit={onUndoEdit}
        onInsertRowBefore={onInsertRowBefore}
        onInsertRowAfter={onInsertRowAfter}
        onInsertColumnBefore={onInsertColumnBefore}
        onInsertColumnAfter={onInsertColumnAfter}
        isProcessing={isProcessing}
        canUndoRun={canUndoRun}
        canUndoEdit={canUndoEdit}
        selectedRows={selectedRows}
        selectedColumn={selectedColumn}
        onRevert={onRevert}
        canRevert={canRevert}
        sx={{
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          borderBottom: 'none',
          borderWidth: '1px 1px 0 1px',
          borderStyle: 'solid',
          borderColor: (theme: Theme) => 
            theme.palette.mode === 'light' 
              ? 'rgba(0, 0, 0, 0.23)'
              : 'rgba(255, 255, 255, 0.23)',
          mb: 0
        }}
      />
      </div>
      <input
        type="file"
        ref={attachmentInputRef}
        style={{ display: 'none' }}
        accept=".txt,.md,.csv,.html,.json,.js,.ts,.jsx,.tsx"
        onChange={handleAttachmentSelect}
      />
    </div>
  );
};

export default MagicFormula;
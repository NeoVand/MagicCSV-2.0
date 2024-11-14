// App.tsx

import React, { useState, useRef } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  Container,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Button,
  Drawer,
  Snackbar
} from '@mui/material';
import {
  Menu as MenuIcon,
  SaveAlt as SaveAltIcon,
  Undo as UndoIcon,
  OpenInBrowser as OpenInBrowserIcon,
  GridOn as NoteAddIcon,  // Add this import
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
  ExpandMore as ExpandMoreIcon,
  History,
  RestartAlt as UndoRunIcon,
} from '@mui/icons-material';
import getTheme from './theme';
import FileUpload from './components/FileUpload';
import MagicFormula from './components/MagicFormula';
import DataGridComponent from './components/DataGridComponent';
import OllamaSettings from './components/OllamaSettings';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import NewCSVDialog from './components/NewCSVDialog';
import MagicIcon from './components/Magicicon';
import { RowNode } from 'ag-grid-community';
import { PromptProcessor } from './utils/PromptProcessor';

interface CellEdit {
  rowId: string;
  column: string;
  oldValue: any;
  newValue: any;
}

interface ColumnHistoryEntry {
  columnName: string;
  type: 'add' | 'update';
  previousData?: { [rowId: string]: any };
}

function App() {
  // State declarations
  const [originalRowData, setOriginalRowData] = useState<any[]>([]);
  const [rowData, setRowData] = useState<any[]>([]);
  const [columnDefs, setColumnDefs] = useState<any[]>([]);
  const [ollamaSettings, setOllamaSettings] = useState<any>({});
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [currentRow, setCurrentRow] = useState<number>(0);
  const [totalRows, setTotalRows] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [columnHistory, setColumnHistory] = useState<ColumnHistoryEntry[]>([]);
  const [processingErrors, setProcessingErrors] = useState<string[]>([]);
  const [shouldStop, setShouldStop] = useState<boolean>(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [selectedRowIndices, setSelectedRowIndices] = useState<number[]>([]);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [rangeInput, setRangeInput] = useState<string>('All');
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const [useRandomSeed, setUseRandomSeed] = useState<boolean>(true);
  const theme = getTheme(mode);
  const [newCSVDialogOpen, setNewCSVDialogOpen] = useState<boolean>(false);
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [cellEditHistory, setCellEditHistory] = useState<CellEdit[]>([]);


  const gridRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getCurrentRowData = () => {
    if (gridRef.current) {
      const rowData: any[] = [];
      gridRef.current.api.forEachNode((node: any) => {
        rowData.push(node.data);
      });
      return rowData;
    }
    return [];
  };

  // Handlers
  const handleThemeChange = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const handleOllamaSettingsChange = (settings: any) => {
    setOllamaSettings(settings);
  };

  const columnHeaders = columnDefs.map((col) => col.field);

  // Handler for file selection
  const handleFileSelected = (data: any[], columns: string[]) => {
    // Assign unique ids to each row
    const dataWithIds = data.map((row, index) => {
      const processedRow = { ...row };
      // Convert any boolean values to strings
      Object.keys(processedRow).forEach(key => {
        if (typeof processedRow[key] === 'boolean') {
          processedRow[key] = processedRow[key].toString();
        }
      });
      return { ...processedRow, __rowId: index.toString() };
    });
    
    setOriginalRowData(dataWithIds);
    setRowData(dataWithIds);
    setColumnDefs(
      columns.map((col: string, index: number) => ({
        field: col,
        headerName: col,
        width: 200,
        flex: 1,
        checkboxSelection: index === 0,
        headerCheckboxSelection: index === 0,
        editable: true,
        resizable: true,
        cellRenderer: 'agTextCellRenderer',
        cellEditor: 'agTextCellEditor',
        cellEditorParams: {
          useFormatter: true,
        },
        valueFormatter: (params: any) => {
          return params.value != null ? String(params.value) : '';
        }
      }))
    );
    setColumnHistory([]);
    setSelectedRowIndices([]);
    setRangeInput('All');
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      // Parse the CSV file
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        complete: (results) => {
          const data = results.data;
          const columns = results.meta.fields || [];
          handleFileSelected(data, columns);
          // Reset the file input value so the same file can be selected again
          event.target.value = '';
        },
      });
    }
  };

  const handleOpenCSV = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleNewCSV = () => {
    setNewCSVDialogOpen(true);  // This should open the dialog
  };

  const handleNewCSVClose = () => {
    setNewCSVDialogOpen(false);
  };

  const handleNewCSVCreate = (data: any[], columns: string[]) => {
    handleFileSelected(data, columns);
    setNewCSVDialogOpen(false);
  };

  const handleStop = async () => {
    if (isProcessing) {
      setShouldStop(true);

      // Cancel any ongoing fetch request
      if (abortController) {
        abortController.abort();
      }

      // Immediately stop all processing
      setIsProcessing(false);
      setCurrentRow(0);
      setTotalRows(0);

      // Force refresh the grid
      if (gridRef.current) {
        gridRef.current.api.refreshCells({ force: true });
      }

      showSnackbar('Processing stopped');

      // Reset all states
      setIsProcessing(false);
      setShouldStop(false);
      setAbortController(null);
      setCurrentRow(0);
      setTotalRows(0);
    }
  };

  // Handler to reset processing state
  const handleReset = () => {
    setIsProcessing(false);
    setShouldStop(false);
    setCurrentRow(0);
    setTotalRows(0);
    setProcessingErrors([]);
    if (abortController) {
      abortController.abort(); // Cancel any ongoing fetch request
    }
  };

  const handleRevert = () => {
    if (originalRowData.length > 0) {
      // Get the original column names excluding __rowId
      const originalColumns = Object.keys(originalRowData[0])
        .filter(col => col !== '__rowId');
  
      // Reset to original data
      setRowData(originalRowData);
      setColumnHistory([]);
      
      // Reset column definitions
      setColumnDefs(
        originalColumns.map((col: string, index: number) => ({
          field: col,
          headerName: col,
          width: 200,
          flex: 1,
          checkboxSelection: index === 0,
          headerCheckboxSelection: index === 0,
          editable: true,
          resizable: true,
          cellRenderer: 'agTextCellRenderer',
          cellEditor: 'agTextCellEditor',
          cellEditorParams: {
            useFormatter: true,
          },
          valueFormatter: (params: any) => {
            return params.value != null ? String(params.value) : '';
          }
        }))
      );
  
      handleReset();
      setRangeInput('All');
    } else {
      showSnackbar('No data to revert to.');
    }
  };
  // Handler to undo the last added column
  const handleUndo = () => {
    if (columnHistory.length === 0) return;
    
    const lastEntry = columnHistory[columnHistory.length - 1];
    
    if (lastEntry.type === 'add') {
      // Remove the added column
      setColumnDefs((prevCols) => 
        prevCols.filter((col) => col.field !== lastEntry.columnName)
      );
      
      // Remove the column from rowData
      setRowData((prevData) =>
        prevData.map((row) => {
          const newRow = { ...row };
          delete newRow[lastEntry.columnName];
          return newRow;
        })
      );
    } else {
      // Restore previous values for the updated column
      setRowData(prevData =>
        prevData.map(row => ({
          ...row,
          [lastEntry.columnName]: lastEntry.previousData?.[row.__rowId] ?? row[lastEntry.columnName]
        }))
      );
    }
    
    // Update history
    setColumnHistory(prev => prev.slice(0, -1));
    
    // Refresh the grid
    if (gridRef.current) {
      gridRef.current.api.refreshCells({ force: true });
    }
  };

  const handleCellValueChanged = (event: any) => {
    const { data, oldValue, colDef } = event;
    const newValue = data[colDef.field];
    
    if (oldValue !== newValue) {
      setCellEditHistory(prev => [...prev, {
        rowId: data.__rowId,
        column: colDef.field,
        oldValue,
        newValue
      }]);
    }
  };

  const handleUndoEdit = () => {
    if (cellEditHistory.length === 0) return;
    
    const lastEdit = cellEditHistory[cellEditHistory.length - 1];
    
    // Update the grid data
    setRowData(prevData => 
      prevData.map(row => {
        if (row.__rowId === lastEdit.rowId) {
          return {
            ...row,
            [lastEdit.column]: lastEdit.oldValue
          };
        }
        return row;
      })
    );
    
    // Remove the last edit from history
    setCellEditHistory(prev => prev.slice(0, -1));
    
    // Refresh the grid
    if (gridRef.current) {
      gridRef.current.api.refreshCells({ force: true });
    }
  };

  const handleColumnHeaderChanged = (oldName: string, newName: string) => {
    // Update columnDefs
    setColumnDefs(prevCols =>
      prevCols.map(col =>
        col.field === oldName
          ? { ...col, field: newName, headerName: newName }
          : col
      )
    );

    // Update rowData with new column name
    setRowData(prevData =>
      prevData.map(row => {
        const newRow = { ...row };
        if (oldName in newRow) {
          newRow[newName] = newRow[oldName];
          delete newRow[oldName];
        }
        return newRow;
      })
    );

    // Update column history
    setColumnHistory(prev =>
      prev.map(entry => 
        entry.columnName === oldName 
          ? { ...entry, columnName: newName }
          : entry
      )
    );
  };

  // Update column definitions with a new column
  const updateColumnDefs = (newColumnName: string) => {
    setColumnDefs((prevCols) => {
      if (!prevCols.find((col) => col.field === newColumnName)) {
        return [
          ...prevCols,
          {
            field: newColumnName,
            headerName: newColumnName,
            width: 200,
            flex: 1,
            editable: true,
            resizable: true,
          },
        ];
      }
      return prevCols;
    });

    // Add new column to history
    const historyEntry: ColumnHistoryEntry = {
      columnName: newColumnName,
      type: 'add',
      previousData: undefined
    };
    setColumnHistory(prev => [...prev, historyEntry]);
  };

  // Show Snackbar message
  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  // Parse the range input
  const parseRangeInput = (input: string): number[] => {
    if (!input || input.trim().toLowerCase() === 'all') {
      // Return all row indices
      return rowData.map((_, index) => index);
    }

    const indicesSet = new Set<number>();
    const parts = input.split(',');

    for (const part of parts) {
      const trimmedPart = part.trim();
      if (trimmedPart.includes('to')) {
        const [startStr, endStr] = trimmedPart.split('to').map((s) => s.trim());
        const start = parseInt(startStr, 10) - 1; // Adjusting for zero-based index
        const end = parseInt(endStr, 10) - 1;
        if (!isNaN(start) && !isNaN(end)) {
          const rangeStart = Math.max(0, Math.min(start, end));
          const rangeEnd = Math.min(rowData.length - 1, Math.max(start, end));
          for (let i = rangeStart; i <= rangeEnd; i++) {
            indicesSet.add(i);
          }
        }
      } else {
        const index = parseInt(trimmedPart, 10) - 1;
        if (!isNaN(index) && index >= 0 && index < rowData.length) {
          indicesSet.add(index);
        }
      }
    }

    return Array.from(indicesSet).sort((a, b) => a - b);
  };

  // Process data function (original logic)
  const processData = async (data: any): Promise<{ currentRow: number; result: string }> => {
    const processSingleAttempt = async (data: any): Promise<{ currentRow: number; result: string }> => {
      const {
        promptTemplate,
        newColumnName,
        ollamaUrl,
        selectedModel,
        temperature,
        topP,
        seed,
        numCtx,
        systemPrompt,
        rowData,
        currentRow,
        allRowData,
      } = data;

      let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;

      if (!rowData || !Array.isArray(rowData) || rowData.length !== 1) {
        throw new Error('Invalid row data provided');
      }

      // Check for stop flag before starting
      if (shouldStop) {
        throw new Error('Processing stopped by user');
      }

      // Get all current row data for range processing
      const allCurrentData = getCurrentRowData();
      
      // Create prompt processor instance with full dataset
      const promptProcessor = new PromptProcessor(allRowData, currentRow);

      try {
        // Process the prompt template with range functions
        const processedPrompt = promptProcessor.processPrompt(promptTemplate);
        
        console.log(`Processing row ${currentRow + 1} with prompt: ${processedPrompt}`);

        if (shouldStop) {
          throw new Error('Processing stopped by user');
        }

        const controller = new AbortController();
        setAbortController(controller);

        const response = await fetch(`${ollamaUrl}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: selectedModel,
            prompt: processedPrompt,
            system: systemPrompt,
            options: {
              temperature: parseFloat(temperature),
              top_p: parseFloat(topP),
              ...(useRandomSeed ? {} : { seed: parseInt(seed, 10) }),
              num_ctx: parseInt(numCtx, 10),
            },
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Ollama API error: ${response.statusText}`);
        }

        if (!response.body) {
          throw new Error('No response body received');
        }

        reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let done = false;
        let fullResponse = '';

        while (!done) {
          if (shouldStop) {
            reader.cancel();
            throw new Error('Processing stopped by user');
          }

          const { value, done: readerDone } = await reader.read();
          done = readerDone;

          if (value) {
            if (shouldStop) {
              reader.cancel();
              throw new Error('Processing stopped by user');
            }

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(Boolean);

            for (const line of lines) {
              if (shouldStop) {
                reader.cancel();
                throw new Error('Processing stopped by user');
              }

              try {
                const jsonResponse = JSON.parse(line);
                if (jsonResponse.response) {
                  fullResponse += jsonResponse.response;
                }
                if (jsonResponse.done) {
                  done = true;
                  break;
                }
              } catch (e) {
                console.error('Error parsing JSON:', e);
              }
            }
          }
        }

        if (shouldStop) {
          throw new Error('Processing stopped by user');
        }

        const result = fullResponse.trim();
        if (!result) {
          throw new Error('Empty response from Ollama');
        }

        return { currentRow, result };

      } catch (error: any) {
        if (reader) {
          reader.cancel();
        }
        if (error.name === 'AbortError') {
          console.log('Fetch aborted');
          throw new Error('Processing stopped by user');
        } else {
          throw error;
        }
      } finally {
        if (reader) {
          reader.cancel().catch(console.error);
        }
        setAbortController(null);
      }
    };

    // Rest of the retry logic remains the same
    const maxRetries = 2;
    let lastError = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (shouldStop) {
          throw new Error('Processing stopped by user');
        }

        const result = await processSingleAttempt(data);

        if (shouldStop) {
          throw new Error('Processing stopped by user');
        }

        return result;
      } catch (error: any) {
        lastError = error;
        console.error(`Attempt ${attempt + 1} failed:`, error);

        if (
          error instanceof Error &&
          (error.message === 'Processing stopped by user' || error.name === 'AbortError')
        ) {
          throw error;
        }

        if (attempt < maxRetries - 1) {
          if (shouldStop) {
            throw new Error('Processing stopped by user');
          }
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    }

    throw new Error(`All retry attempts failed. Last error: ${lastError}`);
  };

  const handleProcessData = async (formulaData: any) => {
    if (!rowData.length) {
      showSnackbar('Please upload a CSV file before processing.');
      return;
    }

    const newColumnName = formulaData.newColumnName.trim();
    if (!newColumnName) {
      showSnackbar('Please provide a name for the new column.');
      return;
    }

    const columnExists = columnDefs.some((col) => col.field === newColumnName);

    // Create history entry before making changes
    const historyEntry: ColumnHistoryEntry = {
      columnName: newColumnName,
      type: columnExists ? 'update' : 'add',
      previousData: columnExists ? 
        rowData.reduce((acc, row) => ({
          ...acc,
          [row.__rowId]: row[newColumnName]
        }), {}) : 
        undefined
    };

    // Add to history before processing
    setColumnHistory(prev => [...prev, historyEntry]);

    // Determine the rows to process
    const rowsToProcess = parseRangeInput(rangeInput);

    if (rowsToProcess.length === 0) {
      showSnackbar('No valid rows to process.');
      return;
    }

    // Initialize cells for the specified rows if creating a new column
    if (!columnExists) {
      updateColumnDefs(newColumnName);
      setRowData((prevData) =>
        prevData.map((row, index) => {
          if (rowsToProcess.includes(index)) {
            return {
              ...row,
              [newColumnName]: '', // Initialize with empty string
            };
          }
          return row;
        })
      );
    }


    const payloadBase = {
      ...formulaData,
      ...ollamaSettings,
    };

    // Reset states before starting
    setIsProcessing(true);
    setShouldStop(false);
    setCurrentRow(0);
    setTotalRows(rowsToProcess.length);
    setProcessingErrors([]);

    try {
      let currentData = [...rowData]; // Keep track of the latest data

      for (let i = 0; i < rowsToProcess.length; i++) {
        if (shouldStop) {
          console.log('Processing stopped by user.');
          return;
        }

        const rowIndex = rowsToProcess[i];

        try {
          const payload = {
            ...payloadBase,
            currentRow: rowIndex,
            rowData: [currentData[rowIndex]], // Send single row
            allRowData: currentData, // Add this to payload for range processing
          };

          if (shouldStop) return;

          // Process single row with retry logic
          const { result } = await processData(payload);

          if (shouldStop) return;

          // Update our local copy of the data immediately
          if (result !== undefined) {
            const updatedRow = { ...currentData[rowIndex], [newColumnName]: result };
            currentData[rowIndex] = updatedRow;

            if (shouldStop) return;

            // Update AG-Grid
            if (gridRef.current) {
              gridRef.current.api.applyTransaction({ update: [updatedRow] });
            }

            // Update state
            setRowData(currentData);

            // Update progress
            setCurrentRow(i + 1);
          }
        } catch (rowError: any) {
          // Handle row-specific errors
          if (
            rowError.name === 'AbortError' ||
            rowError.message === 'Processing stopped by user'
          ) {
            console.log(`Processing stopped at row ${rowIndex + 1}`);
            return; // Exit immediately
          }

          console.error(`Error processing row ${rowIndex + 1}:`, rowError);
          setProcessingErrors((prevErrors) => [
            ...prevErrors,
            `Row ${rowIndex + 1}: ${rowError.message || rowError}`,
          ]);

          // Check if this is a critical error that should stop processing
          if (
            rowError.message?.includes('Invalid API key') ||
            rowError.message?.includes('Network error') ||
            rowError.message?.includes('Ollama API error')
          ) {
            throw rowError; // Re-throw critical errors to stop processing
          }
        }

        // Check stop flag at the end of each iteration
        if (shouldStop) {
          return;
        }
      }

      // Only show completion message if we weren't stopped and there were no errors
      if (!shouldStop) {
        if (processingErrors.length === 0) {
          showSnackbar('Processing completed successfully');
        } else {
          showSnackbar(`Processing completed with ${processingErrors.length} errors`);
        }
      }
    } catch (error: any) {
      // Handle global errors
      if (
        error.name !== 'AbortError' &&
        error.message !== 'Processing stopped by user'
      ) {
        console.error('Error processing data:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        showSnackbar(`Error processing data: ${errorMessage}`);
      } else {
        console.log('Processing stopped by user.');
      }
    } finally {
      // Clean up regardless of success or failure
      setIsProcessing(false);
      setShouldStop(false);
      setAbortController(null);
      setCurrentRow(0);
      setTotalRows(0);
    }
  };

  // Handle selection of rows
  const handleRowSelection = (selectedIndices: number[]) => {
    setSelectedRowIndices(selectedIndices);

    // Update the range input in MagicFormula
    if (selectedIndices.length > 0) {
      const rangeString = selectedIndices
        .map((index) => (index + 1).toString()) // Convert to 1-based index
        .join(', ');
      setRangeInput(rangeString);
    } else {
      setRangeInput('All');
    }
  };

  const handleExport = () => {
    if (rowData.length === 0) {
      showSnackbar('No data available to export.');
      return;
    }

    // Get ordered column fields from columnDefs
    const orderedColumns = columnDefs.map((col) => col.field);

    // Reorder the data according to columnDefs order
    const orderedData = rowData.map((row) => {
      const orderedRow: any = {};
      orderedColumns.forEach((col) => {
        orderedRow[col] = row[col];
      });
      return orderedRow;
    });

    const csv = Papa.unparse(orderedData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'data_export.csv');
  };

  const handleHeaderCheckboxChange = (columnName: string, checked: boolean) => {
    setSelectedColumn(checked ? columnName : null);
  };

  // Add new function to handle text field changes
  const handleColumnNameChange = (newValue: string) => {
    setSelectedColumn(newValue || null);
    
    // Check if the new value matches any existing column
    const matchingColumn = columnDefs.find(col => col.field === newValue);
    if (matchingColumn) {
      // Update the header checkbox state through the grid API
      if (gridRef.current) {
        const api = gridRef.current.api;
        api.forEachNode((node: RowNode) => {
          node.setSelected(false);
        });
        api.refreshHeader();
      }
    }
  };

  const handleUndoRun = () => {
    if (columnHistory.length === 0) return;
    
    const lastEntry = columnHistory[columnHistory.length - 1];
    
    if (lastEntry.type === 'add') {
      // Remove the added column
      setColumnDefs((prevCols) => 
        prevCols.filter((col) => col.field !== lastEntry.columnName)
      );
      
      // Remove the column from rowData
      setRowData((prevData) =>
        prevData.map((row) => {
          const newRow = { ...row };
          delete newRow[lastEntry.columnName];
          return newRow;
        })
      );
    } else {
      // Restore previous values for the updated column
      setRowData(prevData =>
        prevData.map(row => ({
          ...row,
          [lastEntry.columnName]: lastEntry.previousData?.[row.__rowId] ?? row[lastEntry.columnName]
        }))
      );
    }
    
    // Update history
    setColumnHistory(prev => prev.slice(0, -1));
    
    // Refresh the grid
    if (gridRef.current) {
      gridRef.current.api.refreshCells({ force: true });
    }
  };

  const handleInsertRowBefore = () => {
    if (selectedRowIndices.length === 0) return;
    
    const minSelectedIndex = Math.min(...selectedRowIndices);
    const newRow = {
      __rowId: `new_${Date.now()}_${Math.random()}`,
      ...Object.fromEntries(columnDefs.map(col => [col.field, '']))
    };
    
    setRowData(prevData => {
      const newData = [...prevData];
      newData.splice(minSelectedIndex, 0, newRow);
      return newData;
    });

    // Refresh the grid
    if (gridRef.current) {
      gridRef.current.api.refreshCells({ force: true });
    }
  };

  const handleInsertRowAfter = () => {
    if (selectedRowIndices.length === 0) return;
    
    const maxSelectedIndex = Math.max(...selectedRowIndices);
    const newRow = {
      __rowId: `new_${Date.now()}_${Math.random()}`,
      ...Object.fromEntries(columnDefs.map(col => [col.field, '']))
    };
    
    setRowData(prevData => {
      const newData = [...prevData];
      newData.splice(maxSelectedIndex + 1, 0, newRow);
      return newData;
    });

    // Refresh the grid
    if (gridRef.current) {
      gridRef.current.api.refreshCells({ force: true });
    }
  };

  const handleInsertColumnBefore = () => {
    if (!selectedColumn) return;
    
    const columnIndex = columnDefs.findIndex(col => col.field === selectedColumn);
    if (columnIndex === -1) return;

    const newColumnName = generateUniqueColumnName('New Column');
    
    // Update column definitions
    const newColumnDef = {
      field: newColumnName,
      headerName: newColumnName,
      width: 200,
      flex: 1,
      editable: true,
      resizable: true,
      cellRenderer: 'agTextCellRenderer',
      cellEditor: 'agTextCellEditor',
      cellEditorParams: {
        useFormatter: true,
      },
      valueFormatter: (params: any) => {
        return params.value != null ? String(params.value) : '';
      }
    };

    setColumnDefs(prevCols => {
      const newCols = [...prevCols];
      newCols.splice(columnIndex, 0, newColumnDef);
      return newCols;
    });

    // Update row data with new empty column
    setRowData(prevData => 
      prevData.map(row => ({
        ...row,
        [newColumnName]: ''
      }))
    );

    // Add to column history
    const historyEntry: ColumnHistoryEntry = {
      columnName: newColumnName,
      type: 'add'
    };
    setColumnHistory(prev => [...prev, historyEntry]);
  };

  const handleInsertColumnAfter = () => {
    if (!selectedColumn) return;
    
    const columnIndex = columnDefs.findIndex(col => col.field === selectedColumn);
    if (columnIndex === -1) return;

    const newColumnName = generateUniqueColumnName('New Column');
    
    // Update column definitions
    const newColumnDef = {
      field: newColumnName,
      headerName: newColumnName,
      width: 200,
      flex: 1,
      editable: true,
      resizable: true,
      cellRenderer: 'agTextCellRenderer',
      cellEditor: 'agTextCellEditor',
      cellEditorParams: {
        useFormatter: true,
      },
      valueFormatter: (params: any) => {
        return params.value != null ? String(params.value) : '';
      }
    };

    setColumnDefs(prevCols => {
      const newCols = [...prevCols];
      newCols.splice(columnIndex + 1, 0, newColumnDef);
      return newCols;
    });

    // Update row data with new empty column
    setRowData(prevData => 
      prevData.map(row => ({
        ...row,
        [newColumnName]: ''
      }))
    );

    // Add to column history
    const historyEntry: ColumnHistoryEntry = {
      columnName: newColumnName,
      type: 'add'
    };
    setColumnHistory(prev => [...prev, historyEntry]);
  };

  // Helper function to generate unique column names
  const generateUniqueColumnName = (baseColumnName: string): string => {
    let counter = 1;
    let columnName = baseColumnName;
    
    while (columnDefs.some(col => col.field === columnName)) {
      columnName = `${baseColumnName} ${counter}`;
      counter++;
    }
    
    return columnName;
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          width: '100vw',
          position: 'relative',
        }}
      >
        {/* AppBar */}
        <AppBar position="static">
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={() => setDrawerOpen(true)}
              edge="start"
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <MagicIcon size={28} />
              MagicCSV
            </Typography>
            {/* Open CSV Button */}
            <Button
              color="inherit"
              onClick={handleOpenCSV}
              sx={{ mr: 1 }}
              startIcon={<OpenInBrowserIcon />}
            >
              Open CSV
            </Button>
            {/* New CSV Button */}
            <Button
              color="inherit"
              onClick={handleNewCSV}
              sx={{ mr: 1 }}
              startIcon={<NoteAddIcon />}
            >
              New CSV
            </Button>
            {/* Export Button */}
            <Button
              color="inherit"
              onClick={handleExport}
              disabled={rowData.length === 0}
              sx={{ mr: 1 }}
              startIcon={<SaveAltIcon />}
            >
              Export
            </Button>
            {/* Theme Toggle IconButton */}
            <IconButton color="inherit" onClick={handleThemeChange}>
              {mode === 'light' ? <Brightness4Icon /> : <Brightness7Icon />}
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* Hidden File Input */}
        <input
          type="file"
          accept=".csv"
          style={{ display: 'none' }}
          ref={fileInputRef}
          onChange={handleFileInputChange}
        />

        {/* Sidebar Drawer content remains the same */}
        {/* Sidebar Drawer */}
        <Drawer
          variant="temporary"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          ModalProps={{
            keepMounted: true,
          }}
        >
          <OllamaSettings onSettingsChange={handleOllamaSettingsChange} />
        </Drawer>


        {/* Main Content */}
        <div
          style={{
            flexGrow: 1,
            padding: '0px 24px 24px 24px',
            width: '100%',
            minHeight: '100vh',
            display: 'flex',
            overflow: 'auto',
          }}
        >
          <Container
            maxWidth={false}
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
              overflow: 'hidden',
              width: '100%',
              flex: 1,
            }}
          >
            <MagicFormula
              onProcess={handleProcessData}
              onStop={handleStop}
              onUndo={handleUndo}
              isProcessing={isProcessing}
              canUndo={columnHistory.length > 0}
              totalRows={totalRows}
              currentRow={currentRow}
              rangeInput={rangeInput}
              setRangeInput={setRangeInput}
              columnHeaders={columnHeaders}
              themeMode={mode}
              useRandomSeed={useRandomSeed}
              onRandomSeedChange={setUseRandomSeed}
              selectedColumn={selectedColumn}
              onColumnSelect={handleColumnNameChange}
              onUndoRun={handleUndoRun}
              canUndoRun={columnHistory.length > 0}
              onUndoEdit={handleUndoEdit}
              canUndoEdit={cellEditHistory.length > 0}
              selectedRows={selectedRowIndices}
              onInsertRowBefore={handleInsertRowBefore}
              onInsertRowAfter={handleInsertRowAfter}
              onInsertColumnBefore={handleInsertColumnBefore}
              onInsertColumnAfter={handleInsertColumnAfter}
              onRevert={handleRevert}
              canRevert={originalRowData.length > 0}
            />
            <DataGridComponent
              ref={gridRef}
              rowData={rowData}
              columnDefs={columnDefs}
              onRowSelectionChanged={handleRowSelection}
              onCellValueChanged={handleCellValueChanged}
              onColumnHeaderChanged={handleColumnHeaderChanged}
              onHeaderCheckboxChange={handleHeaderCheckboxChange}
              selectedColumn={selectedColumn}
              themeMode={mode}
            />
          </Container>
        </div>
        {/* Snackbar for messages */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
          message={snackbarMessage}
        />

<NewCSVDialog
          open={newCSVDialogOpen}
          onClose={handleNewCSVClose}
          onCreate={handleNewCSVCreate}
        />
      </div>
    </ThemeProvider>
  );
}

export default App;
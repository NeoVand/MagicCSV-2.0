import React, { useState, forwardRef, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.min.css';

interface DataGridProps {
  rowData: any[];
  columnDefs: any[];
  onRowSelectionChanged?: (selectedIndices: number[]) => void;
  onCellValueChanged?: (event: any) => void;
  onColumnHeaderChanged?: (oldName: string, newName: string) => void;
  onHeaderCheckboxChange?: (columnName: string, checked: boolean) => void;
  selectedColumn?: string | null;
  themeMode: 'light' | 'dark';
}

const DataGridComponent = forwardRef<any, DataGridProps>(
  ({ rowData, columnDefs, onRowSelectionChanged, onCellValueChanged, onColumnHeaderChanged, onHeaderCheckboxChange, selectedColumn, themeMode }, ref) => {
    const [expandedCell, setExpandedCell] = useState<string | null>(null);

    
    const onSelectionChanged = () => {
      if (ref && (ref as any).current) {
        const selectedNodes = (ref as any).current.api.getSelectedNodes();
        const selectedIndices = selectedNodes
          .map((node: any) => node.rowIndex)
          .filter((rowIndex: any): rowIndex is number => rowIndex !== null && rowIndex !== undefined);
        if (onRowSelectionChanged) {
          onRowSelectionChanged(selectedIndices);
        }
      }
    };

    const onCellClicked = (params: any) => {
      const cellId = `${params.rowIndex}-${params.column.colId}`;
      setExpandedCell(expandedCell === cellId ? null : cellId);

      if (ref && (ref as any).current) {
        (ref as any).current.api.refreshCells({
          rowNodes: [params.node],
          columns: [params.column.colId],
          force: true,
        });
      }
    };

    const getCellStyle = (params: any) => {
      const cellId = `${params.node.rowIndex}-${params.column.colId}`;
      const isExpanded = expandedCell === cellId;

      return {
        whiteSpace: isExpanded ? 'normal' : 'nowrap',
        lineHeight: '1',
        paddingTop: '4px',
        paddingBottom: '4px',
        height: isExpanded ? 'auto' : '100%',
        maxHeight: isExpanded ? 'none' : '100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      };
    };

    // Handle header name changes
    const onHeaderNameChanged = (event: any) => {
      const oldName = event.column.colId;
      const newName = event.newValue;
      
      if (oldName !== newName && onColumnHeaderChanged) {
        onColumnHeaderChanged(oldName, newName);
      }
    };

    const themeClass = themeMode === 'dark' ? 'ag-theme-alpine-dark' : 'ag-theme-alpine';
    const gridStyle = { width: '100%', height: '100%', overflow: 'auto'  };

    // Modify columnDefs to make headers editable
    const editableColumnDefs = columnDefs.map(col => ({
      ...col,
      headerComponent: 'editableHeader',
      headerComponentParams: {
        onNameChanged: onHeaderNameChanged,
        onHeaderCheckboxChange: onHeaderCheckboxChange,
        selectedColumn: selectedColumn,
      },
    }));

    return (
      <div className={themeClass} style={gridStyle}>
        <AgGridReact
          ref={ref}
          rowData={rowData}
          columnDefs={editableColumnDefs.map(col => ({
            ...col,
            cellEditor: 'agLargeTextCellEditor',
            cellEditorPopup: true,
            minWidth: 150,
          }))}
          getRowId={(params) => params.data.__rowId}
          cellFlashDuration={1000}
          pagination={true}
          animateRows={false}
          suppressColumnMoveAnimation={false}
          suppressRowClickSelection={true}
          suppressRowHoverHighlight={true}
          suppressHorizontalScroll={false}
          suppressCellFocus={true}
          paginationPageSize={20}
          domLayout="autoHeight"
          rowSelection="multiple"
          onSelectionChanged={onSelectionChanged}
          onCellValueChanged={onCellValueChanged}
          onCellClicked={onCellClicked}
          components={{
            editableHeader: EditableHeader,
          }}
          defaultColDef={{
            editable: true,
            resizable: true,
            wrapText: true,
            cellStyle: getCellStyle,
            autoHeight: true,
            suppressMovable: true,
            flex: 1,
            minWidth: 150,
            suppressHeaderKeyboardEvent: () => true,
          }}
          suppressAnimationFrame={true}
          stopEditingWhenCellsLoseFocus={true}
          singleClickEdit={false}
        />
      </div>
    );
  }
);

// Custom Editable Header Component
const EditableHeader = (props: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [headerName, setHeaderName] = useState(props.column.colDef.headerName);
  const [isChecked, setIsChecked] = useState(false);

  // Update checkbox state when selected column changes
  useEffect(() => {
    const isSelected = props.column.colDef.headerComponentParams.selectedColumn === props.column.colId;
    setIsChecked(isSelected);
  }, [props.column.colDef.headerComponentParams.selectedColumn, props.column.colId]);

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    setIsChecked(checked);
    if (props.column.colDef.headerComponentParams.onHeaderCheckboxChange) {
      props.column.colDef.headerComponentParams.onHeaderCheckboxChange(
        props.column.colId,
        checked
      );
    }
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      finishEditing();
    }
  };

  const finishEditing = () => {
    setIsEditing(false);
    if (headerName !== props.column.colDef.headerName) {
      props.column.colDef.headerComponentParams.onNameChanged({
        column: props.column,
        newValue: headerName,
      });
    }
  };

  if (isEditing) {
    return (
      <input
        type="text"
        value={headerName}
        onChange={(e) => setHeaderName(e.target.value)}
        onBlur={finishEditing}
        onKeyDown={onKeyDown}
        style={{
          width: '90%',
          height: '24px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          padding: '0 4px',
        }}
        autoFocus
      />
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }}>
      <input
        type="checkbox"
        checked={isChecked}
        onChange={handleCheckboxChange}
        onClick={(e) => e.stopPropagation()}
      />
      <div onDoubleClick={() => setIsEditing(true)}>
        {headerName}
      </div>
    </div>
  );
};

export default DataGridComponent;
interface ColumnRangeParams {
    start?: number | 'THIS' | 'END' | 'HEADER';
    end?: number | 'THIS' | 'END' | 'HEADER';
    count?: number;
  }
  
  interface ColumnRange {
    type: 'at' | 'prev' | 'next' | 'range';
    params: ColumnRangeParams;
    column: string;
  }
  
  class RangeProcessor {
    private totalRows: number;
    private currentRow: number;
  
    constructor(totalRows: number, currentRow: number) {
      this.totalRows = totalRows;
      this.currentRow = currentRow;
    }
  
    private resolveSpecialValue(value: number | 'THIS' | 'END' | 'HEADER'): number {
      switch (value) {
        case 'THIS':
          return this.currentRow;
        case 'END':
          return this.totalRows - 1;
        case 'HEADER':
          return -1;
        default:
          return value;
      }
    }
  
    parseRangeExpression(expression: string): ColumnRange | null {
      // Match pattern: [@column].function(params)
      const match = expression.match(/\[@([^\]]+)\]\.(\w+)\((.*?)\)/);
      if (!match) return null;
  
      const [_, column, func, params] = match;
      const parsedParams = params.split(',').map(p => p.trim());
  
      switch (func) {
        case 'at':
          return {
            type: 'at',
            column,
            params: { start: this.parseParam(parsedParams[0]) }
          };
        case 'prev':
          return {
            type: 'prev',
            column,
            params: { count: parseInt(parsedParams[0]) }
          };
        case 'next':
          return {
            type: 'next',
            column,
            params: { count: parseInt(parsedParams[0]) }
          };
        case 'range':
          return {
            type: 'range',
            column,
            params: {
              start: this.parseParam(parsedParams[0]),
              end: this.parseParam(parsedParams[1])
            }
          };
        default:
          return null;
      }
    }
  
    private parseParam(param: string): number | 'THIS' | 'END' | 'HEADER' {
      switch (param.toUpperCase()) {
        case 'THIS':
          return 'THIS';
        case 'END':
          return 'END';
        case 'HEADER':
          return 'HEADER';
        default:
          return parseInt(param);
      }
    }
  
    validateRange(range: ColumnRange): boolean {
      switch (range.type) {
        case 'at':
          const pos = this.resolveSpecialValue(range.params.start!);
          return pos >= -1 && pos < this.totalRows;
        
        case 'prev':
          return range.params.count! > 0 && this.currentRow - range.params.count! >= 0;
        
        case 'next':
          return range.params.count! > 0 && this.currentRow + range.params.count! < this.totalRows;
        
        case 'range':
          const start = this.resolveSpecialValue(range.params.start!);
          const end = this.resolveSpecialValue(range.params.end!);
          return start >= -1 && end < this.totalRows && start <= end;
        
        default:
          return false;
      }
    }
  }
  
  export type { ColumnRange, ColumnRangeParams };
  export default RangeProcessor;
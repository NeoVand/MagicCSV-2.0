import RangeProcessor from './RangeProcessor';

interface ProcessedValue {
  value: string;
  type: 'single' | 'array';
}

export class PromptProcessor {
  private rowData: any[];
  private currentRow: number;

  constructor(rowData: any[], currentRow: number) {
    this.rowData = rowData;
    this.currentRow = currentRow;
  }

  private resolveRangeValue(column: string, rangeExpr: string): { value: string } {
    const match = rangeExpr.match(/(\w+)\((.*?)\)/);
    if (!match) return { value: '' };

    const [_, functionName, paramsStr] = match;
    const params = paramsStr.split(',').map(p => p.trim());

    switch (functionName) {
      case 'at': {
        const pos = this.resolvePosition(this.parsePosition(params[0]));
        if (pos > 0 && pos <= this.rowData.length) {
          return { value: this.rowData[pos - 1]?.[column]?.toString() || '' };
        }
        return { value: '' };
      }
      case 'exclusive_range': {
        const [start, end] = params;
        const values = [];
        const startPos = this.resolvePosition(this.parsePosition(start)) - 1;
        const endPos = this.resolvePosition(this.parsePosition(end));
        
        for (let i = startPos; i < endPos; i++) {
          if (i >= 0 && i < this.rowData.length && i !== (this.currentRow - 1)) {
            const value = this.rowData[i]?.[column]?.toString() || '';
            if (value) values.push(value);
          }
        }
        
        return { value: values.join(', ') };
      }
      case 'range': {
        const [start, end] = params;
        const startPos = this.resolvePosition(this.parsePosition(start));
        const endPos = this.resolvePosition(this.parsePosition(end));
        
        console.log('Range Debug:', {
          currentRow: this.currentRow + 1,
          startPos,
          endPos,
          rowDataLength: this.rowData.length,
          column,
          existingValues: this.rowData.map(row => row[column])
        });

        const values = [];
        
        if (end.toUpperCase() === 'END') {
          for (let i = startPos - 1; i < this.rowData.length; i++) {
            if (i >= 0) {
              const value = this.rowData[i]?.[column]?.toString() || '';
              if (value) values.push(value);
            }
          }
        } else {
          for (let i = startPos - 1; i < endPos; i++) {
            if (i >= 0 && i < this.rowData.length) {
              const value = this.rowData[i]?.[column]?.toString() || '';
              if (value) values.push(value);
            }
          }
        }
        
        const result = values.join(', ');
        console.log('Final range result:', result);
        return { value: result };
      }
      default:
        return { value: '' };
    }
  }

  private parsePosition(pos: string): number | 'THIS' | 'END' | 'HEADER' {
    pos = pos.replace(/\s+/g, '').toUpperCase();
    
    const thisPattern = /^THIS([+-]\d+)?$/;
    const match = pos.match(thisPattern);
    
    if (match) {
      if (!match[1]) return 'THIS';
      const operator = match[1][0];
      const number = parseInt(match[1].slice(1));
      return operator === '+' ? this.currentRow + 1 + number : this.currentRow + 1 - number;
    }

    if (['THIS', 'END', 'HEADER'].includes(pos)) {
      return pos as 'THIS' | 'END' | 'HEADER';
    }
    return parseInt(pos);
  }

  private resolvePosition(pos: number | 'THIS' | 'END' | 'HEADER'): number {
    switch (pos) {
      case 'THIS':
        return this.currentRow + 1;
      case 'END':
        return this.rowData.length;
      case 'HEADER':
        return 0;
      default:
        return pos;
    }
  }

  processPrompt(template: string): string {
    const regex = /@\[([^\]]+)\](?:\([^\)]+\))?(?:\.(range|at)\(([^)]+)\))?/g;
    
    return template.replace(regex, (match, column, funcName, paramsStr) => {
      if (!paramsStr) {
        return this.rowData[this.currentRow]?.[column]?.toString() || '';
      }
      
      const cleanParamsStr = paramsStr.replace(/\s+/g, '');
      const processed = this.resolveRangeValue(column, `${funcName || 'range'}(${cleanParamsStr})`);
      return processed.value;
    });
  }
}
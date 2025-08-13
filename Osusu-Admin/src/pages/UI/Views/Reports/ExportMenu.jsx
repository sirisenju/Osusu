import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Download, 
  FileSpreadsheet, 
  FileText,
  Printer,
  File
} from 'lucide-react';

function ExportMenu({ onExport, onPrint, loading = false }) {
  return (
    <div className="flex gap-2">
      <Button 
        variant="outline" 
        onClick={onPrint}
        disabled={loading}
        className="flex items-center gap-2"
      >
        <Printer className="h-4 w-4" />
        Print
      </Button>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button disabled={loading} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onExport('pdf')} className="flex items-center gap-2">
            <File className="h-4 w-4 text-red-500" />
            Export as PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onExport('excel')} className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-green-600" />
            Export as Excel
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onExport('csv')} className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-500" />
            Export as CSV
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default ExportMenu;

'use client';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { DownloadIcon } from 'lucide-react';

import { useDataTableContext } from './DataTableContext';

export function Export() {
  const datatable = useDataTableContext();

  if (!datatable.table.export) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={datatable.table.export}
            disabled={datatable.table.loading}
          >
            <DownloadIcon data-icon="inline-start" />
            Export
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          Exported data is capped at 10,000 entries per export.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

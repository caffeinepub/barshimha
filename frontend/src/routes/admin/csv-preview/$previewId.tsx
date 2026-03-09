import { createFileRoute } from '@tanstack/react-router';
import { CsvPreview } from '../../../pages/CsvPreview';

export const Route = createFileRoute()({
  component: CsvPreview,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      fileName: (search.fileName as string) || 'Unknown File',
    };
  },
});

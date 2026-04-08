import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  CheckSquare,
  Columns,
  Database,
  Edit3,
  Eye,
  FileSpreadsheet,
  FileText,
  Info,
  LogIn,
  MoreVertical,
  Plus,
  RefreshCw,
  Replace,
  Rows,
  Save,
  Search,
  Settings,
  Shield,
  Square,
  Trash2,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type {
  CsvPreview as CsvPreviewType,
  ValidationResult,
} from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCancelCsvPreview,
  useDeleteCsvPreview,
  useGetCsvPreview,
  useIsCallerAdmin,
  useProcessCsvPreview,
  useSaveCsvPreview,
} from "../hooks/useQueries";

const VIRTUAL_ROW_HEIGHT = 60;
const VIRTUAL_OVERSCAN = 5;

export function CsvPreview() {
  const { previewId } = useParams({ from: "/admin/csv-preview/$previewId" });
  const search = useSearch({ from: "/admin/csv-preview/$previewId" });
  const fileName = (search as any)?.fileName || "Unknown File";
  const navigate = useNavigate();

  const { identity, login, loginStatus, clear } = useInternetIdentity();
  const {
    data: isAdmin,
    isLoading: isAdminLoading,
    error: adminError,
  } = useIsCallerAdmin();
  const {
    data: previewData,
    isLoading,
    error,
    refetch,
  } = useGetCsvPreview(previewId);
  const _deleteCsvPreview = useDeleteCsvPreview();
  const processCsvPreview = useProcessCsvPreview();
  const cancelCsvPreview = useCancelCsvPreview();
  const saveCsvPreview = useSaveCsvPreview();

  const [editedData, setEditedData] = useState<string[][]>([]);
  const [editedHeaders, setEditedHeaders] = useState<string[]>([]);
  const [validationResults, setValidationResults] = useState<
    ValidationResult[]
  >([]);
  const [isEditing, setIsEditing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [currentDelimiter, setCurrentDelimiter] = useState<string>(",");
  const [rawFileContent, setRawFileContent] = useState<string>("");

  // Virtual scrolling state
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, _setContainerHeight] = useState(600);

  // Bulk selection state
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [selectedColumns, setSelectedColumns] = useState<Set<number>>(
    new Set(),
  );

  // Find and replace state
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [matchCount, setMatchCount] = useState(0);

  // Cell editing state
  const [editingCell, setEditingCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Column width state
  const [columnWidths, setColumnWidths] = useState<number[]>([]);

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  // Enhanced CSV/TSV parsing function
  const parseCSVLine = useCallback(
    (line: string, delimiter: string): string[] => {
      if (delimiter === "\t") {
        // For tab-separated files, split by tabs
        return line.split("\t").map((field) => field.trim());
      }

      // For comma/semicolon separated files, handle quoted fields
      const result: string[] = [];
      let current = "";
      let inQuotes = false;
      let i = 0;

      while (i < line.length) {
        const char = line[i];

        if (char === '"') {
          if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
            // Handle escaped quotes
            current += '"';
            i += 2;
            continue;
          }
          inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
        i++;
      }

      result.push(current.trim());
      return result.map((field) => field.replace(/^"|"$/g, ""));
    },
    [],
  );

  // Re-parse data with new delimiter
  const reparseWithDelimiter = useCallback(
    (content: string, delimiter: string) => {
      try {
        const lines = content.trim().split("\n");
        if (lines.length === 0) {
          throw new Error("File is empty");
        }

        const headers = parseCSVLine(lines[0], delimiter);
        const rows: string[][] = [];
        const newValidationResults: ValidationResult[] = [];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const cells = parseCSVLine(line, delimiter);

          // Ensure all rows have the same number of columns as headers
          while (cells.length < headers.length) {
            cells.push("");
          }
          if (cells.length > headers.length) {
            cells.splice(headers.length);
          }

          rows.push(cells);

          // Validate row
          const validation = validateRow(i - 1, cells, headers, rows);
          newValidationResults.push({
            rowIndex: BigInt(i - 1),
            isValid: validation.isValid,
            errors: validation.errors,
          });
        }

        return { headers, rows, validationResults: newValidationResults };
      } catch (error: any) {
        toast.error(`Failed to re-parse with new delimiter: ${error.message}`);
        return null;
      }
    },
    [parseCSVLine],
  );

  // Handle delimiter change
  const handleDelimiterChange = async (newDelimiter: string) => {
    if (!rawFileContent) {
      toast.error(
        "Cannot change delimiter: original file content not available",
      );
      return;
    }

    setCurrentDelimiter(newDelimiter);

    // Re-parse the data with the new delimiter
    const reparsed = reparseWithDelimiter(rawFileContent, newDelimiter);

    if (reparsed) {
      setEditedHeaders(reparsed.headers);
      setEditedData(reparsed.rows);
      setValidationResults(reparsed.validationResults);
      setColumnWidths(new Array(reparsed.headers.length).fill(200));
      setHasUnsavedChanges(true);

      const delimiterName =
        newDelimiter === "\t"
          ? "tab"
          : newDelimiter === ";"
            ? "semicolon"
            : "comma";
      toast.success(
        `Data re-parsed with ${delimiterName} delimiter. ${reparsed.rows.length} rows detected.`,
      );
    }
  };

  // Store raw file content when preview loads
  useEffect(() => {
    if (previewData && previewData.rows.length > 0) {
      // Reconstruct raw content from preview data
      const delimiter = previewData.delimiter;
      const lines: string[] = [];

      // Add header line
      lines.push(previewData.headers.join(delimiter));

      // Add data rows
      for (const row of previewData.rows) {
        lines.push(row.join(delimiter));
      }

      setRawFileContent(lines.join("\n"));
      setCurrentDelimiter(delimiter);
    }
  }, [previewData]);

  // Initialize data when preview loads
  useEffect(() => {
    if (previewData) {
      setEditedHeaders([...previewData.headers]);
      setEditedData(previewData.rows.map((row) => [...row]));
      setValidationResults([...previewData.validationResults]);
      setCurrentDelimiter(previewData.delimiter);
      setHasUnsavedChanges(false);
      setSelectedRows(new Set());
      setSelectedColumns(new Set());
      setColumnWidths(new Array(previewData.headers.length).fill(200));
    }
  }, [previewData]);

  // Update match count when find text changes
  useEffect(() => {
    if (findText) {
      let count = 0;
      const searchText = caseSensitive ? findText : findText.toLowerCase();

      for (const row of editedData) {
        for (const cell of row) {
          const cellText = caseSensitive ? cell : cell.toLowerCase();
          if (cellText.includes(searchText)) {
            count++;
          }
        }
      }

      setMatchCount(count);
    } else {
      setMatchCount(0);
    }
  }, [findText, caseSensitive, editedData]);

  // Focus editing input when cell is selected
  useEffect(() => {
    if (editingCell && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingCell]);

  // Virtual scrolling calculations
  const totalHeight = editedData.length * VIRTUAL_ROW_HEIGHT;
  const startIndex = Math.max(
    0,
    Math.floor(scrollTop / VIRTUAL_ROW_HEIGHT) - VIRTUAL_OVERSCAN,
  );
  const endIndex = Math.min(
    editedData.length,
    Math.ceil((scrollTop + containerHeight) / VIRTUAL_ROW_HEIGHT) +
      VIRTUAL_OVERSCAN,
  );
  const visibleRows = editedData.slice(startIndex, endIndex);
  const offsetY = startIndex * VIRTUAL_ROW_HEIGHT;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Handle authentication and permission errors
  const handleAuthError = () => {
    if (!isAuthenticated) {
      toast.error("Your session has expired. Please log in again.");
      navigate({ to: "/admin" });
    } else if (adminError || !isAdmin) {
      toast.error(
        "Admin access required. Please ensure you have the necessary permissions.",
      );
      navigate({ to: "/admin" });
    }
  };

  // Handle preview data errors with user-friendly messages
  const handlePreviewError = (error: any) => {
    const errorMessage = error?.message || error?.toString() || "Unknown error";

    if (
      errorMessage.includes("CSV preview not found") ||
      errorMessage.includes("expired")
    ) {
      toast.error(
        "CSV preview has expired or was not found. Please re-upload your file.",
      );
      navigate({ to: "/admin" });
    } else if (
      errorMessage.includes("Unauthorized") ||
      errorMessage.includes("admin")
    ) {
      toast.error(
        "You do not have permission to access this preview. Admin access required.",
      );
      navigate({ to: "/admin" });
    } else if (errorMessage.includes("Authentication required")) {
      toast.error("Your session has expired. Please log in again.");
      navigate({ to: "/admin" });
    } else {
      toast.error(`Failed to load preview: ${errorMessage}`);
    }
  };

  // Re-authenticate if session expired
  const handleReAuthenticate = async () => {
    try {
      await clear();
      setTimeout(() => {
        login();
      }, 500);
    } catch (error) {
      console.error("Re-authentication error:", error);
      toast.error("Failed to re-authenticate. Please try again.");
    }
  };

  // Retry loading preview data
  const handleRetryLoad = () => {
    if (!isAuthenticated) {
      handleAuthError();
      return;
    }

    toast.info("Retrying to load preview data...");
    refetch();
  };

  const validateRow = (
    rowIndex: number,
    rowData: string[],
    headers: string[] = editedHeaders,
    allRows: string[][] = editedData,
  ) => {
    const errors: string[] = [];
    let isValid = true;

    // Check for empty required fields
    const requiredFields = [
      "id",
      "content",
      "options",
      "explanation",
      "domain",
    ];
    for (const field of requiredFields) {
      const fieldIndex = headers.findIndex((h) =>
        h.toLowerCase().includes(field.toLowerCase()),
      );
      if (
        fieldIndex >= 0 &&
        (!rowData[fieldIndex] || rowData[fieldIndex].trim() === "")
      ) {
        errors.push(`Required field '${field}' is empty`);
        isValid = false;
      }
    }

    // Validate ID uniqueness
    const idIndex = headers.findIndex((h) => h.toLowerCase().includes("id"));
    if (idIndex >= 0 && rowData[idIndex]) {
      const duplicateIndex = allRows.findIndex(
        (row, index) => index !== rowIndex && row[idIndex] === rowData[idIndex],
      );
      if (duplicateIndex >= 0) {
        errors.push(`Duplicate ID found in row ${duplicateIndex + 1}`);
        isValid = false;
      }
    }

    // Check for suspicious patterns
    if (
      rowData.some(
        (cell) =>
          cell.toLowerCase().includes("undefined") ||
          cell.toLowerCase().includes("null"),
      )
    ) {
      errors.push("Contains undefined or null values");
      isValid = false;
    }

    return { isValid, errors };
  };

  const handleCellEdit = (
    rowIndex: number,
    colIndex: number,
    value: string,
  ) => {
    const newData = [...editedData];
    newData[rowIndex][colIndex] = value;
    setEditedData(newData);
    setHasUnsavedChanges(true);

    // Re-validate the edited row
    const validation = validateRow(rowIndex, newData[rowIndex]);
    const newValidationResults = [...validationResults];
    newValidationResults[rowIndex] = {
      rowIndex: BigInt(rowIndex),
      isValid: validation.isValid,
      errors: validation.errors,
    };
    setValidationResults(newValidationResults);
  };

  const handleHeaderEdit = (colIndex: number, value: string) => {
    const newHeaders = [...editedHeaders];
    newHeaders[colIndex] = value;
    setEditedHeaders(newHeaders);
    setHasUnsavedChanges(true);

    // Re-validate all rows since headers changed
    const newValidationResults = editedData.map((row, index) => {
      const validation = validateRow(index, row, newHeaders);
      return {
        rowIndex: BigInt(index),
        isValid: validation.isValid,
        errors: validation.errors,
      };
    });
    setValidationResults(newValidationResults);
  };

  // Double-click to edit cell
  const handleCellDoubleClick = (rowIndex: number, colIndex: number) => {
    if (isEditing) {
      setEditingCell({ row: rowIndex, col: colIndex });
    }
  };

  // Keyboard navigation
  const handleCellKeyDown = (
    e: React.KeyboardEvent,
    rowIndex: number,
    colIndex: number,
  ) => {
    if (!isEditing || !editingCell) return;

    switch (e.key) {
      case "Enter":
        e.preventDefault();
        // Move down
        if (rowIndex < editedData.length - 1) {
          setEditingCell({ row: rowIndex + 1, col: colIndex });
        }
        break;
      case "Tab":
        e.preventDefault();
        // Move right (or left with Shift)
        if (e.shiftKey) {
          if (colIndex > 0) {
            setEditingCell({ row: rowIndex, col: colIndex - 1 });
          }
        } else {
          if (colIndex < editedHeaders.length - 1) {
            setEditingCell({ row: rowIndex, col: colIndex + 1 });
          }
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (rowIndex > 0) {
          setEditingCell({ row: rowIndex - 1, col: colIndex });
        }
        break;
      case "ArrowDown":
        e.preventDefault();
        if (rowIndex < editedData.length - 1) {
          setEditingCell({ row: rowIndex + 1, col: colIndex });
        }
        break;
      case "ArrowLeft":
        e.preventDefault();
        if (colIndex > 0) {
          setEditingCell({ row: rowIndex, col: colIndex - 1 });
        }
        break;
      case "ArrowRight":
        e.preventDefault();
        if (colIndex < editedHeaders.length - 1) {
          setEditingCell({ row: rowIndex, col: colIndex + 1 });
        }
        break;
      case "Escape":
        setEditingCell(null);
        break;
    }
  };

  const addRow = () => {
    const newRow = new Array(editedHeaders.length).fill("");
    const newData = [...editedData, newRow];
    setEditedData(newData);
    setHasUnsavedChanges(true);

    // Add validation result for new row
    const validation = validateRow(editedData.length, newRow);
    const newValidationResults = [
      ...validationResults,
      {
        rowIndex: BigInt(editedData.length),
        isValid: validation.isValid,
        errors: validation.errors,
      },
    ];
    setValidationResults(newValidationResults);
  };

  const removeRow = (rowIndex: number) => {
    const newData = editedData.filter((_, index) => index !== rowIndex);
    const newValidationResults = validationResults
      .filter((_, index) => index !== rowIndex)
      .map((result, index) => ({
        ...result,
        rowIndex: BigInt(index),
      }));

    setEditedData(newData);
    setValidationResults(newValidationResults);
    setHasUnsavedChanges(true);

    // Update selected rows
    const newSelectedRows = new Set<number>();
    for (const idx of selectedRows) {
      if (idx < rowIndex) {
        newSelectedRows.add(idx);
      } else if (idx > rowIndex) {
        newSelectedRows.add(idx - 1);
      }
    }
    setSelectedRows(newSelectedRows);
  };

  // Bulk row selection with keyboard shortcuts
  const toggleRowSelection = (rowIndex: number, event?: React.MouseEvent) => {
    const newSelected = new Set(selectedRows);

    if (event?.shiftKey && selectedRows.size > 0) {
      // Shift-click: select range
      const lastSelected = Math.max(...Array.from(selectedRows));
      const start = Math.min(lastSelected, rowIndex);
      const end = Math.max(lastSelected, rowIndex);
      for (let i = start; i <= end; i++) {
        newSelected.add(i);
      }
    } else if (event?.ctrlKey || event?.metaKey) {
      // Ctrl/Cmd-click: toggle individual
      if (newSelected.has(rowIndex)) {
        newSelected.delete(rowIndex);
      } else {
        newSelected.add(rowIndex);
      }
    } else {
      // Regular click: toggle
      if (newSelected.has(rowIndex)) {
        newSelected.delete(rowIndex);
      } else {
        newSelected.add(rowIndex);
      }
    }

    setSelectedRows(newSelected);
  };

  const toggleAllRows = () => {
    if (selectedRows.size === editedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(editedData.map((_, idx) => idx)));
    }
  };

  // Bulk column selection
  const toggleColumnSelection = (colIndex: number) => {
    const newSelected = new Set(selectedColumns);
    if (newSelected.has(colIndex)) {
      newSelected.delete(colIndex);
    } else {
      newSelected.add(colIndex);
    }
    setSelectedColumns(newSelected);
  };

  const _toggleAllColumns = () => {
    if (selectedColumns.size === editedHeaders.length) {
      setSelectedColumns(new Set());
    } else {
      setSelectedColumns(new Set(editedHeaders.map((_, idx) => idx)));
    }
  };

  // Bulk delete selected rows
  const deleteSelectedRows = () => {
    if (selectedRows.size === 0) {
      toast.error("No rows selected");
      return;
    }

    const rowsToDelete = Array.from(selectedRows).sort((a, b) => b - a);
    let newData = [...editedData];
    let newValidationResults = [...validationResults];

    for (const rowIndex of rowsToDelete) {
      newData = newData.filter((_, idx) => idx !== rowIndex);
      newValidationResults = newValidationResults.filter(
        (_, idx) => idx !== rowIndex,
      );
    }

    // Re-index validation results
    newValidationResults = newValidationResults.map((result, index) => ({
      ...result,
      rowIndex: BigInt(index),
    }));

    setEditedData(newData);
    setValidationResults(newValidationResults);
    setSelectedRows(new Set());
    setHasUnsavedChanges(true);
    toast.success(`Deleted ${rowsToDelete.length} row(s)`);
  };

  // Bulk delete selected columns
  const deleteSelectedColumns = () => {
    if (selectedColumns.size === 0) {
      toast.error("No columns selected");
      return;
    }

    const colsToDelete = Array.from(selectedColumns).sort((a, b) => b - a);
    let newHeaders = [...editedHeaders];
    let newData = editedData.map((row) => [...row]);

    for (const colIndex of colsToDelete) {
      newHeaders = newHeaders.filter((_, idx) => idx !== colIndex);
      newData = newData.map((row) => row.filter((_, idx) => idx !== colIndex));
    }

    setEditedHeaders(newHeaders);
    setEditedData(newData);
    setSelectedColumns(new Set());
    setHasUnsavedChanges(true);

    // Re-validate all rows
    const newValidationResults = newData.map((row, index) => {
      const validation = validateRow(index, row, newHeaders, newData);
      return {
        rowIndex: BigInt(index),
        isValid: validation.isValid,
        errors: validation.errors,
      };
    });
    setValidationResults(newValidationResults);

    toast.success(`Deleted ${colsToDelete.length} column(s)`);
  };

  // Add multiple rows
  const _addMultipleRows = (count: number) => {
    const newRows = Array.from({ length: count }, () =>
      new Array(editedHeaders.length).fill(""),
    );
    const newData = [...editedData, ...newRows];
    setEditedData(newData);
    setHasUnsavedChanges(true);

    // Add validation results for new rows
    const newValidationResults = [...validationResults];
    for (let i = 0; i < count; i++) {
      const rowIndex = editedData.length + i;
      const validation = validateRow(rowIndex, newRows[i]);
      newValidationResults.push({
        rowIndex: BigInt(rowIndex),
        isValid: validation.isValid,
        errors: validation.errors,
      });
    }
    setValidationResults(newValidationResults);
    toast.success(`Added ${count} row(s)`);
  };

  // Find and replace functionality
  const performFindReplace = (replaceAll: boolean) => {
    if (!findText) {
      toast.error("Please enter text to find");
      return;
    }

    let replacedCount = 0;
    const newData = editedData.map((row, _rowIndex) => {
      return row.map((cell, _colIndex) => {
        const searchText = caseSensitive ? findText : findText.toLowerCase();
        const cellText = caseSensitive ? cell : cell.toLowerCase();

        if (cellText.includes(searchText)) {
          if (replaceAll) {
            replacedCount++;
            return caseSensitive
              ? cell.replace(new RegExp(findText, "g"), replaceText)
              : cell.replace(new RegExp(findText, "gi"), replaceText);
          }
          if (replacedCount === 0) {
            replacedCount++;
            return caseSensitive
              ? cell.replace(findText, replaceText)
              : cell.replace(new RegExp(findText, "i"), replaceText);
          }
        }
        return cell;
      });
    });

    if (replacedCount > 0) {
      setEditedData(newData);
      setHasUnsavedChanges(true);

      // Re-validate all affected rows
      const newValidationResults = newData.map((row, index) => {
        const validation = validateRow(index, row);
        return {
          rowIndex: BigInt(index),
          isValid: validation.isValid,
          errors: validation.errors,
        };
      });
      setValidationResults(newValidationResults);

      toast.success(`Replaced ${replacedCount} occurrence(s)`);
    } else {
      toast.info("No matches found");
    }
  };

  const saveChanges = async () => {
    if (!previewData) return;

    // Check authentication before saving
    if (!isAuthenticated) {
      handleAuthError();
      return;
    }

    if (!isAdmin) {
      toast.error("Admin access required to save changes.");
      return;
    }

    const updatedPreview: CsvPreviewType = {
      headers: editedHeaders,
      rows: editedData,
      validationResults,
      delimiter: currentDelimiter,
      importMode: previewData.importMode,
    };

    try {
      await saveCsvPreview.mutateAsync({ previewId, preview: updatedPreview });
      setHasUnsavedChanges(false);
      toast.success("Changes saved successfully!");
    } catch (error: any) {
      handlePreviewError(error);
    }
  };

  const handleApproveImport = async () => {
    // Check authentication before importing
    if (!isAuthenticated) {
      handleAuthError();
      return;
    }

    if (!isAdmin) {
      toast.error("Admin access required to import questions.");
      return;
    }

    if (hasUnsavedChanges) {
      toast.error("Please save your changes before importing");
      return;
    }

    try {
      const result = await processCsvPreview.mutateAsync(previewId);

      if (result.success) {
        toast.success(
          `Successfully imported ${result.importedCount} questions!`,
        );
        navigate({ to: "/admin" });
      } else {
        toast.error(`Import failed: ${result.message}`);
        if (result.errors.length > 0) {
          console.error("Import errors:", result.errors);
          const errorSummary = result.errors.slice(0, 3).join("; ");
          toast.error(
            `Errors: ${errorSummary}${result.errors.length > 3 ? "..." : ""}`,
          );
        }
      }
    } catch (error: any) {
      handlePreviewError(error);
    }
  };

  const handleCancelImport = async () => {
    try {
      await cancelCsvPreview.mutateAsync(previewId);
      toast.info(
        `${fileName.endsWith(".tsv") ? "TSV" : "CSV"} import cancelled`,
      );
    } catch (error: any) {
      console.error("Cancel error:", error);
      // Don't show error for cancel operation, just navigate back
    } finally {
      navigate({ to: "/admin" });
    }
  };

  const handleGoBack = () => {
    if (hasUnsavedChanges) {
      if (
        confirm("You have unsaved changes. Are you sure you want to go back?")
      ) {
        navigate({ to: "/admin" });
      }
    } else {
      navigate({ to: "/admin" });
    }
  };

  // Show loading state while checking authentication AND loading preview simultaneously
  if (
    loginStatus === "initializing" ||
    (isAuthenticated && isAdminLoading && isLoading)
  ) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-16">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto" />
              <p className="text-lg text-muted-foreground">
                Verifying permissions and loading preview...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show authentication error
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center space-y-6">
            <div className="mx-auto p-4 bg-red-100 dark:bg-red-900 rounded-full w-fit">
              <LogIn className="h-12 w-12 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-red-600">
                Session Expired
              </h1>
              <p className="text-muted-foreground mt-2">
                Your session has expired. Please log in again to continue.
              </p>
            </div>
            <div className="flex items-center justify-center space-x-4">
              <Button onClick={handleReAuthenticate} disabled={isLoggingIn}>
                {isLoggingIn ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent mr-2" />
                    Logging in...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Re-authenticate
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate({ to: "/admin" })}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show admin permission error
  if (adminError || !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center space-y-6">
            <div className="mx-auto p-4 bg-red-100 dark:bg-red-900 rounded-full w-fit">
              <Shield className="h-12 w-12 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
              <p className="text-muted-foreground mt-2">
                You do not have administrator privileges required to access the
                CSV preview feature.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate({ to: "/admin" })}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state for preview data (auth has passed, now load data)
  if (isLoading || (isAuthenticated && isAdminLoading)) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-16">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto" />
              <p className="text-lg text-muted-foreground">
                Loading CSV/TSV preview...
              </p>
              <p className="text-sm text-muted-foreground">
                Preview ID: {previewId}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state with retry options
  if (error || !previewData) {
    const errorMessage = error?.message || "Preview data not available";
    const isExpired =
      errorMessage.includes("expired") || errorMessage.includes("not found");

    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center space-y-6">
            <AlertTriangle className="h-16 w-16 text-destructive mx-auto" />
            <div>
              <h1 className="text-2xl font-bold">
                {isExpired ? "Preview Not Found" : "Preview Not Available"}
              </h1>
              <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                {isExpired
                  ? "This preview has expired or was not found. Please upload your CSV file again."
                  : `Error: ${errorMessage}`}
              </p>
            </div>

            {isExpired && (
              <Alert className="max-w-md mx-auto border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                <Info className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  CSV previews are stored temporarily and expire after a session
                  ends or page refresh. Upload your file again to start a new
                  preview.
                </AlertDescription>
              </Alert>
            )}

            {!isExpired && (
              <Alert className="max-w-md mx-auto">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Possible solutions:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                    <li>Re-upload your CSV/TSV file</li>
                    <li>Check your internet connection</li>
                    <li>Ensure you have admin permissions</li>
                    <li>Try refreshing the page</li>
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-center justify-center space-x-4">
              {!isExpired && (
                <Button onClick={handleRetryLoad} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Loading
                </Button>
              )}
              <Button onClick={() => navigate({ to: "/admin" })}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin — Upload Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getValidationSummary = () => {
    const totalRows = validationResults.length;
    const validRows = validationResults.filter((r) => r.isValid).length;
    const invalidRows = totalRows - validRows;

    return { totalRows, validRows, invalidRows };
  };

  const { totalRows, validRows, invalidRows } = getValidationSummary();
  const delimiterName =
    currentDelimiter === "\t"
      ? "Tab"
      : currentDelimiter === ";"
        ? "Semicolon"
        : "Comma";
  const fileType = fileName.endsWith(".tsv") ? "TSV" : "CSV";

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <div className="container-fluid mx-auto px-2 py-4 space-y-4 max-w-[98vw]">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg p-4 border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <Button variant="outline" size="sm" onClick={handleGoBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <FileSpreadsheet className="h-6 w-6 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold">
                    {fileType} Import Preview
                  </h1>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="outline" className="text-sm">
                      {delimiterName}-separated
                    </Badge>
                    {hasUnsavedChanges && (
                      <Badge
                        variant="secondary"
                        className="text-sm bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                      >
                        Unsaved Changes
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Delimiter Selector */}
              <div className="flex items-center space-x-2">
                <Label
                  htmlFor="delimiter-select"
                  className="text-sm font-medium"
                >
                  Delimiter:
                </Label>
                <Select
                  value={currentDelimiter}
                  onValueChange={handleDelimiterChange}
                >
                  <SelectTrigger id="delimiter-select" className="w-[180px]">
                    <SelectValue placeholder="Select delimiter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=",">
                      <div className="flex items-center space-x-2">
                        <span>Comma (,)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value=";">
                      <div className="flex items-center space-x-2">
                        <span>Semicolon (;)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value={"\t"}>
                      <div className="flex items-center space-x-2">
                        <span>Tab (\\t)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-start space-x-2 text-sm">
              <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-foreground">{fileName}</strong> - Review
                and edit your {fileType} content. Change the delimiter above if
                auto-detection was incorrect. Data will be re-parsed
                automatically. Use{" "}
                <kbd className="px-1 py-0.5 bg-muted rounded text-xs">
                  Ctrl+Click
                </kbd>{" "}
                for multi-select,{" "}
                <kbd className="px-1 py-0.5 bg-muted rounded text-xs">
                  Shift+Click
                </kbd>{" "}
                for range select.
              </div>
            </div>
          </div>

          {/* Live Statistics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card className="border-2">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Rows</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {totalRows}
                    </p>
                  </div>
                  <Database className="h-8 w-8 text-blue-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-200 dark:border-green-800">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Valid</p>
                    <p className="text-2xl font-bold text-green-600">
                      {validRows}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-red-200 dark:border-red-800">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Invalid</p>
                    <p className="text-2xl font-bold text-red-600">
                      {invalidRows}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-200 dark:border-purple-800">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Columns</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {editedHeaders.length}
                    </p>
                  </div>
                  <Columns className="h-8 w-8 text-purple-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-orange-200 dark:border-orange-800">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Unsaved</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {hasUnsavedChanges ? "1" : "0"}
                    </p>
                  </div>
                  <Save className="h-8 w-8 text-orange-600 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between bg-muted/20 p-3 rounded-lg border flex-wrap gap-2">
            <div className="flex items-center space-x-2 flex-wrap gap-2">
              <Button
                variant={isEditing ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setIsEditing(!isEditing);
                  setEditingCell(null);
                }}
                disabled={
                  processCsvPreview.isPending || cancelCsvPreview.isPending
                }
              >
                <Edit3 className="h-4 w-4 mr-2" />
                {isEditing ? "Exit Edit" : "Edit Mode"}
              </Button>

              {isEditing && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addRow}
                    disabled={
                      processCsvPreview.isPending || cancelCsvPreview.isPending
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Row
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFindReplace(!showFindReplace)}
                    disabled={
                      processCsvPreview.isPending || cancelCsvPreview.isPending
                    }
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Find & Replace
                  </Button>

                  {hasUnsavedChanges && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={saveChanges}
                      disabled={saveCsvPreview.isPending}
                    >
                      {saveCsvPreview.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-muted-foreground border-t-transparent mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </>
                      )}
                    </Button>
                  )}
                </>
              )}
            </div>

            {invalidRows > 0 && (
              <Badge variant="destructive" className="text-sm">
                {invalidRows} errors to fix
              </Badge>
            )}
          </div>

          {/* Find and Replace Toolbar */}
          {showFindReplace && isEditing && (
            <Card className="border-2 border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center space-x-2">
                    <Search className="h-4 w-4 text-blue-600" />
                    <span>Find and Replace</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFindReplace(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="findText" className="text-sm">
                      Find
                    </Label>
                    <Input
                      id="findText"
                      value={findText}
                      onChange={(e) => setFindText(e.target.value)}
                      placeholder="Enter text to find..."
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="replaceText" className="text-sm">
                      Replace with
                    </Label>
                    <Input
                      id="replaceText"
                      value={replaceText}
                      onChange={(e) => setReplaceText(e.target.value)}
                      placeholder="Enter replacement text..."
                      className="text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="caseSensitive"
                        checked={caseSensitive}
                        onCheckedChange={(checked) =>
                          setCaseSensitive(checked as boolean)
                        }
                      />
                      <Label
                        htmlFor="caseSensitive"
                        className="cursor-pointer text-sm"
                      >
                        Case sensitive
                      </Label>
                    </div>
                    {matchCount > 0 && (
                      <Badge variant="secondary" className="text-sm">
                        {matchCount} match{matchCount !== 1 ? "es" : ""}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => performFindReplace(false)}
                      disabled={!findText || matchCount === 0}
                    >
                      Replace Next
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => performFindReplace(true)}
                      disabled={!findText || matchCount === 0}
                    >
                      Replace All
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bulk Actions Toolbar */}
          {isEditing && (selectedRows.size > 0 || selectedColumns.size > 0) && (
            <Card className="border-2 border-purple-200 dark:border-purple-800">
              <CardContent className="p-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-3">
                    {selectedRows.size > 0 && (
                      <Badge variant="secondary" className="text-sm">
                        <Rows className="h-3 w-3 mr-1" />
                        {selectedRows.size} row(s)
                      </Badge>
                    )}
                    {selectedColumns.size > 0 && (
                      <Badge variant="secondary" className="text-sm">
                        <Columns className="h-3 w-3 mr-1" />
                        {selectedColumns.size} column(s)
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {selectedRows.size > 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={deleteSelectedRows}
                        disabled={
                          processCsvPreview.isPending ||
                          cancelCsvPreview.isPending
                        }
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete Rows
                      </Button>
                    )}
                    {selectedColumns.size > 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={deleteSelectedColumns}
                        disabled={
                          processCsvPreview.isPending ||
                          cancelCsvPreview.isPending
                        }
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete Columns
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedRows(new Set());
                        setSelectedColumns(new Set());
                      }}
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Clear
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Data Table with Virtual Scrolling */}
          <Card className="border-2">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center space-x-2 text-base">
                <Eye className="h-4 w-4" />
                <span>Data Preview</span>
                <Badge variant="outline" className="ml-auto text-xs">
                  {editedData.length} × {editedHeaders.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div
                ref={scrollContainerRef}
                className="overflow-auto border-t"
                style={{ height: "600px" }}
                onScroll={handleScroll}
              >
                <div
                  style={{ height: `${totalHeight}px`, position: "relative" }}
                >
                  <div style={{ transform: `translateY(${offsetY}px)` }}>
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-20 shadow-sm">
                        <TableRow className="border-b-2">
                          {isEditing && (
                            <TableHead className="w-12 text-center bg-muted/50 sticky left-0 z-10">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    onClick={toggleAllRows}
                                    className="p-1"
                                  >
                                    {selectedRows.size === editedData.length ? (
                                      <CheckSquare className="h-4 w-4" />
                                    ) : (
                                      <Square className="h-4 w-4" />
                                    )}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {selectedRows.size === editedData.length
                                    ? "Deselect all"
                                    : "Select all"}
                                </TooltipContent>
                              </Tooltip>
                            </TableHead>
                          )}
                          <TableHead className="w-16 text-center font-bold bg-muted/50 sticky left-0 z-10">
                            #
                          </TableHead>
                          {editedHeaders.map((header, index) => (
                            <TableHead
                              key={header || `col-${index}`}
                              className="bg-muted/50"
                              style={{
                                minWidth: `${columnWidths[index] || 200}px`,
                              }}
                            >
                              <div className="space-y-1">
                                {isEditing && (
                                  <div className="flex items-center justify-center mb-1">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            toggleColumnSelection(index)
                                          }
                                          className="p-1"
                                        >
                                          {selectedColumns.has(index) ? (
                                            <CheckSquare className="h-3 w-3" />
                                          ) : (
                                            <Square className="h-3 w-3" />
                                          )}
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        {selectedColumns.has(index)
                                          ? "Deselect column"
                                          : "Select column"}
                                      </TooltipContent>
                                    </Tooltip>
                                  </div>
                                )}
                                {isEditing ? (
                                  <Input
                                    value={header}
                                    onChange={(e) =>
                                      handleHeaderEdit(index, e.target.value)
                                    }
                                    className="h-8 text-sm font-semibold border-2 focus:border-primary"
                                    placeholder={`Column ${index + 1}`}
                                    disabled={
                                      processCsvPreview.isPending ||
                                      cancelCsvPreview.isPending
                                    }
                                  />
                                ) : (
                                  <div className="font-bold text-sm py-1 px-1">
                                    {header}
                                  </div>
                                )}
                              </div>
                            </TableHead>
                          ))}
                          {isEditing && (
                            <TableHead className="w-16 text-center font-bold bg-muted/50">
                              Actions
                            </TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {visibleRows.map((row, visibleIndex) => {
                          const rowIndex = startIndex + visibleIndex;
                          const validation = validationResults[rowIndex];
                          const isRowValid = validation?.isValid ?? false;
                          const isRowSelected = selectedRows.has(rowIndex);

                          return (
                            <ContextMenu key={rowIndex}>
                              <ContextMenuTrigger asChild>
                                <TableRow
                                  className={`${!isRowValid ? "bg-red-50 dark:bg-red-950/20 border-l-4 border-l-red-500" : isRowSelected ? "bg-blue-50 dark:bg-blue-950/20" : "hover:bg-muted/30"} transition-colors`}
                                  style={{ height: `${VIRTUAL_ROW_HEIGHT}px` }}
                                >
                                  {isEditing && (
                                    <TableCell className="text-center sticky left-0 bg-inherit z-10">
                                      <button
                                        type="button"
                                        onClick={(e) =>
                                          toggleRowSelection(rowIndex, e)
                                        }
                                        className="p-1"
                                      >
                                        {isRowSelected ? (
                                          <CheckSquare className="h-4 w-4" />
                                        ) : (
                                          <Square className="h-4 w-4" />
                                        )}
                                      </button>
                                    </TableCell>
                                  )}
                                  <TableCell className="text-center font-mono text-sm font-semibold bg-muted/30 sticky left-0 z-10">
                                    <div className="flex items-center justify-center space-x-1">
                                      <span>{rowIndex + 1}</span>
                                      {!isRowValid && (
                                        <Tooltip>
                                          <TooltipTrigger>
                                            <AlertTriangle className="h-3 w-3 text-red-500" />
                                          </TooltipTrigger>
                                          <TooltipContent className="max-w-xs">
                                            <div className="space-y-1">
                                              {validation?.errors.map(
                                                (error) => (
                                                  <div
                                                    key={error}
                                                    className="text-xs"
                                                  >
                                                    {error}
                                                  </div>
                                                ),
                                              )}
                                            </div>
                                          </TooltipContent>
                                        </Tooltip>
                                      )}
                                    </div>
                                  </TableCell>
                                  {row.map((cell, colIndex) => {
                                    const colKey =
                                      editedHeaders[colIndex] ||
                                      String(colIndex);
                                    const isEditingThisCell =
                                      editingCell?.row === rowIndex &&
                                      editingCell?.col === colIndex;

                                    return (
                                      <TableCell
                                        key={`${rowIndex}-${colKey}`}
                                        className="p-1"
                                        onDoubleClick={() =>
                                          handleCellDoubleClick(
                                            rowIndex,
                                            colIndex,
                                          )
                                        }
                                      >
                                        {isEditing && isEditingThisCell ? (
                                          <Input
                                            ref={editInputRef}
                                            value={cell}
                                            onChange={(e) =>
                                              handleCellEdit(
                                                rowIndex,
                                                colIndex,
                                                e.target.value,
                                              )
                                            }
                                            onKeyDown={(e) =>
                                              handleCellKeyDown(
                                                e,
                                                rowIndex,
                                                colIndex,
                                              )
                                            }
                                            onBlur={() => setEditingCell(null)}
                                            className={`h-8 text-sm ${!isRowValid ? "border-red-300 dark:border-red-700" : "border-2 focus:border-primary"}`}
                                            disabled={
                                              processCsvPreview.isPending ||
                                              cancelCsvPreview.isPending
                                            }
                                          />
                                        ) : (
                                          <div
                                            className="text-sm py-1 px-2 rounded min-h-[2rem] flex items-center bg-background/50 cursor-pointer hover:bg-muted/50"
                                            title={cell}
                                            onClick={() =>
                                              isEditing &&
                                              setEditingCell({
                                                row: rowIndex,
                                                col: colIndex,
                                              })
                                            }
                                            onKeyDown={(e) => {
                                              if (
                                                e.key === "Enter" ||
                                                e.key === " "
                                              ) {
                                                if (isEditing)
                                                  setEditingCell({
                                                    row: rowIndex,
                                                    col: colIndex,
                                                  });
                                              }
                                            }}
                                          >
                                            <span className="truncate">
                                              {cell || (
                                                <span className="text-muted-foreground italic text-xs">
                                                  Empty
                                                </span>
                                              )}
                                            </span>
                                          </div>
                                        )}
                                      </TableCell>
                                    );
                                  })}
                                  {isEditing && (
                                    <TableCell className="text-center">
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeRow(rowIndex)}
                                            className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20"
                                            disabled={
                                              processCsvPreview.isPending ||
                                              cancelCsvPreview.isPending
                                            }
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          Delete row
                                        </TooltipContent>
                                      </Tooltip>
                                    </TableCell>
                                  )}
                                </TableRow>
                              </ContextMenuTrigger>
                              <ContextMenuContent>
                                <ContextMenuItem
                                  onClick={() => toggleRowSelection(rowIndex)}
                                >
                                  {isRowSelected
                                    ? "Deselect Row"
                                    : "Select Row"}
                                </ContextMenuItem>
                                <ContextMenuItem
                                  onClick={() => removeRow(rowIndex)}
                                >
                                  Delete Row
                                </ContextMenuItem>
                              </ContextMenuContent>
                            </ContextMenu>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="bg-muted/20 p-4 rounded-lg border">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center space-x-3">
                <Badge
                  variant={
                    invalidRows === 0 && !hasUnsavedChanges
                      ? "default"
                      : "destructive"
                  }
                  className="text-sm"
                >
                  {invalidRows === 0 && !hasUnsavedChanges
                    ? "Ready to Import"
                    : hasUnsavedChanges
                      ? "Unsaved Changes"
                      : `${invalidRows} Errors`}
                </Badge>
                <div className="text-sm text-muted-foreground">
                  <strong>{editedData.length}</strong> rows •{" "}
                  <strong>{editedHeaders.length}</strong> columns •{" "}
                  <strong>{delimiterName}</strong> delimiter
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelImport}
                  disabled={
                    processCsvPreview.isPending || cancelCsvPreview.isPending
                  }
                >
                  {cancelCsvPreview.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-muted-foreground border-t-transparent mr-2" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleApproveImport}
                  disabled={
                    invalidRows > 0 ||
                    hasUnsavedChanges ||
                    processCsvPreview.isPending ||
                    cancelCsvPreview.isPending ||
                    editedData.length === 0
                  }
                  size="sm"
                >
                  {processCsvPreview.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent mr-2" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Approve Import
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

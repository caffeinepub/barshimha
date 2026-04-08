import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Download,
  FileText,
  Sparkles,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { CsvPreview } from "../backend";
import { useSaveCsvPreview } from "../hooks/useQueries";

export function CsvImport() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const saveCsvPreview = useSaveCsvPreview();

  // Enhanced delimiter detection: count occurrences per line and pick most consistent
  const detectDelimiter = (content: string): string => {
    const lines = content.split("\n").filter((line) => line.trim().length > 0);
    if (lines.length === 0) return ",";

    // Analyze first 5 lines for detection
    const linesToAnalyze = lines.slice(0, Math.min(5, lines.length));

    // Count raw tab characters per line
    const tabCounts = linesToAnalyze.map((l) => (l.match(/\t/g) || []).length);
    const avgTabs = tabCounts.reduce((a, b) => a + b, 0) / tabCounts.length;

    // Tab wins if most lines have >= 2 tabs consistently
    const tabConsistency = tabCounts.filter((c) => c === tabCounts[0]).length;
    const linesWithTabs = tabCounts.filter((c) => c >= 2).length;
    if (
      linesWithTabs >= Math.floor(linesToAnalyze.length * 0.6) ||
      tabConsistency >= linesToAnalyze.length * 0.8
    ) {
      if (avgTabs >= 1) return "\t";
    }

    // For comma vs semicolon: count per line and pick the one with most consistent (same per line) count
    const delimiters = [",", ";"] as const;
    let bestDelimiter = ",";
    let bestScore = -1;

    for (const delimiter of delimiters) {
      const counts = linesToAnalyze.map((line) => {
        let count = 0;
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') inQuotes = !inQuotes;
          else if (char === delimiter && !inQuotes) count++;
        }
        return count;
      });

      if (counts.length === 0) continue;
      const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
      if (avg === 0) continue;

      // Score = avg count * consistency bonus (same count in most lines wins)
      const mostCommon = counts.sort((a, b) => a - b)[
        Math.floor(counts.length / 2)
      ];
      const consistentLines = counts.filter((c) => c === mostCommon).length;
      const score = avg * (consistentLines / counts.length);

      if (score > bestScore) {
        bestScore = score;
        bestDelimiter = delimiter;
      }
    }

    // If tab avg beats the best comma/semicolon score, prefer tab
    if (avgTabs > 0 && avgTabs > bestScore) return "\t";

    return bestDelimiter;
  };

  // Detect if file is Anki-style format
  const detectAnkiFormat = (headers: string[], rows: string[][]): boolean => {
    // Anki exports typically have specific column patterns
    const headerStr = headers.join("|").toLowerCase();

    // Check for Anki-specific headers or patterns
    if (
      headerStr.includes("deck") ||
      headerStr.includes("tags") ||
      headerStr.includes("note type")
    ) {
      return true;
    }

    // Check if first few rows have embedded answer choices (A. or A) format)
    const sampleRows = rows.slice(0, Math.min(5, rows.length));
    let ankiPatternCount = 0;

    for (const row of sampleRows) {
      for (const cell of row) {
        // Look for patterns like "A. option B. option" or "A) option B) option"
        if (/[A-E][.)]\s+[^.]+\s+[B-E][.)]\s+/.test(cell)) {
          ankiPatternCount++;
          break;
        }
        // Also detect cloze markers
        if (/\{\{c\d+::[A-E]\}\}/i.test(cell)) {
          ankiPatternCount++;
          break;
        }
      }
    }

    // If more than 40% of sample rows have this pattern, likely Anki format
    return ankiPatternCount > sampleRows.length * 0.4;
  };

  // Extract domain from Anki deck path (e.g., "SMLE::Golden::Medguard::Surgery::Gastrointestinal" -> "Surgery")
  const extractDomainFromDeckPath = (deckPath: string): string => {
    if (!deckPath) return "Uncategorized";

    const parts = deckPath.split("::").map((p) => p.trim());

    // Look for known SMLE domains
    const knownDomains = [
      "Surgery",
      "Internal Medicine",
      "Pediatrics",
      "Obstetrics & Gynecology",
      "OBGYN",
      "Ethics",
    ];

    for (const part of parts) {
      for (const domain of knownDomains) {
        if (part.toLowerCase().includes(domain.toLowerCase())) {
          return domain === "OBGYN" ? "Obstetrics & Gynecology" : domain;
        }
      }
    }

    // If no known domain found, use the part after "SMLE" or the first meaningful part
    const smleIndex = parts.findIndex((p) => p.toLowerCase() === "smle");
    if (smleIndex >= 0 && smleIndex < parts.length - 1) {
      return parts[smleIndex + 1];
    }

    return parts.length > 0 ? parts[0] : "Uncategorized";
  };

  // Parse Anki-style question with embedded answer choices
  // Supports: "A. text B. text" and "A) text B) text" formats, newline-separated, or inline
  const parseAnkiQuestion = (
    questionText: string,
  ): { content: string; options: string[]; correctAnswer: string } => {
    // Normalize: replace literal \n sequences and excessive whitespace
    let normalized = questionText.replace(/\\n/g, "\n").trim();

    // 1. Detect Anki cloze answer: {{c1::B}} — extract letter as correct answer
    const clozeMatch = normalized.match(/\{\{c\d+::([A-E])\}\}/i);
    let correctAnswer = clozeMatch ? clozeMatch[1].toUpperCase() : "";

    // Remove cloze markers from text
    normalized = normalized.replace(/\{\{c\d+::[^}]+\}\}/g, "").trim();

    // 2. Detect "Answer: X" format (may appear after options)
    if (!correctAnswer) {
      const answerLineMatch = normalized.match(/\bAnswer:\s*([A-E])\b/i);
      if (answerLineMatch) {
        correctAnswer = answerLineMatch[1].toUpperCase();
        // Remove "Answer: X" and everything after it (it's usually explanation)
        normalized = normalized
          .substring(0, answerLineMatch.index ?? normalized.length)
          .trim();
      }
    }

    // 3. Find where options block starts — look for first "A." or "A)" preceded by whitespace/newline
    // Use a robust pattern that handles both dot and parenthesis formats
    // Scan from the END to find the LAST position where options start to avoid false positives in clinical text
    const optionStartPattern = /(?:^|\n|[ \t]{2,})A[.)]\s+/;
    const firstOptionMatch = normalized.match(optionStartPattern);

    if (!firstOptionMatch || firstOptionMatch.index === undefined) {
      // No options found — return full text as content
      return {
        content: normalized.replace(/\s+/g, " ").trim(),
        options: [],
        correctAnswer,
      };
    }

    // Everything before the first option is the question content
    const splitIndex =
      (firstOptionMatch.index ?? 0) +
      (firstOptionMatch[0].startsWith("\n") ||
      firstOptionMatch[0].startsWith(" ") ||
      firstOptionMatch[0].startsWith("\t")
        ? firstOptionMatch[0].indexOf("A")
        : 0);
    const questionContent = normalized
      .substring(0, splitIndex)
      .replace(/\s+/g, " ")
      .trim();
    const optionsBlock = normalized.substring(splitIndex).trim();

    // 4. Split options block — support "A. text B. text" and "A) text B) text"
    // Build a regex that splits at option labels: A. B. C. D. E. or A) B) C) D) E)
    const optionSplitRegex = /(?:^|\s+)([B-E])[.)]\s+/g;
    const options: string[] = [];

    // First option is everything from "A./ A)" up to the first "B." or "B)"
    const afterFirstLabel = optionsBlock.replace(/^A[.)]\s*/, "");
    const secondOptMatch = afterFirstLabel.search(/\b[B-E][.)]\s+/);

    if (secondOptMatch === -1) {
      // Only one option found — treat whole block as single option
      options.push(`A. ${afterFirstLabel.replace(/\s+/g, " ").trim()}`);
    } else {
      // First option text
      options.push(
        `A. ${afterFirstLabel.substring(0, secondOptMatch).replace(/\s+/g, " ").trim()}`,
      );

      // Remaining options
      const rest = afterFirstLabel.substring(secondOptMatch);
      const parts = rest.split(optionSplitRegex);
      // parts: [before_B, "B", text_B, "C", text_C, ...]
      // After split with capture group: ["", "B", "text", "C", "text", ...]
      for (let i = 1; i < parts.length; i += 2) {
        const letter = parts[i];
        const text = (parts[i + 1] || "").replace(/\s+/g, " ").trim();
        if (letter && text) {
          options.push(`${letter}. ${text}`);
        }
      }
    }

    return {
      content: questionContent || normalized.replace(/\s+/g, " ").trim(),
      options: options.filter((o) => o.length > 3),
      correctAnswer,
    };
  };

  const validateFileFormat = (
    file: File,
    content: string,
  ): { isValid: boolean; error?: string; delimiter?: string } => {
    const fileExtension = file.name.toLowerCase();

    // Check file extension
    if (!fileExtension.endsWith(".csv") && !fileExtension.endsWith(".tsv")) {
      return {
        isValid: false,
        error:
          "Please select a CSV or TSV file. Supported formats: .csv (comma/semicolon-separated) and .tsv (tab-separated)",
      };
    }

    // Detect delimiter using enhanced algorithm
    const delimiter = detectDelimiter(content);

    // Validate delimiter based on file extension (with warnings, not hard errors)
    if (fileExtension.endsWith(".tsv") && delimiter !== "\t") {
      toast.warning(
        "TSV file detected with non-tab delimiter. You can adjust the delimiter in the preview if needed.",
      );
    }

    if (fileExtension.endsWith(".csv") && delimiter === "\t") {
      toast.warning(
        "CSV file detected with tab delimiter. You can adjust the delimiter in the preview if needed.",
      );
    }

    // Check if delimiter is supported
    const supportedDelimiters = [",", ";", "\t"];
    if (!supportedDelimiters.includes(delimiter)) {
      return {
        isValid: false,
        error: `Unsupported delimiter detected. Please use one of the supported formats:
        • CSV with commas (,)
        • CSV with semicolons (;)  
        • TSV with tabs (\\t)
        
        Current file appears to use an unsupported delimiter.`,
      };
    }

    return { isValid: true, delimiter };
  };

  const parseAndValidateCsv = (
    content: string,
    _fileName: string,
    detectedDelimiter: string,
  ) => {
    try {
      const lines = content.trim().split("\n");
      if (lines.length === 0) {
        throw new Error("File is empty");
      }

      // Use the detected delimiter
      const delimiter = detectedDelimiter;

      // Enhanced CSV/TSV parsing to handle quoted fields properly
      const parseCSVLine = (line: string, delimiter: string): string[] => {
        if (delimiter === "\t") {
          // For tab-separated files, split by tabs (no quote handling needed typically)
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
      };

      const headers = parseCSVLine(lines[0], delimiter);

      // Parse rows
      const rows: string[][] = [];
      const validationResults: any[] = [];

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
      }

      // Detect if this is Anki-style format
      const isAnkiFormat = detectAnkiFormat(headers, rows);

      if (isAnkiFormat) {
        toast.info(
          "Anki-style format detected! Processing embedded answer choices and deck paths...",
          {
            duration: 4000,
            icon: <Sparkles className="h-4 w-4" />,
          },
        );
      }

      // Process rows based on format
      const processedRows: string[][] = [];
      const processedHeaders = isAnkiFormat
        ? [
            "id",
            "content",
            "options",
            "correctAnswers",
            "explanation",
            "domain",
            "state",
          ]
        : headers;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        if (isAnkiFormat) {
          // Process Anki-style row
          const deckPathIndex = headers.findIndex((h) =>
            h.toLowerCase().includes("deck"),
          );
          const questionIndex = headers.findIndex(
            (h) =>
              h.toLowerCase().includes("front") ||
              h.toLowerCase().includes("question") ||
              h === headers[0],
          );
          const answerIndex = headers.findIndex(
            (h) =>
              h.toLowerCase().includes("back") ||
              h.toLowerCase().includes("answer"),
          );

          // Extract domain from deck path
          const deckPath = deckPathIndex >= 0 ? row[deckPathIndex] : "";
          const domain = extractDomainFromDeckPath(deckPath);

          // Parse question with embedded choices
          const questionText = questionIndex >= 0 ? row[questionIndex] : "";
          const { content, options, correctAnswer } =
            parseAnkiQuestion(questionText);

          // Generate ID
          const id = `q_${Date.now()}_${i}`;

          // Get explanation (from answer field if available)
          const explanation = answerIndex >= 0 ? row[answerIndex] : "";

          // Format options (pipe-separated, keep label prefix for clarity)
          const optionsStr = options.length > 0 ? options.join("|") : "";

          // Correct answer index derived from parsed letter (A=0, B=1, etc.)
          const correctAnswerIndex = correctAnswer
            ? String(correctAnswer.charCodeAt(0) - "A".charCodeAt(0))
            : "";

          // State (published by default)
          const state = "published";

          processedRows.push([
            id,
            content,
            optionsStr,
            correctAnswerIndex,
            explanation,
            domain,
            state,
          ]);
        } else {
          // Standard format - keep as-is
          processedRows.push(row);
        }

        // Validate row
        const validation = validateRow(
          i,
          processedRows[i],
          processedHeaders,
          processedRows,
        );
        validationResults.push({
          rowIndex: BigInt(i),
          isValid: validation.isValid,
          errors: validation.errors,
        });
      }

      const preview: CsvPreview = {
        headers: processedHeaders,
        rows: processedRows,
        validationResults,
        delimiter,
      };

      return preview;
    } catch (error: any) {
      throw new Error(`Failed to parse file: ${error.message}`);
    }
  };

  const validateRow = (
    rowIndex: number,
    rowData: string[],
    headers: string[],
    allRows: string[][],
  ) => {
    const errors: string[] = [];
    let isValid = true;

    // Check for empty required fields
    const requiredFields = ["id", "content", "domain"];
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
        errors.push(`Duplicate ID found in row ${duplicateIndex + 2}`);
        isValid = false;
      }
    }

    return { isValid, errors };
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      // Read file content
      const content = await readFileAsText(file);

      // Complete progress
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Validate file content
      if (!content.trim()) {
        throw new Error("File is empty");
      }

      const lines = content.trim().split("\n");
      if (lines.length < 2) {
        throw new Error(
          "File must contain at least a header row and one data row",
        );
      }

      // Enhanced format validation with delimiter detection
      const validation = validateFileFormat(file, content);
      if (!validation.isValid) {
        throw new Error(validation.error || "Invalid file format");
      }

      // Parse and validate CSV content with detected delimiter
      const preview = parseAndValidateCsv(
        content,
        file.name,
        validation.delimiter!,
      );

      // Generate unique preview ID
      const previewId = `preview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Save preview to backend
      await saveCsvPreview.mutateAsync({ previewId, preview });

      const delimiter = validation.delimiter!;
      const delimiterName =
        delimiter === "\t" ? "tab" : delimiter === ";" ? "semicolon" : "comma";

      toast.success(
        `${file.name.endsWith(".tsv") ? "TSV" : "CSV"} file processed successfully! Auto-detected ${delimiterName}-separated format. Redirecting to preview...`,
      );

      // Navigate to full-page CSV preview
      navigate({
        to: "/admin/csv-preview/$previewId",
        params: { previewId },
        search: { fileName: file.name },
      });
    } catch (error: any) {
      toast.error(`Failed to process file: ${error.message}`);
      console.error("File processing error:", error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === "string") {
          resolve(result);
        } else {
          reject(new Error("Failed to read file as text"));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  };

  const downloadSampleCsv = () => {
    const sampleData = [
      [
        "id",
        "content",
        "options",
        "correct_answer",
        "explanation",
        "type",
        "domain",
        "difficulty",
      ],
      [
        "q1",
        "What is the capital of France?",
        "Paris|London|Berlin|Madrid",
        "0",
        "Paris is the capital and largest city of France.",
        "single_choice",
        "Geography",
        "easy",
      ],
      [
        "q2",
        "Which of the following are programming languages?",
        "JavaScript|Python|HTML|Java",
        "0,1,3",
        "JavaScript, Python, and Java are programming languages. HTML is a markup language.",
        "multi_select",
        "Computer Science",
        "medium",
      ],
      [
        "q3",
        "The Earth is flat.",
        "True|False",
        "1",
        "The Earth is approximately spherical in shape.",
        "true_false",
        "Science",
        "easy",
      ],
    ];

    const csvContent = sampleData
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample_questions.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Sample CSV file downloaded!");
  };

  const downloadSampleTsv = () => {
    const sampleData = [
      [
        "id",
        "content",
        "options",
        "correct_answer",
        "explanation",
        "type",
        "domain",
        "difficulty",
      ],
      [
        "q1",
        "What is the capital of France?",
        "Paris|London|Berlin|Madrid",
        "0",
        "Paris is the capital and largest city of France.",
        "single_choice",
        "Geography",
        "easy",
      ],
      [
        "q2",
        "Which of the following are programming languages?",
        "JavaScript|Python|HTML|Java",
        "0,1,3",
        "JavaScript, Python, and Java are programming languages. HTML is a markup language.",
        "multi_select",
        "Computer Science",
        "medium",
      ],
      [
        "q3",
        "The Earth is flat.",
        "True|False",
        "1",
        "The Earth is approximately spherical in shape.",
        "true_false",
        "Science",
        "easy",
      ],
    ];

    const tsvContent = sampleData.map((row) => row.join("\t")).join("\n");
    const blob = new Blob([tsvContent], { type: "text/tab-separated-values" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample_questions.tsv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Sample TSV file downloaded!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-primary/10 p-2 rounded-lg">
          <Upload className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            CSV/TSV Question Import
          </h2>
          <p className="text-muted-foreground">
            Upload CSV or TSV files with automatic format detection (standard or
            Anki-style)
          </p>
        </div>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Upload CSV/TSV File</span>
          </CardTitle>
          <CardDescription>
            Select a CSV or TSV file containing questions. The system will
            automatically detect the delimiter and format (standard or
            Anki-style with embedded answer choices).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Input */}
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="csv-upload"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer bg-muted/10 hover:bg-muted/20 transition-colors"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-semibold">Click to upload</span> or drag
                  and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  CSV or TSV files only (MAX. 10MB)
                </p>
              </div>
              <input
                id="csv-upload"
                ref={fileInputRef}
                type="file"
                accept=".csv,.tsv"
                onChange={handleFileSelect}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Processing file and detecting format...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {/* Sample File Downloads */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-2">
              <Download className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Need templates?
              </span>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadSampleCsv}
                disabled={isUploading}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Sample CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadSampleTsv}
                disabled={isUploading}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Sample TSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Format Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <span>Smart Format Detection</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Intelligent Detection:</strong> The system automatically
                detects both standard CSV/TSV formats and Anki-style exports
                with embedded answer choices and deck paths.
              </AlertDescription>
            </Alert>

            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20">
                <h4 className="font-medium mb-2 flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-blue-600" />
                  Standard Format:
                </h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Separate columns for question, options, answers</li>
                  <li>• Options separated by pipe (|) character</li>
                  <li>• Explicit domain column</li>
                  <li>• Example: "What is X?", "A|B|C|D", "0"</li>
                </ul>
              </div>
              <div className="border rounded-lg p-4 bg-purple-50 dark:bg-purple-950/20">
                <h4 className="font-medium mb-2 flex items-center">
                  <Sparkles className="h-4 w-4 mr-2 text-purple-600" />
                  Anki-Style Format:
                </h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Embedded answer choices in question text</li>
                  <li>• Pattern: "Question A. opt1 B. opt2 C. opt3"</li>
                  <li>• Deck paths: "SMLE::Golden::Surgery::..."</li>
                  <li>• Domain extracted from deck path automatically</li>
                </ul>
              </div>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Mixed Batches Supported:</strong> You can upload files
                containing both standard and Anki-style rows. Each row will be
                processed according to its detected format.
              </AlertDescription>
            </Alert>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Anki Deck Path Examples:</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <code className="bg-muted px-2 py-1 rounded text-xs">
                      SMLE::Golden::Medguard::Surgery::Gastrointestinal
                    </code>
                    <span className="ml-2">
                      → Domain: <strong>Surgery</strong>
                    </span>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <code className="bg-muted px-2 py-1 rounded text-xs">
                      SMLE::Internal Medicine::Cardiology
                    </code>
                    <span className="ml-2">
                      → Domain: <strong>Internal Medicine</strong>
                    </span>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <code className="bg-muted px-2 py-1 rounded text-xs">
                      SMLE::Pediatrics::Neonatology
                    </code>
                    <span className="ml-2">
                      → Domain: <strong>Pediatrics</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Column Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5" />
            <span>Format Requirements</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Standard Format Columns:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>
                    <strong>id:</strong> Unique question identifier
                  </li>
                  <li>
                    <strong>content:</strong> Question text
                  </li>
                  <li>
                    <strong>options:</strong> Answer choices (separated by |)
                  </li>
                  <li>
                    <strong>correctAnswers:</strong> Index(es) of correct
                    answers
                  </li>
                  <li>
                    <strong>explanation:</strong> Answer explanation
                  </li>
                  <li>
                    <strong>domain:</strong> SMLE domain
                  </li>
                  <li>
                    <strong>state:</strong> published/draft/archived
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Anki Format Processing:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>
                    <strong>Auto-generated ID:</strong> Unique ID created
                    automatically
                  </li>
                  <li>
                    <strong>Parsed content:</strong> Question extracted from
                    text
                  </li>
                  <li>
                    <strong>Extracted options:</strong> From "A. B. C." pattern
                  </li>
                  <li>
                    <strong>Empty correctAnswers:</strong> Set to empty (to be
                    filled)
                  </li>
                  <li>
                    <strong>Domain from deck:</strong> Extracted from deck path
                  </li>
                  <li>
                    <strong>Default state:</strong> Set to "published"
                  </li>
                </ul>
              </div>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> After upload, you'll be redirected
                to a full-page preview interface where you can review, edit, and
                adjust the parsed data before final import. Anki-style questions
                will have their answer choices extracted and structured
                automatically.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

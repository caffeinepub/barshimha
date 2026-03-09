import { useState, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useSaveCsvPreview } from '../hooks/useQueries';
import { toast } from 'sonner';
import { Upload, FileText, AlertCircle, CheckCircle, Download, AlertTriangle, Sparkles } from 'lucide-react';
import type { CsvPreview } from '../backend';

export function CsvImport() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const saveCsvPreview = useSaveCsvPreview();

  // Enhanced delimiter detection that analyzes multiple lines for better accuracy
  const detectDelimiter = (content: string): string => {
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    if (lines.length === 0) return ',';

    // Analyze first 5 lines (or all if less than 5) for more accurate detection
    const linesToAnalyze = lines.slice(0, Math.min(5, lines.length));
    
    const delimiters = ['\t', ',', ';'];
    const scores: { [key: string]: number } = { '\t': 0, ',': 0, ';': 0 };
    
    // Count occurrences across multiple lines and check consistency
    for (const delimiter of delimiters) {
      const counts: number[] = [];
      
      for (const line of linesToAnalyze) {
        // Skip quoted content when counting delimiters
        let count = 0;
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === delimiter && !inQuotes) {
            count++;
          }
        }
        
        counts.push(count);
      }
      
      // Check if delimiter appears consistently across lines
      if (counts.length > 0) {
        const avgCount = counts.reduce((a, b) => a + b, 0) / counts.length;
        const variance = counts.reduce((sum, count) => sum + Math.pow(count - avgCount, 2), 0) / counts.length;
        
        // Score based on average count and consistency (low variance is better)
        if (avgCount > 0) {
          scores[delimiter] = avgCount * (1 / (1 + variance));
        }
      }
    }

    // Return delimiter with highest score
    let bestDelimiter = ',';
    let bestScore = scores[','];
    
    for (const delimiter of delimiters) {
      if (scores[delimiter] > bestScore) {
        bestScore = scores[delimiter];
        bestDelimiter = delimiter;
      }
    }

    return bestDelimiter;
  };

  // Detect if file is Anki-style format
  const detectAnkiFormat = (headers: string[], rows: string[][]): boolean => {
    // Anki exports typically have specific column patterns
    const headerStr = headers.join('|').toLowerCase();
    
    // Check for Anki-specific headers or patterns
    if (headerStr.includes('deck') || headerStr.includes('tags') || headerStr.includes('note type')) {
      return true;
    }
    
    // Check if first few rows have embedded answer choices (A., B., C., etc.)
    const sampleRows = rows.slice(0, Math.min(5, rows.length));
    let ankiPatternCount = 0;
    
    for (const row of sampleRows) {
      for (const cell of row) {
        // Look for patterns like "A. option B. option C. option"
        if (/[A-E]\.\s+[^.]+\s+[A-E]\.\s+/.test(cell)) {
          ankiPatternCount++;
          break;
        }
      }
    }
    
    // If more than 50% of sample rows have this pattern, likely Anki format
    return ankiPatternCount > sampleRows.length * 0.5;
  };

  // Extract domain from Anki deck path (e.g., "SMLE::Golden::Medguard::Surgery::Gastrointestinal" -> "Surgery")
  const extractDomainFromDeckPath = (deckPath: string): string => {
    if (!deckPath) return 'Uncategorized';
    
    const parts = deckPath.split('::').map(p => p.trim());
    
    // Look for known SMLE domains
    const knownDomains = ['Surgery', 'Internal Medicine', 'Pediatrics', 'Obstetrics & Gynecology', 'OBGYN', 'Ethics'];
    
    for (const part of parts) {
      for (const domain of knownDomains) {
        if (part.toLowerCase().includes(domain.toLowerCase())) {
          return domain === 'OBGYN' ? 'Obstetrics & Gynecology' : domain;
        }
      }
    }
    
    // If no known domain found, use the part after "SMLE" or the first meaningful part
    const smleIndex = parts.findIndex(p => p.toLowerCase() === 'smle');
    if (smleIndex >= 0 && smleIndex < parts.length - 1) {
      return parts[smleIndex + 1];
    }
    
    return parts.length > 0 ? parts[0] : 'Uncategorized';
  };

  // Parse Anki-style question with embedded answer choices
  const parseAnkiQuestion = (questionText: string): { content: string; options: string[] } => {
    // Pattern to match answer choices like "A. option B. option C. option"
    const choicePattern = /([A-E])\.\s+([^A-E]+?)(?=\s+[A-E]\.|$)/g;
    const matches = Array.from(questionText.matchAll(choicePattern));
    
    if (matches.length === 0) {
      // No embedded choices found, return as-is
      return { content: questionText, options: [] };
    }
    
    // Extract the question content (text before first choice)
    const firstMatch = matches[0];
    const questionContent = questionText.substring(0, firstMatch.index).trim();
    
    // Extract options
    const options = matches.map(match => match[2].trim());
    
    return { content: questionContent, options };
  };

  const validateFileFormat = (file: File, content: string): { isValid: boolean; error?: string; delimiter?: string } => {
    const fileExtension = file.name.toLowerCase();
    
    // Check file extension
    if (!fileExtension.endsWith('.csv') && !fileExtension.endsWith('.tsv')) {
      return {
        isValid: false,
        error: 'Please select a CSV or TSV file. Supported formats: .csv (comma/semicolon-separated) and .tsv (tab-separated)'
      };
    }

    // Detect delimiter using enhanced algorithm
    const delimiter = detectDelimiter(content);
    
    // Validate delimiter based on file extension (with warnings, not hard errors)
    if (fileExtension.endsWith('.tsv') && delimiter !== '\t') {
      toast.warning('TSV file detected with non-tab delimiter. You can adjust the delimiter in the preview if needed.');
    }

    if (fileExtension.endsWith('.csv') && delimiter === '\t') {
      toast.warning('CSV file detected with tab delimiter. You can adjust the delimiter in the preview if needed.');
    }

    // Check if delimiter is supported
    const supportedDelimiters = [',', ';', '\t'];
    if (!supportedDelimiters.includes(delimiter)) {
      return {
        isValid: false,
        error: `Unsupported delimiter detected. Please use one of the supported formats:
        • CSV with commas (,)
        • CSV with semicolons (;)  
        • TSV with tabs (\\t)
        
        Current file appears to use an unsupported delimiter.`
      };
    }

    return { isValid: true, delimiter };
  };

  const parseAndValidateCsv = (content: string, fileName: string, detectedDelimiter: string) => {
    try {
      const lines = content.trim().split('\n');
      if (lines.length === 0) {
        throw new Error('File is empty');
      }

      // Use the detected delimiter
      const delimiter = detectedDelimiter;

      // Enhanced CSV/TSV parsing to handle quoted fields properly
      const parseCSVLine = (line: string, delimiter: string): string[] => {
        if (delimiter === '\t') {
          // For tab-separated files, split by tabs (no quote handling needed typically)
          return line.split('\t').map(field => field.trim());
        }

        // For comma/semicolon separated files, handle quoted fields
        const result: string[] = [];
        let current = '';
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
            current = '';
          } else {
            current += char;
          }
          i++;
        }
        
        result.push(current.trim());
        return result.map(field => field.replace(/^"|"$/g, ''));
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
          cells.push('');
        }
        if (cells.length > headers.length) {
          cells.splice(headers.length);
        }
        
        rows.push(cells);
      }

      // Detect if this is Anki-style format
      const isAnkiFormat = detectAnkiFormat(headers, rows);
      
      if (isAnkiFormat) {
        toast.info('Anki-style format detected! Processing embedded answer choices and deck paths...', {
          duration: 4000,
          icon: <Sparkles className="h-4 w-4" />
        });
      }

      // Process rows based on format
      const processedRows: string[][] = [];
      const processedHeaders = isAnkiFormat 
        ? ['id', 'content', 'options', 'correctAnswers', 'explanation', 'domain', 'state']
        : headers;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        
        if (isAnkiFormat) {
          // Process Anki-style row
          const deckPathIndex = headers.findIndex(h => h.toLowerCase().includes('deck'));
          const questionIndex = headers.findIndex(h => h.toLowerCase().includes('front') || h.toLowerCase().includes('question') || h === headers[0]);
          const answerIndex = headers.findIndex(h => h.toLowerCase().includes('back') || h.toLowerCase().includes('answer'));
          
          // Extract domain from deck path
          const deckPath = deckPathIndex >= 0 ? row[deckPathIndex] : '';
          const domain = extractDomainFromDeckPath(deckPath);
          
          // Parse question with embedded choices
          const questionText = questionIndex >= 0 ? row[questionIndex] : '';
          const { content, options } = parseAnkiQuestion(questionText);
          
          // Generate ID
          const id = `q_${Date.now()}_${i}`;
          
          // Get explanation (from answer field if available)
          const explanation = answerIndex >= 0 ? row[answerIndex] : '';
          
          // Format options (pipe-separated)
          const optionsStr = options.length > 0 ? options.join('|') : '';
          
          // Correct answers (empty for now, as Anki doesn't typically mark correct answers)
          const correctAnswers = '';
          
          // State (published by default)
          const state = 'published';
          
          processedRows.push([id, content, optionsStr, correctAnswers, explanation, domain, state]);
        } else {
          // Standard format - keep as-is
          processedRows.push(row);
        }

        // Validate row
        const validation = validateRow(i, processedRows[i], processedHeaders, processedRows);
        validationResults.push({
          rowIndex: BigInt(i),
          isValid: validation.isValid,
          errors: validation.errors
        });
      }

      const preview: CsvPreview = {
        headers: processedHeaders,
        rows: processedRows,
        validationResults,
        delimiter
      };

      return preview;
    } catch (error: any) {
      throw new Error(`Failed to parse file: ${error.message}`);
    }
  };

  const validateRow = (rowIndex: number, rowData: string[], headers: string[], allRows: string[][]) => {
    const errors: string[] = [];
    let isValid = true;

    // Check for empty required fields
    const requiredFields = ['id', 'content', 'domain'];
    requiredFields.forEach((field) => {
      const fieldIndex = headers.findIndex(h => h.toLowerCase().includes(field.toLowerCase()));
      if (fieldIndex >= 0 && (!rowData[fieldIndex] || rowData[fieldIndex].trim() === '')) {
        errors.push(`Required field '${field}' is empty`);
        isValid = false;
      }
    });

    // Validate ID uniqueness
    const idIndex = headers.findIndex(h => h.toLowerCase().includes('id'));
    if (idIndex >= 0 && rowData[idIndex]) {
      const duplicateIndex = allRows.findIndex((row, index) => 
        index !== rowIndex && row[idIndex] === rowData[idIndex]
      );
      if (duplicateIndex >= 0) {
        errors.push(`Duplicate ID found in row ${duplicateIndex + 2}`);
        isValid = false;
      }
    }

    return { isValid, errors };
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
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
        throw new Error('File is empty');
      }

      const lines = content.trim().split('\n');
      if (lines.length < 2) {
        throw new Error('File must contain at least a header row and one data row');
      }

      // Enhanced format validation with delimiter detection
      const validation = validateFileFormat(file, content);
      if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid file format');
      }

      // Parse and validate CSV content with detected delimiter
      const preview = parseAndValidateCsv(content, file.name, validation.delimiter!);
      
      // Generate unique preview ID
      const previewId = `preview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Save preview to backend
      await saveCsvPreview.mutateAsync({ previewId, preview });

      const delimiter = validation.delimiter!;
      const delimiterName = delimiter === '\t' ? 'tab' : delimiter === ';' ? 'semicolon' : 'comma';
      
      toast.success(`${file.name.endsWith('.tsv') ? 'TSV' : 'CSV'} file processed successfully! Auto-detected ${delimiterName}-separated format. Redirecting to preview...`);

      // Navigate to full-page CSV preview
      navigate({ 
        to: '/admin/csv-preview/$previewId', 
        params: { previewId },
        search: { fileName: file.name }
      });

    } catch (error: any) {
      toast.error(`Failed to process file: ${error.message}`);
      console.error('File processing error:', error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          reject(new Error('Failed to read file as text'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const downloadSampleCsv = () => {
    const sampleData = [
      ['id', 'content', 'options', 'correct_answer', 'explanation', 'type', 'domain', 'difficulty'],
      ['q1', 'What is the capital of France?', 'Paris|London|Berlin|Madrid', '0', 'Paris is the capital and largest city of France.', 'single_choice', 'Geography', 'easy'],
      ['q2', 'Which of the following are programming languages?', 'JavaScript|Python|HTML|Java', '0,1,3', 'JavaScript, Python, and Java are programming languages. HTML is a markup language.', 'multi_select', 'Computer Science', 'medium'],
      ['q3', 'The Earth is flat.', 'True|False', '1', 'The Earth is approximately spherical in shape.', 'true_false', 'Science', 'easy']
    ];

    const csvContent = sampleData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_questions.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Sample CSV file downloaded!');
  };

  const downloadSampleTsv = () => {
    const sampleData = [
      ['id', 'content', 'options', 'correct_answer', 'explanation', 'type', 'domain', 'difficulty'],
      ['q1', 'What is the capital of France?', 'Paris|London|Berlin|Madrid', '0', 'Paris is the capital and largest city of France.', 'single_choice', 'Geography', 'easy'],
      ['q2', 'Which of the following are programming languages?', 'JavaScript|Python|HTML|Java', '0,1,3', 'JavaScript, Python, and Java are programming languages. HTML is a markup language.', 'multi_select', 'Computer Science', 'medium'],
      ['q3', 'The Earth is flat.', 'True|False', '1', 'The Earth is approximately spherical in shape.', 'true_false', 'Science', 'easy']
    ];

    const tsvContent = sampleData.map(row => row.join('\t')).join('\n');
    const blob = new Blob([tsvContent], { type: 'text/tab-separated-values' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_questions.tsv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Sample TSV file downloaded!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-primary/10 p-2 rounded-lg">
          <Upload className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">CSV/TSV Question Import</h2>
          <p className="text-muted-foreground">Upload CSV or TSV files with automatic format detection (standard or Anki-style)</p>
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
            Select a CSV or TSV file containing questions. The system will automatically detect the delimiter and format (standard or Anki-style with embedded answer choices).
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
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">CSV or TSV files only (MAX. 10MB)</p>
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
              <span className="text-sm text-muted-foreground">Need templates?</span>
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
                <strong>Intelligent Detection:</strong> The system automatically detects both standard CSV/TSV formats and Anki-style exports with embedded answer choices and deck paths.
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
                <strong>Mixed Batches Supported:</strong> You can upload files containing both standard and Anki-style rows. Each row will be processed according to its detected format.
              </AlertDescription>
            </Alert>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Anki Deck Path Examples:</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <code className="bg-muted px-2 py-1 rounded text-xs">SMLE::Golden::Medguard::Surgery::Gastrointestinal</code>
                    <span className="ml-2">→ Domain: <strong>Surgery</strong></span>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <code className="bg-muted px-2 py-1 rounded text-xs">SMLE::Internal Medicine::Cardiology</code>
                    <span className="ml-2">→ Domain: <strong>Internal Medicine</strong></span>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <code className="bg-muted px-2 py-1 rounded text-xs">SMLE::Pediatrics::Neonatology</code>
                    <span className="ml-2">→ Domain: <strong>Pediatrics</strong></span>
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
                  <li><strong>id:</strong> Unique question identifier</li>
                  <li><strong>content:</strong> Question text</li>
                  <li><strong>options:</strong> Answer choices (separated by |)</li>
                  <li><strong>correctAnswers:</strong> Index(es) of correct answers</li>
                  <li><strong>explanation:</strong> Answer explanation</li>
                  <li><strong>domain:</strong> SMLE domain</li>
                  <li><strong>state:</strong> published/draft/archived</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Anki Format Processing:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li><strong>Auto-generated ID:</strong> Unique ID created automatically</li>
                  <li><strong>Parsed content:</strong> Question extracted from text</li>
                  <li><strong>Extracted options:</strong> From "A. B. C." pattern</li>
                  <li><strong>Empty correctAnswers:</strong> Set to empty (to be filled)</li>
                  <li><strong>Domain from deck:</strong> Extracted from deck path</li>
                  <li><strong>Default state:</strong> Set to "published"</li>
                </ul>
              </div>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> After upload, you'll be redirected to a full-page preview interface where you can review, edit, and adjust the parsed data before final import. Anki-style questions will have their answer choices extracted and structured automatically.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

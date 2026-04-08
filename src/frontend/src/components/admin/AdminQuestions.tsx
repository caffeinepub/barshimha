import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  CheckCircle,
  Database,
  Edit,
  Link,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { Question } from "../../backend";
import { QuestionState, QuestionType } from "../../backend";
import {
  useAddQuestion,
  useDeleteQuestion,
  useGetDomains,
  useGetQuestions,
  useInitializeDomains,
  useUpdateQuestion,
} from "../../hooks/useQueries";
import { CsvImport } from "../CsvImport";

export function AdminQuestions() {
  const { data: questions = [] } = useGetQuestions();
  const { data: domains = [] } = useGetDomains();
  const addQuestion = useAddQuestion();
  const updateQuestion = useUpdateQuestion();
  const deleteQuestion = useDeleteQuestion();
  const initializeDomains = useInitializeDomains();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedState, setSelectedState] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const [selectedQuestionBank, setSelectedQuestionBank] = useState("SMLE");
  const [selectedDomain, setSelectedDomain] = useState("");

  const [formData, setFormData] = useState({
    content: "",
    options: ["", "", "", ""],
    correctAnswers: [] as number[],
    explanation: "",
    questionType: QuestionType.singleChoice,
    state: QuestionState.draft,
    evidenceUrl: "",
  });

  useEffect(() => {
    if (domains.length === 0) {
      initializeDomains.mutate();
    }
  }, [domains.length, initializeDomains]);

  const handleQuestionBankChange = (value: string) => {
    setSelectedQuestionBank(value);
    setSelectedDomain("");
  };

  const filteredQuestions = useMemo(() => {
    return questions.filter((question) => {
      const matchesSearch =
        question.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        question.domain.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesState =
        selectedState === "all" || question.state === selectedState;
      return matchesSearch && matchesState;
    });
  }, [questions, searchTerm, selectedState]);

  const resetForm = useCallback(() => {
    setFormData({
      content: "",
      options: ["", "", "", ""],
      correctAnswers: [],
      explanation: "",
      questionType: QuestionType.singleChoice,
      state: QuestionState.draft,
      evidenceUrl: "",
    });
    setEditingQuestion(null);
    setSelectedQuestionBank("SMLE");
    setSelectedDomain("");
  }, []);

  const handleEdit = useCallback(
    (question: Question) => {
      setEditingQuestion(question);
      setFormData({
        content: question.content,
        options: [...question.options],
        correctAnswers: question.correctAnswers.map(Number),
        explanation: question.explanation,
        questionType: question.questionType,
        state: question.state,
        evidenceUrl:
          (question as Question & { evidenceUrl?: string }).evidenceUrl ?? "",
      });
      setSelectedQuestionBank("SMLE");
      const domain = domains.find((d) => d.name === question.domain);
      if (domain) setSelectedDomain(domain.id);
      setIsDialogOpen(true);
    },
    [domains],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.content.trim()) {
      toast.error("Please enter question content");
      return;
    }
    if (!selectedQuestionBank || !selectedDomain) {
      toast.error("Please select question bank and domain");
      return;
    }
    if (formData.correctAnswers.length === 0) {
      toast.error("Please select at least one correct answer");
      return;
    }

    try {
      const selectedDomainObj = domains.find((d) => d.id === selectedDomain);
      if (!selectedDomainObj) {
        toast.error("Invalid domain selection");
        return;
      }

      const questionData: Question & { evidenceUrl?: string } = {
        id:
          editingQuestion?.id ||
          `question_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: formData.content.trim(),
        options: formData.options.filter((opt) => opt.trim()),
        correctAnswers: formData.correctAnswers.map(BigInt),
        explanation: formData.explanation.trim(),
        questionType: formData.questionType,
        domain: selectedDomainObj.name,
        state: formData.state,
        version: editingQuestion
          ? editingQuestion.version + BigInt(1)
          : BigInt(1),
        createdAt: editingQuestion?.createdAt || BigInt(Date.now() * 1000000),
        updatedAt: BigInt(Date.now() * 1000000),
        ...(formData.evidenceUrl.trim()
          ? { evidenceUrl: formData.evidenceUrl.trim() }
          : {}),
      };

      if (editingQuestion) {
        await updateQuestion.mutateAsync(questionData);
        toast.success("Question updated successfully");
      } else {
        await addQuestion.mutateAsync(questionData);
        toast.success("Question created successfully");
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error("Failed to save question");
      console.error("Question save error:", error);
    }
  };

  const handleDelete = async (questionId: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    try {
      await deleteQuestion.mutateAsync(questionId);
      toast.success("Question deleted successfully");
    } catch (error) {
      toast.error("Failed to delete question");
      console.error("Question delete error:", error);
    }
  };

  const handleCorrectAnswerToggle = (index: number) => {
    if (
      formData.questionType === QuestionType.singleChoice ||
      formData.questionType === QuestionType.trueFalse
    ) {
      setFormData((prev) => ({ ...prev, correctAnswers: [index] }));
    } else {
      setFormData((prev) => ({
        ...prev,
        correctAnswers: prev.correctAnswers.includes(index)
          ? prev.correctAnswers.filter((i) => i !== index)
          : [...prev.correctAnswers, index],
      }));
    }
  };

  const getQuestionTypeLabel = (type: QuestionType) => {
    switch (type) {
      case QuestionType.singleChoice:
        return "Single Choice";
      case QuestionType.multiSelect:
        return "Multiple Select";
      case QuestionType.trueFalse:
        return "True/False";
      case QuestionType.numeric:
        return "Numeric";
      default:
        return "Unknown";
    }
  };

  const getStateColor = (state: QuestionState) => {
    switch (state) {
      case QuestionState.published:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case QuestionState.draft:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case QuestionState.archived:
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const canProceedToQuestionDetails = selectedQuestionBank && selectedDomain;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Question Management</h2>
          <p className="text-muted-foreground">
            Create, edit, and manage exam questions across the five SMLE domains
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingQuestion ? "Edit Question" : "Create New Question"}
              </DialogTitle>
              <DialogDescription>
                {editingQuestion
                  ? "Update the question details below."
                  : "Select question bank and domain, then fill in the question details."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Classification */}
              <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Database className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-blue-800 dark:text-blue-200">
                      SMLE Question Classification
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2">
                        <span>Question Bank *</span>
                        {selectedQuestionBank && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                      </Label>
                      <Select
                        value={selectedQuestionBank}
                        onValueChange={handleQuestionBankChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select question bank" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SMLE">SMLE</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2">
                        <span>Domain *</span>
                        {selectedDomain && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                      </Label>
                      <Select
                        value={selectedDomain}
                        onValueChange={setSelectedDomain}
                        disabled={!selectedQuestionBank}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              !selectedQuestionBank
                                ? "Select question bank first"
                                : "Select domain"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {domains.map((domain) => (
                            <SelectItem key={domain.id} value={domain.id}>
                              {domain.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-sm">
                    <div
                      className={`w-3 h-3 rounded-full ${selectedQuestionBank ? "bg-green-500" : "bg-muted-foreground"}`}
                    />
                    <span
                      className={
                        selectedQuestionBank
                          ? "text-green-700 dark:text-green-300"
                          : "text-muted-foreground"
                      }
                    >
                      SMLE Question Bank
                    </span>
                    <div className="w-4 h-px bg-border" />
                    <div
                      className={`w-3 h-3 rounded-full ${selectedDomain ? "bg-green-500" : "bg-muted-foreground"}`}
                    />
                    <span
                      className={
                        selectedDomain
                          ? "text-green-700 dark:text-green-300"
                          : "text-muted-foreground"
                      }
                    >
                      Domain ({domains.length}/5)
                    </span>
                  </div>

                  {!canProceedToQuestionDetails && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Please complete both selections above before entering
                        question details.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Question Details */}
              {canProceedToQuestionDetails && (
                <>
                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Question Type</Label>
                      <Select
                        value={formData.questionType}
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            questionType: value as QuestionType,
                            correctAnswers: [],
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={QuestionType.singleChoice}>
                            Single Choice
                          </SelectItem>
                          <SelectItem value={QuestionType.multiSelect}>
                            Multiple Select
                          </SelectItem>
                          <SelectItem value={QuestionType.trueFalse}>
                            True/False
                          </SelectItem>
                          <SelectItem value={QuestionType.numeric}>
                            Numeric
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={formData.state}
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            state: value as QuestionState,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={QuestionState.draft}>
                            Draft
                          </SelectItem>
                          <SelectItem value={QuestionState.published}>
                            Published
                          </SelectItem>
                          <SelectItem value={QuestionState.archived}>
                            Archived
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Question Content *</Label>
                    <Textarea
                      value={formData.content}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          content: e.target.value,
                        }))
                      }
                      placeholder="Enter the question text..."
                      rows={4}
                      required
                    />
                  </div>

                  {formData.questionType !== QuestionType.numeric && (
                    <div className="space-y-4">
                      <Label>Answer Options</Label>
                      {formData.questionType === QuestionType.trueFalse ? (
                        <div className="space-y-2">
                          {["True", "False"].map((option, index) => (
                            <div
                              key={option}
                              className="flex items-center space-x-2"
                            >
                              <input
                                type="radio"
                                name="correct-answer"
                                checked={formData.correctAnswers.includes(
                                  index,
                                )}
                                onChange={() =>
                                  handleCorrectAnswerToggle(index)
                                }
                              />
                              <span>{option}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {formData.options.map((option, index) => (
                            <div
                              key={`opt-${String(index)}`}
                              className="flex items-center space-x-2"
                            >
                              <input
                                type={
                                  formData.questionType ===
                                  QuestionType.singleChoice
                                    ? "radio"
                                    : "checkbox"
                                }
                                name="correct-answer"
                                checked={formData.correctAnswers.includes(
                                  index,
                                )}
                                onChange={() =>
                                  handleCorrectAnswerToggle(index)
                                }
                              />
                              <Input
                                value={option}
                                onChange={(e) => {
                                  const newOptions = [...formData.options];
                                  newOptions[index] = e.target.value;
                                  setFormData((prev) => ({
                                    ...prev,
                                    options: newOptions,
                                  }));
                                }}
                                placeholder={`Option ${index + 1}`}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Explanation</Label>
                    <Textarea
                      value={formData.explanation}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          explanation: e.target.value,
                        }))
                      }
                      placeholder="Provide a detailed explanation for the correct answer..."
                      rows={3}
                    />
                  </div>

                  {/* Evidence / YouTube Link */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Link className="h-4 w-4 text-muted-foreground" />
                      Evidence / YouTube Link
                      <span className="text-xs text-muted-foreground font-normal">
                        (optional)
                      </span>
                    </Label>
                    <Input
                      value={formData.evidenceUrl}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          evidenceUrl: e.target.value,
                        }))
                      }
                      placeholder="https://youtube.com/watch?v=... or any reference URL"
                      type="url"
                      data-ocid="evidence-url-input"
                    />
                    <p className="text-xs text-muted-foreground">
                      Add a YouTube video or reference link as evidence for the
                      answer.
                    </p>
                  </div>
                </>
              )}

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    !canProceedToQuestionDetails ||
                    addQuestion.isPending ||
                    updateQuestion.isPending
                  }
                >
                  {addQuestion.isPending || updateQuestion.isPending
                    ? "Saving…"
                    : editingQuestion
                      ? "Update Question"
                      : "Create Question"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* SMLE Structure Overview */}
      <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="text-green-800 dark:text-green-200">
            SMLE Domain Structure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-green-700 dark:text-green-300">
            The system includes the five SMLE domains: Surgery, OBGYN, Internal
            Medicine, Pediatrics, and Ethics.
          </CardDescription>
        </CardContent>
      </Card>

      {/* Tabs: Questions and CSV Import only */}
      <Tabs defaultValue="questions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="questions">Question Management</TabsTrigger>
          <TabsTrigger value="csv-import">CSV Import</TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search questions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedState} onValueChange={setSelectedState}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    <SelectItem value={QuestionState.published}>
                      Published
                    </SelectItem>
                    <SelectItem value={QuestionState.draft}>Draft</SelectItem>
                    <SelectItem value={QuestionState.archived}>
                      Archived
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Questions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Questions ({filteredQuestions.length})</CardTitle>
              <CardDescription>
                Questions organised by the five SMLE domains
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Question</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Domain</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Evidence</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuestions.map((question) => {
                    const evidenceUrl = (
                      question as Question & { evidenceUrl?: string }
                    ).evidenceUrl;
                    return (
                      <TableRow key={question.id}>
                        <TableCell className="max-w-xs">
                          <p className="line-clamp-2 text-sm">
                            {question.content}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getQuestionTypeLabel(question.questionType)}
                          </Badge>
                        </TableCell>
                        <TableCell>{question.domain}</TableCell>
                        <TableCell>
                          <Badge className={getStateColor(question.state)}>
                            {question.state}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {evidenceUrl ? (
                            <a
                              href={evidenceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline text-xs flex items-center gap-1"
                            >
                              <Link className="h-3 w-3" />
                              View
                            </a>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(question)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(question.id)}
                              disabled={deleteQuestion.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="csv-import" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>CSV Import with Full-Page Preview</CardTitle>
              <CardDescription>
                Upload CSV/TSV files and preview them before importing. No
                questions will be imported until you approve them.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CsvImport />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

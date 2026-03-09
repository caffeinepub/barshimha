import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAddQuestion, useGetDomains, useInitializeDomains } from '../hooks/useQueries';
import { Question, QuestionType, QuestionState } from '../backend';
import { toast } from 'sonner';
import { Plus, X, AlertCircle, BookOpen, FileText, CheckCircle, Save } from 'lucide-react';

export function AddQuestionForm() {
  const [questionBank, setQuestionBank] = useState('SMLE');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [questionContent, setQuestionContent] = useState('');
  const [questionType, setQuestionType] = useState<QuestionType>(QuestionType.singleChoice);
  const [options, setOptions] = useState<string[]>(['', '']);
  const [correctAnswers, setCorrectAnswers] = useState<number[]>([]);
  const [explanation, setExplanation] = useState('');
  const [questionState, setQuestionState] = useState<QuestionState>(QuestionState.draft);

  const { data: domains = [], isLoading: domainsLoading } = useGetDomains();
  const addQuestion = useAddQuestion();
  const initializeDomains = useInitializeDomains();

  // Initialize domains if empty
  useEffect(() => {
    if (!domainsLoading && domains.length === 0) {
      initializeDomains.mutate();
    }
  }, [domains, domainsLoading, initializeDomains]);

  const addOption = () => {
    setOptions([...options, '']);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      // Remove from correct answers if it was selected
      setCorrectAnswers(correctAnswers.filter(answer => answer !== index).map(answer => answer > index ? answer - 1 : answer));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const toggleCorrectAnswer = (index: number) => {
    if (questionType === QuestionType.singleChoice) {
      setCorrectAnswers([index]);
    } else {
      const isSelected = correctAnswers.includes(index);
      if (isSelected) {
        setCorrectAnswers(correctAnswers.filter(answer => answer !== index));
      } else {
        setCorrectAnswers([...correctAnswers, index]);
      }
    }
  };

  const resetForm = () => {
    setQuestionBank('SMLE');
    setSelectedDomain('');
    setQuestionContent('');
    setQuestionType(QuestionType.singleChoice);
    setOptions(['', '']);
    setCorrectAnswers([]);
    setExplanation('');
    setQuestionState(QuestionState.draft);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!questionBank) {
      toast.error('Please select a question bank');
      return;
    }

    if (!selectedDomain) {
      toast.error('Please select a domain');
      return;
    }

    if (!questionContent.trim()) {
      toast.error('Please enter question content');
      return;
    }

    if (questionType !== QuestionType.numeric && options.some(opt => !opt.trim())) {
      toast.error('Please fill in all options');
      return;
    }

    if (questionType !== QuestionType.numeric && correctAnswers.length === 0) {
      toast.error('Please select at least one correct answer');
      return;
    }

    if (!explanation.trim()) {
      toast.error('Please provide an explanation');
      return;
    }

    try {
      const question: Question = {
        id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: questionContent.trim(),
        options: questionType === QuestionType.numeric ? [] : options.filter(opt => opt.trim()),
        correctAnswers: questionType === QuestionType.numeric ? [] : correctAnswers.map(i => BigInt(i)),
        explanation: explanation.trim(),
        questionType,
        domain: selectedDomain,
        state: questionState,
        version: BigInt(1),
        createdAt: BigInt(Date.now() * 1000000), // Convert to nanoseconds
        updatedAt: BigInt(Date.now() * 1000000), // Convert to nanoseconds
      };

      await addQuestion.mutateAsync(question);
      toast.success('Question added successfully!');
      resetForm();
    } catch (error: any) {
      toast.error(`Failed to add question: ${error.message}`);
      console.error('Add question error:', error);
    }
  };

  const canCreateQuestion = questionBank && selectedDomain;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-primary/10 p-2 rounded-lg">
          <Plus className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Add New Question</h2>
          <p className="text-muted-foreground">Create a new question for the SMLE question bank</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Question Bank and Domain Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5" />
              <span>Question Classification</span>
            </CardTitle>
            <CardDescription>
              Select the question bank and domain for this question
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Question Bank Selection */}
              <div className="space-y-2">
                <Label htmlFor="questionBank">Question Bank</Label>
                <Select value={questionBank} onValueChange={setQuestionBank}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select question bank" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SMLE">SMLE</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Domain Selection */}
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Select 
                  value={selectedDomain} 
                  onValueChange={setSelectedDomain}
                  disabled={!questionBank || domainsLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={domainsLoading ? "Loading domains..." : "Select domain"} />
                  </SelectTrigger>
                  <SelectContent>
                    {domains.map((domain) => (
                      <SelectItem key={domain.id} value={domain.name}>
                        {domain.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {questionBank && selectedDomain && (
              <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  Question will be added to: <strong>{questionBank} → {selectedDomain}</strong>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Question Details */}
        {canCreateQuestion && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Question Details</span>
              </CardTitle>
              <CardDescription>
                Enter the question content and configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Question Content */}
              <div className="space-y-2">
                <Label htmlFor="content">Question Content</Label>
                <Textarea
                  id="content"
                  value={questionContent}
                  onChange={(e) => setQuestionContent(e.target.value)}
                  placeholder="Enter the question text..."
                  rows={4}
                  required
                />
              </div>

              {/* Question Type */}
              <div className="space-y-2">
                <Label htmlFor="type">Question Type</Label>
                <Select value={questionType} onValueChange={(value) => {
                  setQuestionType(value as QuestionType);
                  setCorrectAnswers([]);
                  if (value === QuestionType.trueFalse) {
                    setOptions(['True', 'False']);
                  } else if (value === QuestionType.numeric) {
                    setOptions([]);
                  } else {
                    setOptions(['', '']);
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={QuestionType.singleChoice}>Single Choice</SelectItem>
                    <SelectItem value={QuestionType.multiSelect}>Multiple Select</SelectItem>
                    <SelectItem value={QuestionType.trueFalse}>True/False</SelectItem>
                    <SelectItem value={QuestionType.numeric}>Numeric Input</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Options (for non-numeric questions) */}
              {questionType !== QuestionType.numeric && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Answer Options</Label>
                    {questionType !== QuestionType.trueFalse && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addOption}
                        disabled={options.length >= 6}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Option
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    {options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="flex-1 flex items-center space-x-2">
                          <Input
                            value={option}
                            onChange={(e) => updateOption(index, e.target.value)}
                            placeholder={`Option ${index + 1}`}
                            disabled={questionType === QuestionType.trueFalse}
                            required
                          />
                          <Button
                            type="button"
                            variant={correctAnswers.includes(index) ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleCorrectAnswer(index)}
                            className="min-w-[80px]"
                          >
                            {correctAnswers.includes(index) ? 'Correct' : 'Mark'}
                          </Button>
                        </div>
                        {questionType !== QuestionType.trueFalse && options.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeOption(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  {correctAnswers.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">Correct answers:</span>
                      {correctAnswers.map((answerIndex) => (
                        <Badge key={answerIndex} variant="secondary">
                          Option {answerIndex + 1}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Explanation */}
              <div className="space-y-2">
                <Label htmlFor="explanation">Explanation</Label>
                <Textarea
                  id="explanation"
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Provide a detailed explanation for the correct answer..."
                  rows={3}
                  required
                />
              </div>

              {/* Question State */}
              <div className="space-y-2">
                <Label htmlFor="state">Question State</Label>
                <Select value={questionState} onValueChange={(value) => setQuestionState(value as QuestionState)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={QuestionState.draft}>Draft</SelectItem>
                    <SelectItem value={QuestionState.published}>Published</SelectItem>
                    <SelectItem value={QuestionState.archived}>Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        {canCreateQuestion && (
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
              disabled={addQuestion.isPending}
            >
              Reset Form
            </Button>
            <Button
              type="submit"
              disabled={addQuestion.isPending}
              className="min-w-[120px]"
            >
              {addQuestion.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                  Adding...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Add Question
                </>
              )}
            </Button>
          </div>
        )}

        {/* Instructions */}
        {!canCreateQuestion && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please select both a question bank and domain to continue creating your question.
            </AlertDescription>
          </Alert>
        )}
      </form>
    </div>
  );
}

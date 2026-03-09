import { useState, useEffect, useCallback, useMemo } from 'react';
import { useGetQuestions, useAddQuestion, useUpdateQuestion, useDeleteQuestion, useGetDomains, useInitializeDomains } from '../../hooks/useQueries';
import { AdminDomainTopicManagement } from './AdminDomainTopicManagement';
import { CsvImport } from '../CsvImport';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Search, Database, AlertCircle, CheckCircle, Settings } from 'lucide-react';
import { Question, QuestionType, QuestionState } from '../../backend';
import { toast } from 'sonner';

export function AdminQuestions() {
  const { data: questions = [] } = useGetQuestions();
  const { data: domains = [] } = useGetDomains();
  const addQuestion = useAddQuestion();
  const updateQuestion = useUpdateQuestion();
  const deleteQuestion = useDeleteQuestion();
  const initializeDomains = useInitializeDomains();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Simplified cascading dropdown state
  const [selectedQuestionBank, setSelectedQuestionBank] = useState('SMLE');
  const [selectedDomain, setSelectedDomain] = useState('');

  const [formData, setFormData] = useState({
    content: '',
    options: ['', '', '', ''],
    correctAnswers: [] as number[],
    explanation: '',
    questionType: QuestionType.singleChoice,
    state: QuestionState.draft,
  });

  // Initialize domains if empty
  useEffect(() => {
    if (domains.length === 0) {
      initializeDomains.mutate();
    }
  }, [domains.length, initializeDomains]);

  // Reset domain when question bank changes
  useEffect(() => {
    setSelectedDomain('');
  }, [selectedQuestionBank]);

  const filteredQuestions = useMemo(() => {
    return questions.filter(question => {
      const matchesSearch = question.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           question.domain.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesState = selectedState === 'all' || question.state === selectedState;
      return matchesSearch && matchesState;
    });
  }, [questions, searchTerm, selectedState]);

  const resetForm = useCallback(() => {
    setFormData({
      content: '',
      options: ['', '', '', ''],
      correctAnswers: [],
      explanation: '',
      questionType: QuestionType.singleChoice,
      state: QuestionState.draft,
    });
    setEditingQuestion(null);
    
    // Reset cascading dropdowns to initial state
    setSelectedQuestionBank('SMLE');
    setSelectedDomain('');
  }, []);

  const handleEdit = useCallback((question: Question) => {
    setEditingQuestion(question);
    setFormData({
      content: question.content,
      options: [...question.options],
      correctAnswers: question.correctAnswers.map(Number),
      explanation: question.explanation,
      questionType: question.questionType,
      state: question.state,
    });
    
    // Set cascading dropdown values for editing
    setSelectedQuestionBank('SMLE');
    
    // Find domain by name
    const domain = domains.find(d => d.name === question.domain);
    if (domain) {
      setSelectedDomain(domain.id);
    }
    
    setIsDialogOpen(true);
  }, [domains]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.content.trim()) {
      toast.error('Please enter question content');
      return;
    }

    if (!selectedQuestionBank || !selectedDomain) {
      toast.error('Please select question bank and domain');
      return;
    }

    if (formData.correctAnswers.length === 0) {
      toast.error('Please select at least one correct answer');
      return;
    }

    try {
      // Get domain name from ID
      const selectedDomainObj = domains.find(d => d.id === selectedDomain);

      if (!selectedDomainObj) {
        toast.error('Invalid domain selection');
        return;
      }

      const questionData: Question = {
        id: editingQuestion?.id || `question_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: formData.content.trim(),
        options: formData.options.filter(opt => opt.trim()),
        correctAnswers: formData.correctAnswers.map(BigInt),
        explanation: formData.explanation.trim(),
        questionType: formData.questionType,
        domain: selectedDomainObj.name,
        state: formData.state,
        version: editingQuestion ? editingQuestion.version + BigInt(1) : BigInt(1),
        createdAt: editingQuestion?.createdAt || BigInt(Date.now() * 1000000),
        updatedAt: BigInt(Date.now() * 1000000),
      };

      if (editingQuestion) {
        await updateQuestion.mutateAsync(questionData);
        toast.success('Question updated successfully');
      } else {
        await addQuestion.mutateAsync(questionData);
        toast.success('Question created successfully');
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Failed to save question');
      console.error('Question save error:', error);
    }
  };

  const handleDelete = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      await deleteQuestion.mutateAsync(questionId);
      toast.success('Question deleted successfully');
    } catch (error) {
      toast.error('Failed to delete question');
      console.error('Question delete error:', error);
    }
  };

  const handleCorrectAnswerToggle = (index: number) => {
    if (formData.questionType === QuestionType.singleChoice || formData.questionType === QuestionType.trueFalse) {
      setFormData(prev => ({ ...prev, correctAnswers: [index] }));
    } else {
      setFormData(prev => ({
        ...prev,
        correctAnswers: prev.correctAnswers.includes(index)
          ? prev.correctAnswers.filter(i => i !== index)
          : [...prev.correctAnswers, index]
      }));
    }
  };

  const getQuestionTypeLabel = (type: QuestionType) => {
    switch (type) {
      case QuestionType.singleChoice: return 'Single Choice';
      case QuestionType.multiSelect: return 'Multiple Select';
      case QuestionType.trueFalse: return 'True/False';
      case QuestionType.numeric: return 'Numeric';
      default: return 'Unknown';
    }
  };

  const getStateColor = (state: QuestionState) => {
    switch (state) {
      case QuestionState.published: return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case QuestionState.draft: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case QuestionState.archived: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const canProceedToQuestionDetails = selectedQuestionBank && selectedDomain;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Question Management</h2>
          <p className="text-muted-foreground">Create, edit, and manage exam questions across the five SMLE domains</p>
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
                {editingQuestion ? 'Edit Question' : 'Create New Question'}
              </DialogTitle>
              <DialogDescription>
                {editingQuestion ? 'Update the question details below.' : 'Select question bank and domain from the five SMLE domains, then fill in the question details.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Cascading Dropdowns Section */}
              <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Database className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-blue-800 dark:text-blue-200">SMLE Question Classification</CardTitle>
                  </div>
                  <CardDescription className="text-blue-700 dark:text-blue-300">
                    Select from the five SMLE domains: question bank and domain before entering question details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Question Bank Selection */}
                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2">
                        <span>Question Bank *</span>
                        {selectedQuestionBank && <CheckCircle className="h-4 w-4 text-green-600" />}
                      </Label>
                      <Select 
                        value={selectedQuestionBank} 
                        onValueChange={setSelectedQuestionBank}
                      >
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
                      <Label className="flex items-center space-x-2">
                        <span>Domain * (5 SMLE Domains)</span>
                        {selectedDomain && <CheckCircle className="h-4 w-4 text-green-600" />}
                      </Label>
                      <Select 
                        value={selectedDomain} 
                        onValueChange={setSelectedDomain}
                        disabled={!selectedQuestionBank}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={
                            !selectedQuestionBank ? "Select question bank first" :
                            "Select domain"
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {domains.map(domain => (
                            <SelectItem key={domain.id} value={domain.id}>
                              {domain.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {domains.length > 0 && (
                        <p className="text-xs text-green-600 dark:text-green-400">
                          ✓ {domains.length} SMLE domains available
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Progress Indicator */}
                  <div className="flex items-center space-x-2 text-sm">
                    <div className={`w-3 h-3 rounded-full ${selectedQuestionBank ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className={selectedQuestionBank ? 'text-green-700 dark:text-green-300' : 'text-gray-500'}>
                      SMLE Question Bank
                    </span>
                    <div className="w-4 h-px bg-gray-300" />
                    <div className={`w-3 h-3 rounded-full ${selectedDomain ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className={selectedDomain ? 'text-green-700 dark:text-green-300' : 'text-gray-500'}>
                      Domain ({domains.length}/5)
                    </span>
                  </div>

                  {!canProceedToQuestionDetails && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Please complete both selections above before entering question details. 
                        The system includes the five SMLE domains.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Question Details Section - Only show when all selections are made */}
              {canProceedToQuestionDetails && (
                <>
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Question Type</Label>
                      <Select 
                        value={formData.questionType} 
                        onValueChange={(value) => setFormData(prev => ({ 
                          ...prev, 
                          questionType: value as QuestionType,
                          correctAnswers: []
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={QuestionType.singleChoice}>Single Choice</SelectItem>
                          <SelectItem value={QuestionType.multiSelect}>Multiple Select</SelectItem>
                          <SelectItem value={QuestionType.trueFalse}>True/False</SelectItem>
                          <SelectItem value={QuestionType.numeric}>Numeric</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select 
                        value={formData.state} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, state: value as QuestionState }))}
                      >
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
                  </div>

                  <div className="space-y-2">
                    <Label>Question Content *</Label>
                    <Textarea
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
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
                          {['True', 'False'].map((option, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <input
                                type="radio"
                                name="correct-answer"
                                checked={formData.correctAnswers.includes(index)}
                                onChange={() => handleCorrectAnswerToggle(index)}
                              />
                              <span>{option}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {formData.options.map((option, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <input
                                type={formData.questionType === QuestionType.singleChoice ? 'radio' : 'checkbox'}
                                name="correct-answer"
                                checked={formData.correctAnswers.includes(index)}
                                onChange={() => handleCorrectAnswerToggle(index)}
                              />
                              <Input
                                value={option}
                                onChange={(e) => {
                                  const newOptions = [...formData.options];
                                  newOptions[index] = e.target.value;
                                  setFormData(prev => ({ ...prev, options: newOptions }));
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
                      onChange={(e) => setFormData(prev => ({ ...prev, explanation: e.target.value }))}
                      placeholder="Provide a detailed explanation for the correct answer..."
                      rows={3}
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={!canProceedToQuestionDetails || addQuestion.isPending || updateQuestion.isPending}
                >
                  {addQuestion.isPending || updateQuestion.isPending 
                    ? 'Saving...' 
                    : editingQuestion ? 'Update Question' : 'Create Question'
                  }
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* SMLE Structure Overview */}
      <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="text-green-800 dark:text-green-200">SMLE Domain Structure</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-green-700 dark:text-green-300">
            The system includes the five SMLE domains: Surgery, OBGYN, Internal Medicine, Pediatrics, and Ethics.
          </CardDescription>
        </CardContent>
      </Card>

      {/* Tabs for Question Management, CSV Import, and Domain/Topic Management */}
      <Tabs defaultValue="questions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="questions">Question Management</TabsTrigger>
          <TabsTrigger value="csv-import">CSV Import</TabsTrigger>
          <TabsTrigger value="domain-topic-management">
            <div className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Domain & Topic Management</span>
            </div>
          </TabsTrigger>
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
                    <SelectItem value={QuestionState.published}>Published</SelectItem>
                    <SelectItem value={QuestionState.draft}>Draft</SelectItem>
                    <SelectItem value={QuestionState.archived}>Archived</SelectItem>
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
                Questions organized by the five SMLE domains
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
                    <TableHead>Version</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuestions.map((question) => (
                    <TableRow key={question.id}>
                      <TableCell className="max-w-xs">
                        <p className="line-clamp-2 text-sm">{question.content}</p>
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
                      <TableCell>v{question.version.toString()}</TableCell>
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
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="csv-import" className="space-y-6">
          {/* CSV Import with Full-Page Preview */}
          <Card>
            <CardHeader>
              <CardTitle>CSV Import with Full-Page Preview</CardTitle>
              <CardDescription>
                Upload CSV files and preview them in a full-page interface before importing questions. No questions will be imported until you approve them in the full-page preview.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CsvImport />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="domain-topic-management" className="space-y-6">
          <AdminDomainTopicManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}

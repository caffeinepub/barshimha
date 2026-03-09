import { useState, useEffect, useMemo, useCallback } from 'react';
import { useGetQuestions, useGetCallerUserProfile, useGetCallerUserRole, useGetQuestionsByMode, useGetQuestionsByFilter, useSearchQuestions, useGetBookmarks, useAddBookmark, useRemoveBookmark, useAddComment, useGetComments, useSaveStudyStatistics, useGetStudyStatistics } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, Clock, BookOpen, Play, Settings, Lock, ChevronLeft, ChevronRight, Bookmark, BookmarkCheck, MessageCircle, CheckCircle, XCircle, Timer, RotateCcw, Shuffle, Target, AlertCircle } from 'lucide-react';
import { QuestionState, PaymentStatus, UserRole, StudyMode, Question, QuestionType, Comment, StudyStatistics, ModeStats, AggregateStats } from '../backend';
import { Link } from '@tanstack/react-router';
import { toast } from 'sonner';
import { AiAssistantButton } from '../components/AiAssistantButton';

interface StudySession {
  mode: StudyMode;
  questions: Question[];
  currentIndex: number;
  answers: Record<string, number[]>;
  startTime: number;
  timeLimit?: number;
  isStarted: boolean;
  isCompleted: boolean;
}

export function Study() {
  const { data: questions = [] } = useGetQuestions();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: userRole } = useGetCallerUserRole();
  const { data: comments = [] } = useGetComments();
  const { data: bookmarks = [] } = useGetBookmarks();
  const { data: studyStatistics } = useGetStudyStatistics();
  const { identity } = useInternetIdentity();
  const addComment = useAddComment();
  const addBookmark = useAddBookmark();
  const removeBookmark = useRemoveBookmark();
  const saveStudyStatistics = useSaveStudyStatistics();

  // Study setup state
  const [selectedMode, setSelectedMode] = useState<StudyMode>(StudyMode.practice);
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [timeLimit, setTimeLimit] = useState<string>('60');
  const [customTimeLimit, setCustomTimeLimit] = useState<string>('');
  const [questionLimit, setQuestionLimit] = useState<string>('20');
  const [randomizeQuestions, setRandomizeQuestions] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Study session state
  const [session, setSession] = useState<StudySession | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [commentText, setCommentText] = useState('');

  const isStudent = userRole === UserRole.user;
  const hasActivePayment = userProfile?.paymentStatus === PaymentStatus.active;
  const canAccessStudy = !isStudent || hasActivePayment;

  const publishedQuestions = questions.filter(q => q.state === QuestionState.published);

  // Get questions based on selected mode
  const { data: modeQuestions = [] } = useGetQuestionsByMode(selectedMode);
  const { data: searchResults = [] } = useSearchQuestions(searchTerm);
  const { data: filteredByFilter = [] } = useGetQuestionsByFilter(
    selectedDomain !== 'all' ? selectedDomain : undefined,
    selectedDifficulty !== 'all' ? selectedDifficulty : undefined
  );

  const domains = [...new Set(publishedQuestions.map(q => q.domain))].sort();

  // Get filtered questions for session
  const getFilteredQuestions = useCallback(() => {
    let baseQuestions = modeQuestions;

    // Apply search if there's a search term
    if (searchTerm.trim()) {
      baseQuestions = searchResults;
    }

    // Apply filters
    const filtered = baseQuestions.filter(question => {
      const matchesDomain = selectedDomain === 'all' || question.domain === selectedDomain;
      const matchesDifficulty = selectedDifficulty === 'all'; // Difficulty filtering would need backend support
      
      return matchesDomain && matchesDifficulty;
    });

    // Apply randomization
    let finalQuestions = [...filtered];
    if (randomizeQuestions) {
      finalQuestions = finalQuestions.sort(() => Math.random() - 0.5);
    }

    // Apply question limit
    if (questionLimit !== 'all') {
      const limit = parseInt(questionLimit);
      finalQuestions = finalQuestions.slice(0, limit);
    }

    return finalQuestions;
  }, [modeQuestions, searchResults, searchTerm, selectedDomain, selectedDifficulty, randomizeQuestions, questionLimit]);

  // Timer logic for timed mode
  useEffect(() => {
    if (session?.mode === StudyMode.timed && session.isStarted && !session.isCompleted && timeRemaining !== null && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 1) {
            handleCompleteSession();
            toast.info('Time\'s up! Session completed.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [session, timeRemaining]);

  const startSession = () => {
    const filteredQuestions = getFilteredQuestions();
    
    if (filteredQuestions.length === 0) {
      toast.error('No questions available with the selected filters');
      return;
    }

    const finalTimeLimit = selectedMode === StudyMode.timed 
      ? (timeLimit === 'custom' ? parseInt(customTimeLimit) : parseInt(timeLimit))
      : undefined;

    const newSession: StudySession = {
      mode: selectedMode,
      questions: filteredQuestions,
      currentIndex: 0,
      answers: {},
      startTime: Date.now(),
      timeLimit: finalTimeLimit,
      isStarted: true,
      isCompleted: false,
    };

    setSession(newSession);
    setShowAnswer(false);
    setCommentText('');

    if (selectedMode === StudyMode.timed && finalTimeLimit) {
      setTimeRemaining(finalTimeLimit * 60);
    }

    toast.success(`Study session started with ${filteredQuestions.length} questions!`);
  };

  const handleCompleteSession = async () => {
    if (!session) return;

    const completedSession = {
      ...session,
      isCompleted: true,
    };
    setSession(completedSession);

    // Update study statistics
    try {
      const currentStats = studyStatistics || {
        practiceModeStats: { 
          questionsAttempted: BigInt(0), 
          questionsCorrect: BigInt(0), 
          accuracyPercentage: 0, 
          timeSpent: BigInt(0), 
          sessionsCompleted: BigInt(0) 
        },
        timedModeStats: { 
          questionsAttempted: BigInt(0), 
          questionsCorrect: BigInt(0), 
          accuracyPercentage: 0, 
          timeSpent: BigInt(0), 
          sessionsCompleted: BigInt(0) 
        },
        reviewModeStats: { 
          questionsAttempted: BigInt(0), 
          questionsCorrect: BigInt(0), 
          accuracyPercentage: 0, 
          timeSpent: BigInt(0), 
          sessionsCompleted: BigInt(0) 
        },
        aggregateStats: { 
          totalQuestionsAttempted: BigInt(0), 
          totalQuestionsCorrect: BigInt(0), 
          overallAccuracy: 0, 
          totalTimeSpent: BigInt(0), 
          totalSessionsCompleted: BigInt(0) 
        },
      };

      const timeSpent = BigInt(Date.now() - session.startTime);
      const questionsAttempted = BigInt(Object.keys(session.answers).length);
      const questionsCorrect = BigInt(session.questions.filter(q => {
        const userAnswer = session.answers[q.id];
        if (!userAnswer) return false;
        const correctAnswers = q.correctAnswers.map(Number);
        return userAnswer.length === correctAnswers.length && userAnswer.every(a => correctAnswers.includes(a));
      }).length);

      const accuracy = Number(questionsAttempted) > 0 ? (Number(questionsCorrect) / Number(questionsAttempted)) * 100 : 0;

      let updatedStats: StudyStatistics;

      if (session.mode === StudyMode.practice) {
        updatedStats = {
          ...currentStats,
          practiceModeStats: {
            questionsAttempted: currentStats.practiceModeStats.questionsAttempted + questionsAttempted,
            questionsCorrect: currentStats.practiceModeStats.questionsCorrect + questionsCorrect,
            accuracyPercentage: accuracy,
            timeSpent: currentStats.practiceModeStats.timeSpent + timeSpent,
            sessionsCompleted: currentStats.practiceModeStats.sessionsCompleted + BigInt(1),
          },
          aggregateStats: {
            totalQuestionsAttempted: currentStats.aggregateStats.totalQuestionsAttempted + questionsAttempted,
            totalQuestionsCorrect: currentStats.aggregateStats.totalQuestionsCorrect + questionsCorrect,
            overallAccuracy: Number(currentStats.aggregateStats.totalQuestionsAttempted + questionsAttempted) > 0 
              ? (Number(currentStats.aggregateStats.totalQuestionsCorrect + questionsCorrect) / Number(currentStats.aggregateStats.totalQuestionsAttempted + questionsAttempted)) * 100 
              : 0,
            totalTimeSpent: currentStats.aggregateStats.totalTimeSpent + timeSpent,
            totalSessionsCompleted: currentStats.aggregateStats.totalSessionsCompleted + BigInt(1),
          },
        };
      } else if (session.mode === StudyMode.timed) {
        updatedStats = {
          ...currentStats,
          timedModeStats: {
            questionsAttempted: currentStats.timedModeStats.questionsAttempted + questionsAttempted,
            questionsCorrect: currentStats.timedModeStats.questionsCorrect + questionsCorrect,
            accuracyPercentage: accuracy,
            timeSpent: currentStats.timedModeStats.timeSpent + timeSpent,
            sessionsCompleted: currentStats.timedModeStats.sessionsCompleted + BigInt(1),
          },
          aggregateStats: {
            totalQuestionsAttempted: currentStats.aggregateStats.totalQuestionsAttempted + questionsAttempted,
            totalQuestionsCorrect: currentStats.aggregateStats.totalQuestionsCorrect + questionsCorrect,
            overallAccuracy: Number(currentStats.aggregateStats.totalQuestionsAttempted + questionsAttempted) > 0 
              ? (Number(currentStats.aggregateStats.totalQuestionsCorrect + questionsCorrect) / Number(currentStats.aggregateStats.totalQuestionsAttempted + questionsAttempted)) * 100 
              : 0,
            totalTimeSpent: currentStats.aggregateStats.totalTimeSpent + timeSpent,
            totalSessionsCompleted: currentStats.aggregateStats.totalSessionsCompleted + BigInt(1),
          },
        };
      } else {
        updatedStats = {
          ...currentStats,
          reviewModeStats: {
            questionsAttempted: currentStats.reviewModeStats.questionsAttempted + questionsAttempted,
            questionsCorrect: currentStats.reviewModeStats.questionsCorrect + questionsCorrect,
            accuracyPercentage: accuracy,
            timeSpent: currentStats.reviewModeStats.timeSpent + timeSpent,
            sessionsCompleted: currentStats.reviewModeStats.sessionsCompleted + BigInt(1),
          },
          aggregateStats: {
            totalQuestionsAttempted: currentStats.aggregateStats.totalQuestionsAttempted + questionsAttempted,
            totalQuestionsCorrect: currentStats.aggregateStats.totalQuestionsCorrect + questionsCorrect,
            overallAccuracy: Number(currentStats.aggregateStats.totalQuestionsAttempted + questionsAttempted) > 0 
              ? (Number(currentStats.aggregateStats.totalQuestionsCorrect + questionsCorrect) / Number(currentStats.aggregateStats.totalQuestionsAttempted + questionsAttempted)) * 100 
              : 0,
            totalTimeSpent: currentStats.aggregateStats.totalTimeSpent + timeSpent,
            totalSessionsCompleted: currentStats.aggregateStats.totalSessionsCompleted + BigInt(1),
          },
        };
      }

      await saveStudyStatistics.mutateAsync(updatedStats);
      toast.success('Session completed! Statistics updated.');
    } catch (error) {
      console.error('Failed to update statistics:', error);
    }
  };

  const resetSession = () => {
    setSession(null);
    setTimeRemaining(null);
    setShowAnswer(false);
    setCommentText('');
  };

  const navigateToQuestion = (index: number) => {
    if (!session || index < 0 || index >= session.questions.length) return;
    
    setSession(prev => prev ? { ...prev, currentIndex: index } : null);
    setShowAnswer(false);
    setCommentText('');
  };

  const handleAnswerChange = (optionIndex: number, checked: boolean) => {
    if (!session) return;
    
    const currentQuestion = session.questions[session.currentIndex];
    
    setSession(prev => {
      if (!prev) return null;
      
      let newAnswers: number[];
      
      if (currentQuestion.questionType === QuestionType.singleChoice || 
          currentQuestion.questionType === QuestionType.trueFalse) {
        newAnswers = [optionIndex];
      } else if (currentQuestion.questionType === QuestionType.multiSelect) {
        const currentAnswers = prev.answers[currentQuestion.id] || [];
        if (checked) {
          newAnswers = [...currentAnswers, optionIndex];
        } else {
          newAnswers = currentAnswers.filter(i => i !== optionIndex);
        }
      } else {
        newAnswers = prev.answers[currentQuestion.id] || [];
      }
      
      return {
        ...prev,
        answers: {
          ...prev.answers,
          [currentQuestion.id]: newAnswers,
        },
      };
    });
  };

  const handleNumericAnswer = (value: string) => {
    if (!session) return;
    
    const currentQuestion = session.questions[session.currentIndex];
    const numValue = parseInt(value);
    
    if (!isNaN(numValue)) {
      setSession(prev => {
        if (!prev) return null;
        return {
          ...prev,
          answers: {
            ...prev.answers,
            [currentQuestion.id]: [numValue],
          },
        };
      });
    }
  };

  const checkAnswer = () => {
    if (!session) return;
    
    const currentQuestion = session.questions[session.currentIndex];
    const userAnswer = session.answers[currentQuestion.id] || [];
    const correctAnswers = currentQuestion.correctAnswers.map(Number);
    
    const isCorrect = userAnswer.length === correctAnswers.length &&
                     userAnswer.every(answer => correctAnswers.includes(answer));
    
    setShowAnswer(true);
    
    if (isCorrect) {
      toast.success('Correct answer!');
    } else {
      toast.error('Incorrect answer. Review the explanation.');
    }
  };

  const resetQuestion = () => {
    setShowAnswer(false);
  };

  const handleAddComment = async () => {
    if (!session || !commentText.trim() || !identity) return;

    const currentQuestion = session.questions[session.currentIndex];

    try {
      const comment: Comment = {
        id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user: identity.getPrincipal(),
        questionId: currentQuestion.id,
        content: commentText.trim(),
        approved: false,
        createdAt: BigInt(Date.now() * 1000000),
      };

      await addComment.mutateAsync(comment);
      setCommentText('');
      toast.success('Comment submitted for review');
    } catch (error) {
      toast.error('Failed to submit comment');
      console.error('Comment submission error:', error);
    }
  };

  const handleBookmarkToggle = async () => {
    if (!session) return;

    const currentQuestion = session.questions[session.currentIndex];
    const isBookmarked = bookmarks.some(b => b.questionId === currentQuestion.id);

    try {
      if (isBookmarked) {
        await removeBookmark.mutateAsync(currentQuestion.id);
        toast.success('Question removed from bookmarks');
      } else {
        await addBookmark.mutateAsync(currentQuestion.id);
        toast.success('Question bookmarked for later review');
      }
    } catch (error) {
      toast.error('Failed to update bookmark');
      console.error('Bookmark error:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getQuestionTypeLabel = (type: QuestionType) => {
    switch (type) {
      case QuestionType.singleChoice:
        return 'Single Choice';
      case QuestionType.multiSelect:
        return 'Multiple Select';
      case QuestionType.trueFalse:
        return 'True/False';
      case QuestionType.numeric:
        return 'Numeric';
      default:
        return 'Unknown';
    }
  };

  const getModeLabel = (mode: StudyMode) => {
    switch (mode) {
      case StudyMode.practice:
        return 'Practice Mode';
      case StudyMode.timed:
        return 'Timed Mode';
      case StudyMode.review:
        return 'Review Mode';
      default:
        return 'Practice Mode';
    }
  };

  const getModeIcon = (mode: StudyMode) => {
    switch (mode) {
      case StudyMode.practice:
        return Brain;
      case StudyMode.timed:
        return Clock;
      case StudyMode.review:
        return BookOpen;
      default:
        return Brain;
    }
  };

  const getModeDescription = (mode: StudyMode) => {
    switch (mode) {
      case StudyMode.practice:
        return 'Unlimited practice with immediate feedback';
      case StudyMode.timed:
        return 'Exam simulation with time constraints';
      case StudyMode.review:
        return 'Review previously answered questions with answer history';
      default:
        return 'Practice mode';
    }
  };

  const isConfigurationValid = () => {
    if (selectedMode === StudyMode.timed) {
      const finalTimeLimit = timeLimit === 'custom' ? customTimeLimit : timeLimit;
      return finalTimeLimit && parseInt(finalTimeLimit) > 0;
    }
    return true;
  };

  const currentQuestion = session?.questions[session.currentIndex];
  const currentAnswer = session ? session.answers[currentQuestion?.id || ''] || [] : [];
  const questionComments = currentQuestion 
    ? comments.filter(c => c.questionId === currentQuestion.id && c.approved)
    : [];
  const isBookmarked = currentQuestion ? bookmarks.some(b => b.questionId === currentQuestion.id) : false;
  const progress = session ? ((session.currentIndex + 1) / session.questions.length) * 100 : 0;

  // Show payment required message for students without active payment
  if (isStudent && !hasActivePayment) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Study Center</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Your unified study experience for SMLE exam preparation
          </p>
        </div>

        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Lock className="h-5 w-5 text-yellow-600" />
              <CardTitle className="text-yellow-800 dark:text-yellow-200">
                Payment Required
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-yellow-700 dark:text-yellow-300">
              You need an active subscription to access the study center. Please{' '}
              <Link 
                to="/profile" 
                className="text-yellow-800 dark:text-yellow-200 underline hover:text-yellow-900 dark:hover:text-yellow-100 font-medium"
              >
                complete your payment
              </Link>
              {' '}to start your study sessions.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Study Center</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Your unified study experience for SMLE exam preparation. Configure your session and start studying immediately.
        </p>
      </div>

      {!session ? (
        /* Study Setup Section */
        <div className="space-y-6">
          {/* Mode Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Study Mode</CardTitle>
              <CardDescription>
                Choose your preferred study mode for a customized learning experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[StudyMode.practice, StudyMode.timed, StudyMode.review].map((mode) => {
                  const Icon = getModeIcon(mode);
                  return (
                    <Card 
                      key={mode}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedMode === mode ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedMode(mode)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center space-x-2">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <CardTitle className="text-base">{getModeLabel(mode)}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{getModeDescription(mode)}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Filters and Configuration */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Question Filters</CardTitle>
                <CardDescription>
                  Customize which questions to include in your study session
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Search Questions</Label>
                  <Input
                    placeholder="Search by content..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Domain</Label>
                    <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Domains</SelectItem>
                        {domains.map(domain => (
                          <SelectItem key={domain} value={domain}>{domain}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Difficulty</Label>
                    <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Session Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Session Configuration</CardTitle>
                <CardDescription>
                  Set up your study session parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Question Limit</Label>
                    <Select value={questionLimit} onValueChange={setQuestionLimit}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 questions</SelectItem>
                        <SelectItem value="20">20 questions</SelectItem>
                        <SelectItem value="30">30 questions</SelectItem>
                        <SelectItem value="50">50 questions</SelectItem>
                        <SelectItem value="all">All available</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center space-x-2">
                      <span>Randomize Order</span>
                      <Switch
                        checked={randomizeQuestions}
                        onCheckedChange={setRandomizeQuestions}
                      />
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Shuffle questions for varied practice
                    </p>
                  </div>
                </div>

                {selectedMode === StudyMode.timed && (
                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-medium">Timed Mode Settings</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Time Limit</Label>
                        <Select value={timeLimit} onValueChange={setTimeLimit}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="60">60 minutes</SelectItem>
                            <SelectItem value="90">90 minutes</SelectItem>
                            <SelectItem value="120">120 minutes</SelectItem>
                            <SelectItem value="custom">Custom time limit</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {timeLimit === 'custom' && (
                        <div className="space-y-2">
                          <Label>Custom Minutes</Label>
                          <Input
                            type="number"
                            placeholder="Enter minutes"
                            value={customTimeLimit}
                            onChange={(e) => setCustomTimeLimit(e.target.value)}
                            min="1"
                            max="300"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="bg-muted/30 p-3 rounded-lg">
                  <p className="text-sm">
                    <strong>Available Questions:</strong> {getFilteredQuestions().length}
                  </p>
                  {getFilteredQuestions().length === 0 && (
                    <p className="text-sm text-destructive mt-1">
                      No questions match your current filters
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Start Session Button */}
          <div className="flex justify-center">
            <Button 
              size="lg" 
              className="px-8" 
              onClick={startSession}
              disabled={!isConfigurationValid() || getFilteredQuestions().length === 0}
            >
              <Play className="h-4 w-4 mr-2" />
              Start {getModeLabel(selectedMode)}
            </Button>
          </div>
        </div>
      ) : (
        /* Study Session Section */
        <div className="space-y-6">
          {/* Session Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {(() => {
                      const Icon = getModeIcon(session.mode);
                      return <Icon className="h-5 w-5" />;
                    })()}
                    <h2 className="text-xl font-bold">{getModeLabel(session.mode)}</h2>
                  </div>
                  {session.mode === StudyMode.timed && timeRemaining !== null && (
                    <Badge variant={timeRemaining < 300 ? 'destructive' : 'secondary'}>
                      <Timer className="h-3 w-3 mr-1" />
                      {formatTime(timeRemaining)}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={resetSession}>
                    Reset Session
                  </Button>
                  {session.currentIndex === session.questions.length - 1 && (
                    <Button onClick={handleCompleteSession}>
                      Complete Session
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Question {session.currentIndex + 1} of {session.questions.length}</span>
                  <span>{Math.round(progress)}% Complete</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            </CardContent>
          </Card>

          {/* Question Display */}
          {currentQuestion && (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Badge>{getQuestionTypeLabel(currentQuestion.questionType)}</Badge>
                      <Badge variant="outline">{currentQuestion.domain}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleBookmarkToggle}
                        disabled={addBookmark.isPending || removeBookmark.isPending}
                      >
                        {isBookmarked ? (
                          <BookmarkCheck className="h-4 w-4 text-primary" />
                        ) : (
                          <Bookmark className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <CardDescription>
                      {currentQuestion.domain}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Question Content */}
                <div className="prose prose-sm max-w-none">
                  <p className="text-base leading-relaxed">{currentQuestion.content}</p>
                </div>

                {/* Answer Options */}
                <div className="space-y-4">
                  {currentQuestion.questionType === QuestionType.numeric ? (
                    <div className="space-y-2">
                      <Label>Your Answer</Label>
                      <Input
                        type="number"
                        placeholder="Enter numeric answer"
                        value={currentAnswer[0] || ''}
                        onChange={(e) => handleNumericAnswer(e.target.value)}
                        disabled={showAnswer}
                      />
                    </div>
                  ) : currentQuestion.questionType === QuestionType.singleChoice || 
                             currentQuestion.questionType === QuestionType.trueFalse ? (
                    <RadioGroup
                      value={currentAnswer[0]?.toString() || ''}
                      onValueChange={(value) => handleAnswerChange(parseInt(value), true)}
                      disabled={showAnswer}
                    >
                      {currentQuestion.options.map((option, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                          <Label htmlFor={`option-${index}`} className="flex-1">
                            {option}
                          </Label>
                          {showAnswer && currentQuestion.correctAnswers.includes(BigInt(index)) && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                          {showAnswer && currentAnswer.includes(index) && 
                           !currentQuestion.correctAnswers.includes(BigInt(index)) && (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                      ))}
                    </RadioGroup>
                  ) : (
                    <div className="space-y-2">
                      <Label>Select all correct answers</Label>
                      {currentQuestion.options.map((option, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Checkbox
                            id={`option-${index}`}
                            checked={currentAnswer.includes(index)}
                            onCheckedChange={(checked) => handleAnswerChange(index, !!checked)}
                            disabled={showAnswer}
                          />
                          <Label htmlFor={`option-${index}`} className="flex-1">
                            {option}
                          </Label>
                          {showAnswer && currentQuestion.correctAnswers.includes(BigInt(index)) && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                          {showAnswer && currentAnswer.includes(index) && 
                           !currentQuestion.correctAnswers.includes(BigInt(index)) && (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => navigateToQuestion(session.currentIndex - 1)}
                      disabled={session.currentIndex === 0}
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigateToQuestion(session.currentIndex + 1)}
                      disabled={session.currentIndex === session.questions.length - 1}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!showAnswer ? (
                      <Button onClick={checkAnswer} disabled={currentAnswer.length === 0}>
                        Check Answer
                      </Button>
                    ) : (
                      <Button onClick={resetQuestion} variant="outline">
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Try Again
                      </Button>
                    )}
                  </div>
                </div>

                {/* Explanation */}
                {showAnswer && currentQuestion.explanation && (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Explanation</h4>
                    <p className="text-sm leading-relaxed">{currentQuestion.explanation}</p>
                  </div>
                )}

                <Separator />

                {/* Comments Section */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="h-4 w-4" />
                    <h4 className="font-medium">Comments ({questionComments.length})</h4>
                  </div>

                  {/* Add Comment */}
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Add a comment or ask a question..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      rows={3}
                    />
                    <Button 
                      onClick={handleAddComment}
                      disabled={!commentText.trim() || addComment.isPending}
                      size="sm"
                    >
                      {addComment.isPending ? 'Submitting...' : 'Submit Comment'}
                    </Button>
                  </div>

                  {/* Comments List */}
                  <div className="space-y-3">
                    {questionComments.map((comment) => (
                      <div key={comment.id} className="bg-muted/30 p-3 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-sm font-medium">
                            User {comment.user.toString().slice(0, 8)}...
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(Number(comment.createdAt) / 1000000).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Session Completion */}
          {session.isCompleted && (
            <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-green-800 dark:text-green-200">
                    Session Completed!
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-green-700 dark:text-green-300">
                    Great job! You've completed your {getModeLabel(session.mode).toLowerCase()} session.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {Object.keys(session.answers).length}
                      </div>
                      <p className="text-sm text-muted-foreground">Questions Answered</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {session.questions.filter(q => {
                          const userAnswer = session.answers[q.id];
                          if (!userAnswer) return false;
                          const correctAnswers = q.correctAnswers.map(Number);
                          return userAnswer.length === correctAnswers.length && userAnswer.every(a => correctAnswers.includes(a));
                        }).length}
                      </div>
                      <p className="text-sm text-muted-foreground">Correct Answers</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {Object.keys(session.answers).length > 0 
                          ? Math.round((session.questions.filter(q => {
                              const userAnswer = session.answers[q.id];
                              if (!userAnswer) return false;
                              const correctAnswers = q.correctAnswers.map(Number);
                              return userAnswer.length === correctAnswers.length && userAnswer.every(a => correctAnswers.includes(a));
                            }).length / Object.keys(session.answers).length) * 100)
                          : 0
                        }%
                      </div>
                      <p className="text-sm text-muted-foreground">Accuracy</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {Math.round((Date.now() - session.startTime) / 60000)}m
                      </div>
                      <p className="text-sm text-muted-foreground">Time Spent</p>
                    </div>
                  </div>
                  <div className="flex justify-center space-x-2">
                    <Button onClick={resetSession}>
                      Start New Session
                    </Button>
                    <Button variant="outline" asChild>
                      <Link to="/dashboard">View Dashboard</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Assistant Button - Only show during active session */}
          {!session.isCompleted && currentQuestion && (
            <AiAssistantButton questionContext={currentQuestion.content} />
          )}
        </div>
      )}
    </div>
  );
}

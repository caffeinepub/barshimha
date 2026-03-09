import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useGetDomains } from '../hooks/useQueries';
import { StudyMode } from '../backend';
import { Clock, Target, BookOpen, Shuffle, Filter, Play, Settings } from 'lucide-react';

interface StudySetupProps {
  onStartSession: (config: StudyConfiguration) => void;
  isLoading?: boolean;
}

export interface StudyConfiguration {
  mode: StudyMode;
  domain?: string;
  difficulty?: string;
  randomize: boolean;
  questionLimit?: number;
  timeLimit?: number; // in minutes, for timed mode
}

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

const TIME_PRESETS = [
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
];

export function StudySetup({ onStartSession, isLoading = false }: StudySetupProps) {
  const [mode, setMode] = useState<StudyMode>(StudyMode.practice);
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [randomize, setRandomize] = useState(true);
  const [questionLimit, setQuestionLimit] = useState<number>(20);
  const [timeLimit, setTimeLimit] = useState<number>(60);
  const [customTimeLimit, setCustomTimeLimit] = useState<number>(60);
  const [useCustomTime, setUseCustomTime] = useState(false);

  const { data: domains = [], isLoading: domainsLoading } = useGetDomains();

  const handleStartSession = () => {
    const config: StudyConfiguration = {
      mode,
      domain: selectedDomain || undefined,
      difficulty: selectedDifficulty || undefined,
      randomize,
      questionLimit: questionLimit > 0 ? questionLimit : undefined,
      timeLimit: mode === StudyMode.timed ? (useCustomTime ? customTimeLimit : timeLimit) : undefined,
    };

    onStartSession(config);
  };

  const getModeDescription = (mode: StudyMode) => {
    switch (mode) {
      case StudyMode.practice:
        return 'Unlimited practice with immediate feedback and explanations';
      case StudyMode.timed:
        return 'Exam simulation with time constraints and custom time limits';
      case StudyMode.review:
        return 'Review previously answered questions with explanations';
      default:
        return '';
    }
  };

  const getModeIcon = (mode: StudyMode) => {
    switch (mode) {
      case StudyMode.practice:
        return <BookOpen className="h-5 w-5" />;
      case StudyMode.timed:
        return <Clock className="h-5 w-5" />;
      case StudyMode.review:
        return <Target className="h-5 w-5" />;
      default:
        return <BookOpen className="h-5 w-5" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-primary/10 p-2 rounded-lg">
          <Settings className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Study Setup</h2>
          <p className="text-muted-foreground">Configure your study session preferences</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Study Mode Selection */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Play className="h-5 w-5" />
              <span>Study Mode</span>
            </CardTitle>
            <CardDescription>
              Choose your preferred study mode
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              {Object.values(StudyMode).map((modeOption) => (
                <div
                  key={modeOption}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    mode === modeOption
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setMode(modeOption)}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${
                      mode === modeOption ? 'bg-primary/10' : 'bg-muted'
                    }`}>
                      {getModeIcon(modeOption)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-semibold capitalize">{modeOption}</h4>
                        {mode === modeOption && (
                          <Badge variant="secondary" className="text-xs">Selected</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {getModeDescription(modeOption)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Time Limit Settings for Timed Mode */}
            {mode === StudyMode.timed && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-4">
                <h5 className="font-medium flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Time Limit Settings</span>
                </h5>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="custom-time"
                      checked={useCustomTime}
                      onCheckedChange={setUseCustomTime}
                    />
                    <Label htmlFor="custom-time">Use custom time limit</Label>
                  </div>

                  {useCustomTime ? (
                    <div className="space-y-2">
                      <Label htmlFor="custom-time-input">Custom time limit (minutes)</Label>
                      <Input
                        id="custom-time-input"
                        type="number"
                        min="1"
                        max="300"
                        value={customTimeLimit}
                        onChange={(e) => setCustomTimeLimit(parseInt(e.target.value) || 60)}
                        className="w-32"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>Preset time limits</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {TIME_PRESETS.map((preset) => (
                          <Button
                            key={preset.value}
                            type="button"
                            variant={timeLimit === preset.value ? "default" : "outline"}
                            size="sm"
                            onClick={() => setTimeLimit(preset.value)}
                          >
                            {preset.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Configuration Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Session Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Mode:</span>
                <Badge variant="secondary" className="capitalize">{mode}</Badge>
              </div>
              
              {selectedDomain && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Domain:</span>
                  <Badge variant="outline">{selectedDomain}</Badge>
                </div>
              )}
              
              {selectedDifficulty && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Difficulty:</span>
                  <Badge variant="outline" className="capitalize">{selectedDifficulty}</Badge>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Questions:</span>
                <Badge variant="outline">{questionLimit || 'All'}</Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Randomized:</span>
                <Badge variant={randomize ? "secondary" : "outline"}>
                  {randomize ? 'Yes' : 'No'}
                </Badge>
              </div>
              
              {mode === StudyMode.timed && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Time Limit:</span>
                  <Badge variant="secondary">
                    {useCustomTime ? customTimeLimit : timeLimit} min
                  </Badge>
                </div>
              )}
            </div>

            <Separator />

            <Button
              onClick={handleStartSession}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                  Starting...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Session
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters & Options</span>
          </CardTitle>
          <CardDescription>
            Customize your study session with filters and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Domain Filter */}
            <div className="space-y-2">
              <Label htmlFor="domain">Domain</Label>
              <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                <SelectTrigger>
                  <SelectValue placeholder={domainsLoading ? "Loading..." : "All domains"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All domains</SelectItem>
                  {domains.map((domain) => (
                    <SelectItem key={domain.id} value={domain.name}>
                      {domain.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Difficulty Filter */}
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger>
                  <SelectValue placeholder="All levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All levels</SelectItem>
                  {DIFFICULTY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Question Limit */}
            <div className="space-y-2">
              <Label htmlFor="limit">Question Limit</Label>
              <Input
                id="limit"
                type="number"
                min="1"
                max="200"
                value={questionLimit}
                onChange={(e) => setQuestionLimit(parseInt(e.target.value) || 20)}
                placeholder="20"
              />
            </div>

            {/* Randomize Toggle */}
            <div className="space-y-2">
              <Label htmlFor="randomize" className="flex items-center space-x-2">
                <Shuffle className="h-4 w-4" />
                <span>Randomize</span>
              </Label>
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="randomize"
                  checked={randomize}
                  onCheckedChange={setRandomize}
                />
                <span className="text-sm text-muted-foreground">
                  {randomize ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

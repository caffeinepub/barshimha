import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertCircle,
  ArrowRight,
  Award,
  BookOpen,
  Brain,
  CheckCircle,
  Clock,
  Loader2,
  Music,
  Pause,
  Play,
  RotateCcw,
  Shield,
  Sparkles,
  Square,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Users,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetBrandAssets } from "../hooks/useQueries";

export function LandingPage() {
  const { login, isLoggingIn } = useInternetIdentity();
  const { data: _brandAssets } = useGetBrandAssets();

  // Audio player state for the provided audio file
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Use the provided audio file from assets
  const audioUrl = "/assets/WhatsApp Audio 2025-10-01 at 11.53.26_6ab6ee4b.mp3";

  const handleSubscribeNow = () => {
    // This will trigger login and then redirect to payment page in student interface
    login();
  };

  const handleLogin = () => {
    login();
  };

  // Enhanced audio player functions with error handling
  const togglePlay = async () => {
    if (!audioRef.current || !audioUrl) return;

    try {
      setAudioError(null);

      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        setIsLoading(true);
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error: any) {
      console.error("Audio playback error:", error);
      setAudioError("Failed to play audio. Please try again.");
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  };

  const stopMusic = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      const newMuted = !isMuted;
      audioRef.current.muted = newMuted;
      setIsMuted(newMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number.parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      if (newVolume > 0 && isMuted) {
        setIsMuted(false);
        audioRef.current.muted = false;
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setAudioError(null);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number.parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleAudioError = (error: any) => {
    console.error("Audio error:", error);
    setAudioError(
      "Audio file could not be loaded. Please check the file format.",
    );
    setIsPlaying(false);
    setIsLoading(false);
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: audioUrl is intentionally listed for re-mounting when src changes
  const retryAudioLoad = useCallback(() => {
    if (audioRef.current && audioUrl && retryCount < 3) {
      setRetryCount((prev) => prev + 1);
      setAudioError(null);
      setIsLoading(true);

      // Force reload the audio with cache busting
      const cacheBustUrl = `${audioUrl}?t=${Date.now()}`;
      audioRef.current.src = cacheBustUrl;
      audioRef.current.load();

      setTimeout(() => {
        setIsLoading(false);
      }, 2000);
    }
  }, [audioUrl, retryCount]);

  const formatTime = (time: number) => {
    if (Number.isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Audio event listeners with enhanced error handling
  // biome-ignore lint/correctness/useExhaustiveDependencies: handler functions are stable refs defined outside this effect
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && audioUrl) {
      const handleLoadStart = () => setIsLoading(true);
      const handleCanPlay = () => {
        setIsLoading(false);
        setAudioError(null);
        setRetryCount(0);
      };

      audio.addEventListener("loadstart", handleLoadStart);
      audio.addEventListener("canplay", handleCanPlay);
      audio.addEventListener("timeupdate", handleTimeUpdate);
      audio.addEventListener("loadedmetadata", handleLoadedMetadata);
      audio.addEventListener("ended", handleAudioEnded);
      audio.addEventListener("error", handleAudioError);

      // Set initial volume
      audio.volume = volume;

      return () => {
        audio.removeEventListener("loadstart", handleLoadStart);
        audio.removeEventListener("canplay", handleCanPlay);
        audio.removeEventListener("timeupdate", handleTimeUpdate);
        audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
        audio.removeEventListener("ended", handleAudioEnded);
        audio.removeEventListener("error", handleAudioError);
      };
    }
  }, [audioUrl, volume]);

  // Cleanup audio when component unmounts to ensure it doesn't play on other pages
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 lg:py-24">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-8">
              <div className="bg-primary/10 p-6 rounded-3xl">
                <img
                  src="/assets/5d0a4fad-307b-4b30-8c10-dd200e46e3f2.png"
                  alt="Barshimha Logo"
                  className="h-16 w-16 object-contain"
                  onError={(e) => {
                    // Fallback to BookOpen icon if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = "block";
                  }}
                />
                <BookOpen
                  className="h-16 w-16 text-primary"
                  style={{ display: "none" }}
                />
              </div>
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
              Barshimha
            </h1>
            <div className="flex items-center justify-center mb-8">
              <div className="bg-gradient-to-r from-primary/20 to-secondary/20 px-4 py-2 rounded-full">
                <p className="text-lg font-medium text-primary">
                  Smart SMLE Exam Preparation Platform
                </p>
              </div>
            </div>

            {/* Landing Page Exclusive Audio Player */}
            <div className="mb-8">
              <Card className="max-w-md mx-auto bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-center space-x-2">
                    <Music className="h-4 w-4" />
                    <span>Platform Audio</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    preload="metadata"
                    className="hidden"
                  >
                    <track kind="captions" />
                  </audio>

                  {/* Error Display */}
                  {audioError && (
                    <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800 dark:text-red-200 text-xs">
                        {audioError}
                        {retryCount < 3 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={retryAudioLoad}
                            className="ml-2 h-auto p-1 text-xs"
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Retry
                          </Button>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Play/Pause, Stop Music, and Mute Controls */}
                  <div className="flex items-center justify-center space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={togglePlay}
                      disabled={isLoading || !!audioError}
                      className="flex items-center space-x-2"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                      <span>
                        {isLoading
                          ? "Loading..."
                          : isPlaying
                            ? "Pause"
                            : "Play"}
                      </span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={stopMusic}
                      disabled={isLoading || !!audioError || !isPlaying}
                      className="flex items-center space-x-2"
                      title="Stop Music"
                    >
                      <Square className="h-4 w-4" />
                      <span>Stop</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleMute}
                      disabled={isLoading || !!audioError}
                      title={isMuted ? "Unmute" : "Mute"}
                    >
                      {isMuted ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {/* Progress Bar */}
                  {duration > 0 && !audioError && (
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="0"
                        max={duration}
                        value={currentTime}
                        onChange={handleSeek}
                        disabled={isLoading}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 disabled:opacity-50"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                    </div>
                  )}

                  {/* Volume Control */}
                  {!audioError && (
                    <div className="flex items-center space-x-2">
                      <Volume2 className="h-3 w-3 text-muted-foreground" />
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={volume}
                        onChange={handleVolumeChange}
                        disabled={isLoading}
                        className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 disabled:opacity-50"
                      />
                      <span className="text-xs text-muted-foreground w-8">
                        {Math.round(volume * 100)}%
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Hero Description */}
            <div className="max-w-5xl mx-auto mb-12">
              <div className="bg-gradient-to-r from-card/80 to-card/60 backdrop-blur-sm rounded-3xl p-8 lg:p-12 border border-border/50 shadow-xl">
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                  <div className="space-y-6 text-left">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <Zap className="h-6 w-6 text-primary" />
                      </div>
                      <h2 className="text-2xl font-bold text-foreground">
                        Transform Your Study Experience
                      </h2>
                    </div>

                    <p className="text-lg text-muted-foreground leading-relaxed">
                      Barshimha is a smart exam preparation platform that
                      transforms{" "}
                      <span className="font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
                        'براشيم'
                      </span>{" "}
                      — Arabic for cheat sheets — into powerful learning tools.
                    </p>

                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <div className="bg-green-100 dark:bg-green-900 p-1 rounded-full mt-1">
                          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">
                            High-quality questions
                          </span>{" "}
                          sourced from accredited medical references
                        </p>
                      </div>

                      <div className="flex items-start space-x-3">
                        <div className="bg-blue-100 dark:bg-blue-900 p-1 rounded-full mt-1">
                          <Brain className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">
                            Evidence-based learning methods
                          </span>{" "}
                          to improve recall and mastery
                        </p>
                      </div>

                      <div className="flex items-start space-x-3">
                        <div className="bg-purple-100 dark:bg-purple-900 p-1 rounded-full mt-1">
                          <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">
                            Intuitive interface
                          </span>{" "}
                          that makes studying smarter and more rewarding
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl p-8 border border-primary/20">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-card/80 backdrop-blur-sm rounded-xl p-4 text-center border border-border/50">
                          <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-foreground">
                            5
                          </div>
                          <div className="text-xs text-muted-foreground">
                            SMLE Domains
                          </div>
                        </div>
                        <div className="bg-card/80 backdrop-blur-sm rounded-xl p-4 text-center border border-border/50">
                          <Target className="h-8 w-8 text-green-500 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-foreground">
                            100%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Coverage
                          </div>
                        </div>
                        <div className="bg-card/80 backdrop-blur-sm rounded-xl p-4 text-center border border-border/50">
                          <Clock className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-foreground">
                            3
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Study Modes
                          </div>
                        </div>
                        <div className="bg-card/80 backdrop-blur-sm rounded-xl p-4 text-center border border-border/50">
                          <Shield className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-foreground">
                            ∞
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Practice
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Floating elements for visual appeal */}
                    <div className="absolute -top-4 -right-4 bg-primary/10 p-3 rounded-full">
                      <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <div className="absolute -bottom-4 -left-4 bg-secondary/10 p-3 rounded-full">
                      <Award className="h-6 w-6 text-secondary" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Call-to-Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Button
                onClick={handleSubscribeNow}
                disabled={isLoggingIn}
                size="lg"
                className="px-8 py-4 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                {isLoggingIn ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground mr-2" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Subscribe Now
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </Button>
              <Button
                onClick={handleLogin}
                disabled={isLoggingIn}
                variant="outline"
                size="lg"
                className="px-8 py-4 text-lg font-semibold border-2 hover:bg-primary/5 transition-all duration-300"
              >
                {isLoggingIn ? "Connecting..." : "Log In / Register"}
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Evidence-based learning</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>Accredited references</span>
              </div>
              <div className="flex items-center space-x-2">
                <Award className="h-4 w-4 text-purple-500" />
                <span>SMLE focused</span>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="text-center hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
              <CardHeader>
                <div className="mx-auto bg-chart-1/10 p-4 rounded-2xl w-fit mb-4">
                  <Brain className="h-8 w-8 text-chart-1" />
                </div>
                <CardTitle className="text-xl">Smart Study Modes</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Practice, timed, and review modes with detailed explanations
                  and immediate feedback to optimize your learning experience.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
              <CardHeader>
                <div className="mx-auto bg-chart-2/10 p-4 rounded-2xl w-fit mb-4">
                  <TrendingUp className="h-8 w-8 text-chart-2" />
                </div>
                <CardTitle className="text-xl">Performance Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Track your progress with detailed metrics, identify weak
                  areas, and get personalized recommendations for improvement.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
              <CardHeader>
                <div className="mx-auto bg-chart-3/10 p-4 rounded-2xl w-fit mb-4">
                  <Users className="h-8 w-8 text-chart-3" />
                </div>
                <CardTitle className="text-xl">Expert Content</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Comprehensive question bank organized by all 5 SMLE domains
                  with high-quality content from accredited medical references.
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* Additional Features */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <div className="text-center">
              <div className="bg-primary/10 p-3 rounded-xl w-fit mx-auto mb-3">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">Timed Practice</h4>
              <p className="text-sm text-muted-foreground">
                Simulate real exam conditions
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 p-3 rounded-xl w-fit mx-auto mb-3">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">Targeted Learning</h4>
              <p className="text-sm text-muted-foreground">
                Focus on weak areas
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 p-3 rounded-xl w-fit mx-auto mb-3">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">Comprehensive Coverage</h4>
              <p className="text-sm text-muted-foreground">
                All SMLE domains included
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 p-3 rounded-xl w-fit mx-auto mb-3">
                <Award className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">Progress Tracking</h4>
              <p className="text-sm text-muted-foreground">
                Monitor your improvement
              </p>
            </div>
          </div>

          {/* Final CTA Section */}
          <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
            <CardContent className="text-center py-12">
              <h3 className="text-2xl lg:text-3xl font-bold mb-4">
                Ready to Transform Your SMLE Preparation?
              </h3>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join thousands of medical students who are already using
                Barshimha to ace their SMLE exams with our smart, evidence-based
                learning approach.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={handleSubscribeNow}
                  disabled={isLoggingIn}
                  size="lg"
                  className="px-8 py-4 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {isLoggingIn ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground mr-2" />
                      Getting Started...
                    </>
                  ) : (
                    <>
                      Get Started Today
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                New users are automatically registered. The first user becomes
                an admin.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-primary/10 p-2 rounded-lg">
                <img
                  src="/assets/5d0a4fad-307b-4b30-8c10-dd200e46e3f2.png"
                  alt="Barshimha Logo"
                  className="h-6 w-6 object-contain"
                  onError={(e) => {
                    // Fallback to BookOpen icon if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = "block";
                  }}
                />
                <BookOpen
                  className="h-6 w-6 text-primary"
                  style={{ display: "none" }}
                />
              </div>
              <span className="text-xl font-bold ml-2">Barshimha</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Transforming medical exam preparation with smart learning tools
            </p>
            <div className="text-sm text-muted-foreground">
              © 2025. Built with ❤️ using{" "}
              <a
                href="https://caffeine.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline transition-colors"
              >
                caffeine.ai
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

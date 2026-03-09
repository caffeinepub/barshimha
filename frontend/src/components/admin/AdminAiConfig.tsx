import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Bot, Save, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useGetAiAssistantConfig, useSetAiAssistantConfig, useDeleteAiAssistantConfig } from '../../hooks/useQueries';
import { toast } from 'sonner';

export function AdminAiConfig() {
  const { data: config, isLoading } = useGetAiAssistantConfig();
  const setConfig = useSetAiAssistantConfig();
  const deleteConfig = useDeleteAiAssistantConfig();

  const [apiKey, setApiKey] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    if (config) {
      setApiKey(config.apiKey);
      setEnabled(config.enabled);
    }
  }, [config]);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter a valid API key');
      return;
    }

    try {
      await setConfig.mutateAsync({ apiKey: apiKey.trim(), enabled });
      toast.success('AI Assistant configuration saved successfully');
    } catch (error) {
      toast.error('Failed to save configuration');
      console.error('AI config save error:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete the AI Assistant configuration? This will disable the feature for all users.')) {
      return;
    }

    try {
      await deleteConfig.mutateAsync();
      setApiKey('');
      setEnabled(false);
      toast.success('AI Assistant configuration deleted');
    } catch (error) {
      toast.error('Failed to delete configuration');
      console.error('AI config delete error:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">AI Assistant Configuration</h2>
        <p className="text-muted-foreground">
          Configure DeepSeek API integration for the AI Study Assistant
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>DeepSeek API Configuration</CardTitle>
              <CardDescription>
                Enter your DeepSeek API credentials to enable AI-powered study assistance
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              The AI Assistant uses DeepSeek's API to provide intelligent responses to student queries. 
              You need a valid API key from DeepSeek to enable this feature.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">DeepSeek API Key *</Label>
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Input
                    id="apiKey"
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Your API key will be stored securely and encrypted
              </p>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enabled">Enable AI Assistant</Label>
                <p className="text-sm text-muted-foreground">
                  Make the AI Assistant available to students
                </p>
              </div>
              <Switch
                id="enabled"
                checked={enabled}
                onCheckedChange={setEnabled}
              />
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Configuration Status</p>
              {config ? (
                <div className="flex items-center space-x-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Configured and {config.enabled ? 'enabled' : 'disabled'}</span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Not configured</p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {config && (
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  disabled={deleteConfig.isPending}
                >
                  Delete Configuration
                </Button>
              )}
              <Button
                onClick={handleSave}
                disabled={setConfig.isPending || !apiKey.trim()}
              >
                <Save className="h-4 w-4 mr-2" />
                {setConfig.isPending ? 'Saving...' : 'Save Configuration'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Information</CardTitle>
          <CardDescription>
            How to obtain and use your DeepSeek API key
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Getting Your API Key</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Visit the DeepSeek platform at https://platform.deepseek.com</li>
              <li>Create an account or sign in to your existing account</li>
              <li>Navigate to the API Keys section in your dashboard</li>
              <li>Generate a new API key and copy it</li>
              <li>Paste the API key in the field above and save</li>
            </ol>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-medium">Security Notes</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>API keys are stored securely with encryption</li>
              <li>Only administrators can view or modify the configuration</li>
              <li>Students cannot access the API key</li>
              <li>All API communications are logged for monitoring</li>
            </ul>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-medium">Usage Information</h4>
            <p className="text-sm text-muted-foreground">
              The AI Assistant will be available to students on the Study page when enabled. 
              Students can click the floating AI button to open a chat interface and ask questions 
              about the current study material.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

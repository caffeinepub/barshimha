import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  useGetAllDomainsAndTopics, 
  useGetAllQuestions, 
  useAddDomainTopic, 
  useUpdateDomainTopic, 
  useDeleteDomainTopic 
} from '../hooks/useQueries';
import { DomainTopicType } from '../backend';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, AlertCircle, CheckCircle, Folder, FileText, Settings } from 'lucide-react';

export function DomainManagement() {
  const [newDomainName, setNewDomainName] = useState('');
  const [editingDomain, setEditingDomain] = useState<{ id: string; name: string } | null>(null);
  const [editName, setEditName] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: domainsAndTopics = [], isLoading: domainsLoading, refetch: refetchDomains } = useGetAllDomainsAndTopics();
  const { data: allQuestions = [], isLoading: questionsLoading, refetch: refetchQuestions } = useGetAllQuestions();
  const addDomainTopic = useAddDomainTopic();
  const updateDomainTopic = useUpdateDomainTopic();
  const deleteDomainTopic = useDeleteDomainTopic();

  // Filter only domains
  const domains = domainsAndTopics.filter(item => item.type === DomainTopicType.domain);

  // Get question count for each domain
  const getQuestionCount = (domainName: string) => {
    return allQuestions.filter(question => question.domain === domainName).length;
  };

  const handleAddDomain = async () => {
    if (!newDomainName.trim()) {
      toast.error('Please enter a domain name');
      return;
    }

    // Check if domain already exists
    const existingDomain = domains.find(d => d.name.toLowerCase() === newDomainName.trim().toLowerCase());
    if (existingDomain) {
      toast.error('A domain with this name already exists');
      return;
    }

    try {
      const domainId = `domain_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await addDomainTopic.mutateAsync({
        id: domainId,
        name: newDomainName.trim(),
        type: DomainTopicType.domain
      });
      
      toast.success('Domain added successfully!');
      setNewDomainName('');
      setIsAddDialogOpen(false);
      await refetchDomains();
      await refetchQuestions();
    } catch (error: any) {
      toast.error(`Failed to add domain: ${error.message}`);
      console.error('Add domain error:', error);
    }
  };

  const handleEditDomain = async () => {
    if (!editingDomain || !editName.trim()) {
      toast.error('Please enter a domain name');
      return;
    }

    // Check if domain name already exists (excluding current domain)
    const existingDomain = domains.find(d => 
      d.name.toLowerCase() === editName.trim().toLowerCase() && d.id !== editingDomain.id
    );
    if (existingDomain) {
      toast.error('A domain with this name already exists');
      return;
    }

    try {
      await updateDomainTopic.mutateAsync({
        id: editingDomain.id,
        newName: editName.trim()
      });
      
      toast.success('Domain updated successfully! All related questions have been updated.');
      setEditingDomain(null);
      setEditName('');
      setIsEditDialogOpen(false);
      await refetchDomains();
      await refetchQuestions();
    } catch (error: any) {
      toast.error(`Failed to update domain: ${error.message}`);
      console.error('Update domain error:', error);
    }
  };

  const handleDeleteDomain = async (domainId: string, domainName: string) => {
    const questionCount = getQuestionCount(domainName);
    
    try {
      await deleteDomainTopic.mutateAsync(domainId);
      
      if (questionCount > 0) {
        toast.success(`Domain deleted successfully! ${questionCount} questions have been marked as "Uncategorized".`);
      } else {
        toast.success('Domain deleted successfully!');
      }
      
      await refetchDomains();
      await refetchQuestions();
    } catch (error: any) {
      toast.error(`Failed to delete domain: ${error.message}`);
      console.error('Delete domain error:', error);
    }
  };

  const openEditDialog = (domain: { id: string; name: string }) => {
    setEditingDomain(domain);
    setEditName(domain.name);
    setIsEditDialogOpen(true);
  };

  if (domainsLoading || questionsLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Settings className="h-6 w-6 text-primary animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Domain Management</h2>
            <p className="text-muted-foreground">Loading domains and questions...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Domain Management</h2>
            <p className="text-muted-foreground">Manage domains and view question distribution</p>
          </div>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Domain
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Domain</DialogTitle>
              <DialogDescription>
                Create a new domain for organizing questions. This will be available for question categorization.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="domain-name">Domain Name</Label>
                <Input
                  id="domain-name"
                  value={newDomainName}
                  onChange={(e) => setNewDomainName(e.target.value)}
                  placeholder="Enter domain name..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddDomain();
                    }
                  }}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setNewDomainName('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddDomain}
                  disabled={addDomainTopic.isPending || !newDomainName.trim()}
                >
                  {addDomainTopic.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                      Adding...
                    </>
                  ) : (
                    'Add Domain'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Domain Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Folder className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{domains.length}</p>
                <p className="text-sm text-muted-foreground">Total Domains</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{allQuestions.length}</p>
                <p className="text-sm text-muted-foreground">Total Questions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">
                  {allQuestions.filter(q => q.domain !== 'Uncategorized').length}
                </p>
                <p className="text-sm text-muted-foreground">Categorized Questions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Domains Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Folder className="h-5 w-5" />
            <span>Domains</span>
          </CardTitle>
          <CardDescription>
            Manage domains and view their question distribution. When you rename a domain, all related questions are automatically updated.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {domains.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No domains found. Add your first domain to start organizing questions.
              </AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain Name</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {domains.map((domain) => {
                  const questionCount = getQuestionCount(domain.name);
                  return (
                    <TableRow key={domain.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <Folder className="h-4 w-4 text-primary" />
                          <span>{domain.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={questionCount > 0 ? "secondary" : "outline"}>
                          {questionCount} questions
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(Number(domain.createdAt) / 1000000).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(Number(domain.updatedAt) / 1000000).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(domain)}
                            disabled={updateDomainTopic.isPending}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={deleteDomainTopic.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Domain</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete the domain "{domain.name}"?
                                  {questionCount > 0 && (
                                    <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                                      <div className="flex items-center space-x-2">
                                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                                        <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                          Warning: This domain has {questionCount} questions.
                                        </span>
                                      </div>
                                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                                        All questions in this domain will be marked as "Uncategorized" and can be reassigned later.
                                      </p>
                                    </div>
                                  )}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteDomain(domain.id, domain.name)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete Domain
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Domain Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Domain</DialogTitle>
            <DialogDescription>
              Update the domain name. All questions in this domain will be automatically updated to reflect the new name.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-domain-name">Domain Name</Label>
              <Input
                id="edit-domain-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter domain name..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleEditDomain();
                  }
                }}
              />
            </div>
            
            {editingDomain && (
              <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  <strong>Cascading Update:</strong> Renaming this domain will automatically update all {getQuestionCount(editingDomain.name)} related questions.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingDomain(null);
                  setEditName('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditDomain}
                disabled={updateDomainTopic.isPending || !editName.trim()}
              >
                {updateDomainTopic.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                    Updating...
                  </>
                ) : (
                  'Update Domain'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

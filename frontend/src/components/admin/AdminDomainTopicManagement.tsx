import { useState, useMemo } from 'react';
import { useGetDomainTopics, useAddDomainTopic, useUpdateDomainTopic, useDeleteDomainTopic, useGetQuestions, useGetDomains } from '../../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Search, Tag, Folder, AlertTriangle, CheckCircle, Loader2, Info, BookOpen, Database, Eye } from 'lucide-react';
import { DomainTopic, DomainTopicType, Question, QuestionState } from '../../backend';
import { toast } from 'sonner';

export function AdminDomainTopicManagement() {
  const { data: customDomainTopics = [], isLoading: customLoading } = useGetDomainTopics();
  const { data: questions = [], isLoading: questionsLoading } = useGetQuestions();
  const { data: smleDomains = [], isLoading: smleDomainsLoading } = useGetDomains();
  const addDomainTopic = useAddDomainTopic();
  const updateDomainTopic = useUpdateDomainTopic();
  const deleteDomainTopic = useDeleteDomainTopic();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DomainTopic | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<DomainTopic | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    type: DomainTopicType.domain,
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
  });

  const isLoading = customLoading || questionsLoading || smleDomainsLoading;

  // Get all domains (SMLE + custom)
  const allDomains = useMemo(() => {
    const smleDomainsData = smleDomains.map(domain => ({
      name: domain.name,
      type: 'SMLE' as const,
      subjectCount: 0,
      subjects: [] as string[]
    }));

    const customDomainsData = customDomainTopics
      .filter(item => item.type === DomainTopicType.domain)
      .map(domain => ({
        name: domain.name,
        type: 'Custom' as const,
        subjectCount: 0,
        subjects: [] as string[]
      }));

    return [...smleDomainsData, ...customDomainsData];
  }, [smleDomains, customDomainTopics]);

  // Get all topics (custom only since subjects are removed)
  const allTopics = useMemo(() => {
    const customTopics = customDomainTopics
      .filter(item => item.type === DomainTopicType.topic)
      .map(topic => ({
        name: topic.name,
        domain: 'Custom',
        type: 'Custom' as const
      }));

    return customTopics;
  }, [customDomainTopics]);

  // Filter custom domain topics
  const filteredCustomDomainTopics = useMemo(() => {
    return customDomainTopics.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || item.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [customDomainTopics, searchTerm, typeFilter]);

  // Filter questions
  const filteredQuestions = useMemo(() => {
    return questions.filter(question => {
      const matchesSearch = question.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           question.domain.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [questions, searchTerm]);

  // Get affected questions for a domain/topic
  const getAffectedQuestions = (item: DomainTopic) => {
    if (item.type === DomainTopicType.domain) {
      return questions.filter(q => q.domain === item.name);
    } else {
      // For topics, we don't have topic field anymore, so return empty array
      return [];
    }
  };

  // Get question statistics
  const questionStats = useMemo(() => {
    const total = questions.length;
    const published = questions.filter(q => q.state === QuestionState.published).length;
    const draft = questions.filter(q => q.state === QuestionState.draft).length;
    const archived = questions.filter(q => q.state === QuestionState.archived).length;

    // Questions by domain
    const byDomain = questions.reduce((acc, q) => {
      acc[q.domain] = (acc[q.domain] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total, published, draft, archived, byDomain };
  }, [questions]);

  const resetAddForm = () => {
    setFormData({
      name: '',
      type: DomainTopicType.domain,
    });
  };

  const handleAdd = () => {
    resetAddForm();
    setIsAddDialogOpen(true);
  };

  const handleEdit = (item: DomainTopic) => {
    setEditingItem(item);
    setEditFormData({
      name: item.name,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (item: DomainTopic) => {
    setDeletingItem(item);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Please enter a name');
      return;
    }

    // Check for duplicate names
    const existingItem = customDomainTopics.find(item => 
      item.name.toLowerCase() === formData.name.trim().toLowerCase() && 
      item.type === formData.type
    );

    if (existingItem) {
      toast.error(`A ${formData.type} with this name already exists`);
      return;
    }

    // Check against SMLE structure
    if (formData.type === DomainTopicType.domain) {
      const existsInSMLE = allDomains.some(domain => 
        domain.name.toLowerCase() === formData.name.trim().toLowerCase()
      );
      if (existsInSMLE) {
        toast.error('A domain with this name already exists in the SMLE structure');
        return;
      }
    }

    try {
      const id = `${formData.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await addDomainTopic.mutateAsync({
        id,
        name: formData.name.trim(),
        type: formData.type,
      });

      toast.success(`${formData.type === DomainTopicType.domain ? 'Domain' : 'Topic'} created successfully`);
      setIsAddDialogOpen(false);
      resetAddForm();
    } catch (error) {
      toast.error('Failed to create item');
      console.error('Add domain/topic error:', error);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingItem || !editFormData.name.trim()) {
      toast.error('Please enter a valid name');
      return;
    }

    if (editFormData.name.trim() === editingItem.name) {
      toast.info('No changes made');
      setIsEditDialogOpen(false);
      return;
    }

    // Check for duplicate names (excluding current item)
    const existingItem = customDomainTopics.find(item => 
      item.id !== editingItem.id &&
      item.name.toLowerCase() === editFormData.name.trim().toLowerCase() && 
      item.type === editingItem.type
    );

    if (existingItem) {
      toast.error(`A ${editingItem.type} with this name already exists`);
      return;
    }

    try {
      await updateDomainTopic.mutateAsync({
        id: editingItem.id,
        newName: editFormData.name.trim(),
      });

      const affectedQuestions = getAffectedQuestions(editingItem);
      const itemType = editingItem.type === DomainTopicType.domain ? 'Domain' : 'Topic';
      
      toast.success(
        `${itemType} renamed successfully${affectedQuestions.length > 0 ? ` and ${affectedQuestions.length} related questions updated` : ''}`
      );
      
      setIsEditDialogOpen(false);
      setEditingItem(null);
    } catch (error) {
      toast.error('Failed to update item');
      console.error('Update domain/topic error:', error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;

    try {
      await deleteDomainTopic.mutateAsync(deletingItem.id);

      const affectedQuestions = getAffectedQuestions(deletingItem);
      const itemType = deletingItem.type === DomainTopicType.domain ? 'Domain' : 'Topic';
      
      toast.success(
        `${itemType} deleted successfully${affectedQuestions.length > 0 ? ` and ${affectedQuestions.length} questions marked as "Uncategorized"` : ''}`
      );
      
      setDeletingItem(null);
    } catch (error) {
      toast.error('Failed to delete item');
      console.error('Delete domain/topic error:', error);
    }
  };

  const getTypeLabel = (type: DomainTopicType) => {
    return type === DomainTopicType.domain ? 'Domain' : 'Topic';
  };

  const getTypeIcon = (type: DomainTopicType) => {
    return type === DomainTopicType.domain ? Folder : Tag;
  };

  const getTypeColor = (type: DomainTopicType) => {
    return type === DomainTopicType.domain 
      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  };

  const getQuestionStateColor = (state: QuestionState) => {
    switch (state) {
      case QuestionState.published:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case QuestionState.draft:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case QuestionState.archived:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) / 1000000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const customDomainCount = customDomainTopics.filter(item => item.type === DomainTopicType.domain).length;
  const customTopicCount = customDomainTopics.filter(item => item.type === DomainTopicType.topic).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading domain, topic, and question data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">Domain & Topic Management</h3>
          <p className="text-muted-foreground">
            Manage the five SMLE domains, custom domains, topics, and view all questions with automatic updates and orphan prevention
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Custom Domain/Topic
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Custom Domain or Topic</DialogTitle>
              <DialogDescription>
                Create a new custom domain or topic for organizing questions (in addition to the five SMLE domains)
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as DomainTopicType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={DomainTopicType.domain}>
                      <div className="flex items-center space-x-2">
                        <Folder className="h-4 w-4" />
                        <span>Custom Domain</span>
                      </div>
                    </SelectItem>
                    <SelectItem value={DomainTopicType.topic}>
                      <div className="flex items-center space-x-2">
                        <Tag className="h-4 w-4" />
                        <span>Custom Topic</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={`Enter custom ${formData.type} name`}
                  required
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={addDomainTopic.isPending}
                >
                  {addDomainTopic.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info Alert */}
      <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 dark:text-blue-200">
          <strong>Domain-Only Structure:</strong> This interface shows the five SMLE domains (Surgery, OBGYN, Internal Medicine, Pediatrics, Ethics), 
          custom domains/topics, and all questions. When you rename custom domains or topics, all related questions are automatically updated. 
          When you delete custom domains or topics, affected questions are marked as "Uncategorized" to prevent orphaned data.
        </AlertDescription>
      </Alert>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">SMLE Domains</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{smleDomains.length}</div>
            <p className="text-xs text-muted-foreground">Five SMLE domains</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Custom Items</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{customDomainTopics.length}</div>
            <p className="text-xs text-muted-foreground">{customDomainCount} domains, {customTopicCount} topics</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{questionStats.total}</div>
            <p className="text-xs text-muted-foreground">{questionStats.published} published</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Topics</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{allTopics.length}</div>
            <p className="text-xs text-muted-foreground">Custom topics</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="domains">All Domains</TabsTrigger>
          <TabsTrigger value="custom">Custom Items</TabsTrigger>
          <TabsTrigger value="questions">All Questions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* SMLE Structure Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-blue-600" />
                <span>SMLE Domain Structure (5 Domains)</span>
              </CardTitle>
              <CardDescription>
                Five SMLE domains without subject subdivisions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {smleDomains.map((domain) => (
                  <div key={domain.id} className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950">
                    <div className="flex items-center space-x-2 mb-2">
                      <Folder className="h-4 w-4 text-blue-600" />
                      <h4 className="font-medium text-blue-800 dark:text-blue-200">{domain.name}</h4>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Questions: {questionStats.byDomain[domain.name] || 0}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Custom Items Overview */}
          {customDomainTopics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="h-5 w-5 text-purple-600" />
                  <span>Custom Domains & Topics</span>
                </CardTitle>
                <CardDescription>
                  Your custom domains and topics for additional organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {customDomainTopics.map((item) => {
                    const Icon = getTypeIcon(item.type);
                    const affectedQuestions = getAffectedQuestions(item);
                    return (
                      <div key={item.id} className="border rounded-lg p-4 bg-purple-50 dark:bg-purple-950">
                        <div className="flex items-center space-x-2 mb-2">
                          <Icon className="h-4 w-4 text-purple-600" />
                          <h4 className="font-medium text-purple-800 dark:text-purple-200">{item.name}</h4>
                        </div>
                        <Badge className={getTypeColor(item.type)}>
                          {getTypeLabel(item.type)}
                        </Badge>
                        <div className="mt-2 text-xs text-muted-foreground">
                          Questions: {affectedQuestions.length}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Created: {formatDate(item.createdAt)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Question Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-green-600" />
                <span>Question Statistics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{questionStats.published}</div>
                  <p className="text-sm text-muted-foreground">Published</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{questionStats.draft}</div>
                  <p className="text-sm text-muted-foreground">Draft</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">{questionStats.archived}</div>
                  <p className="text-sm text-muted-foreground">Archived</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{questionStats.total}</div>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="domains" className="space-y-6">
          {/* Search */}
          <Card>
            <CardHeader>
              <CardTitle>All Domains (SMLE + Custom)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search domains..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Domain Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Questions</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allDomains
                    .filter(domain => domain.name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((domain) => (
                    <TableRow key={`${domain.type}-${domain.name}`}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Folder className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{domain.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={domain.type === 'SMLE' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'}>
                          {domain.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{questionStats.byDomain[domain.name] || 0}</span>
                      </TableCell>
                      <TableCell>
                        {domain.type === 'Custom' && (
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const customItem = customDomainTopics.find(item => 
                                  item.name === domain.name && item.type === DomainTopicType.domain
                                );
                                if (customItem) handleEdit(customItem);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Custom Domain</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{domain.name}"? This will mark {questionStats.byDomain[domain.name] || 0} questions as "Uncategorized".
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => {
                                      const customItem = customDomainTopics.find(item => 
                                        item.name === domain.name && item.type === DomainTopicType.domain
                                      );
                                      if (customItem) {
                                        setDeletingItem(customItem);
                                        handleDeleteConfirm();
                                      }
                                    }}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                        {domain.type === 'SMLE' && (
                          <Badge variant="outline" className="text-xs">
                            Protected
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Custom Domains & Topics</CardTitle>
              <CardDescription>Manage your custom domains and topics with real-time question updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search custom domains and topics..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value={DomainTopicType.domain}>Custom Domains</SelectItem>
                    <SelectItem value={DomainTopicType.topic}>Custom Topics</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Custom Domain/Topic Table */}
          <Card>
            <CardHeader>
              <CardTitle>Custom Items ({filteredCustomDomainTopics.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Questions</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomDomainTopics.map((item) => {
                    const affectedQuestions = getAffectedQuestions(item);
                    const Icon = getTypeIcon(item.type);
                    
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{item.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getTypeColor(item.type)}>
                            {getTypeLabel(item.type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm">{affectedQuestions.length}</span>
                            {affectedQuestions.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {affectedQuestions.length} linked
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(item.createdAt)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(item.updatedAt)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(item)}
                              disabled={updateDomainTopic.isPending}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDelete(item)}
                                  disabled={deleteDomainTopic.isPending}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="flex items-center space-x-2">
                                    <AlertTriangle className="h-5 w-5 text-red-600" />
                                    <span>Delete {getTypeLabel(item.type)}</span>
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="space-y-3">
                                    <p>
                                      Are you sure you want to delete the {getTypeLabel(item.type).toLowerCase()} "{item.name}"?
                                    </p>
                                    {affectedQuestions.length > 0 && (
                                      <div className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                        <div className="flex items-start space-x-2">
                                          <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                          <div className="space-y-1">
                                            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                              Impact on Questions
                                            </p>
                                            <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                              {affectedQuestions.length} question{affectedQuestions.length !== 1 ? 's' : ''} 
                                              {' '}currently use{affectedQuestions.length === 1 ? 's' : ''} this {getTypeLabel(item.type).toLowerCase()}. 
                                              {item.type === DomainTopicType.domain 
                                                ? ' These questions will have their domain changed to "Uncategorized".'
                                                : ' These questions will have their topic changed to "Uncategorized".'
                                              }
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    <p className="text-sm text-muted-foreground">
                                      This action cannot be undone.
                                    </p>
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={handleDeleteConfirm}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                  >
                                    {deleteDomainTopic.isPending ? (
                                      <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Deleting...
                                      </>
                                    ) : (
                                      'Delete'
                                    )}
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

              {filteredCustomDomainTopics.length === 0 && (
                <div className="text-center py-8">
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <Folder className="h-8 w-8 text-muted-foreground" />
                    <Tag className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground mb-2">
                    {searchTerm || typeFilter !== 'all' ? 'No items match your filters' : 'No custom domains or topics yet'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {searchTerm || typeFilter !== 'all' 
                      ? 'Try adjusting your search or filter criteria'
                      : 'Create your first custom domain or topic to get started'
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions" className="space-y-6">
          {/* Search */}
          <Card>
            <CardHeader>
              <CardTitle>All Questions ({questions.length})</CardTitle>
              <CardDescription>
                View and manage all questions across SMLE domains and custom categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search questions by content or domain..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Question</TableHead>
                    <TableHead>Domain</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuestions.slice(0, 50).map((question) => (
                    <TableRow key={question.id}>
                      <TableCell className="max-w-xs">
                        <p className="line-clamp-2 text-sm">{question.content}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Folder className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{question.domain}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getQuestionStateColor(question.state)}>
                          {question.state}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">v{question.version.toString()}</span>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // This would typically navigate to question edit page
                            toast.info('Question editing available in Question Management tab');
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredQuestions.length > 50 && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    Showing first 50 of {filteredQuestions.length} questions. Use search to narrow results.
                  </p>
                </div>
              )}

              {filteredQuestions.length === 0 && (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">
                    {searchTerm ? 'No questions match your search' : 'No questions found'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {searchTerm ? 'Try adjusting your search criteria' : 'Questions will appear here once created'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Edit {editingItem ? getTypeLabel(editingItem.type) : 'Item'}
            </DialogTitle>
            <DialogDescription>
              Rename this {editingItem ? getTypeLabel(editingItem.type).toLowerCase() : 'item'}. 
              All related questions will be updated automatically.
            </DialogDescription>
          </DialogHeader>
          {editingItem && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Current Name</Label>
                <div className="bg-muted/30 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    {(() => {
                      const Icon = getTypeIcon(editingItem.type);
                      return <Icon className="h-4 w-4 text-muted-foreground" />;
                    })()}
                    <span className="font-medium">{editingItem.name}</span>
                    <Badge className={getTypeColor(editingItem.type)}>
                      {getTypeLabel(editingItem.type)}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>New Name *</Label>
                <Input
                  value={editFormData.name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={`Enter new ${getTypeLabel(editingItem.type).toLowerCase()} name`}
                  required
                />
              </div>

              {(() => {
                const affectedQuestions = getAffectedQuestions(editingItem);
                if (affectedQuestions.length > 0) {
                  return (
                    <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            Automatic Updates
                          </p>
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            {affectedQuestions.length} question{affectedQuestions.length !== 1 ? 's' : ''} 
                            {' '}will be automatically updated to use the new name.
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateDomainTopic.isPending}
                >
                  {updateDomainTopic.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update'
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

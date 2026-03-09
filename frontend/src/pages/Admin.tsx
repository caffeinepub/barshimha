import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminQuestions } from '../components/admin/AdminQuestions';
import { AdminComments } from '../components/admin/AdminComments';
import { AdminPayments } from '../components/admin/AdminPayments';
import { AdminPaymentConfiguration } from '../components/admin/AdminPaymentConfiguration';
import { AdminBrandManagement } from '../components/admin/AdminBrandManagement';
import { AdminUsers } from '../components/admin/AdminUsers';
import { AdminAnalytics } from '../components/admin/AdminAnalytics';
import { AdminAiConfig } from '../components/admin/AdminAiConfig';
import { useIsCallerAdmin } from '../hooks/useQueries';
import { AlertCircle } from 'lucide-react';

export function Admin() {
  const { data: isAdmin, isLoading } = useIsCallerAdmin();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <Card className="max-w-md mx-auto mt-16">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle>Access Denied</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription>
            You don't have permission to access the admin panel. 
            Only administrators can view this page.
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground mt-2">
          Manage users, questions, payments, brand assets, and platform analytics
        </p>
      </div>

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="payment-config">Payment Config</TabsTrigger>
          <TabsTrigger value="brand-management">Brand Assets</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <AdminAnalytics />
        </TabsContent>

        <TabsContent value="questions">
          <AdminQuestions />
        </TabsContent>

        <TabsContent value="comments">
          <AdminComments />
        </TabsContent>

        <TabsContent value="payments">
          <AdminPayments />
        </TabsContent>

        <TabsContent value="payment-config">
          <AdminPaymentConfiguration />
        </TabsContent>

        <TabsContent value="brand-management">
          <AdminBrandManagement />
        </TabsContent>

        <TabsContent value="users">
          <AdminUsers />
        </TabsContent>

        <TabsContent value="settings">
          <AdminAiConfig />
        </TabsContent>
      </Tabs>
    </div>
  );
}

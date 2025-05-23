'use client';

import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DebugPage() {
  const { data: session, status } = useSession();

  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Session Debug</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Session Status: {status}</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg overflow-auto">
            {JSON.stringify(session, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <div className="mt-6 space-y-4">
        <div className="p-4 bg-muted rounded-lg">
          <strong>Has Session:</strong> {session ? 'Yes' : 'No'}
        </div>
        <div className="p-4 bg-muted rounded-lg">
          <strong>User ID:</strong> {session?.user?.id || 'Not found'}
        </div>
        <div className="p-4 bg-muted rounded-lg">
          <strong>User Email:</strong> {session?.user?.email || 'Not found'}
        </div>
        <div className="p-4 bg-muted rounded-lg">
          <strong>User Role:</strong> {session?.user?.role || 'Not found'}
        </div>
      </div>
    </div>
  );
} 
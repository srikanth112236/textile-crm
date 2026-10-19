'use client';

import { useEffect, useState } from 'react';
import { adminApi, Permission } from '@/lib/api/admin';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield } from 'lucide-react';
import { getErrorMessage } from '@/lib/utils';

export default function PermissionsClient() {
  const { toast } = useToast();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getPermissions();
      if (response.success) {
        setPermissions(response.data);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: getErrorMessage(error) || 'Failed to fetch permissions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.resource]) {
      acc[perm.resource] = [];
    }
    acc[perm.resource].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Permissions & Roles</h1>
        <p className="text-muted-foreground">View and manage system permissions</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedPermissions).map(([resource, perms]) => (
            <div key={resource} className="rounded-lg border bg-card p-6">
              <h2 className="text-xl font-semibold mb-4 capitalize">{resource}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {perms.map((perm) => (
                  <div
                    key={perm._id}
                    className="flex items-center gap-2 p-3 rounded-lg border bg-background"
                  >
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium capitalize">{perm.action}</div>
                      {perm.description && (
                        <div className="text-xs text-muted-foreground">
                          {perm.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {permissions.length === 0 && (
            <div className="text-center p-8 text-muted-foreground">
              No permissions found
            </div>
          )}
        </div>
      )}
    </div>
  );
}


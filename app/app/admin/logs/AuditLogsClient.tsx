'use client';

import { useEffect, useState } from 'react';
import { adminApi, AuditLog } from '@/lib/api/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { getErrorMessage } from '@/lib/utils';
import {
  AdminTable,
  AdminTableBody,
  AdminTableCell,
  AdminTableHead,
  AdminTableHeader,
  AdminTableRow,
} from '@/components/admin/DataTable';

export default function AuditLogsClient() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });
  const [filters, setFilters] = useState({
    action: 'all',
    resource: 'all',
    status: 'all',
    userId: '',
    startDate: '',
    endDate: '',
  });

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (filters.action !== 'all') params.action = filters.action;
      if (filters.resource !== 'all') params.resource = filters.resource;
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.userId) params.userId = filters.userId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await adminApi.getAuditLogs(params);
      if (response.success) {
        setLogs(response.data);
        setPagination(response.pagination);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: getErrorMessage(error) || 'Failed to fetch audit logs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [pagination.page, filters]);

  const getActionBadge = (action: string) => {
    const actionColors: Record<string, string> = {
      create: 'bg-blue-100 text-blue-800',
      update: 'bg-yellow-100 text-yellow-800',
      delete: 'bg-red-100 text-red-800',
      login: 'bg-green-100 text-green-800',
      logout: 'bg-gray-100 text-gray-800',
    };
    return (
      <Badge className={`${actionColors[action.split('_')[0]] || 'bg-gray-100 text-gray-800'} text-[11px]`}>
        {action.replace(/_/g, ' ').toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto px-3 py-4 max-w-7xl space-y-4">
      <div className="mb-4">
        <h1 className="text-xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground mt-1 text-[13px]">View system activity and audit trail</p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div>
          <Label>Action</Label>
          <Select
            value={filters.action}
            onValueChange={(value) => {
              setFilters({ ...filters, action: value });
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="create">Create</SelectItem>
              <SelectItem value="update">Update</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
              <SelectItem value="login">Login</SelectItem>
              <SelectItem value="user_ban">User Ban</SelectItem>
              <SelectItem value="user_unban">User Unban</SelectItem>
              <SelectItem value="role_change">Role Change</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Resource</Label>
          <Select
            value={filters.resource}
            onValueChange={(value) => {
              setFilters({ ...filters, resource: value });
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Resources</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="order">Order</SelectItem>
              <SelectItem value="product">Product</SelectItem>
              <SelectItem value="discount">Discount</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Status</Label>
          <Select
            value={filters.status}
            onValueChange={(value) => {
              setFilters({ ...filters, status: value });
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Start Date</Label>
          <Input
            type="date"
            value={filters.startDate}
            onChange={(e) => {
              setFilters({ ...filters, startDate: e.target.value });
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
          />
        </div>
        <div>
          <Label>End Date</Label>
          <Input
            type="date"
            value={filters.endDate}
            onChange={(e) => {
              setFilters({ ...filters, endDate: e.target.value });
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
          />
        </div>
        <div className="flex items-end">
          <Button
            variant="outline"
            onClick={() => {
              setFilters({
                action: 'all',
                resource: 'all',
                status: 'all',
                userId: '',
                startDate: '',
                endDate: '',
              });
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="w-full"
          >
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="rounded-xl border bg-card flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">No logs found</div>
      ) : (
        <AdminTable>
          <AdminTableHeader>
            <AdminTableRow>
              <AdminTableHead>Timestamp</AdminTableHead>
              <AdminTableHead>User</AdminTableHead>
              <AdminTableHead>Action</AdminTableHead>
              <AdminTableHead>Resource</AdminTableHead>
              <AdminTableHead>Status</AdminTableHead>
              <AdminTableHead>IP address</AdminTableHead>
            </AdminTableRow>
          </AdminTableHeader>
          <AdminTableBody>
            {logs.map((log) => (
              <AdminTableRow key={log._id}>
                <AdminTableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString()}
                </AdminTableCell>
                <AdminTableCell className="text-[13px] truncate max-w-[180px]">
                  {log.userId
                    ? typeof log.userId === 'object'
                      ? log.userId.email
                      : log.userId
                    : 'System'}
                </AdminTableCell>
                <AdminTableCell>{getActionBadge(log.action)}</AdminTableCell>
                <AdminTableCell className="text-[13px] capitalize truncate max-w-[120px]">{log.resource}</AdminTableCell>
                <AdminTableCell>
                  <Badge
                    variant={log.status === 'success' ? 'default' : 'destructive'}
                    className="text-[11px]"
                  >
                    {log.status}
                  </Badge>
                </AdminTableCell>
                <AdminTableCell className="font-mono text-xs text-muted-foreground">
                  {log.ipAddress || '-'}
                </AdminTableCell>
              </AdminTableRow>
            ))}
          </AdminTableBody>
        </AdminTable>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} logs
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center px-4 text-sm">
              Page {pagination.page} of {pagination.pages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.pages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}


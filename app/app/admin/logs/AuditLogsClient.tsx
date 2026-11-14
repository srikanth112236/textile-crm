'use client';

import { useEffect, useState, useMemo } from 'react';
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
import { Loader2, ChevronLeft, ChevronRight, Search, Shield } from 'lucide-react';
import { getErrorMessage } from '@/lib/utils';
import { LogDetailDialog } from '@/components/admin/LogDetailDialog';
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
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });
  const [filters, setFilters] = useState({ action: 'all', resource: 'all', status: 'all', userId: '', resourceId: '', startDate: '', endDate: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params: any = { page: pagination.page, limit: pagination.limit };
      if (filters.action !== 'all') params.action = filters.action;
      if (filters.resource !== 'all') params.resource = filters.resource;
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.userId) params.userId = filters.userId;
      if (filters.resourceId) params.resourceId = filters.resourceId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      const response = await adminApi.getAuditLogs(params);
      if (response.success) {
        setLogs(response.data);
        setPagination(response.pagination);
      }
    } catch (error: any) {
      toast({ title: 'Error', description: getErrorMessage(error) || 'Failed to fetch audit logs', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [pagination.page, filters]);

  const getActionBadge = (action: string) => {
    const map: Record<string, string> = {
      create: 'bg-blue-100 text-blue-800',
      update: 'bg-amber-100 text-amber-800',
      delete: 'bg-rose-100 text-red-800',
      login: 'bg-emerald-100 text-emerald-800',
      logout: 'bg-slate-100 text-slate-700',
    };
    return (
      <Badge className={`${map[action.split('_')[0]] || 'bg-gray-100 text-gray-800'} text-[10px] font-extrabold rounded-full`}>
        {action.replace(/_/g, ' ').toUpperCase()}
      </Badge>
    );
  };

  const filteredLogs = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return logs;
    return logs.filter((l) => {
      const userStr = (typeof l.userId === 'object' ? (l.userId.email || l.userId.name || '') : String(l.userId || '')).toLowerCase();
      const resStr = (l.resource || '').toLowerCase();
      const actStr = (l.action || '').toLowerCase();
      const idStr = (l.resourceId || '').toLowerCase();
      return userStr.includes(q) || resStr.includes(q) || actStr.includes(q) || idStr.includes(q) || (l.ipAddress || '').toLowerCase().includes(q);
    });
  }, [logs, searchQuery]);

  const clearFilters = () => {
    setFilters({ action: 'all', resource: 'all', status: 'all', userId: '', resourceId: '', startDate: '', endDate: '' });
    setSearchQuery('');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div className="w-full px-3 py-3 sm:px-4 lg:px-5 space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight leading-none">Audit Logs</h1>
            <p className="text-[11px] text-muted-foreground mt-1">Complete application activity with route-level details and structured filters.</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs} className="h-8 rounded-lg text-[10px] font-extrabold shadow-sm">
          <Loader2 className={`h-3 w-3 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-2.5 border-b border-slate-100 dark:border-slate-800">
          <div className="relative w-full lg:w-72">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search user, action, resource, IP..." className="pl-9 pr-3 h-9 rounded-lg text-[11px] w-full" />
          </div>
        </div>
        <div className="p-2.5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          <div>
            <Label className="text-[9px] font-bold">Action</Label>
            <Select value={filters.action} onValueChange={(v) => { setFilters({ ...filters, action: v }); setPagination(p => ({ ...p, page: 1 })); }}>
              <SelectTrigger className="h-8 rounded-lg text-[10px]"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="user_ban">Ban</SelectItem>
                <SelectItem value="user_unban">Unban</SelectItem>
                <SelectItem value="role_change">Role Change</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[9px] font-bold">Resource</Label>
            <Select value={filters.resource} onValueChange={(v) => { setFilters({ ...filters, resource: v }); setPagination(p => ({ ...p, page: 1 })); }}>
              <SelectTrigger className="h-8 rounded-lg text-[10px]"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="order">Order</SelectItem>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="discount">Discount</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[9px] font-bold">Status</Label>
            <Select value={filters.status} onValueChange={(v) => { setFilters({ ...filters, status: v }); setPagination(p => ({ ...p, page: 1 })); }}>
              <SelectTrigger className="h-8 rounded-lg text-[10px]"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[9px] font-bold">User ID / Email</Label>
            <Input value={filters.userId} onChange={(e) => { setFilters({ ...filters, userId: e.target.value }); setPagination(p => ({ ...p, page: 1 })); }} placeholder="Search user..." className="h-8 rounded-lg text-xs" />
          </div>
          <div>
            <Label className="text-[9px] font-bold">Resource ID</Label>
            <Input value={filters.resourceId} onChange={(e) => { setFilters({ ...filters, resourceId: e.target.value }); setPagination(p => ({ ...p, page: 1 })); }} placeholder="Resource ID..." className="h-8 rounded-lg text-xs" />
          </div>
          <div className="flex items-end gap-2">
            <Button variant="outline" size="sm" onClick={clearFilters} className="h-8 rounded-lg text-[10px] font-extrabold">Clear</Button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <AdminTable>
          <AdminTableHeader>
            <AdminTableRow>
              <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Timestamp</AdminTableHead>
              <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">User</AdminTableHead>
              <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Action</AdminTableHead>
              <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Resource</AdminTableHead>
              <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Status</AdminTableHead>
              <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">IP</AdminTableHead>
            </AdminTableRow>
          </AdminTableHeader>
          <AdminTableBody>
            {loading ? (
              <AdminTableRow>
                <AdminTableCell colSpan={6} className="text-center py-10 text-sm text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" /> Loading logs...
                </AdminTableCell>
              </AdminTableRow>
            ) : filteredLogs.length === 0 ? (
              <AdminTableRow>
                <AdminTableCell colSpan={6} className="text-center py-10 text-sm text-muted-foreground">No logs found</AdminTableCell>
              </AdminTableRow>
            ) : (
              filteredLogs.map((log) => (
                <AdminTableRow key={log._id} className="hover:bg-violet-500/[0.03] transition-colors cursor-pointer" onClick={() => { setSelectedLog(log); setDetailOpen(true); }}>
                  <AdminTableCell className="text-[11px] text-muted-foreground whitespace-nowrap">{new Date(log.createdAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</AdminTableCell>
                  <AdminTableCell className="text-[11px] truncate max-w-[160px]">
                    {(typeof log.userId === 'object' && log.userId ? log.userId.email || log.userId.name : log.userId) || 'System'}
                  </AdminTableCell>
                  <AdminTableCell>{getActionBadge(log.action)}</AdminTableCell>
                  <AdminTableCell className="text-[11px] capitalize truncate max-w-[120px]">{log.resource || '—'}</AdminTableCell>
                  <AdminTableCell>
                    <Badge variant={log.status === 'success' ? 'default' : 'destructive'} className="text-[9px] font-extrabold rounded-full px-2">{log.status}</Badge>
                  </AdminTableCell>
                  <AdminTableCell className="font-mono text-[10px] text-muted-foreground truncate max-w-[120px]">{log.ipAddress || '—'}</AdminTableCell>
                </AdminTableRow>
              ))
            )}
          </AdminTableBody>
        </AdminTable>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground font-medium">
            Showing <span className="font-extrabold text-slate-600">{(pagination.page - 1) * pagination.limit + 1}</span>–
            <span className="font-extrabold text-slate-600">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{" "}
            <span className="font-extrabold text-slate-600">{pagination.total}</span>
          </p>
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" disabled={pagination.page === 1} onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))} className="h-8 rounded-lg text-[10px] font-extrabold">
              <ChevronLeft className="h-3 w-3" /> Prev
            </Button>
            <div className="flex items-center px-3 text-[10px] font-extrabold text-slate-600">Page {pagination.page} of {pagination.pages}</div>
            <Button variant="outline" size="sm" disabled={pagination.page === pagination.pages} onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))} className="h-8 rounded-lg text-[10px] font-extrabold">
              Next <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      <LogDetailDialog open={detailOpen} onOpenChange={(o) => { setDetailOpen(o); if (!o) setSelectedLog(null); }} log={selectedLog} />
    </div>
  );
}

'use client';
import { useQuery } from '@tanstack/react-query';
import { webhooksApi } from '@/lib/api';
import { formatDate, statusBadgeClass, statusLabel } from '@/lib/utils';
import { RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function WebhooksPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['webhook-logs'],
    queryFn: () => webhooksApi.getLogs({ limit: 50 }),
    refetchInterval: 30000,
  });

  const logs = (data as any)?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Webhook loglar</h1>
          <p className="text-sm text-gray-500 mt-1">Kiruvchi va chiquvchi webhook so&apos;rovlari</p>
        </div>
        <button onClick={() => refetch()} className="btn-secondary">
          <RefreshCw className="w-4 h-4" />
          Yangilash
        </button>
      </div>

      <div className="card !p-0 overflow-hidden">
        <div className="p-5 border-b flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-gray-600">{logs.filter((l: any) => l.status === 'delivered').length} yuborildi</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="text-gray-600">{logs.filter((l: any) => l.status === 'failed').length} xato</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-gray-600">{logs.filter((l: any) => l.status === 'pending').length} kutmoqda</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Yo&apos;nalish</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Hodisa</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Provayder</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Javob kodi</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Urinish</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Sana</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log: any) => (
                <tr key={log.id} className="table-row">
                  <td className="py-3.5 px-4">
                    <span className={`badge ${log.direction === 'inbound' ? 'badge-blue' : 'badge-purple'}`}>
                      {log.direction === 'inbound' ? '↓ Kiruvchi' : '↑ Chiquvchi'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <code className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">{log.eventType}</code>
                  </td>
                  <td className="py-3.5 px-4 text-gray-700">{log.providerName || '—'}</td>
                  <td className="py-3.5 px-4">
                    <span className={statusBadgeClass(log.status)}>{statusLabel(log.status)}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    {log.responseStatus ? (
                      <span className={`font-mono text-xs font-semibold ${log.responseStatus < 300 ? 'text-green-600' : 'text-red-600'}`}>
                        {log.responseStatus}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="py-3.5 px-4 text-gray-500">{log.attemptCount} / {log.maxAttempts}</td>
                  <td className="py-3.5 px-4 text-gray-500 text-xs">{formatDate(log.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {!logs.length && !isLoading && (
            <div className="text-center py-12 text-gray-400">
              <RefreshCw className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm">Webhook log yo&apos;q</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

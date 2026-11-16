import * as React from 'react'
import { Search, User } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { useSaaSStore } from '@/lib/saas-store'

export function AuditLogsView() {
  const { auditLogs, currentUser } = useSaaSStore()
  const [searchTerm, setSearchTerm] = React.useState('')
  const [selectedEntity, setSelectedEntity] = React.useState<string>('all')

  // Access restricted to Super Admin only (Section 14)
  if (currentUser.role !== 'SUPER_ADMIN') {
    return (
      <div className='flex min-h-[50vh] flex-col items-center justify-center p-6 text-center'>
        <h2 className='text-lg font-bold text-destructive'>Access Restricted</h2>
        <p className='text-xs text-muted-foreground mt-1'>
          Section 14: Only Platform Super Admin can view system Audit Logs.
        </p>
      </div>
    )
  }

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.actionType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actorEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesEntity = selectedEntity === 'all' || log.entityType === selectedEntity
    return matchesSearch && matchesEntity
  })

  return (
    <>
      <Header>
        <div className='flex items-center gap-2'>
          <h1 className='font-semibold text-sm'>Platform Governance</h1>
          <Badge variant='default' className='text-xs'>
            Audit Trail
          </Badge>
        </div>
        <div className='ms-auto flex items-center gap-2'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-5 p-4 md:p-6'>
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>System Audit Logs</h2>
            <p className='text-xs text-muted-foreground'>
              Section 14: Immutable log of administrative actions, pricing alterations, status changes, and QR regenerations.
            </p>
          </div>
          <Badge variant='outline' className='text-xs font-mono self-start sm:self-auto'>
            {auditLogs.length} Events Recorded
          </Badge>
        </div>

        {/* Filter bar */}
        <Card className='p-3 bg-card'>
          <div className='flex flex-col sm:flex-row gap-3 items-center justify-between'>
            <div className='relative w-full sm:w-80'>
              <Search className='absolute left-2.5 top-2.5 size-4 text-muted-foreground' />
              <Input
                placeholder='Search action type, actor email, or record ID...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='pl-9 text-xs'
              />
            </div>
            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className='rounded-md border bg-background px-3 py-1.5 text-xs text-foreground'
            >
              <option value='all'>All Entities</option>
              <option value='Product'>Product Actions</option>
              <option value='Merchant'>Merchant Actions</option>
              <option value='Branch'>Branch & QR Actions</option>
              <option value='Category'>Category Actions</option>
              <option value='Excel'>Excel Operations</option>
              <option value='User'>User & Permissions</option>
            </select>
          </div>
        </Card>

        {/* Logs Table */}
        <Card>
          <div className='overflow-x-auto'>
            <table className='w-full text-left text-xs'>
              <thead className='border-b bg-muted/50 font-bold text-muted-foreground uppercase text-[10px] tracking-wider'>
                <tr>
                  <th className='p-3'>Timestamp</th>
                  <th className='p-3'>Actor User</th>
                  <th className='p-3'>Action Type</th>
                  <th className='p-3'>Entity Type</th>
                  <th className='p-3'>Record ID</th>
                  <th className='p-3'>Relevant Change Details</th>
                </tr>
              </thead>
              <tbody className='divide-y'>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className='p-8 text-center text-muted-foreground'>
                      No audit log records match the search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className='hover:bg-muted/30 transition-colors'>
                      <td className='p-3 text-muted-foreground font-mono text-[11px] whitespace-nowrap'>
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className='p-3'>
                        <div className='font-semibold text-foreground flex items-center gap-1.5'>
                          <User className='size-3 text-muted-foreground' /> {log.actorEmail}
                        </div>
                      </td>
                      <td className='p-3'>
                        <Badge
                          variant={
                            log.actionType.includes('DELETE') || log.actionType.includes('SUSPEND')
                              ? 'destructive'
                              : log.actionType.includes('PRICE') || log.actionType.includes('QR')
                              ? 'secondary'
                              : 'outline'
                          }
                          className='font-mono text-[10px]'
                        >
                          {log.actionType}
                        </Badge>
                      </td>
                      <td className='p-3 font-semibold text-foreground'>{log.entityType}</td>
                      <td className='p-3 font-mono text-[11px] text-muted-foreground'>
                        {log.entityId}
                      </td>
                      <td className='p-3'>
                        <div className='max-w-md truncate font-mono text-[11px] bg-muted/60 p-1 rounded'>
                          {JSON.stringify(log.newValues || log.oldValues || {})}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </Main>
    </>
  )
}

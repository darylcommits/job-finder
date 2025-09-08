// src/components/admin/UserManagementTable.jsx
import { useState } from 'react'
import { 
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  TrashIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline'
import { formatDate, timeAgo } from '../../lib/utils'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import ConfirmDialog from '../ui/ConfirmDialog'

export default function UserManagementTable({ 
  users, 
  loading, 
  selectedUsers, 
  onUserSelect, 
  onSelectAll, 
  onUserAction, 
  onViewUser,
  pagination 
}) {
  const [confirmAction, setConfirmAction] = useState(null)

  const handleConfirmAction = () => {
    if (confirmAction) {
      onUserAction(confirmAction.action, confirmAction.userId, confirmAction.data)
      setConfirmAction(null)
    }
  }

  const getUserBadgeVariant = (user) => {
    if (!user.is_active) return 'danger'
    if (user.is_verified) return 'success'
    return 'warning'
  }

  const getUserBadgeText = (user) => {
    if (!user.is_active) return 'Suspended'
    if (user.is_verified) return 'Verified'
    return 'Unverified'
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === users.length && users.length > 0}
                    onChange={onSelectAll}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subscription
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => onUserSelect(user.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {user.avatar_url ? (
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={user.avatar_url}
                            alt={user.full_name}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {user.full_name?.charAt(0) || user.email.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.full_name || 'No name provided'}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="default" size="sm">
                      {user.role.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={getUserBadgeVariant(user)} size="sm">
                      {getUserBadgeText(user)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {user.subscriptions?.[0]?.tier || 'Free'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onViewUser(user)}
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                      
                      {user.is_active ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setConfirmAction({
                            action: 'suspend',
                            userId: user.id,
                            data: { reason: 'Administrative action' }
                          })}
                          className="text-orange-600 hover:text-orange-700"
                        >
                          <ExclamationTriangleIcon className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onUserAction('update', user.id, { is_active: true })}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckIcon className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {!user.is_verified && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onUserAction('verify', user.id)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <ShieldCheckIcon className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setConfirmAction({
                          action: 'delete',
                          userId: user.id
                        })}
                        className="text-red-600 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} results
            </div>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                disabled={pagination.page === 1}
                onClick={() => pagination.setPage(pagination.page - 1)}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pagination.page * pagination.limit >= pagination.total}
                onClick={() => pagination.setPage(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
        title={
          confirmAction?.action === 'delete' ? 'Delete User' :
          confirmAction?.action === 'suspend' ? 'Suspend User' : 'Confirm Action'
        }
        message={
          confirmAction?.action === 'delete' 
            ? 'Are you sure you want to delete this user? This action cannot be undone.'
            : confirmAction?.action === 'suspend'
            ? 'Are you sure you want to suspend this user? They will lose access to the platform.'
            : 'Are you sure you want to perform this action?'
        }
        variant={confirmAction?.action === 'delete' ? 'danger' : 'warning'}
        confirmText={
          confirmAction?.action === 'delete' ? 'Delete' :
          confirmAction?.action === 'suspend' ? 'Suspend' : 'Confirm'
        }
      />
    </>
  )
}

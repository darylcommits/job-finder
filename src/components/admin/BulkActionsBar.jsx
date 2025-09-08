
// src/components/admin/BulkActionsBar.jsx
import { useState } from 'react'
import { 
  CheckIcon,
  XMarkIcon,
  ShieldCheckIcon,
  TrashIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Textarea from '../ui/Textarea'

export default function BulkActionsBar({ selectedCount, onBulkAction, onClear }) {
  const [showModal, setShowModal] = useState(false)
  const [selectedAction, setSelectedAction] = useState('')
  const [actionData, setActionData] = useState({ reason: '', notes: '' })

  const handleAction = (action) => {
    setSelectedAction(action)
    if (action === 'suspend' || action === 'delete') {
      setShowModal(true)
    } else {
      onBulkAction(action)
    }
  }

  const handleConfirm = () => {
    onBulkAction(selectedAction, actionData)
    setShowModal(false)
    setActionData({ reason: '', notes: '' })
    setSelectedAction('')
  }

  return (
    <>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-blue-900">
              {selectedCount} user{selectedCount !== 1 ? 's' : ''} selected
            </span>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction('activate')}
              >
                <CheckIcon className="h-4 w-4 mr-1" />
                Activate
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction('suspend')}
              >
                <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                Suspend
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction('verify')}
              >
                <ShieldCheckIcon className="h-4 w-4 mr-1" />
                Verify
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction('delete')}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClear}
          >
            <XMarkIcon className="h-4 w-4 mr-1" />
            Clear Selection
          </Button>
        </div>
      </div>

      {/* Action Confirmation Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`${selectedAction === 'suspend' ? 'Suspend' : 'Delete'} Users`}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            {selectedAction === 'suspend' 
              ? `Are you sure you want to suspend ${selectedCount} user${selectedCount !== 1 ? 's' : ''}?`
              : `Are you sure you want to delete ${selectedCount} user${selectedCount !== 1 ? 's' : ''}? This action cannot be undone.`
            }
          </p>
          
          <Input
            label="Reason"
            value={actionData.reason}
            onChange={(e) => setActionData(prev => ({ ...prev, reason: e.target.value }))}
            placeholder="Enter reason for this action"
            required
          />
          
          <Textarea
            label="Additional Notes"
            value={actionData.notes}
            onChange={(e) => setActionData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Any additional context..."
            rows={3}
          />
          
          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant={selectedAction === 'delete' ? 'danger' : 'warning'}
              onClick={handleConfirm}
              disabled={!actionData.reason.trim()}
              className="flex-1"
            >
              {selectedAction === 'suspend' ? 'Suspend Users' : 'Delete Users'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
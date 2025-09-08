
// src/components/ui/Alert.jsx
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { cn } from '../../lib/utils'

const alertStyles = {
  success: {
    container: 'bg-green-50 border-green-200',
    icon: 'text-green-400',
    title: 'text-green-800',
    description: 'text-green-700',
    IconComponent: CheckCircleIcon
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200',
    icon: 'text-yellow-400',
    title: 'text-yellow-800',
    description: 'text-yellow-700',
    IconComponent: ExclamationTriangleIcon
  },
  error: {
    container: 'bg-red-50 border-red-200',
    icon: 'text-red-400',
    title: 'text-red-800',
    description: 'text-red-700',
    IconComponent: XCircleIcon
  },
  info: {
    container: 'bg-blue-50 border-blue-200',
    icon: 'text-blue-400',
    title: 'text-blue-800',
    description: 'text-blue-700',
    IconComponent: InformationCircleIcon
  }
}

export default function Alert({ 
  variant = 'info', 
  title, 
  children,
  dismissible = false,
  onDismiss,
  className 
}) {
  const styles = alertStyles[variant]
  const IconComponent = styles.IconComponent

  return (
    <div className={cn('rounded-md border p-4', styles.container, className)}>
      <div className="flex">
        <div className="flex-shrink-0">
          <IconComponent className={cn('h-5 w-5', styles.icon)} />
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={cn('text-sm font-medium', styles.title)}>
              {title}
            </h3>
          )}
          {children && (
            <div className={cn('text-sm', title ? 'mt-2' : '', styles.description)}>
              {children}
            </div>
          )}
        </div>
        {dismissible && (
          <div className="ml-auto pl-3">
            <button
              onClick={onDismiss}
              className={cn(
                'inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2',
                styles.icon,
                'hover:bg-black hover:bg-opacity-10 focus:ring-offset-' + variant + '-50'
              )}
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
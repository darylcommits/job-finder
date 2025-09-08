
// src/components/ui/Card.jsx
import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

const Card = forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('bg-white rounded-lg shadow-sm border border-gray-200', className)}
    {...props}
  >
    {children}
  </div>
))

Card.displayName = 'Card'

const CardHeader = forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('p-6 border-b border-gray-200', className)}
    {...props}
  >
    {children}
  </div>
))

CardHeader.displayName = 'CardHeader'

const CardTitle = forwardRef(({ className, children, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn('text-lg font-semibold text-gray-900', className)}
    {...props}
  >
    {children}
  </h2>
))

CardTitle.displayName = 'CardTitle'

const CardDescription = forwardRef(({ className, children, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('mt-1 text-sm text-gray-600', className)}
    {...props}
  >
    {children}
  </p>
))

CardDescription.displayName = 'CardDescription'

const CardContent = forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('p-6', className)}
    {...props}
  >
    {children}
  </div>
))

CardContent.displayName = 'CardContent'

const CardFooter = forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('p-6 pt-0', className)}
    {...props}
  >
    {children}
  </div>
))

CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }

// src/hooks/usePagination.js
import { useState, useMemo } from 'react'

export function usePagination({ 
  totalItems, 
  itemsPerPage = 10, 
  initialPage = 1,
  siblingCount = 1 
}) {
  const [currentPage, setCurrentPage] = useState(initialPage)

  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const paginationRange = useMemo(() => {
    const totalPageNumbers = siblingCount + 5 // 2 * siblingCount + 3 (first, last, current)

    if (totalPageNumbers >= totalPages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1)
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages)

    const shouldShowLeftDots = leftSiblingIndex > 2
    const shouldShowRightDots = rightSiblingIndex < totalPages - 2

    const firstPageIndex = 1
    const lastPageIndex = totalPages

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount
      const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1)
      return [...leftRange, '...', totalPages]
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount
      const rightRange = Array.from(
        { length: rightItemCount },
        (_, i) => totalPages - rightItemCount + i + 1
      )
      return [firstPageIndex, '...', ...rightRange]
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = Array.from(
        { length: rightSiblingIndex - leftSiblingIndex + 1 },
        (_, i) => leftSiblingIndex + i
      )
      return [firstPageIndex, '...', ...middleRange, '...', lastPageIndex]
    }

    return []
  }, [totalItems, itemsPerPage, siblingCount, currentPage, totalPages])

  const goToPage = (page) => {
    const pageNumber = Math.max(1, Math.min(page, totalPages))
    setCurrentPage(pageNumber)
  }

  const goToNext = () => {
    goToPage(currentPage + 1)
  }

  const goToPrevious = () => {
    goToPage(currentPage - 1)
  }

  const goToFirst = () => {
    goToPage(1)
  }

  const goToLast = () => {
    goToPage(totalPages)
  }

  return {
    currentPage,
    totalPages,
    paginationRange,
    goToPage,
    goToNext,
    goToPrevious,
    goToFirst,
    goToLast,
    hasNext: currentPage < totalPages,
    hasPrevious: currentPage > 1,
    isFirst: currentPage === 1,
    isLast: currentPage === totalPages
  }
}
/**
 * ORIZON Pagination Component
 *
 * A pagination component following the ORIZON design system
 * with cosmic styling and smooth animations.
 *
 * Features:
 * - Page number buttons
 * - Previous/Next navigation
 * - First/Last page buttons
 * - Ellipsis for large page counts
 * - Active page indicator
 * - Disabled states
 */

'use client';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  showFirstLast = true,
  maxVisible = 5,
  className = '',
  ...props
}) {
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && onPageChange) {
      onPageChange(page);
    }
  };

  // Calculate visible page numbers
  const getPageNumbers = () => {
    const pages = [];
    const half = Math.floor(maxVisible / 2);

    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    // Add first page and ellipsis if needed
    if (start > 1) {
      pages.push(1);
      if (start > 2) {
        pages.push('ellipsis-start');
      }
    }

    // Add visible page numbers
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // Add last page and ellipsis if needed
    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push('ellipsis-end');
      }
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav
      aria-label="Pagination"
      className={`flex items-center gap-2 ${className}`}
      {...props}
    >
      {/* First Page Button */}
      {showFirstLast && (
        <button
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          className={`
            p-2 rounded-lg
            font-secondary text-sm
            transition-all duration-200 ease-out
            ${
              currentPage === 1
                ? 'text-text-muted-dark cursor-not-allowed opacity-50'
                : 'text-primary hover:bg-primary/10 hover:shadow-glow-primary/50'
            }
          `}
          aria-label="First page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
      )}

      {/* Previous Button */}
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`
          p-2 rounded-lg
          font-secondary text-sm
          transition-all duration-200 ease-out
          ${
            currentPage === 1
              ? 'text-text-muted-dark cursor-not-allowed opacity-50'
              : 'text-primary hover:bg-primary/10 hover:shadow-glow-primary/50'
          }
        `}
        aria-label="Previous page"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Page Numbers */}
      {pageNumbers.map((page, index) => {
        if (typeof page === 'string' && page.startsWith('ellipsis')) {
          return (
            <span
              key={page}
              className="px-2 text-text-muted-dark"
              aria-hidden="true"
            >
              ...
            </span>
          );
        }

        return (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`
              min-w-[36px] h-9 px-3 rounded-lg
              font-secondary text-sm font-medium
              transition-all duration-200 ease-out
              ${
                currentPage === page
                  ? 'bg-primary text-black shadow-glow-primary'
                  : 'text-white hover:bg-surface-hover-dark hover:text-primary'
              }
            `}
            aria-label={`Page ${page}`}
            aria-current={currentPage === page ? 'page' : undefined}
          >
            {page}
          </button>
        );
      })}

      {/* Next Button */}
      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`
          p-2 rounded-lg
          font-secondary text-sm
          transition-all duration-200 ease-out
          ${
            currentPage === totalPages
              ? 'text-text-muted-dark cursor-not-allowed opacity-50'
              : 'text-primary hover:bg-primary/10 hover:shadow-glow-primary/50'
          }
        `}
        aria-label="Next page"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Last Page Button */}
      {showFirstLast && (
        <button
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={`
            p-2 rounded-lg
            font-secondary text-sm
            transition-all duration-200 ease-out
            ${
              currentPage === totalPages
                ? 'text-text-muted-dark cursor-not-allowed opacity-50'
                : 'text-primary hover:bg-primary/10 hover:shadow-glow-primary/50'
            }
          `}
          aria-label="Last page"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      )}
    </nav>
  );
}

/**
 * Simple Pagination Component
 * Just Previous/Next buttons without page numbers
 */
export function SimplePagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  className = '',
  ...props
}) {
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && onPageChange) {
      onPageChange(page);
    }
  };

  return (
    <nav
      aria-label="Pagination"
      className={`flex items-center justify-between gap-4 ${className}`}
      {...props}
    >
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`
          px-4 py-2 rounded-lg
          font-secondary text-sm font-medium
          transition-all duration-200 ease-out
          ${
            currentPage === 1
              ? 'text-text-muted-dark cursor-not-allowed opacity-50'
              : 'text-primary hover:bg-primary/10 hover:shadow-glow-primary/50'
          }
        `}
      >
        Previous
      </button>

      <span className="font-secondary text-sm text-text-secondary-dark">
        Page {currentPage} of {totalPages}
      </span>

      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`
          px-4 py-2 rounded-lg
          font-secondary text-sm font-medium
          transition-all duration-200 ease-out
          ${
            currentPage === totalPages
              ? 'text-text-muted-dark cursor-not-allowed opacity-50'
              : 'text-primary hover:bg-primary/10 hover:shadow-glow-primary/50'
          }
        `}
      >
        Next
      </button>
    </nav>
  );
}

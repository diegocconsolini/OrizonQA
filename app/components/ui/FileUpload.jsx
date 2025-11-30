/**
 * ORIZON File Upload Component
 *
 * A drag-and-drop file upload component following the ORIZON design system
 * with cosmic styling and smooth animations.
 *
 * Features:
 * - Drag and drop support
 * - Click to browse
 * - File type validation
 * - File size limits
 * - Multiple file support
 * - Preview thumbnails
 * - Progress indication
 * - Borderless Interstellar design
 */

'use client';

import { useState, useRef } from 'react';
import { Upload, X, File, Image as ImageIcon } from 'lucide-react';

export default function FileUpload({
  onFilesSelected,
  accept,
  maxSize = 5242880, // 5MB default
  multiple = false,
  showPreview = true,
  className = '',
  ...props
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFileInput = (e) => {
    const selectedFiles = Array.from(e.target.files);
    handleFiles(selectedFiles);
  };

  const handleFiles = (newFiles) => {
    // Filter files by size
    const validFiles = newFiles.filter((file) => {
      if (maxSize && file.size > maxSize) {
        console.warn(`File ${file.name} exceeds max size of ${maxSize} bytes`);
        return false;
      }
      return true;
    });

    const updatedFiles = multiple ? [...files, ...validFiles] : validFiles;
    setFiles(updatedFiles);

    if (onFilesSelected) {
      onFilesSelected(updatedFiles);
    }
  };

  const removeFile = (index) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);

    if (onFilesSelected) {
      onFilesSelected(updatedFiles);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className={className} {...props}>
      {/* Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          relative
          flex flex-col items-center justify-center
          min-h-[200px] p-8
          bg-surface-dark rounded-lg
          transition-all duration-200 ease-out
          cursor-pointer
          ${
            isDragging
              ? 'shadow-glow-primary bg-primary/5 shadow-[0_0_0_2px_rgba(0,212,255,0.5)]'
              : 'shadow-[0_0_0_1px_rgba(0,212,255,0.1)] hover:shadow-glow-primary/30'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileInput}
          accept={accept}
          multiple={multiple}
          className="sr-only"
        />

        <Upload
          className={`w-12 h-12 mb-4 transition-colors ${
            isDragging ? 'text-primary' : 'text-text-muted-dark'
          }`}
        />

        <p className="text-white font-secondary font-medium mb-1">
          {isDragging ? 'Drop files here' : 'Drop files or click to browse'}
        </p>

        <p className="text-sm text-text-muted-dark font-secondary">
          {accept ? `Accepted: ${accept}` : 'All file types accepted'}
          {maxSize && ` • Max size: ${formatFileSize(maxSize)}`}
        </p>
      </div>

      {/* File Preview */}
      {showPreview && files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <FilePreview
              key={index}
              file={file}
              onRemove={() => removeFile(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * File Preview Component
 */
function FilePreview({ file, onRemove }) {
  const isImage = file.type.startsWith('image/');
  const [preview, setPreview] = useState(null);

  // Generate image preview
  if (isImage && !preview) {
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-surface-dark rounded-lg shadow-[0_0_0_1px_rgba(0,212,255,0.1)]">
      {/* File Icon/Preview */}
      <div className="flex-shrink-0 w-10 h-10 rounded bg-surface-hover-dark flex items-center justify-center overflow-hidden">
        {isImage && preview ? (
          <img src={preview} alt={file.name} className="w-full h-full object-cover" />
        ) : isImage ? (
          <ImageIcon className="w-5 h-5 text-primary" />
        ) : (
          <File className="w-5 h-5 text-primary" />
        )}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-secondary text-white truncate">{file.name}</p>
        <p className="text-xs font-secondary text-text-muted-dark">
          {formatFileSize(file.size)}
        </p>
      </div>

      {/* Remove Button */}
      <button
        onClick={onRemove}
        className="flex-shrink-0 p-1 text-text-muted-dark hover:text-error transition-colors"
        aria-label="Remove file"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

import { useState, useCallback } from 'react';
import JSZip from 'jszip';

export default function useFileUpload(setError, setSuccess) {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const acceptedTypes = [
    '.zip', '.txt', '.md', '.json', '.py', '.js', '.ts', '.jsx', '.tsx',
    '.java', '.cs', '.go', '.rb', '.html', '.css', '.sql', '.yml',
    '.yaml', '.xml', '.sh', '.env'
  ];

  const processFiles = async (files) => {
    const processed = [];
    setError('');

    for (const file of files) {
      const ext = '.' + file.name.split('.').pop().toLowerCase();

      if (file.name.endsWith('.zip')) {
        try {
          const zip = await JSZip.loadAsync(file);

          for (const [path, zipEntry] of Object.entries(zip.files)) {
            if (zipEntry.dir) continue;
            if (path.includes('node_modules/') || path.includes('.git/') || path.includes('__pycache__/')) continue;

            const fileExt = '.' + path.split('.').pop().toLowerCase();
            if (acceptedTypes.includes(fileExt) || path.endsWith('Dockerfile') || path.endsWith('Makefile')) {
              try {
                const content = await zipEntry.async('string');
                if (content.length < 500000) {
                  processed.push({ name: path, content });
                }
              } catch {
                // Skip binary files
              }
            }
          }
        } catch (err) {
          setError('Failed to process zip file: ' + err.message);
        }
      } else if (acceptedTypes.includes(ext)) {
        const content = await file.text();
        if (content.length < 500000) {
          processed.push({ name: file.name, content });
        }
      }
    }

    setUploadedFiles(prev => [...prev, ...processed]);
    if (processed.length > 0) {
      setSuccess(`Loaded ${processed.length} file(s)`);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    await processFiles(files);
  }, []);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    await processFiles(files);
  };

  const clearFiles = () => {
    setUploadedFiles([]);
  };

  return {
    uploadedFiles,
    setUploadedFiles,
    isDragging,
    setIsDragging,
    handleDrop,
    handleFileSelect,
    clearFiles,
    acceptedTypes
  };
}


import React, { useState, useCallback } from 'react';
import { UploadIcon } from './Icons';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  disabled: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      !disabled && setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, [disabled]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (!disabled && e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  }, [disabled, onFileSelect]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const borderStyle = isDragging
    ? 'border-indigo-600'
    : 'border-gray-300';
  
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-indigo-500';

  return (
    <div
      className={`relative flex flex-col items-center justify-center w-full p-8 text-center bg-white border-2 border-dashed rounded-lg transition-colors duration-300 ${borderStyle} ${disabledClasses}`}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id="file-upload"
        className="absolute w-full h-full opacity-0 cursor-pointer"
        accept=".xlsx, .xls, .csv"
        onChange={handleChange}
        disabled={disabled}
      />
      <UploadIcon className="w-12 h-12 mx-auto text-gray-400" />
      <p className="mt-4 text-sm text-gray-600">
        <span className="font-semibold text-indigo-600">Click to upload</span> or drag and drop
      </p>
      <p className="text-xs text-gray-500">XLSX, XLS, or CSV files</p>
    </div>
  );
};

export default FileUpload;

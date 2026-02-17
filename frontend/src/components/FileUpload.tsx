import { cn } from '../utils';
import { Upload, X, FileText } from 'lucide-react';
import { useState, useRef } from 'react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number; // in MB
  value?: File | null;
  label?: string;
  helperText?: string;
}

export function FileUpload({
  onFileSelect,
  accept = '.pdf,.jpg,.jpeg,.png',
  maxSize = 10,
  value,
  label,
  helperText,
}: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    setError(null);

    if (maxSize && file.size > maxSize * 1024 * 1024) {
      setError(`Le fichier doit faire moins de ${maxSize} Mo`);
      return false;
    }

    const acceptedTypes = accept.split(',').map((t) => t.trim());
    const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    
    if (!acceptedTypes.some((type) => 
      file.type.includes(type.replace('.', '')) || 
      fileExtension === type
    )) {
      setError(`Types acceptés: ${accept}`);
      return false;
    }

    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      onFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && validateFile(file)) {
      onFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer',
          'transition-colors duration-200',
          dragOver && 'border-quebec-blue bg-blue-50',
          !dragOver && !error && 'border-gray-300 hover:border-gray-400',
          error && 'border-accent-error bg-red-50'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />
        
        {value ? (
          <div className="flex items-center justify-center gap-3">
            <FileText className="w-8 h-8 text-quebec-blue" />
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">{value.name}</p>
              <p className="text-xs text-gray-500">
                {(value.size / 1024 / 1024).toFixed(2)} Mo
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFileSelect(null as unknown as File);
              }}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">
              <span className="font-medium text-quebec-blue">Clique</span> ou{' '}
              <span className="font-medium text-quebec-blue">glisse</span> ton fichier ici
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {accept.replace(/,/g, ', ')} (max {maxSize} Mo)
            </p>
          </>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-accent-error">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
}

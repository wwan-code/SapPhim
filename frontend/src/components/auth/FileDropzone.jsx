/**
 * FileDropzone Component
 * Drag-and-drop zone với file picker cho import auth files
 */

import { useRef, useState, useCallback } from 'react';
import { FiUploadCloud, FiFolderPlus } from 'react-icons/fi';
import { SUPPORTED_FORMATS } from '@/utils/authFileParsers';
import '@/assets/scss/components/auth/_file-dropzone.scss';

const FileDropzone = ({ onFilesSelected, disabled = false, maxFiles = 1 }) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const acceptedFormats = SUPPORTED_FORMATS.join(',');
  const acceptAttribute = '.json,.txt,.docx,application/json,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set to false if we're leaving the dropzone itself
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      const validFiles = files.filter((file) => {
        const ext = `.${file.name.split('.').pop().toLowerCase()}`;
        return SUPPORTED_FORMATS.includes(ext);
      });

      if (validFiles.length > 1) {
        alert(`Chỉ được phép chọn 1 file duy nhất`);
        return;
      }

      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      } else {
        alert(`Chỉ chấp nhận các file: ${SUPPORTED_FORMATS.join(', ')}`);
      }
    },
    [disabled, onFilesSelected, maxFiles]
  );

  const handleFileInputChange = useCallback(
    (e) => {
      const files = Array.from(e.target.files);
      
      if (files.length > 1) {
        alert(`Chỉ được phép chọn 1 file duy nhất`);
        e.target.value = '';
        return;
      }

      if (files.length > 0) {
        onFilesSelected(files);
      }
      e.target.value = '';
    },
    [onFilesSelected, maxFiles]
  );

  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  return (
    <div
      className={`file-dropzone ${isDragging ? 'file-dropzone--dragging' : ''} ${
        disabled ? 'file-dropzone--disabled' : ''
      }`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label="Kéo thả hoặc click để chọn file"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptAttribute}
        onChange={handleFileInputChange}
        className="file-dropzone__input"
        disabled={disabled}
        aria-hidden="true"
      />

      <div className="file-dropzone__content">
        <div className="file-dropzone__icon">
          <FiUploadCloud />
        </div>

        <div className="file-dropzone__text">
          <p className="file-dropzone__title">
            {isDragging ? 'Thả file vào đây' : 'Kéo thả file hoặc click để chọn'}
          </p>
          <p className="file-dropzone__subtitle">
            Hỗ trợ: {SUPPORTED_FORMATS.join(', ')} (chỉ 1 file)
          </p>
        </div>

        <button
          type="button"
          className="file-dropzone__button"
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          disabled={disabled}
        >
          <FiFolderPlus />
          Chọn file
        </button>
      </div>
    </div>
  );
};

export default FileDropzone;

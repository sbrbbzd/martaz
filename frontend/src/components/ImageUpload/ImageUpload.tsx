import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage, faTimes } from '@fortawesome/free-solid-svg-icons';
import './ImageUpload.scss';

interface ImageUploadProps {
  onImagesSelected: (files: File[]) => void;
  initialImages?: string[];
  maxFiles?: number;
  maxSizeInMB?: number;
  allowedTypes?: string[];
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onImagesSelected,
  initialImages = [],
  maxFiles = 10,
  maxSizeInMB = 5,
  allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  className = '',
}) => {
  const [images, setImages] = useState<string[]>(initialImages || []);
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const imageServerUrl = import.meta.env.VITE_IMAGE_SERVER_URL || 'http://localhost:3001/api/images';

  useEffect(() => {
    if (initialImages && initialImages.length > 0) {
      setImages(initialImages);
    }
  }, [initialImages]);

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }

    const selectedFiles = Array.from(e.target.files);
    const newErrors: string[] = [];
    const validFiles: File[] = [];
    const newImageUrls: string[] = [];

    // Validate files
    selectedFiles.forEach((file) => {
      // Check file type
      if (!allowedTypes.includes(file.type)) {
        newErrors.push(`${file.name}: Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
        return;
      }

      // Check file size
      if (file.size > maxSizeInMB * 1024 * 1024) {
        newErrors.push(`${file.name}: File too large. Maximum size: ${maxSizeInMB}MB`);
        return;
      }

      // Check maximum number of files
      if (images.length + validFiles.length >= maxFiles) {
        newErrors.push(`Maximum number of files (${maxFiles}) exceeded`);
        return;
      }

      // Create URL for preview
      const imageUrl = URL.createObjectURL(file);
      newImageUrls.push(imageUrl);
      validFiles.push(file);
    });

    if (newErrors.length > 0) {
      setErrors(newErrors);
    }

    if (validFiles.length > 0) {
      setFiles((prevFiles) => [...prevFiles, ...validFiles]);
      setImages((prevImages) => [...prevImages, ...newImageUrls]);
      onImagesSelected([...files, ...validFiles]);
    }

    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    // Create a new array without the removed image
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);

    // Also remove from files array if it exists
    if (index < files.length) {
      const newFiles = [...files];
      newFiles.splice(index, 1);
      setFiles(newFiles);
      onImagesSelected(newFiles);
    }
  };

  return (
    <div className={`image-upload ${className}`}>
      <div className="image-upload__container">
        {images.length > 0 && (
          <div className="image-upload__preview">
            {images.map((image, index) => (
              <div key={index} className="image-upload__preview-item">
                <img src={image} alt={`Preview ${index}`} />
                <button
                  type="button"
                  className="image-upload__remove-btn"
                  onClick={() => removeImage(index)}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
            ))}
          </div>
        )}

        {images.length < maxFiles && (
          <div className="image-upload__button-container">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept={allowedTypes.join(',')}
              multiple={maxFiles > 1}
              className="image-upload__input"
            />
            <button
              type="button"
              onClick={handleClick}
              className="image-upload__button"
            >
              <FontAwesomeIcon icon={faImage} />
              <span>Upload Images</span>
            </button>
          </div>
        )}
      </div>

      {errors.length > 0 && (
        <div className="image-upload__errors">
          {errors.map((error, index) => (
            <div key={index} className="image-upload__error">
              {error}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUpload; 
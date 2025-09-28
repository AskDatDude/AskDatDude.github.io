/**
 * Image Format Converter Module
 * Canvas-based image conversion with multi-file support and ZIP packaging
 */

import { globalAlert } from './securityUtils.js';

export function initImageConverter() {
    const converterContainer = document.getElementById('image-converter-container');
    if (!converterContainer) return;

    new ImageConverter();
}

class ImageConverter {
    constructor() {
        this.files = [];
        this.convertedImages = [];
        this.supportedFormats = ['image/png', 'image/jpeg', 'image/webp'];
        
        this.init();
        this.detectFormatSupport();
    }

    init() {
        // Get DOM elements
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.folderInput = document.getElementById('folderInput');
        this.controlsSection = document.getElementById('controlsSection');
        this.previewSection = document.getElementById('previewSection');
        this.progressSection = document.getElementById('progressSection');
        this.outputFormat = document.getElementById('outputFormat');
        this.compressionMethod = document.getElementById('compressionMethod');
        this.qualitySlider = document.getElementById('qualitySlider');
        this.qualityValue = document.getElementById('qualityValue');
        this.convertBtn = document.getElementById('convertBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.previewGrid = document.getElementById('previewGrid');
        this.resizeWidth = document.getElementById('resizeWidth');
        this.resizeHeight = document.getElementById('resizeHeight');
        this.maintainRatio = document.getElementById('maintainRatio');
        
        // Progress bar elements
        this.progressText = document.getElementById('progressText');
        this.timeRemaining = document.getElementById('timeRemaining');
        this.progressBar = document.getElementById('progressBar');
        this.progressFill = document.getElementById('progressFill');
        this.progressPercentage = document.getElementById('progressPercentage');

        // Validate critical elements
        if (!this.progressSection) {
            console.warn('Progress section element not found - progress tracking will be disabled');
        }

        this.setupEventListeners();
        this.enhanceResizeInputs();
        this.updateQualityDisplay(); // Initialize quality display
        this.updateCompressionOptions(); // Initialize compression options
    }

    enhanceResizeInputs() {
        // Wrap resize inputs with custom spinners
        const resizeInputs = document.querySelectorAll('#resizeWidth, #resizeHeight');
        resizeInputs.forEach(input => {
            if (input.parentNode.classList.contains('resize-input-wrapper')) return;
            
            const wrapper = document.createElement('div');
            wrapper.className = 'resize-input-wrapper';
            input.parentNode.insertBefore(wrapper, input);
            wrapper.appendChild(input);

            const spinner = document.createElement('div');
            spinner.className = 'custom-spinner';
            spinner.innerHTML = `
                <button type="button" class="spinner-btn spinner-up">▲</button>
                <button type="button" class="spinner-btn spinner-down">▼</button>
            `;
            wrapper.appendChild(spinner);

            // Add spinner functionality
            const upBtn = spinner.querySelector('.spinner-up');
            const downBtn = spinner.querySelector('.spinner-down');
            
            upBtn.addEventListener('click', () => this.adjustInput(input, 1));
            downBtn.addEventListener('click', () => this.adjustInput(input, -1));
        });
    }

    adjustInput(input, delta) {
        const currentValue = parseInt(input.value) || 0;
        const step = delta > 0 ? 10 : -10;
        const newValue = Math.max(0, currentValue + step);
        input.value = newValue || '';
        
        // Trigger ratio maintenance if enabled
        if (input.id === 'resizeWidth') {
            this.handleResizeInput('width');
        } else if (input.id === 'resizeHeight') {
            this.handleResizeInput('height');
        }
    }

    setupEventListeners() {
        // Upload area events
        this.uploadArea.addEventListener('click', (e) => {
            // Check if Ctrl/Cmd key is pressed for folder selection
            if (e.ctrlKey || e.metaKey) {
                this.folderInput.click();
            } else {
                this.fileInput.click();
            }
        });
        this.uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        this.uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        this.uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        this.folderInput.addEventListener('change', this.handleFolderSelect.bind(this));

        // Controls
        this.qualitySlider.addEventListener('input', this.updateQualityDisplay.bind(this));
        this.outputFormat.addEventListener('change', this.updateQualityDisplay.bind(this));
        this.compressionMethod.addEventListener('change', this.updateCompressionOptions.bind(this));
        this.convertBtn.addEventListener('click', this.convertImages.bind(this));
        this.clearBtn.addEventListener('click', this.clearAll.bind(this));

        // Resize ratio maintenance
        this.resizeWidth.addEventListener('input', this.handleResizeInput.bind(this, 'width'));
        this.resizeHeight.addEventListener('input', this.handleResizeInput.bind(this, 'height'));
    }

    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('drag-over');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('drag-over');
    }

    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('drag-over');
        
        const files = [];
        const items = e.dataTransfer.items;
        
        if (items) {
            // Handle both files and directories
            const promises = [];
            
            for (let i = 0; i < items.length; i++) {
                const item = items[i].webkitGetAsEntry();
                if (item) {
                    promises.push(this.traverseFileTree(item));
                }
            }
            
            Promise.all(promises).then(results => {
                const allFiles = results.flat().filter(file => 
                    file.type && file.type.startsWith('image/'));
                this.processFiles(allFiles);
            });
        } else {
            // Fallback for older browsers
            const droppedFiles = Array.from(e.dataTransfer.files).filter(file => 
                file.type.startsWith('image/'));
            this.processFiles(droppedFiles);
        }
    }

    // Recursively traverse directory structure
    traverseFileTree(item) {
        return new Promise((resolve) => {
            if (item.isFile) {
                item.file(resolve);
            } else if (item.isDirectory) {
                const dirReader = item.createReader();
                const allFiles = [];
                
                const readEntries = () => {
                    dirReader.readEntries((entries) => {
                        if (entries.length === 0) {
                            resolve(allFiles);
                        } else {
                            const promises = entries.map(entry => this.traverseFileTree(entry));
                            Promise.all(promises).then(results => {
                                allFiles.push(...results.flat());
                                readEntries();
                            });
                        }
                    });
                };
                readEntries();
            }
        });
    }

    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.processFiles(files);
    }

    handleFolderSelect(e) {
        const files = Array.from(e.target.files).filter(file => 
            file.type && file.type.startsWith('image/'));
        this.processFiles(files);
    }

    processFiles(files) {
        if (files.length === 0) return;
        
        // Enhanced validation - support more image types
        const imageFiles = files.filter(file => {
            if (file.type && file.type.startsWith('image/')) {
                return true;
            }
            // Also check by extension for formats that might not have proper MIME types
            return /\.(gif|svg|bmp|avif|ico)$/i.test(file.name);
        });
        
        // Check for HEIC files by extension (they often don't have proper MIME types)
        const heicFiles = files.filter(file => /\.(heic|heif)$/i.test(file.name));
        
        // Check for potentially problematic formats
        const gifFiles = imageFiles.filter(file => 
            file.type === 'image/gif' || /\.gif$/i.test(file.name));
        const svgFiles = imageFiles.filter(file => 
            file.type === 'image/svg+xml' || /\.svg$/i.test(file.name));
        if (heicFiles.length > 0) {
            this.showHEICGuidance(heicFiles.length);
            // Don't process HEIC files, just show guidance
        }
        
        // Inform about special format handling
        if (gifFiles.length > 0) {
            globalAlert.showSuccess(`${gifFiles.length} GIF file(s) detected - only first frame will be converted (animation lost).`);
        }
        
        if (svgFiles.length > 0) {
            globalAlert.showSuccess(`${svgFiles.length} SVG file(s) detected - will be rasterized to chosen output format.`);
        }
        
        if (imageFiles.length === 0) {
            if (heicFiles.length > 0) {
                globalAlert.showError(`Found ${heicFiles.length} HEIC files. Please convert them to JPEG first using the guidance above.`);
            } else {
                globalAlert.showError('No valid image files found. Please select image files only.');
            }
            return;
        }
        
        // Security: Check for oversized files that could cause performance issues
        const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB limit per file
        const oversizedFiles = imageFiles.filter(file => file.size > MAX_FILE_SIZE);
        
        if (oversizedFiles.length > 0) {
            globalAlert.showError(`${oversizedFiles.length} files exceed 50MB limit and were skipped for performance reasons.`);
        }
        
        const validFiles = imageFiles.filter(file => file.size <= MAX_FILE_SIZE);
        
        if (validFiles.length === 0) {
            globalAlert.showError('No valid files after filtering. Files must be under 50MB.');
            return;
        }
        
        if (imageFiles.length !== files.length) {
            const ignoredCount = files.length - imageFiles.length;
            globalAlert.showError(`${ignoredCount} non-image files were ignored. Only standard image formats are supported.`);
        }
        
        this.files = validFiles;
        this.controlsSection.style.display = 'block';
        this.updateFileCount();
        
        if (validFiles.length > 0) {
            globalAlert.showSuccess(`${validFiles.length} image files loaded successfully`);
        }
    }

    showHEICGuidance(heicCount) {
        const heicHelp = document.getElementById('heicHelp');
        if (heicHelp) {
            const title = heicHelp.querySelector('h4');
            if (title) {
                title.textContent = `${heicCount} HEIC/HEIF File${heicCount > 1 ? 's' : ''} Detected`;
            }
            heicHelp.style.display = 'block';
            
            // Smooth scroll to the guidance
            heicHelp.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    updateFileCount() {
        const count = this.files.length;
        const uploadContent = this.uploadArea.querySelector('.upload-content p');
        if (count === 0) {
            uploadContent.innerHTML = 'Select multiple images or drag entire folders for batch conversion<br><small>Hold Ctrl/Cmd and click to select folders</small>';
        } else {
            uploadContent.textContent = `${count} image${count > 1 ? 's' : ''} selected from ${this.getUniqueDirectoryCount()} location${this.getUniqueDirectoryCount() > 1 ? 's' : ''}`;
        }
    }

    getUniqueDirectoryCount() {
        const directories = new Set();
        this.files.forEach(file => {
            const path = file.webkitRelativePath || file.name;
            const dir = path.includes('/') ? path.substring(0, path.lastIndexOf('/')) : 'root';
            directories.add(dir);
        });
        return directories.size;
    }

    updateQualityDisplay() {
        const quality = Math.round(this.qualitySlider.value * 100);
        const format = this.outputFormat.value;
        const compressionMethod = this.compressionMethod.value;
        const qualityGroup = this.qualitySlider.closest('.control-group');
        
        if (format === 'image/png' || compressionMethod === 'lossless') {
            qualityGroup.style.opacity = '0.5';
            this.qualityValue.textContent = `${quality}% (Lossless mode)`;
        } else {
            qualityGroup.style.opacity = '1';
            this.qualityValue.textContent = `${quality}%`;
        }
    }

    updateCompressionOptions() {
        const method = this.compressionMethod.value;
        const format = this.outputFormat.value;
        
        // Update quality slider based on compression method
        switch(method) {
            case 'lossless':
                this.qualitySlider.disabled = true;
                break;
            case 'aggressive':
                if (this.qualitySlider.value > 0.6) {
                    this.qualitySlider.value = 0.6;
                }
                this.qualitySlider.disabled = false;
                break;
            case 'optimized':
                if (this.qualitySlider.value < 0.8) {
                    this.qualitySlider.value = 0.8;
                }
                this.qualitySlider.disabled = false;
                break;
            default:
                this.qualitySlider.disabled = false;
                break;
        }
        
        this.updateQualityDisplay();
    }

    handleResizeInput(dimension) {
        if (!this.maintainRatio.checked || this.files.length === 0) return;

        // Get first image to calculate ratio
        const firstFile = this.files[0];
        if (!firstFile) return;

        const img = new Image();
        img.onload = () => {
            const ratio = img.width / img.height;
            
            if (dimension === 'width' && this.resizeWidth.value) {
                this.resizeHeight.value = Math.round(this.resizeWidth.value / ratio);
            } else if (dimension === 'height' && this.resizeHeight.value) {
                this.resizeWidth.value = Math.round(this.resizeHeight.value * ratio);
            }
            
            // Clean up blob URL to prevent memory leak
            URL.revokeObjectURL(img.src);
        };
        
        img.onerror = () => {
            URL.revokeObjectURL(img.src);
        };
        
        img.src = URL.createObjectURL(firstFile);
    }

    // Progress tracking methods
    estimateProcessingTime(fileCount, avgFileSize = 500000) {
        // Base time estimation in milliseconds per file
        // Factors: file size, compression method, output format
        const baseTimePerFile = 150; // Base 150ms per file
        
        const compressionMultiplier = {
            'lossless': 1.5,
            'optimized': 1.2,
            'standard': 1.0,
            'aggressive': 0.8
        };
        
        const formatMultiplier = {
            'image/webp': 1.3,
            'image/avif': 2.0,
            'image/png': 1.1,
            'image/jpeg': 1.0
        };
        
        const sizeMultiplier = Math.max(0.5, Math.min(2.0, avgFileSize / 500000));
        
        const compressionFactor = compressionMultiplier[this.compressionMethod.value] || 1.0;
        const formatFactor = formatMultiplier[this.outputFormat.value] || 1.0;
        
        return fileCount * baseTimePerFile * compressionFactor * formatFactor * sizeMultiplier;
    }

    shouldShowProgressBar(fileCount, estimatedTime) {
        // Show progress bar if estimated time > 3 seconds OR file count > 5
        return estimatedTime > 3000 || fileCount > 5;
    }

    showProgressBar(fileCount, estimatedTime) {
        if (!this.progressSection) {
            console.warn('Progress section not found in DOM');
            return;
        }
        
        this.progressSection.style.display = 'block';
        
        if (this.progressText) this.progressText.textContent = `0 / ${fileCount} files`;
        if (this.timeRemaining) this.timeRemaining.textContent = this.formatTime(estimatedTime);
        if (this.progressFill) this.progressFill.style.width = '0%';
        if (this.progressPercentage) this.progressPercentage.textContent = '0%';
        
        // Store initial values for calculations
        this.totalFiles = fileCount;
        this.completedFiles = 0;
        this.startTime = Date.now();
        this.estimatedTotalTime = estimatedTime;
    }

    hideProgressBar() {
        if (this.progressSection) {
            this.progressSection.style.display = 'none';
        }
    }

    updateProgress(completedFiles, totalFiles) {
        this.completedFiles = completedFiles;
        const percentage = Math.round((completedFiles / totalFiles) * 100);
        
        // Update progress bar with safety checks
        if (this.progressFill) {
            this.progressFill.style.width = `${percentage}%`;
        }
        if (this.progressPercentage) {
            this.progressPercentage.textContent = `${percentage}%`;
        }
        if (this.progressText) {
            this.progressText.textContent = `${completedFiles} / ${totalFiles} files`;
        }
        
        // Calculate and update remaining time
        if (completedFiles > 0 && this.timeRemaining) {
            const elapsedTime = Date.now() - this.startTime;
            const avgTimePerFile = elapsedTime / completedFiles;
            const remainingFiles = totalFiles - completedFiles;
            const estimatedRemainingTime = remainingFiles * avgTimePerFile;
            
            if (remainingFiles > 0) {
                this.timeRemaining.textContent = `${this.formatTime(estimatedRemainingTime)} remaining`;
            } else {
                this.timeRemaining.textContent = 'Complete!';
            }
        }
    }

    async convertImages() {
        if (this.files.length === 0) return;

        // Calculate estimated processing time
        const avgFileSize = this.files.reduce((sum, file) => sum + file.size, 0) / this.files.length;
        const estimatedTime = this.estimateProcessingTime(this.files.length, avgFileSize);
        
        // Show progress bar if needed
        const showProgress = this.shouldShowProgressBar(this.files.length, estimatedTime) && this.progressSection;
        
        if (showProgress) {
            this.showProgressBar(this.files.length, estimatedTime);
        }

        this.convertBtn.disabled = true;
        this.convertBtn.textContent = 'Converting...';
        this.convertedImages = [];

        // Start timing and collect original stats
        const startTime = Date.now();
        const originalStats = {
            totalSize: this.files.reduce((sum, file) => sum + file.size, 0),
            fileCount: this.files.length,
            formats: this.getFormatDistribution(this.files)
        };

        try {
            // Process images with optimized batching for better performance
            if (showProgress) {
                // Process in small batches for progress tracking while maintaining good performance
                const batchSize = Math.min(5, Math.max(1, Math.ceil(this.files.length / 20)));
                this.convertedImages = [];
                
                for (let i = 0; i < this.files.length; i += batchSize) {
                    const batch = this.files.slice(i, i + batchSize);
                    const batchPromises = batch.map(file => this.convertImage(file));
                    const batchResults = await Promise.all(batchPromises);
                    
                    this.convertedImages.push(...batchResults);
                    this.updateProgress(Math.min(i + batchSize, this.files.length), this.files.length);
                    
                    // Small delay to prevent UI blocking, but only between batches
                    if (i + batchSize < this.files.length) {
                        await new Promise(resolve => setTimeout(resolve, 5));
                    }
                }
            } else {
                // Process all images in parallel for maximum speed (original behavior)
                const conversionPromises = this.files.map(file => this.convertImage(file));
                this.convertedImages = await Promise.all(conversionPromises);
            }
            
        } catch (error) {
            globalAlert.showError(`Conversion failed: ${error.message}`);
        }

        // Hide progress bar
        if (showProgress) {
            this.hideProgressBar();
        }

        // Calculate completion stats
        const endTime = Date.now();
        const processingTime = endTime - startTime;
        
        const newStats = {
            totalSize: this.convertedImages.reduce((sum, img) => sum + img.size, 0),
            fileCount: this.convertedImages.length,
            formats: this.getFormatDistribution(this.convertedImages)
        };

        this.showStatistics(originalStats, newStats, processingTime);
        this.showPreview();
        this.convertBtn.disabled = false;
        this.convertBtn.textContent = 'Convert Images';
        
        if (this.convertedImages.length > 0) {
            globalAlert.showSuccess(`Successfully converted ${this.convertedImages.length} images`);
        }
    }

    convertImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    // Calculate dimensions
                    let { width, height } = this.calculateDimensions(img);
                    
                    canvas.width = width;
                    canvas.height = height;

                    // Apply compression method specific rendering
                    this.applyCompressionPreprocessing(ctx, img, width, height);

                    // Draw image
                    ctx.drawImage(img, 0, 0, width, height);

                    // Apply post-processing based on compression method
                    this.applyCompressionPostprocessing(ctx, width, height);

                    // Get compression settings
                    const { format, quality } = this.getCompressionSettings();

                    // Convert to blob
                    canvas.toBlob((blob) => {
                        if (blob) {
                            const fileName = this.generateFileName(file.name);
                            resolve({
                                blob,
                                fileName,
                                originalName: file.name,
                                size: blob.size,
                                format: format,
                                compressionMethod: this.compressionMethod.value
                            });
                        } else {
                            reject(new Error('Failed to convert image'));
                        }
                    }, format, quality);

                } catch (error) {
                    reject(error);
                }
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = URL.createObjectURL(file);
        });
    }

    applyCompressionPreprocessing(ctx, img, width, height) {
        const method = this.compressionMethod.value;
        
        switch(method) {
            case 'optimized':
                // Use higher quality rendering
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                break;
            case 'aggressive':
                // Disable smoothing for smaller files
                ctx.imageSmoothingEnabled = false;
                break;
            case 'lossless':
                // Use highest quality settings
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                break;
            default:
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'medium';
                break;
        }
    }

    applyCompressionPostprocessing(ctx, width, height) {
        const method = this.compressionMethod.value;
        
        if (method === 'aggressive') {
            // Apply slight blur to reduce high-frequency details
            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;
            
            // Simple box blur for compression
            for (let i = 0; i < data.length; i += 4) {
                if (i > 4 * width && i < data.length - 4 * width) {
                    // Slightly reduce color precision
                    data[i] = Math.round(data[i] / 4) * 4;     // Red
                    data[i + 1] = Math.round(data[i + 1] / 4) * 4; // Green  
                    data[i + 2] = Math.round(data[i + 2] / 4) * 4; // Blue
                }
            }
            
            ctx.putImageData(imageData, 0, 0);
        }
    }

    getCompressionSettings() {
        const format = this.outputFormat.value;
        const method = this.compressionMethod.value;
        let quality = this.qualitySlider.value;
        
        switch(method) {
            case 'lossless':
                if (format === 'image/webp') {
                    quality = 1.0; // WebP lossless
                }
                return { format, quality };
            case 'aggressive':
                quality = Math.min(quality, 0.6); // Cap at 60%
                return { format, quality };
            case 'optimized':
                quality = Math.max(quality, 0.8); // Minimum 80%
                return { format, quality };
            default:
                return { format, quality };
        }
    }

    calculateDimensions(img) {
        let width = img.width;
        let height = img.height;

        // Apply resize if specified
        if (this.resizeWidth.value || this.resizeHeight.value) {
            const targetWidth = parseInt(this.resizeWidth.value) || null;
            const targetHeight = parseInt(this.resizeHeight.value) || null;

            // Security: Limit maximum dimensions to prevent browser crashes
            const MAX_DIMENSION = 8192;
            
            if (targetWidth && targetWidth > MAX_DIMENSION) {
                globalAlert.showError(`Width cannot exceed ${MAX_DIMENSION}px for performance reasons`);
                return { width: Math.min(width, MAX_DIMENSION), height: Math.min(height, MAX_DIMENSION) };
            }
            
            if (targetHeight && targetHeight > MAX_DIMENSION) {
                globalAlert.showError(`Height cannot exceed ${MAX_DIMENSION}px for performance reasons`);
                return { width: Math.min(width, MAX_DIMENSION), height: Math.min(height, MAX_DIMENSION) };
            }

            if (targetWidth && targetHeight) {
                width = targetWidth;
                height = targetHeight;
            } else if (targetWidth) {
                const ratio = img.height / img.width;
                width = targetWidth;
                height = Math.round(targetWidth * ratio);
            } else if (targetHeight) {
                const ratio = img.width / img.height;
                height = targetHeight;
                width = Math.round(targetHeight * ratio);
            }
        }

        // Additional safety check for original image dimensions
        if (width > 8192 || height > 8192) {
            const scale = Math.min(8192 / width, 8192 / height);
            width = Math.round(width * scale);
            height = Math.round(height * scale);
            globalAlert.showError('Image automatically resized for performance (max 8192px)');
        }

        return { width, height };
    }

    generateFileName(originalName) {
        // Sanitize the original filename for security (prevent directory traversal)
        const sanitizedName = globalAlert.sanitizeFilename(originalName);
        const nameWithoutExt = sanitizedName.replace(/\.[^/.]+$/, "");
        const newExt = this.outputFormat.value.split('/')[1];
        const finalExt = newExt === 'jpeg' ? 'jpg' : newExt;
        
        // Ensure filename is not empty and add fallback
        const safeName = nameWithoutExt || `image_${Date.now()}`;
        
        return `${safeName}.${finalExt}`;
    }

    showPreview() {
        this.previewSection.style.display = 'block';
        
        // Clean up any existing preview images to prevent memory leaks
        this.cleanupPreviewImages();
        this.previewGrid.innerHTML = '';

        // Add sticky download header if multiple images
        if (this.convertedImages.length > 1) {
            this.createStickyDownloadHeader();
        }

        // Create preview items
        this.convertedImages.forEach((converted, index) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            previewItem.dataset.index = index;
            
            // Add selection checkbox for multiple files
            let checkboxHtml = '';
            if (this.convertedImages.length > 1) {
                checkboxHtml = `<input type="checkbox" class="file-checkbox" data-index="${index}">`;
            }
            
            const img = document.createElement('img');
            img.src = URL.createObjectURL(converted.blob);
            img.className = 'preview-image';

            const info = document.createElement('div');
            info.className = 'preview-info';
            info.innerHTML = `
                <div class="file-name">${converted.fileName}</div>
                <div class="file-details">
                    <span class="file-size">${this.formatFileSize(converted.size)}</span>
                    <span class="compression-method">${this.getCompressionMethodName(converted.compressionMethod)}</span>
                </div>
                <div class="file-actions">
                    ${checkboxHtml}
                    <button class="download-single" data-index="${index}">Download</button>
                </div>
            `;

            previewItem.appendChild(img);
            previewItem.appendChild(info);
            this.previewGrid.appendChild(previewItem);
        });

        // Add single download listeners
        this.previewGrid.querySelectorAll('.download-single').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.downloadSingle(index);
            });
        });

        // Add checkbox listeners
        this.previewGrid.querySelectorAll('.file-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', this.updateSelectedCount.bind(this));
        });
    }

    downloadSingle(index) {
        try {
            const converted = this.convertedImages[index];
            
            // Additional security check
            if (!converted || !converted.blob) {
                globalAlert.showError('Invalid file data. Please regenerate the image.');
                return;
            }
            
            // Validate filename again before download
            const sanitizedFilename = globalAlert.sanitizeFilename(converted.fileName);
            
            const url = URL.createObjectURL(converted.blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = sanitizedFilename;
            a.click();
            URL.revokeObjectURL(url);
            
            globalAlert.showSuccess(`Downloaded: ${sanitizedFilename}`);
            
        } catch (error) {
            globalAlert.showError('Download failed. Please try again.');
        }
    }

    createStickyDownloadHeader() {
        // Remove existing sticky header
        const existingHeader = document.querySelector('.sticky-download-header');
        if (existingHeader) existingHeader.remove();

        const stickyHeader = document.createElement('div');
        stickyHeader.className = 'sticky-download-header';
        stickyHeader.innerHTML = `
            <div class="sticky-content">
                <div class="files-summary">
                    <span class="files-count">${this.convertedImages.length} files converted</span>
                    <span class="total-size">Total: ${this.formatFileSize(this.convertedImages.reduce((sum, img) => sum + img.size, 0))}</span>
                </div>
                <div class="sticky-actions">
                    <button id="stickyDownloadAll" class="btn-primary">Download All as ZIP</button>
                    <button id="stickySelectAll" class="btn-secondary">Select All</button>
                    <button id="stickyDownloadSelected" class="btn-secondary" style="display: none;">Download Selected</button>
                </div>
            </div>
        `;

        // Insert at the beginning of preview section
        this.previewSection.insertBefore(stickyHeader, this.previewGrid);

        // Add sticky download functionality
        document.getElementById('stickyDownloadAll').addEventListener('click', this.downloadAll.bind(this));
        document.getElementById('stickySelectAll').addEventListener('click', this.selectAllFiles.bind(this));
        document.getElementById('stickyDownloadSelected').addEventListener('click', this.downloadSelected.bind(this));

        // Make it stick to top when scrolling
        this.setupStickyBehavior(stickyHeader);
    }

    setupStickyBehavior(stickyHeader) {
        let ticking = false;
        let lastKnownState = false;
        
        const handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const rect = stickyHeader.getBoundingClientRect();
                    const isSticky = rect.top <= 20;
                
                    if (isSticky !== lastKnownState) {
                        if (isSticky) {
                            stickyHeader.classList.add('stuck');
                        } else {
                            stickyHeader.classList.remove('stuck');
                        }
                        lastKnownState = isSticky;
                    }
                    ticking = false;
                });
                ticking = true;
            }
        };
        
        // Use passive listener for better performance
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll(); // Check initial state
    }

    getFormatDistribution(items) {
        const distribution = {};
        items.forEach(item => {
            const format = item.type || item.format || 'unknown';
            const formatName = this.getFormatName(format);
            distribution[formatName] = (distribution[formatName] || 0) + 1;
        });
        return distribution;
    }

    getFormatName(mimeType) {
        switch(mimeType) {
            case 'image/png': return 'PNG';
            case 'image/jpeg': return 'JPEG';
            case 'image/webp': return 'WebP';
            case 'image/avif': return 'AVIF';
            default: return mimeType.replace('image/', '').toUpperCase();
        }
    }

    getCompressionMethodName(method) {
        switch(method) {
            case 'standard': return 'Standard';
            case 'optimized': return 'Optimized Quality';
            case 'lossless': return 'Lossless';
            case 'aggressive': return 'Aggressive';
            default: return method;
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    formatTime(milliseconds) {
        if (milliseconds < 1000) return '< 1s';
        if (milliseconds < 60000) return `${(milliseconds / 1000).toFixed(1)}s`;
        return `${(milliseconds / 60000).toFixed(1)}min`;
    }

    showStatistics(originalStats, newStats, processingTime) {
        const spaceSaved = originalStats.totalSize - newStats.totalSize;
        const compressionRatio = ((spaceSaved / originalStats.totalSize) * 100);
        const avgProcessingTime = processingTime / newStats.fileCount;

        // Remove any existing stats
        const existingStats = document.querySelector('.conversion-statistics');
        if (existingStats) existingStats.remove();

        // Create statistics display
        const statsContainer = document.createElement('div');
        statsContainer.className = 'conversion-statistics';
        
        const formatList = (formats) => {
            return Object.entries(formats)
                .map(([format, count]) => `${count}× ${format}`)
                .join(', ');
        };

        statsContainer.innerHTML = `

            <div class="stats-grid">
                <div class="stat-group">
                    <h4 class="h3">Performance</h4>
                    <div class="stat-item">
                        <span class="stat-label">Total Time:</span>
                        <span class="stat-value">${this.formatTime(processingTime)}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Avg per File:</span>
                        <span class="stat-value">${this.formatTime(avgProcessingTime)}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Processing Speed:</span>
                        <span class="stat-value">${(newStats.fileCount / (processingTime / 1000)).toFixed(1)} files/sec</span>
                    </div>
                </div>
                
                <div class="stat-group">
                    <h4 class="h3">File Sizes</h4>
                    <div class="stat-item">
                        <span class="stat-label">Original Total:</span>
                        <span class="stat-value">${this.formatFileSize(originalStats.totalSize)}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Converted Total:</span>
                        <span class="stat-value">${this.formatFileSize(newStats.totalSize)}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Space ${spaceSaved >= 0 ? 'Saved' : 'Used'}:</span>
                        <span class="stat-value ${spaceSaved >= 0 ? 'stat-positive' : 'stat-negative'}">
                            ${spaceSaved >= 0 ? '-' : '+'}${this.formatFileSize(Math.abs(spaceSaved))} 
                            (${Math.abs(compressionRatio).toFixed(1)}%)
                        </span>
                    </div>
                </div>
                
                <div class="stat-group">
                    <h4 class="h3">Conversion Details</h4>
                    <div class="stat-item">
                        <span class="stat-label">Files Processed:</span>
                        <span class="stat-value">${newStats.fileCount}/${originalStats.fileCount}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Input Formats:</span>
                        <span class="stat-value">${formatList(originalStats.formats)}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Output Format:</span>
                        <span class="stat-value">${this.getFormatName(this.outputFormat.value)}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Compression:</span>
                        <span class="stat-value">${this.getCompressionMethodName(this.compressionMethod.value)}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Quality Setting:</span>
                        <span class="stat-value">${Math.round(this.qualitySlider.value * 100)}%</span>
                    </div>
                </div>
            </div>
        `;

        // Insert after controls section, before preview
        this.controlsSection.parentNode.insertBefore(statsContainer, this.previewSection);
    }

    selectAllFiles() {
        const checkboxes = document.querySelectorAll('.preview-item input[type="checkbox"]');
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        
        checkboxes.forEach(cb => {
            cb.checked = !allChecked;
        });
        
        this.updateSelectedCount();
    }

    updateSelectedCount() {
        const selectedCheckboxes = document.querySelectorAll('.preview-item input[type="checkbox"]:checked');
        const downloadSelectedBtn = document.getElementById('stickyDownloadSelected');
        const selectAllBtn = document.getElementById('stickySelectAll');
        
        if (selectedCheckboxes.length > 0) {
            downloadSelectedBtn.style.display = 'inline-block';
            downloadSelectedBtn.textContent = `Download ${selectedCheckboxes.length} Selected`;
            selectAllBtn.textContent = selectedCheckboxes.length === this.convertedImages.length ? 'Deselect All' : 'Select All';
        } else {
            downloadSelectedBtn.style.display = 'none';
            selectAllBtn.textContent = 'Select All';
        }
    }

    downloadSelected() {
        const selectedCheckboxes = document.querySelectorAll('.preview-item input[type="checkbox"]:checked');
        const selectedIndices = Array.from(selectedCheckboxes).map(cb => 
            parseInt(cb.closest('.preview-item').dataset.index)
        );
        
        if (selectedIndices.length === 0) return;
        
        if (selectedIndices.length === 1) {
            this.downloadSingle(selectedIndices[0]);
        } else {
            this.downloadMultiple(selectedIndices);
        }
    }

    async downloadMultiple(indices) {
        // Check if JSZip is available
        if (typeof JSZip === 'undefined') {
            globalAlert.showError('ZIP functionality not available. Please try individual downloads.');
            return;
        }

        const selectedBtn = document.getElementById('stickyDownloadSelected');
        selectedBtn.disabled = true;
        selectedBtn.textContent = 'Creating ZIP...';

        try {
            const zip = new JSZip();
            const filenames = new Set(); // Track filenames to avoid duplicates
            
            indices.forEach(index => {
                const converted = this.convertedImages[index];
                if (converted && converted.blob) {
                    // Sanitize filename and ensure uniqueness
                    let sanitizedName = globalAlert.sanitizeFilename(converted.fileName);
                    let counter = 1;
                    const originalName = sanitizedName;
                    
                    // Handle duplicate filenames
                    while (filenames.has(sanitizedName)) {
                        const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
                        const ext = originalName.split('.').pop();
                        sanitizedName = `${nameWithoutExt}_${counter}.${ext}`;
                        counter++;
                    }
                    
                    filenames.add(sanitizedName);
                    zip.file(sanitizedName, converted.blob);
                }
            });

            if (filenames.size === 0) {
                throw new Error('No valid files to include in ZIP');
            }

            const zipBlob = await zip.generateAsync({
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: { level: 6 }
            });

            const sanitizedZipName = globalAlert.sanitizeFilename(`selected_images_${new Date().toISOString().slice(0,10)}.zip`);
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = sanitizedZipName;
            a.click();
            URL.revokeObjectURL(url);

            globalAlert.showSuccess(`Downloaded ZIP with ${filenames.size} files`);

        } catch (error) {
            globalAlert.showError(`ZIP creation failed: ${error.message}`);
        } finally {
            selectedBtn.disabled = false;
            this.updateSelectedCount();
        }
    }

    async downloadAll() {
        if (this.convertedImages.length <= 1) {
            this.downloadSingle(0);
            return;
        }

        // Check if JSZip is available
        if (typeof JSZip === 'undefined') {
            globalAlert.showError('ZIP functionality not available. Please try individual downloads.');
            return;
        }

        const downloadAllBtn = document.getElementById('stickyDownloadAll');
        downloadAllBtn.disabled = true;
        downloadAllBtn.textContent = 'Creating ZIP...';

        try {
            const zip = new JSZip();
            const filenames = new Set();
            
            // Add all files to zip with security checks
            this.convertedImages.forEach(converted => {
                if (converted && converted.blob) {
                    // Sanitize filename and ensure uniqueness
                    let sanitizedName = globalAlert.sanitizeFilename(converted.fileName);
                    let counter = 1;
                    const originalName = sanitizedName;
                    
                    while (filenames.has(sanitizedName)) {
                        const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
                        const ext = originalName.split('.').pop();
                        sanitizedName = `${nameWithoutExt}_${counter}.${ext}`;
                        counter++;
                    }
                    
                    filenames.add(sanitizedName);
                    zip.file(sanitizedName, converted.blob);
                }
            });

            if (filenames.size === 0) {
                throw new Error('No valid files to include in ZIP');
            }

            const zipBlob = await zip.generateAsync({
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: { level: 6 }
            });

            const sanitizedZipName = globalAlert.sanitizeFilename(`converted_images_${new Date().toISOString().slice(0,10)}.zip`);
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = sanitizedZipName;
            a.click();
            URL.revokeObjectURL(url);

            globalAlert.showSuccess(`Downloaded ZIP with all ${filenames.size} files`);

        } catch (error) {
            globalAlert.showError(`ZIP creation failed: ${error.message}`);
        } finally {
            downloadAllBtn.disabled = false;
            downloadAllBtn.textContent = 'Download All as ZIP';
        }
    }

    clearAll() {
        this.files = [];
        this.convertedImages = [];
        this.controlsSection.style.display = 'none';
        this.previewSection.style.display = 'none';
        this.hideProgressBar(); // Hide progress bar
        this.fileInput.value = '';
        
        // Clean up preview image blob URLs to prevent memory leaks
        this.cleanupPreviewImages();
        
        // Clear statistics and sticky header
        const existingStats = document.querySelector('.conversion-statistics');
        if (existingStats) existingStats.remove();
        
        const existingStickyHeader = document.querySelector('.sticky-download-header');
        if (existingStickyHeader) existingStickyHeader.remove();
        
        const uploadContent = this.uploadArea.querySelector('.upload-content p');
        uploadContent.innerHTML = 'Select multiple images or drag entire folders for batch conversion<br><small>Hold Ctrl/Cmd and click to select folders</small>';
    }

    // New method to clean up blob URLs and prevent memory leaks
    cleanupPreviewImages() {
        const previewImages = this.previewGrid.querySelectorAll('.preview-image');
        previewImages.forEach(img => {
            if (img.src && img.src.startsWith('blob:')) {
                URL.revokeObjectURL(img.src);
            }
        });
    }
}
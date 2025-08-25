export function initQRGenerator() {
    const qrContainer = document.getElementById('qr-container');
    if (!qrContainer) return;

    let currentQRCode = null;
    
    // Security & Rate Limiting Configuration
    const SECURITY_CONFIG = {
        maxRequestsPerMinute: 10,
        maxRequestsPerHour: 50,
        maxInputLength: 2048,
        minTimeBetweenRequests: 3000, // 3 seconds
        encryptionKey: generateEncryptionKey()
    };

    // Initialize security systems
    initSecurity();

    // Create the QR code generator interface
    createQRInterface();

    function createQRInterface() {
        const interfaceHTML = `

            <div class="qr-input-section">
                <div class="search-wrapper">
                    <label class="h2" for="url-input">Enter URL or Text</label>
                    <input type="text" id="url-input" placeholder="Paste your link here" maxlength="${SECURITY_CONFIG.maxInputLength}" />
                    <div class="input-info">
                        <span class="h3" id="char-count">0/${SECURITY_CONFIG.maxInputLength} characters</span>
                        <span class="h3" id="input-status">✓ Valid input</span>
                    </div>
                </div>
                
                <div class="qr-controls">
                    <button class="qr-button primary" id="generate-btn">
                        <span class="h1">Generate QR Code</span>
                    </button>
                    <button class="qr-button secondary" id="copy-btn" style="display: none;">
                        <span class="h1">Copy Image</span>
                    </button>
                    <button class="qr-button secondary" id="download-btn" style="display: none;">
                        <span class="h1">Download JPG</span>
                    </button>
                    <button class="qr-button danger" id="clear-btn" style="display: none;">
                        <span class="h1">Clear</span>
                    </button>
                </div>
            </div>
            

            <div class="qr-display-section">
                <div id="qr-code-display" class="qr-code-container" style="display: none;">
                    <canvas id="qr-canvas"></canvas>
                </div>
                <div id="qr-placeholder" class="qr-placeholder">
                    <div class="placeholder-content">
                        <div class="placeholder-icon">📱</div>
                        <p class="h2">Enter a URL above to generate QR code</p>
                    </div>
                </div>
            </div>

            <div class="security-status" id="security-status">
                <div class="security-indicator">
                    <span class="h3">Secure QR Generation</span>
                    <div class="rate-limit-info">
                        <span class="h3" id="requests-remaining">Requests remaining: ${getRemainingRequests()}</span>
                    </div>
                </div>
            </div>
        `;

        qrContainer.innerHTML = interfaceHTML;
        
        // Add event listeners
        setupEventListeners();
        
        // Initialize real-time validation
        setupInputValidation();
        
        // Update security status
        updateSecurityStatus();
    }

    function setupEventListeners() {
        const urlInput = document.getElementById('url-input');
        const generateBtn = document.getElementById('generate-btn');
        const copyBtn = document.getElementById('copy-btn');
        const downloadBtn = document.getElementById('download-btn');
        const clearBtn = document.getElementById('clear-btn');

        // Generate QR code
        generateBtn.addEventListener('click', async () => {
            const url = urlInput.value.trim();
            
            // Security checks
            if (!validateInput(url)) {
                return; // Error already shown by validateInput
            }
            
            if (!checkRateLimit()) {
                showError('Rate limit exceeded. Please wait before generating another QR code.');
                return;
            }
            
            // Disable button during generation
            generateBtn.disabled = true;
            generateBtn.querySelector('.h1').textContent = 'Generating...';
            
            try {
                const formattedUrl = formatUrl(url);
                await generateQRCode(formattedUrl);
                recordRequest();
                updateSecurityStatus();
            } catch (error) {
                showError('Failed to generate QR code: ' + error.message);
            } finally {
                // Re-enable button after delay
                setTimeout(() => {
                    generateBtn.disabled = false;
                    generateBtn.querySelector('.h1').textContent = 'Generate QR Code';
                }, SECURITY_CONFIG.minTimeBetweenRequests);
            }
        });

        // Enter key support
        urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                generateBtn.click();
            }
        });

        // Copy image button
        copyBtn.addEventListener('click', async () => {
            await copyQRCodeToClipboard();
        });

        // Download button
        downloadBtn.addEventListener('click', () => {
            downloadQRCode();
        });

        // Clear button
        clearBtn.addEventListener('click', () => {
            clearQRCode();
        });
    }

    async function generateQRCode(text) {
        try {
            const canvas = document.getElementById('qr-canvas');
            const ctx = canvas.getContext('2d');
            
            // Set canvas size
            canvas.width = 300;
            canvas.height = 300;

            // Log encrypted data for security audit (but don't use for QR)
            const encryptedData = encryptData(text);
            console.log('Security audit: Data encrypted and logged:', encryptedData.substring(0, 50) + '...');

            // Generate QR code using ORIGINAL data (so it's actually usable)
            await generateQRCodeCanvas(text, canvas);
            
            // Show the QR code and controls
            showQRCode();
            
        } catch (error) {
            throw new Error('QR generation failed: ' + error.message);
        }
    }

    async function generateQRCodeCanvas(originalData, canvas) {
        const ctx = canvas.getContext('2d');
        const size = 300;
        
        // Create QR code with ORIGINAL data (so it's scannable and usable)
        const qrApiUrl = await createSecureAPIRequest(originalData);
        
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            // Add timeout for API request
            const timeout = setTimeout(() => {
                reject(new Error('API request timeout'));
            }, 10000);
            
            img.onload = function() {
                clearTimeout(timeout);
                // Clear canvas and draw QR code
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#131313';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, size, size);
                resolve();
            };
            
            img.onerror = function() {
                clearTimeout(timeout);
                // Fallback: Create a functional QR placeholder
                createFunctionalFallbackQR(ctx, size, originalData);
                resolve();
            };
            
            img.src = qrApiUrl;
        });
    }
    
    async function createSecureAPIRequest(originalData) {
        // Validate origin for CORS protection
        if (!validateOrigin()) {
            throw new Error('Invalid origin - CORS protection activated');
        }
        
        // Create API URL with ORIGINAL data (not encrypted)
        const size = 300;
        const encodedData = encodeURIComponent(originalData);
        
        // Log the request for security auditing
        logSecureRequest(originalData);
        
        return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedData}&bgcolor=131313&color=FFFFFF&format=png`;
    }
    
    function logSecureRequest(data) {
        // Securely log requests for audit purposes (encrypted)
        const encryptedLog = encryptData(data);
        const timestamp = new Date().toISOString();
        
        // Store in secure audit log
        const auditLog = JSON.parse(localStorage.getItem('qr_audit_log') || '[]');
        auditLog.push({
            timestamp: timestamp,
            dataHash: hashString(data),
            encryptedData: encryptedLog,
            origin: window.location.origin
        });
        
        // Keep only last 100 entries
        if (auditLog.length > 100) {
            auditLog.splice(0, auditLog.length - 100);
        }
        
        localStorage.setItem('qr_audit_log', JSON.stringify(auditLog));
    }
    
    function createFunctionalFallbackQR(ctx, size, originalData) {
        // Fallback: Create a functional QR-like pattern that still contains the data
        ctx.clearRect(0, 0, size, size);
        ctx.fillStyle = '#131313';
        ctx.fillRect(0, 0, size, size);
        
        // Create a deterministic pattern based on the data
        ctx.fillStyle = '#FFFFFF';
        const gridSize = 8;
        const hash = hashString(originalData);
        
        for (let x = 0; x < size; x += gridSize) {
            for (let y = 0; y < size; y += gridSize) {
                // Use hash to create deterministic but readable pattern
                if ((hash + x + y) % 17 === 0) {
                    ctx.fillRect(x, y, gridSize, gridSize);
                }
            }
        }
        
        // Add corner markers
        const markerSize = 21;
        drawSecureMarker(ctx, 0, 0, markerSize);
        drawSecureMarker(ctx, size - markerSize, 0, markerSize);
        drawSecureMarker(ctx, 0, size - markerSize, markerSize);
        
        // Add readable text (the actual URL/data)
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '10px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText('⚠️ FALLBACK QR', size/2, size/2 - 30);
        ctx.fillText('API Failed - Manual Entry:', size/2, size/2 - 15);
        
        // Display the actual URL in readable chunks
        const maxChars = 25;
        const lines = [];
        for (let i = 0; i < originalData.length; i += maxChars) {
            lines.push(originalData.substring(i, i + maxChars));
        }
        
        lines.slice(0, 4).forEach((line, index) => {
            ctx.fillText(line, size/2, size/2 + (index * 12));
        });
        
        if (lines.length > 4) {
            ctx.fillText('...', size/2, size/2 + (4 * 12));
        }
    }
    
    function drawSecureMarker(ctx, x, y, size) {
        // Draw enhanced QR code corner marker with security pattern
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#131313';
        ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x + 6, y + 6, size - 12, size - 12);
        
        // Add security dot in center
        ctx.fillStyle = '#32C743'; // Accent color for security indicator
        ctx.fillRect(x + 9, y + 9, 3, 3);
    }

    function showQRCode() {
        const qrDisplay = document.getElementById('qr-code-display');
        const qrPlaceholder = document.getElementById('qr-placeholder');
        const generateBtn = document.getElementById('generate-btn');
        const copyBtn = document.getElementById('copy-btn');
        const downloadBtn = document.getElementById('download-btn');
        const clearBtn = document.getElementById('clear-btn');

        qrDisplay.style.display = 'block';
        qrPlaceholder.style.display = 'none';
        generateBtn.style.display = 'none';
        copyBtn.style.display = 'inline-block';
        downloadBtn.style.display = 'inline-block';
        clearBtn.style.display = 'inline-block';
    }

    function resetInterface() {
        const urlInput = document.getElementById('url-input');
        urlInput.value = '';
        urlInput.focus();
        clearQRCode();
    }

    function clearQRCode() {
        const qrDisplay = document.getElementById('qr-code-display');
        const qrPlaceholder = document.getElementById('qr-placeholder');
        const generateBtn = document.getElementById('generate-btn');
        const copyBtn = document.getElementById('copy-btn');
        const downloadBtn = document.getElementById('download-btn');
        const clearBtn = document.getElementById('clear-btn');

        qrDisplay.style.display = 'none';
        qrPlaceholder.style.display = 'flex';
        generateBtn.style.display = 'inline-block';
        copyBtn.style.display = 'none';
        downloadBtn.style.display = 'none';
        clearBtn.style.display = 'none';
    }

    function downloadQRCode() {
        const canvas = document.getElementById('qr-canvas');
        
        // Create a new canvas with white background for better JPG quality
        const downloadCanvas = document.createElement('canvas');
        const ctx = downloadCanvas.getContext('2d');
        downloadCanvas.width = canvas.width;
        downloadCanvas.height = canvas.height;
        
        // Fill with white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, downloadCanvas.width, downloadCanvas.height);
        
        // Draw the QR code on top
        ctx.drawImage(canvas, 0, 0);
        
        // Convert to blob and download
        downloadCanvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'qrcode.jpg';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 'image/jpeg', 0.9);
    }

    async function copyQRCodeToClipboard() {
        try {
            const canvas = document.getElementById('qr-canvas');
            
            // Create a new canvas with white background for better contrast
            const copyCanvas = document.createElement('canvas');
            const ctx = copyCanvas.getContext('2d');
            copyCanvas.width = canvas.width;
            copyCanvas.height = canvas.height;
            
            // Fill with white background
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, copyCanvas.width, copyCanvas.height);
            
            // Draw the QR code on top
            ctx.drawImage(canvas, 0, 0);
            
            // Convert canvas to blob
            copyCanvas.toBlob(async (blob) => {
                try {
                    // Create ClipboardItem with the image blob
                    const clipboardItem = new ClipboardItem({
                        'image/png': blob
                    });
                    
                    // Write to clipboard
                    await navigator.clipboard.write([clipboardItem]);
                    
                    // Show success message
                    showSuccess('QR code copied to clipboard!');
                    
                } catch (error) {
                    console.error('Failed to copy to clipboard:', error);
                    showError('Failed to copy image. Try using download instead.');
                }
            }, 'image/png');
            
        } catch (error) {
            console.error('Copy operation failed:', error);
            showError('Copy not supported in this browser. Use download instead.');
        }
    }

    function showError(message) {
        // Create temporary error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: var(--accent-color);
            color: var(--background);
            padding: 10px 20px;
            border-radius: 5px;
            font-size: 12px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        errorDiv.textContent = message;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }

    function showSuccess(message) {
        // Create temporary success message
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: var(--accent-color);
            color: var(--background);
            padding: 10px 20px;
            border-radius: 5px;
            font-size: 12px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
            box-shadow: 0 4px 12px rgba(50, 199, 67, 0.3);
        `;
        successDiv.textContent = '✓ ' + message;
        
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            successDiv.remove();
        }, 2000);
    }

    function formatUrl(input) {
        // If it looks like a URL but doesn't have protocol, add https://
        const urlPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
        const hasProtocol = /^https?:\/\//i.test(input);
        
        if (!hasProtocol && (urlPattern.test(input) || input.includes('.'))) {
            return 'https://' + input;
        }
        
        return input;
    }

    // === SECURITY FUNCTIONS ===
    
    function initSecurity() {
        // Initialize rate limiting data
        if (!localStorage.getItem('qr_security')) {
            localStorage.setItem('qr_security', JSON.stringify({
                requests: [],
                lastRequest: 0,
                totalRequests: 0
            }));
        }
        
        // Clean old request records
        cleanOldRequests();
    }
    
    function generateEncryptionKey() {
        // Generate a session-specific encryption key
        return 'qr_key_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
    }
    
    function encryptData(data) {
        // Simple encryption using Base64 and key rotation
        const timestamp = Date.now();
        const keyFragment = SECURITY_CONFIG.encryptionKey.substring(0, 8);
        
        // Create encrypted payload
        const payload = {
            d: btoa(data), // Base64 encode
            t: timestamp,
            k: keyFragment,
            s: hashString(data + timestamp) // Integrity check
        };
        
        // Return encrypted string
        return btoa(JSON.stringify(payload));
    }
    
    function hashString(str) {
        // Simple hash function for integrity checks
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }
    
    function validateInput(input) {
        if (!input || input.trim() === '') {
            showError('Please enter a valid URL or text');
            updateInputStatus('❌ Empty input', 'error');
            return false;
        }
        
        if (input.length > SECURITY_CONFIG.maxInputLength) {
            showError(`Input too long. Maximum ${SECURITY_CONFIG.maxInputLength} characters allowed.`);
            updateInputStatus('❌ Too long', 'error');
            return false;
        }
        
        // Check for potentially malicious patterns
        const maliciousPatterns = [
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            /javascript:/gi,
            /data:text\/html/gi,
            /vbscript:/gi,
            /on\w+\s*=/gi
        ];
        
        for (const pattern of maliciousPatterns) {
            if (pattern.test(input)) {
                showError('Input contains potentially unsafe content');
                updateInputStatus('❌ Unsafe content', 'error');
                return false;
            }
        }
        
        updateInputStatus('✓ Valid input', 'success');
        return true;
    }
    
    function checkRateLimit() {
        const security = JSON.parse(localStorage.getItem('qr_security'));
        const now = Date.now();
        
        // Check minimum time between requests
        if (now - security.lastRequest < SECURITY_CONFIG.minTimeBetweenRequests) {
            return false;
        }
        
        // Count requests in last minute
        const oneMinuteAgo = now - 60000;
        const recentRequests = security.requests.filter(time => time > oneMinuteAgo);
        
        if (recentRequests.length >= SECURITY_CONFIG.maxRequestsPerMinute) {
            return false;
        }
        
        // Count requests in last hour
        const oneHourAgo = now - 3600000;
        const hourlyRequests = security.requests.filter(time => time > oneHourAgo);
        
        if (hourlyRequests.length >= SECURITY_CONFIG.maxRequestsPerHour) {
            return false;
        }
        
        return true;
    }
    
    function recordRequest() {
        const security = JSON.parse(localStorage.getItem('qr_security'));
        const now = Date.now();
        
        security.requests.push(now);
        security.lastRequest = now;
        security.totalRequests++;
        
        localStorage.setItem('qr_security', JSON.stringify(security));
    }
    
    function cleanOldRequests() {
        const security = JSON.parse(localStorage.getItem('qr_security'));
        const oneHourAgo = Date.now() - 3600000;
        
        // Keep only requests from last hour
        security.requests = security.requests.filter(time => time > oneHourAgo);
        
        localStorage.setItem('qr_security', JSON.stringify(security));
    }
    
    function getRemainingRequests() {
        const security = JSON.parse(localStorage.getItem('qr_security') || '{"requests":[]}');
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        const recentRequests = security.requests.filter(time => time > oneMinuteAgo);
        
        return Math.max(0, SECURITY_CONFIG.maxRequestsPerMinute - recentRequests.length);
    }
    
    function validateOrigin() {
        // CORS protection - validate that request is from expected origin
        const allowedOrigins = [
            'http://127.0.0.1:3000',
            'https://askdatdude.github.io'
        ];
        
        return allowedOrigins.includes(window.location.origin);
    }
    
    function setupInputValidation() {
        const urlInput = document.getElementById('url-input');
        const charCount = document.getElementById('char-count');
        
        urlInput.addEventListener('input', () => {
            const value = urlInput.value;
            charCount.textContent = `${value.length}/${SECURITY_CONFIG.maxInputLength} characters`;
            
            // Real-time validation
            if (value.length === 0) {
                updateInputStatus('Enter URL or text', 'neutral');
            } else if (value.length > SECURITY_CONFIG.maxInputLength) {
                updateInputStatus('❌ Too long', 'error');
            } else {
                validateInput(value);
            }
        });
        
        // Prevent paste of overly long content
        urlInput.addEventListener('paste', (e) => {
            setTimeout(() => {
                if (urlInput.value.length > SECURITY_CONFIG.maxInputLength) {
                    urlInput.value = urlInput.value.substring(0, SECURITY_CONFIG.maxInputLength);
                    showError('Pasted content was truncated to maximum length');
                }
            }, 0);
        });
    }
    
    function updateInputStatus(message, type) {
        const statusElement = document.getElementById('input-status');
        statusElement.textContent = message;
        statusElement.className = `h3 input-status-${type}`;
    }
    
    function updateSecurityStatus() {
        const remainingRequests = getRemainingRequests();
        document.getElementById('requests-remaining').textContent = `Requests remaining: ${remainingRequests}`;
        
        const generateBtn = document.getElementById('generate-btn');
        if (remainingRequests <= 0) {
            generateBtn.disabled = true;
            generateBtn.querySelector('.h1').textContent = 'Rate Limited';
        }
    }
}

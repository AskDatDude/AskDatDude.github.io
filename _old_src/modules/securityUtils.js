/**
 * Shared Alert System for Toolbox Applications
 */

export class AlertSystem {
    showError(message) {
        this.createAlert(message, 'error');
    }

    showSuccess(message) {
        this.createAlert('✓ ' + message, 'success');
    }

    createAlert(message, type) {
        const alert = document.createElement('div');
        alert.className = `alert-${type}`;
        alert.style.cssText = `
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
        alert.textContent = message;
        
        document.body.appendChild(alert);
        setTimeout(() => alert.remove(), type === 'success' ? 2000 : 3000);
    }

    sanitizeFilename(filename) {
        return filename
            .replace(/[<>:"|?*]/g, '_')
            .replace(/\.\./g, '_')
            .replace(/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i, 'file_$1$2')
            .substring(0, 255);
    }
}

// Create global instance
export const globalAlert = new AlertSystem();
import Toastify from 'toastify-js';
import 'toastify-js/src/toastify.css';
import '../styles/toast-overrides.css';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

const PREFIX: Record<ToastVariant, string> = {
  success: '✓ ',
  error: '✕ ',
  warning: '⚠ ',
  info: 'ℹ ',
};

export function showToast(message: string, variant: ToastVariant = 'info', duration = 4000): void {
  Toastify({
    text: `${PREFIX[variant]}${message}`,
    duration,
    gravity: 'top',
    position: 'right',
    stopOnFocus: true,
    className: `app-toast toast--${variant}`,
    ariaLive: variant === 'error' ? 'assertive' : 'polite',
  }).showToast();
}

export function toastSuccess(message: string): void {
  showToast(message, 'success');
}

export function toastError(message: string): void {
  showToast(message, 'error', 5500);
}

export function toastWarning(message: string): void {
  showToast(message, 'warning', 4500);
}

export function toastInfo(message: string): void {
  showToast(message, 'info');
}

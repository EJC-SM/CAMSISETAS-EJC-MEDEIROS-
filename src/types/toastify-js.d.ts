declare module 'toastify-js' {
  interface ToastifyOptions {
    text?: string;
    node?: Node;
    duration?: number;
    gravity?: 'top' | 'bottom';
    position?: 'left' | 'center' | 'right';
    className?: string;
    stopOnFocus?: boolean;
    ariaLive?: 'off' | 'polite' | 'assertive';
    escapeMarkup?: boolean;
    onClick?: () => void;
  }
  interface ToastifyInstance {
    showToast: () => void;
    hideToast: () => void;
  }
  function Toastify(options: ToastifyOptions): ToastifyInstance;
  export default Toastify;
}

declare module 'toastify-js/src/toastify.css';

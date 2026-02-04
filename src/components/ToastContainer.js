import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
/**
 * Renders toast notifications on the screen.
 */
const ToastContainer = ({ toasts }) => {
    return (_jsx("div", { className: "toast-container", role: "status", "aria-live": "polite", children: toasts.map((toast) => (_jsx("div", { className: "toast", children: toast.message }, toast.id))) }));
};
export default ToastContainer;

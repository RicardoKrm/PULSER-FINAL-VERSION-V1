import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Safeguard against Google Translate and other extensions modifying the DOM directly
// which causes React's virtual DOM reconciliation to fail with "removeChild" or "insertBefore" errors.
if (typeof window !== 'undefined' && typeof Node !== 'undefined' && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function(child) {
    if (child.parentNode !== this) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('removeChild: parent mismatch, skipping to prevent crash', this, child);
      }
      return child;
    }
    return originalRemoveChild.call(this, child);
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function(newNode, referenceNode) {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('insertBefore: parent mismatch, appending instead of inserting before', this, referenceNode);
      }
      return this.appendChild(newNode);
    }
    return originalInsertBefore.call(this, newNode, referenceNode);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

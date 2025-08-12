import React from 'react';

// HTML Sanitization utility to prevent XSS attacks
// This utility provides safe HTML rendering for trusted content

// Severely restricted allowed HTML tags
const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'b', 'i', 'u',
  'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
];

// No attributes allowed to prevent any XSS vectors
const ALLOWED_ATTRIBUTES: Record<string, string[]> = {};

// Simple HTML sanitizer that removes potentially dangerous content
export const sanitizeHTML = (html: string): string => {
  if (!html) return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const root = doc.body; // Work only within body to avoid touching document/html/head

  // Remove script tags and event handlers
  root.querySelectorAll('script').forEach((script) => script.remove());

  // Remove all elements with javascript: links
  root.querySelectorAll('a[href^="javascript:"]').forEach((link) => link.remove());

  // Sanitize all elements inside body only
  const allElements = root.querySelectorAll('*');
  allElements.forEach((element) => {
    // Strip event handler attributes
    Array.from(element.attributes).forEach((attr) => {
      if (attr.name.startsWith('on')) element.removeAttribute(attr.name);
    });

    // Remove inline styles
    element.removeAttribute('style');

    const tag = element.tagName.toLowerCase();
    // Only allow specific tags
    if (!ALLOWED_TAGS.includes(tag)) {
      const textNode = doc.createTextNode(element.textContent || '');
      if (element.parentNode && element.parentNode.nodeType === Node.ELEMENT_NODE) {
        element.parentNode.replaceChild(textNode, element);
      } else {
        // Fallback: if somehow no safe parent, just remove the element
        element.remove();
      }
      return;
    }

    // Only allow specific attributes for allowed tags
    const allowedAttrs = ALLOWED_ATTRIBUTES[tag as keyof typeof ALLOWED_ATTRIBUTES] || [];
    Array.from(element.attributes).forEach((attr) => {
      if (!allowedAttrs.includes(attr.name)) element.removeAttribute(attr.name);
    });
  });

  return root.innerHTML;
};

// React component for safe HTML rendering
interface SafeHTMLProps {
  html: string;
  className?: string;
}

export const SafeHTML: React.FC<SafeHTMLProps> = ({ html, className }) => {
  const sanitizedHTML = sanitizeHTML(html);
  
  return React.createElement('div', {
    className,
    dangerouslySetInnerHTML: { __html: sanitizedHTML }
  });
};
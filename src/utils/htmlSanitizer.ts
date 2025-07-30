import React from 'react';

// HTML Sanitization utility to prevent XSS attacks
// This utility provides safe HTML rendering for trusted content

const ALLOWED_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'br', 'strong', 'em', 'b', 'i', 'u',
  'ul', 'ol', 'li',
  'div', 'span',
  'label', 'input'
];

const ALLOWED_ATTRIBUTES = {
  'input': ['type', 'checked'],
  'label': [],
  'div': ['class'],
  'span': ['class']
};

// Simple HTML sanitizer that removes potentially dangerous content
export const sanitizeHTML = (html: string): string => {
  // Create a DOM parser
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Remove script tags and event handlers
  const scripts = doc.querySelectorAll('script');
  scripts.forEach(script => script.remove());
  
  // Remove all elements with javascript: links
  const links = doc.querySelectorAll('a[href^="javascript:"]');
  links.forEach(link => link.remove());
  
  // Remove event handlers (onclick, onload, etc.)
  const allElements = doc.querySelectorAll('*');
  allElements.forEach(element => {
    // Remove all event handler attributes
    Array.from(element.attributes).forEach(attr => {
      if (attr.name.startsWith('on')) {
        element.removeAttribute(attr.name);
      }
    });
    
    // Remove style attributes to prevent CSS injection
    element.removeAttribute('style');
    
    // Only allow specific tags
    if (!ALLOWED_TAGS.includes(element.tagName.toLowerCase())) {
      // For non-allowed tags, replace with their text content
      const textNode = doc.createTextNode(element.textContent || '');
      element.parentNode?.replaceChild(textNode, element);
      return;
    }
    
    // Only allow specific attributes for allowed tags
    const allowedAttrs = ALLOWED_ATTRIBUTES[element.tagName.toLowerCase() as keyof typeof ALLOWED_ATTRIBUTES] || [];
    Array.from(element.attributes).forEach(attr => {
      if (!allowedAttrs.includes(attr.name)) {
        element.removeAttribute(attr.name);
      }
    });
  });
  
  return doc.body.innerHTML;
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
// Mobile Navigation Toggle
document.addEventListener('DOMContentLoaded', function() {
  const navToggle = document.getElementById('nav-toggle');
  const mainNav = document.getElementById('main-nav');
  
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', function() {
      const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', !isExpanded);
      mainNav.classList.toggle('active');
    });
    
    // Close mobile nav when clicking outside
    document.addEventListener('click', function(event) {
      const isClickInside = navToggle.contains(event.target) || mainNav.contains(event.target);
      if (!isClickInside && mainNav.classList.contains('active')) {
        navToggle.setAttribute('aria-expanded', 'false');
        mainNav.classList.remove('active');
      }
    });
  }
});

// Header Anchors
document.addEventListener('DOMContentLoaded', function() {
  // Add anchor links to all headings in post content
  const content = document.querySelector('.post article, .post, .page');
  if (content) {
    const headings = content.querySelectorAll('h2, h3, h4, h5, h6');
    
    headings.forEach(heading => {
      // Create ID from heading text if it doesn't have one
      if (!heading.id) {
        heading.id = heading.textContent
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/^-+|-+$/g, '');
      }
      
      // Create anchor link
      const anchor = document.createElement('a');
      anchor.className = 'header-anchor';
      anchor.href = '#' + heading.id;
      anchor.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z"></path></svg>';
      anchor.setAttribute('aria-label', 'Link to this section');
      
      heading.appendChild(anchor);
    });
  }
  
  // Copy buttons for code blocks
  const codeBlocks = document.querySelectorAll('pre');
  
  codeBlocks.forEach(block => {
    // Create wrapper if not already wrapped
    if (!block.parentElement.classList.contains('code-block-wrapper')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'code-block-wrapper';
      block.parentNode.insertBefore(wrapper, block);
      wrapper.appendChild(block);
      
      // Create copy button
      const button = document.createElement('button');
      button.className = 'copy-button';
      button.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 010 1.5h-1.5a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-1.5a.75.75 0 011.5 0v1.5A1.75 1.75 0 019.25 16h-7.5A1.75 1.75 0 010 14.25v-7.5z"></path><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0114.25 11h-7.5A1.75 1.75 0 015 9.25v-7.5zm1.75-.25a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25h-7.5z"></path></svg> Copy';
      button.setAttribute('aria-label', 'Copy code to clipboard');
      
      // Add click handler
      button.addEventListener('click', async function() {
        const code = block.querySelector('code');
        const text = code ? code.textContent : block.textContent;
        
        try {
          // Feature detection: Check if Clipboard API is available
          if (navigator.clipboard && window.isSecureContext) {
            // Use modern Clipboard API (requires HTTPS)
            await navigator.clipboard.writeText(text);
          } else {
            // Fallback for older browsers or non-HTTPS contexts
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'absolute';
            textArea.style.opacity = '0';
            textArea.style.pointerEvents = 'none';
            textArea.setAttribute('readonly', '');
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
              const successful = document.execCommand('copy');
              if (!successful) {
                throw new Error('Copy command was unsuccessful');
              }
            } finally {
              textArea.remove();
            }
          }
          
          // Update button to show success
          button.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"></path></svg> Copied!';
          button.classList.add('copied');
          
          // Reset after 2 seconds
          setTimeout(() => {
            button.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 010 1.5h-1.5a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-1.5a.75.75 0 011.5 0v1.5A1.75 1.75 0 019.25 16h-7.5A1.75 1.75 0 010 14.25v-7.5z"></path><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0114.25 11h-7.5A1.75 1.75 0 015 9.25v-7.5zm1.75-.25a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25h-7.5z"></path></svg> Copy';
            button.classList.remove('copied');
          }, 2000);
        } catch (err) {
          console.error('Failed to copy:', err);
          button.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z"></path></svg> Failed';
          setTimeout(() => {
            button.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 010 1.5h-1.5a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-1.5a.75.75 0 011.5 0v1.5A1.75 1.75 0 019.25 16h-7.5A1.75 1.75 0 010 14.25v-7.5z"></path><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0114.25 11h-7.5A1.75 1.75 0 015 9.25v-7.5zm1.75-.25a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25h-7.5z"></path></svg> Copy';
          }, 2000);
        }
      });
      
      wrapper.appendChild(button);
    }
  });
  
  // Wrap tables for mobile scrolling
  const tables = document.querySelectorAll('table');
  tables.forEach(table => {
    if (!table.parentElement.classList.contains('table-wrapper')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'table-wrapper';
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    }
  });
  
  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href !== '#') {
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
          
          // Update URL without jumping
          history.pushState(null, null, href);
        }
      }
    });
  });
});

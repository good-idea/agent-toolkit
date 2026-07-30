// Hello World TypeScript application
console.log('Hello from TypeScript!');

// Simple DOM manipulation
const heading = document.querySelector('h1');
if (heading) {
  heading.style.color = '#4a90e2';
  heading.textContent = 'Hello from TypeScript! 🚀';
}

// Add a timestamp
const timestamp = new Date().toLocaleTimeString();
const timeElement = document.createElement('p');
timeElement.textContent = `Page loaded at: ${timestamp}`;
timeElement.style.fontFamily = 'monospace';
timeElement.style.color = '#666';
document.body.appendChild(timeElement);

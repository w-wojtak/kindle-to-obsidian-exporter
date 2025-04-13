// Import our Tauri API wrapper
import * as tauriApi from './tauri-api.js';

// State
let clippingsPath = '';
let outputDir = '';
let books = [];

// DOM elements
let fileInfo;
let dirInfo;
let bookList;
let booksContainer;
let exportBtn;
let statusMsg;
let selectAllBtn;
let deselectAllBtn;

// Initialize the app
async function initApp() {
    console.log("Initializing app...");
    
    // Get DOM elements
    fileInfo = document.getElementById('fileInfo');
    dirInfo = document.getElementById('dirInfo');
    bookList = document.getElementById('bookList');
    booksContainer = document.getElementById('booksContainer');
    exportBtn = document.getElementById('exportBtn');
    statusMsg = document.getElementById('statusMsg');
    selectAllBtn = document.getElementById('selectAllBtn');
    deselectAllBtn = document.getElementById('deselectAllBtn');
    
    // Add event listeners
    document.getElementById('selectFileBtn').addEventListener('click', selectClippingsFile);
    document.getElementById('selectDirBtn').addEventListener('click', selectOutputDirectory);
    selectAllBtn.addEventListener('click', selectAllBooks);
    deselectAllBtn.addEventListener('click', deselectAllBooks);
    exportBtn.addEventListener('click', exportHighlights);
    
    // Set up search if it exists
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterBooks);
    }
    
    // Load saved paths (just for display, don't try to access files)
    try {
        // Load output directory
        const savedOutputDir = tauriApi.getFromStorage('outputDir');
        if (savedOutputDir) {
            outputDir = savedOutputDir;
            dirInfo.textContent = `Selected: ${savedOutputDir}`;
        }
        
        // Load clippings path
        const savedClippingsPath = tauriApi.getFromStorage('clippingsPath');
        if (savedClippingsPath) {
            // Just display the path, don't try to access the file
            fileInfo.textContent = `Last used: ${savedClippingsPath}`;
            
            // Add a note that the user needs to select the file again
            showStatus("Please select your clippings file to load highlights", "info");
        }
        
        // Update export button state
        updateExportButton();
        
        console.log("App initialization complete");
    } catch (error) {
        console.error('Error during app initialization:', error);
    }
}

function filterBooks() {
    const searchTerm = searchInput.value.toLowerCase();
    
    let visibleCount = 0;
    const bookItems = bookList.querySelectorAll('.book-item');
    
    bookItems.forEach((item, index) => {
        const bookTitle = books[index].title.toLowerCase();
        if (bookTitle.includes(searchTerm)) {
            item.style.display = 'flex';
            visibleCount++;
        } else {
            item.style.display = 'none';
        }
    });
    
    // Show a message if no books match the search
    const noResultsEl = bookList.querySelector('.no-results');
    if (visibleCount === 0) {
        if (!noResultsEl) {
            const message = document.createElement('div');
            message.className = 'no-results';
            message.textContent = 'No books match your search';
            bookList.appendChild(message);
        }
    } else if (noResultsEl) {
        noResultsEl.remove();
    }
}

// Select clippings file
async function selectClippingsFile() {
    try {
        console.log("Selecting clippings file...");
        const selected = await tauriApi.selectFile();
        
        console.log("File selection result:", selected);
        
        if (selected) {
            clippingsPath = selected;
            fileInfo.textContent = `Selected: ${selected}`;
            
            // Save the path
            tauriApi.saveToStorage('clippingsPath', selected);
            
            // Read and parse the file
            console.log("Reading file content...");
            const content = await tauriApi.readTextFile(selected);
            console.log(`File content loaded (${content.length} characters)`);
            
            parseClippings(content);
            
            updateExportButton();
        } else {
            console.log("No file selected");
        }
    } catch (error) {
        showStatus(`Error selecting file: ${error.message}`, "error");
        console.error('Error selecting file:', error);
    }
}

// Select output directory
async function selectOutputDirectory() {
    try {
        const selected = await tauriApi.selectDirectory();
        
        if (selected) {
            outputDir = selected;
            dirInfo.textContent = `Selected: ${selected}`;
            
            // Save the path
            tauriApi.saveToStorage('outputDir', selected);
            
            updateExportButton();
        }
    } catch (error) {
        showStatus(`Error selecting directory: ${error.message}`, "error");
        console.error('Error selecting directory:', error);
    }
}

// Parse clippings file
function parseClippings(content) {
    try {
        console.log("Starting to parse clippings file...");
        const entries = content.split('==========');
        console.log(`Found ${entries.length} entries in the clippings file`);
        
        const bookMap = {};
        
        // Process entries - in Kindle's My Clippings.txt, newer entries are at the END of the file
        entries.forEach((entry, index) => {
            const lines = entry.trim().split('\n');
            if (lines.length >= 2) {
                const title = lines[0].trim();
                if (title) {
                    if (!bookMap[title]) {
                        bookMap[title] = {
                            highlights: [],
                            latestPosition: -1, // Track the latest position in the file
                        };
                    }
                    
                    if (lines.length >= 3) {
                        const metadata = lines[1].trim();
                        const content = lines.slice(2).join('\n').trim();
                        
                        // Use the entry's position in the file as a proxy for recency
                        // Higher index means more recent in Kindle's format
                        const position = index;
                        
                        // Update book's latest position if this highlight is newer (higher position)
                        if (position > bookMap[title].latestPosition) {
                            bookMap[title].latestPosition = position;
                        }
                        
                        if (content) {
                            bookMap[title].highlights.push({ 
                                metadata, 
                                content,
                                position: position
                            });
                        }
                    }
                }
            }
        });
        
        console.log(`Extracted ${Object.keys(bookMap).length} books from clippings`);
        
        // Convert to array and sort by latest position in the file (newest first)
        books = Object.keys(bookMap).map(title => ({
            title,
            highlights: bookMap[title].highlights,
            latestPosition: bookMap[title].latestPosition,
            selected: false
        })).sort((a, b) => {
            // Sort by latest position - higher number means more recent
            // We want the highest numbers (most recent) at the top
            return b.latestPosition - a.latestPosition;
        });
        
        console.log("Books sorted by latest position in file (newest first)");
        
        // Display books and ensure container is visible
        displayBooks();
        booksContainer.style.display = 'block';
        console.log("Books container display set to block");
        
        showStatus(`Found ${books.length} books with highlights.`, "success");
    } catch (error) {
        showStatus(`Error parsing file: ${error.message}`, "error");
        console.error('Error parsing file:', error);
    }
}

// Display books in the UI
function displayBooks() {
    bookList.innerHTML = '';
    
    if (books.length === 0) {
        bookList.innerHTML = '<p>No books found in the clippings file.</p>';
        return;
    }
    
    books.forEach((book, index) => {
        const bookItem = document.createElement('div');
        bookItem.className = 'book-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `book-${index}`;
        checkbox.checked = book.selected;
        checkbox.addEventListener('change', () => {
            books[index].selected = checkbox.checked;
            updateExportButton();
        });
        
        const label = document.createElement('label');
        label.htmlFor = `book-${index}`;
        label.textContent = `${book.title} (${book.highlights.length} highlights)`;
        
        bookItem.appendChild(checkbox);
        bookItem.appendChild(label);
        bookList.appendChild(bookItem);
    });
}

// Select all books
function selectAllBooks() {
    books.forEach(book => book.selected = true);
    displayBooks();
    updateExportButton();
}

// Deselect all books
function deselectAllBooks() {
    books.forEach(book => book.selected = false);
    displayBooks();
    updateExportButton();
}

// Update export button state
function updateExportButton() {
    const hasSelectedBooks = books.some(book => book.selected);
    exportBtn.disabled = !outputDir || !hasSelectedBooks;
}

// Export highlights
async function exportHighlights() {
    try {
        const selectedBooks = books.filter(book => book.selected);
        
        if (selectedBooks.length === 0) {
            showStatus('No books selected for export.', "error");
            return;
        }
        
        // Show "in progress" message
        showStatus(`Exporting ${selectedBooks.length} books...`, "progress");
        
        let successCount = 0;
        let exportedTitles = [];
        
        for (const book of selectedBooks) {
            // Create sanitized filename
            const sanitizedTitle = book.title
                .replace(/[\\/:*?"<>|]/g, '_')
                .replace(/\s+/g, ' ')
                .trim();
            
            // Format content
            let content = `# ${book.title}\n\n`;
            
            book.highlights.forEach(highlight => {
                content += `> ${highlight.content}\n\n`;
                content += `*${highlight.metadata}*\n\n---\n\n`;
            });
            
            // Create file path
            const filePath = await tauriApi.joinPaths(outputDir, `${sanitizedTitle}.md`);
            
            // Write to file
            await tauriApi.writeTextFile(filePath, content);
            successCount++;
            exportedTitles.push(book.title);
        }
        
        // Create a detailed success message
        let successMessage = `Successfully exported ${successCount} books to:\n${outputDir}`;
        
        // Add the CSS class for success messages
        showStatus(successMessage, "success");
        
        // Create a more detailed popup alert
        const bookList = exportedTitles.length > 5 
            ? exportedTitles.slice(0, 5).join("\n• ") + `\n• ... and ${exportedTitles.length - 5} more`
            : exportedTitles.join("\n• ");
        
        alert(`Export Complete!\n\n${successCount} books exported to:\n${outputDir}\n\nBooks exported:\n• ${bookList}`);
    } catch (error) {
        showStatus(`Error exporting highlights: ${error.message}`, "error");
        console.error('Error exporting highlights:', error);
    }
}

// Show status message
function showStatus(message, type) {
    statusMsg.textContent = message;
    statusMsg.className = `status ${type}`;
    statusMsg.style.display = 'block';
    
    // Only auto-hide success messages
    if (type === "success") {
        setTimeout(() => {
            statusMsg.style.display = 'none';
        }, 5000);
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
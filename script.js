// Firebase Imports - Use the latest modular syntax
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { 
    getAuth, 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { 
    getDatabase, 
    ref, 
    onValue, 
    set, 
    update, 
    remove, 
    push 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";

// Firebase Configuration (provided by the user)
const firebaseConfig = {
    apiKey: "AIzaSyD0DILWmp5gzZojL7e3NpgLuiHAXpgX1bo",
    authDomain: "perryclipboard.firebaseapp.com",
    databaseURL: "https://perryclipboard-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "perryclipboard",
    storageBucket: "perryclipboard.firebasestorage.com",
    messagingSenderId: "757683406667",
    appId: "1:757683406667:web:c24f01c8755bfc5041cace"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
const auth = getAuth(app); // Get Auth service instance
const db = getDatabase(app); // Get Realtime Database service instance

let currentUserId = null;
let unsubscribeFromMessages = null; // To store the unsubscribe function for onValue

// Get references to HTML elements
const messageInput = document.getElementById('messageInput');
const saveButton = document.getElementById('saveButton');
const messageColumn1 = document.getElementById('messageColumn1');
const messageColumn2 = document.getElementById('messageColumn2');
const messageColumn3 = document.getElementById('messageColumn3');
const charCount = document.getElementById('charCount');
const messageCount = document.getElementById('messageCount');
const debugMessage = document.getElementById('debugMessage');
const searchInput = document.getElementById('searchInput');
const searchResultsModal = document.getElementById('searchResultsModal');
const searchResultsList = document.getElementById('searchResultsList');
const searchCloseButton = document.getElementById('searchCloseButton');
const noSearchResults = document.getElementById('noSearchResults');

const prevPageButton = document.getElementById('prevPageButton');
const nextPageButton = document.getElementById('nextPageButton');
const pageInfo = document.getElementById('pageInfo');

// Auth UI elements
const authSection = document.getElementById('authSection');
const loggedInSection = document.getElementById('loggedInSection');
const authForm = document.getElementById('authForm'); // Get the form element
const authEmailInput = document.getElementById('authEmail');
const authPasswordInput = document.getElementById('authPassword');
const confirmAuthPasswordInput = document.getElementById('confirmAuthPassword');
const loginButton = document.getElementById('loginButton');
const registerButton = document.getElementById('registerButton');
const logoutButton = document.getElementById('logoutButton');
const userEmailSpan = document.getElementById('userEmail');
const authErrorDisplay = document.getElementById('authError');

// Clipboard content sections
const clipboardContent = document.getElementById('clipboardContent');
const messageDisplaySection = document.getElementById('messageDisplaySection');

let messages = [];
const messagesPerPage = 30;
let currentPage = 0;

// Define a palette of colors for the badges, similar to a rainbow spectrum
const badgeColors = [
    '#FF69B4', // Hot Pink (for 1, similar to user's "pink")
    '#8A2BE2', // Blue Violet (for 2, similar to user's "purple")
    '#00BFFF', // Deep Sky Blue (for 3)
    '#32CD32', // Lime Green (for 4)
    '#FFD700', // Gold (for 5)
    '#FF4500', // Orange Red (for 6)
    '#DA70D6', // Orchid (for 7)
    '#BA55D3', // Medium Orchid (for 8)
    '#4682B4', // Steel Blue (for 9)
    '#6A5ACD', // Slate Blue (for 10)
    '#ADFF2F', // Green Yellow (for 11)
    '#FFA07A', // Light Salmon (for 12)
    '#20B2AA', // Light Sea Green (for 13)
    '#DC143C', // Crimson (for 14)
    '#800000'  // Maroon (for 15+)
];

/**
 * Clears authentication error message.
 */
function clearAuthError() {
    authErrorDisplay.textContent = '';
}

/**
 * Handles user registration.
 */
registerButton.addEventListener('click', async (e) => {
    e.preventDefault(); // Prevent default form submission initially
    const email = authEmailInput.value.trim();
    const password = authPasswordInput.value.trim();
    const confirmPassword = confirmAuthPasswordInput.value.trim();
    clearAuthError();

    // If confirm password field is hidden, show it and return
    if (confirmAuthPasswordInput.classList.contains('hidden')) {
        confirmAuthPasswordInput.classList.remove('hidden');
        confirmAuthPasswordInput.focus();
        return;
    }

    if (!email || !password || !confirmPassword) {
        authErrorDisplay.textContent = 'All fields are required.';
        return;
    }
    if (password !== confirmPassword) {
        authErrorDisplay.textContent = 'Passwords do not match.';
        return;
    }
    try {
        // Use createUserWithEmailAndPassword from modular SDK
        await createUserWithEmailAndPassword(auth, email, password);
        showNotification('Registration successful! You are now logged in.');
    } catch (error) {
        console.error("Registration error:", error); // Log full error object
        authErrorDisplay.textContent = error.message;
    }
});

/**
 * Handles user login.
 */
const handleLogin = async () => {
    const email = authEmailInput.value.trim();
    const password = authPasswordInput.value.trim();
    clearAuthError();
    // Ensure confirm password field is hidden when logging in
    confirmAuthPasswordInput.classList.add('hidden');
    if (!email || !password) {
        authErrorDisplay.textContent = 'Email and password cannot be empty.';
        return;
    }
    try {
        // Use signInWithEmailAndPassword from modular SDK
        await signInWithEmailAndPassword(auth, email, password);
        showNotification('Logged in successfully! ✨');
    } catch (error) {
        console.error("Login error:", error); // Log full error object
        authErrorDisplay.textContent = error.message;
    }
};

// Modify login button to use form submission, but also keep its direct click handler for consistency
loginButton.addEventListener('click', handleLogin);

// Add form submit listener
authForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent default form submission
    // For now, let's just trigger login if the form is submitted by pressing Enter in an input field.
    handleLogin();
});


/**
 * Handles user logout.
 */
logoutButton.addEventListener('click', async () => {
    try {
        // Use signOut from modular SDK
        await signOut(auth);
        showNotification('Logged out successfully.');
    } catch (error) {
        console.error("Logout error:", error);
        showNotification('Error logging out.');
    }
});

/**
 * Listens for Firebase authentication state changes.
 */
// Use onAuthStateChanged from modular SDK
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserId = user.uid;
        userEmailSpan.textContent = user.email;
        // Also log to console for debugging
        console.log("User logged in:", user.email, "UID:", user.uid);
        authSection.classList.add('hidden');
        loggedInSection.classList.remove('hidden');
        clipboardContent.classList.remove('hidden');
        messageDisplaySection.classList.remove('hidden');
        loadMessages(); // Load messages for the logged-in user
    } else {
        currentUserId = null;
        messages = []; // Clear messages when logged out
        if (unsubscribeFromMessages) {
            unsubscribeFromMessages(); // Unsubscribe from previous listener
            unsubscribeFromMessages = null;
        }
        authEmailInput.value = '';
        authPasswordInput.value = '';
        // Clear and hide confirm password input
        confirmAuthPasswordInput.value = '';
        confirmAuthPasswordInput.classList.add('hidden');
        authSection.classList.remove('hidden');
        loggedInSection.classList.add('hidden');
        clipboardContent.classList.add('hidden');
        messageDisplaySection.classList.add('hidden');
        updateMessageList(); // Clear displayed messages
        updatePaginationControls();
        console.log("User logged out.");
    }
});

/**
 * Loads messages from Firebase Realtime Database.
 */
function loadMessages() {
    if (!currentUserId) {
        console.log("No user logged in, cannot load messages.");
        return;
    }

    // Unsubscribe from any previous listener to avoid multiple listeners
    if (unsubscribeFromMessages) {
        unsubscribeFromMessages();
    }

    // Use ref and onValue from modular SDK
    const userMessagesRef = ref(db, `users/${currentUserId}/messages`);
    unsubscribeFromMessages = onValue(userMessagesRef, (snapshot) => {
        messages = []; // Clear current messages
        snapshot.forEach((childSnapshot) => {
            const messageData = childSnapshot.val();
            messages.push({
                id: childSnapshot.key, // Firebase unique key
                name: messageData.name,
                content: messageData.content,
                timestamp: messageData.timestamp,
                copyCount: messageData.copyCount || 0
            });
        });
        updateMessageList(); // Sort and render
        updatePaginationControls();
        saveButton.disabled = messageInput.value.length === 0;
    }, (error) => {
        console.error("Error loading messages from Firebase:", error);
        showNotification('Error loading messages.');
    });
}

/**
 * Saves the current messages array to Firebase Realtime Database.
 * For new messages, this is called after the name input modal confirms.
 * For updates, directly updates the specific message.
 */
function saveMessageToFirebase(messageObj) {
    if (!currentUserId) {
        showNotification('Please log in to save messages.');
        return;
    }

    // Use ref and set from modular SDK
    const messageRef = ref(db, `users/${currentUserId}/messages/${messageObj.id}`);
    set(messageRef, {
        name: messageObj.name,
        content: messageObj.content,
        timestamp: messageObj.timestamp,
        copyCount: messageObj.copyCount
    })
    .then(() => {
        // Message list will be updated by the onValue listener, no need to call updateMessageList here
        // showNotification('Message saved successfully! ✨'); // Notification moved to showNameInputModal
    })
    .catch((error) => {
        console.error("Error saving message to Firebase:", error);
        showNotification('Error: Could not save message to Firebase.');
    });
}

/**
 * Displays a floating notification.
 */
function showNotification(messageText) {
    const notification = document.createElement('div');
    notification.className = 'floating-notification';
    notification.textContent = messageText;
    document.body.appendChild(notification);
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.style.animationName = 'notificationSlideOut'; // Assuming you add a slideOut animation
            notification.style.animationDuration = '0.4s';
            notification.style.animationTimingFunction = 'ease';
            notification.style.animationFillMode = 'forwards';

            setTimeout(() => {
                if (document.body.contains(notification)) {
                    notification.remove();
                }
            }, 400);
        }
    }, 2000);
}


/**
 * Creates a message object with name, content, timestamp, and initial copyCount.
 */
function showNameInputModal(messageText) {
    const existingOverlay = document.querySelector('.modal-overlay');
    if (existingOverlay) existingOverlay.remove();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay fixed inset-0 flex items-center justify-center z-50';
    const modal = document.createElement('div');
    modal.className = 'modal-content fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-3xl p-8 max-w-md w-full mx-4';
    modal.innerHTML = `
        <div class="text-center mb-6">
            <div class="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center"><span class="text-2xl">🏷️</span></div>
            <h3 class="text-xl font-semibold text-gray-800 mb-2">Name Your Message</h3>
            <p class="text-gray-600 text-sm mb-4">Give your message a memorable name</p>
            <input type="text" id="messageNameInput" class="input-field w-full p-3 rounded-xl focus:outline-none" placeholder="Enter message name..." maxlength="30"/>
            <p class="text-xs text-gray-500 mt-2">Max 30 characters</p>
        </div>
        <div class="flex space-x-3">
            <button class="cancel-button action-button flex-1 text-white px-4 py-3 rounded-xl font-medium">Cancel</button>
            <button class="primary-button action-button flex-1 text-white px-4 py-3 rounded-xl font-medium">Save</button>
        </div>`;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const nameInput = modal.querySelector('#messageNameInput');
    const saveBtn = modal.querySelector('.primary-button');
    const cancelBtn = modal.querySelector('.cancel-button');

    nameInput.focus();
    const suggestedName = messageText.substring(0, 25) + (messageText.length > 25 ? '...' : '');
    nameInput.value = suggestedName;
    nameInput.select();

    saveBtn.addEventListener('click', () => {
        const name = nameInput.value.trim();
        if (name) {
            if (!currentUserId) {
                showNotification('Please log in to save messages.');
                if (document.body.contains(overlay)) overlay.remove();
                return;
            }
            // Use push from modular SDK to get a new unique key
            const newMessageRef = push(ref(db, `users/${currentUserId}/messages`)); 
            const messageObj = {
                id: newMessageRef.key, // Store the Firebase generated key
                name: name,
                content: messageText,
                timestamp: Date.now(),
                copyCount: 0
            };
            // Use set from modular SDK
            set(newMessageRef, messageObj) 
            .then(() => {
                // The onValue listener will automatically update the `messages` array and UI
                messageInput.value = '';
                charCount.textContent = `0 characters`;
                saveButton.disabled = true;
                showNotification('Message saved successfully! ✨');
                if (document.body.contains(overlay)) overlay.remove();
            })
            .catch((error) => {
                console.error("Error adding message to Firebase:", error);
                showNotification('Error saving message.');
                if (document.body.contains(overlay)) overlay.remove();
            });
        } else {
            nameInput.focus();
            nameInput.style.borderColor = '#ef4444';
            setTimeout(() => nameInput.style.borderColor = '', 2000);
        }
    });

    cancelBtn.addEventListener('click', () => { if (document.body.contains(overlay)) overlay.remove(); });
    overlay.addEventListener('click', (e) => { if (e.target === overlay && document.body.contains(overlay)) overlay.remove(); });
    nameInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') saveBtn.click(); });
}

/**
 * Shows a confirmation modal before deleting a message.
 */
function showWarningMessage(messageId, messageName) {
    const existingOverlay = document.querySelector('.modal-overlay');
    if (existingOverlay) existingOverlay.remove();
    
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay fixed inset-0 flex items-center justify-center z-50';
    const modal = document.createElement('div');
    modal.className = 'modal-content fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-3xl p-8 max-w-sm w-full mx-4 text-center';
    modal.innerHTML = `
        <div class="mb-6">
            <div class="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center"><span class="text-2xl">🗑️</span></div>
            <h3 class="text-xl font-semibold text-gray-800 mb-2">Delete Message</h3>
            <p class="text-gray-600">Are you sure you want to delete "${messageName}"? This action cannot be undone.</p>
        </div>
        <div class="flex space-x-3">
            <button class="cancel-button action-button flex-1 text-white px-4 py-3 rounded-xl font-medium">Cancel</button>
            <button class="delete-button action-button flex-1 text-white px-4 py-3 rounded-xl font-medium">Delete</button>
        </div>`;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    modal.querySelector('.delete-button').addEventListener('click', () => {
        deleteMessage(messageId);
        if (document.body.contains(overlay)) overlay.remove();
        showNotification('Message deleted successfully!');
    });
    modal.querySelector('.cancel-button').addEventListener('click', () => { if (document.body.contains(overlay)) overlay.remove(); });
    overlay.addEventListener('click', (e) => { if (e.target === overlay && document.body.contains(overlay)) closeSearchResults(); });
}

messageInput.addEventListener('input', () => {
    const currentLength = messageInput.value.length;
    charCount.textContent = `${currentLength} characters`;
    saveButton.disabled = currentLength === 0;
});

saveButton.addEventListener('click', () => {
    const message = messageInput.value.trim();
    if (message) showNameInputModal(message);
});

/**
 * Generates the content and the appropriate color class for the copy count badge.
 * Uses standard numbers for clarity.
 * @param {number} count - The copy count.
 * @returns {object} An object containing the badge content and the CSS class.
 */
function getCopyBadgeInfo(count) {
    if (count <= 0) return { content: '', className: '' };
    const displayCount = count > 99 ? '99+' : count.toString();
    // Use modulo to cycle through the badgeColors array
    const colorClassIndex = (count - 1) % badgeColors.length; // -1 to map 1 to index 0, 2 to index 1, etc.
    return {
        content: displayCount,
        className: `badge-color-${colorClassIndex}`
    };
}

/**
 * Updates the displayed message list: sorts, paginates, and renders messages.
 */
function updateMessageList() {
    messageColumn1.innerHTML = '';
    messageColumn2.innerHTML = '';
    messageColumn3.innerHTML = '';
    
    // Sort messages: by copyCount descending, then by timestamp descending (newest first)
    messages.sort((a, b) => {
        const countA = a.copyCount || 0;
        const countB = b.copyCount || 0;
        if (countB !== countA) {
            return countB - countA;
        }
        return (b.timestamp || 0) - (a.timestamp || 0);
    });

    const startIdx = currentPage * messagesPerPage;
    const endIdx = startIdx + messagesPerPage;
    const messagesToDisplay = messages.slice(startIdx, endIdx);

    messagesToDisplay.forEach((msgObj, localIndex) => {
        // Ensure msgObj is well-formed
        if (!msgObj || typeof msgObj.name === 'undefined' || typeof msgObj.content === 'undefined') {
            console.warn("Malformed message object during render:", msgObj);
            return; // Skip rendering malformed message
        }

        const messageName = msgObj.name;
        const messageContent = msgObj.content;
        const copyCount = msgObj.copyCount || 0;
        const badgeInfo = getCopyBadgeInfo(copyCount);
        
        const messageContainer = document.createElement('div');
        messageContainer.className = 'message-container relative';
        messageContainer.dataset.messageId = msgObj.id; // Store Firebase ID

        const button = document.createElement('button');
        button.className = 'message-button w-full text-left p-3 rounded-xl relative font-medium min-h-[60px] flex items-center pr-20';
        button.innerHTML = `
            <div class="w-full">
                <div class="font-semibold text-gray-800 truncate text-sm">${highlightKeywords(messageName, [])}</div>
                <div class="text-xs text-gray-500 truncate mt-1">${highlightKeywords((messageContent.length > 30 ? messageContent.substring(0, 30) + '...' : messageContent), [])}</div>
            </div>
            ${badgeInfo.content ? `<span class="copy-count-badge ${badgeInfo.className}">${badgeInfo.content}</span>` : ''}
        `;
        button.title = `${messageName}\n\n${messageContent}`;
        button.addEventListener('click', () => {
            copyToClipboard(msgObj, button);
        });

        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'message-actions';
        const editButton = document.createElement('button');
        editButton.className = 'edit-button action-button text-white px-2 py-1 rounded-lg font-medium text-xs';
        editButton.textContent = 'Edit';
        editButton.addEventListener('click', (e) => {
            e.stopPropagation();
            editMessage(msgObj.id, msgObj, messageContainer); // Pass message ID and object
        });
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-button action-button text-white px-2 py-1 rounded-lg font-medium text-xs';
        deleteButton.textContent = 'Del';
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            showWarningMessage(msgObj.id, msgObj.name); // Pass message ID and name for warning
        });
        actionsContainer.appendChild(editButton);
        actionsContainer.appendChild(deleteButton);
        messageContainer.appendChild(button);
        messageContainer.appendChild(actionsContainer);
        
        if (localIndex < 10) messageColumn1.appendChild(messageContainer);
        else if (localIndex < 20) messageColumn2.appendChild(messageContainer);
        else messageColumn3.appendChild(messageContainer);
    });
    messageCount.textContent = `${messages.length} total messages`;
    updatePaginationControls();
}

/**
 * Copies text, increments count in Firebase, and triggers re-render via listener.
 * @param {object} messageObjectToCopy - The message object.
 * @param {HTMLElement} buttonElement - The button clicked.
 */
async function copyToClipboard(messageObjectToCopy, buttonElement) {
    const textToCopy = messageObjectToCopy.content;
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(textToCopy);
        } else {
            // Fallback for non-secure contexts or older browsers: Use document.execCommand('copy')
            // This is especially relevant in iframes where navigator.clipboard might not be available
            const textarea = document.createElement('textarea');
            textarea.value = textToCopy;
            textarea.style.position = 'fixed'; // Prevents scrolling to the bottom of the page
            textarea.style.opacity = '0'; // Makes the textarea invisible
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            const successful = document.execCommand('copy');
            document.body.removeChild(textarea); // Clean up the textarea
            if (!successful) throw new Error('Fallback copy command failed');
        }
        
        if (currentUserId && messageObjectToCopy.id) {
            // Use update from modular SDK
            const messageRef = ref(db, `users/${currentUserId}/messages/${messageObjectToCopy.id}`);
            const newCopyCount = (messageObjectToCopy.copyCount || 0) + 1;
            await update(messageRef, { copyCount: newCopyCount });
            showNotification('Message copied! Count updated. ✨');
            // updateMessageList will be called by the onValue listener
        } else {
             showNotification('Message copied! (Count not updated - not logged in or invalid message ID)');
        }

    } catch (err) {
        console.error('Failed to copy:', err);
        if (buttonElement && document.body.contains(buttonElement)) {
            buttonElement.classList.add('copy-failed');
            setTimeout(() => { if (document.body.contains(buttonElement)) buttonElement.classList.remove('copy-failed'); }, 3000);
        }
        debugMessage.textContent = 'Copy failed. Ensure HTTPS or try another browser.';
        debugMessage.classList.remove('hidden');
        setTimeout(() => { debugMessage.classList.add('hidden'); }, 5000);
    }
}

/**
 * Enables editing of an existing message in Firebase.
 * @param {string} messageId - The Firebase ID of the message.
 * @param {object} currentMessage - The current message object.
 * @param {HTMLElement} container - The HTML container of the message.
 */
function editMessage(messageId, currentMessage, container) {
    if (!currentUserId || !messageId) {
        showNotification('Cannot edit. Not logged in or invalid message.');
        return;
    }
    
    const currentContent = currentMessage.content;
    const currentName = currentMessage.name;
    
    container.innerHTML = '';
    container.className = 'bg-white p-4 rounded-2xl border-2 border-indigo-300 shadow-lg';
    
    const nameInput = document.createElement('input');
    nameInput.className = 'input-field w-full p-2 rounded-lg focus:outline-none mb-2 text-sm border-gray-300';
    nameInput.value = currentName; nameInput.placeholder = 'Message name...'; nameInput.maxLength = 30;
    const contentInput = document.createElement('textarea');
    contentInput.className = 'input-field w-full p-2 rounded-lg focus:outline-none resize-none mb-2 text-sm border-gray-300';
    contentInput.value = currentContent; contentInput.rows = 3; contentInput.placeholder = 'Edit message...';

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'flex space-x-2 mt-2';
    const saveEditButton = document.createElement('button');
    saveEditButton.className = 'save-edit-button action-button text-white px-3 py-1.5 rounded-lg font-medium text-xs flex-1';
    saveEditButton.textContent = '💾 Save';
    saveEditButton.addEventListener('click', async () => {
        const newName = nameInput.value.trim();
        const newContent = contentInput.value.trim();
        if (newName && newContent) {
            // Use update from modular SDK
            const messageToUpdateRef = ref(db, `users/${currentUserId}/messages/${messageId}`);
            try {
                await update(messageToUpdateRef, {
                    name: newName,
                    content: newContent
                });
                showNotification('Message updated! ✨');
                // The onValue listener will handle re-rendering
            } catch (error) {
                console.error("Error updating message in Firebase:", error);
                showNotification('Error updating message.');
            }
        } else {
            showNotification('Name and message cannot be empty.');
        }
    });
    const cancelButton = document.createElement('button');
    cancelButton.className = 'cancel-button action-button text-white px-3 py-1.5 rounded-lg font-medium text-xs flex-1';
    cancelButton.textContent = '❌ Cancel';
    cancelButton.addEventListener('click', () => updateMessageList());
    buttonContainer.appendChild(saveEditButton); buttonContainer.appendChild(cancelButton);
    container.appendChild(nameInput); container.appendChild(contentInput); container.appendChild(buttonContainer);
    nameInput.focus(); nameInput.setSelectionRange(nameInput.value.length, nameInput.value.length);
}

/**
 * Deletes a message from Firebase and updates UI.
 * @param {string} messageId - The Firebase ID of the message to delete.
 */
async function deleteMessage(messageId) {
    if (!currentUserId || !messageId) {
        showNotification('Cannot delete. Not logged in or invalid message.');
        return;
    }
    try {
        // Use remove from modular SDK
        const messageToDeleteRef = ref(db, `users/${currentUserId}/messages/${messageId}`);
        await remove(messageToDeleteRef);
        // The onValue listener will automatically update the `messages` array and UI
        const totalPages = Math.max(1, Math.ceil((messages.length - 1) / messagesPerPage));
        if (currentPage >= totalPages && currentPage > 0) {
            currentPage = totalPages - 1;
        }
        updatePaginationControls(); // Update pagination after deletion
        saveButton.disabled = messageInput.value.length === 0;
    } catch (error) {
        console.error("Error deleting message from Firebase:", error);
        showNotification('Error deleting message.');
    }
}

// --- Search Logic ---
searchInput.addEventListener('input', () => {
    const searchTerm = searchInput.value.toLowerCase().trim();
    if (searchTerm.length > 0) {
        const keywords = searchTerm.split(' ').filter(word => word.length > 0);
        const filteredMessages = messages.filter(msg => {
            const messageNameLower = (msg.name || '').toLowerCase();
            const messageContentLower = (msg.content || '').toLowerCase();
            return keywords.every(keyword =>
                messageNameLower.includes(keyword) || messageContentLower.includes(keyword)
            );
        });
        displaySearchResults(filteredMessages, keywords);
    } else {
        closeSearchResults();
    }
});

searchCloseButton.addEventListener('click', closeSearchResults);
searchResultsModal.addEventListener('click', (e) => { if (e.target === searchResultsModal) closeSearchResults(); });

/**
 * Highlights keywords within a given text.
 * @param {string} text The original text.
 * @param {string[]} keywords An array of keywords to highlight.
 * @returns {string} The text with keywords wrapped in highlight spans.
 */
function highlightKeywords(text, keywords) {
    let highlightedText = text;
    keywords.forEach(keyword => {
        const regex = new RegExp(`(${keyword})`, 'gi');
        highlightedText = highlightedText.replace(regex, '<span class="highlight">$1</span>');
    });
    return highlightedText;
}

function displaySearchResults(results, keywords = []) {
    searchResultsList.innerHTML = '';
    noSearchResults.classList.toggle('hidden', results.length > 0);
    results.forEach(msg => {
        const resultItem = document.createElement('div');
        resultItem.className = 'search-result-item';

        const highlightedName = highlightKeywords(msg.name || 'Untitled', keywords);
        const highlightedContent = highlightKeywords((msg.content || '').substring(0,100), keywords);

        resultItem.innerHTML = `
            <div class="search-result-name">${highlightedName}</div>
            <div class="search-result-content">${highlightedContent}${(msg.content && msg.content.length > 100) ? '...' : ''}</div>`;
        resultItem.addEventListener('click', () => {
            copyToClipboard(msg, resultItem);
            closeSearchResults();
        });
        searchResultsList.appendChild(resultItem);
    });
    searchResultsModal.classList.add('active');
}

function closeSearchResults() {
    searchResultsModal.classList.remove('active');
    searchResultsList.innerHTML = '';
    noSearchResults.classList.add('hidden');
}

// --- Pagination Logic ---
function updatePaginationControls() {
    const totalPages = Math.max(1, Math.ceil(messages.length / messagesPerPage));
    pageInfo.textContent = `Page ${currentPage + 1} of ${totalPages}`;
    prevPageButton.disabled = currentPage === 0;
    nextPageButton.disabled = currentPage >= totalPages - 1;
}

prevPageButton.addEventListener('click', () => {
    if (currentPage > 0) { currentPage--; updateMessageList(); }
});
nextPageButton.addEventListener('click', () => {
    const totalPages = Math.ceil(messages.length / messagesPerPage);
    if (currentPage < totalPages - 1) { currentPage++; updateMessageList(); }
});

// Initial setup handled by onAuthStateChanged

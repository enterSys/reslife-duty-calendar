// API configuration
const API_URL = '/api';
let authToken = localStorage.getItem('token');
let currentUser = JSON.parse(localStorage.getItem('user') || 'null');

// Authentication check
function checkAuth() {
    if (!authToken || !currentUser) {
        window.location.href = 'auth.html';
        return false;
    }
    return true;
}

// API request helper
async function apiRequest(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers
        });

        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'auth.html';
            return;
        }

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'API request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API request error:', error);
        throw error;
    }
}

// Enhanced calendar functionality
let currentDate = new Date();
let selectedDate = null;
let duties = [];
let swapRequests = [];

// Initialize the application
async function init() {
    if (!checkAuth()) return;
    
    document.getElementById('user-name').textContent = currentUser.fullName;
    
    await loadDuties();
    await loadSwapRequests();
    renderCalendar();
    setupEventListeners();
}

// Load duties from API
async function loadDuties() {
    try {
        const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        
        duties = await apiRequest(`/duties?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`);
    } catch (error) {
        showNotification('Failed to load duties', 'error');
    }
}

// Load swap requests
async function loadSwapRequests() {
    try {
        swapRequests = await apiRequest('/swaps');
    } catch (error) {
        console.error('Failed to load swap requests:', error);
    }
}

// Render calendar
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    document.getElementById('currentMonth').textContent = 
        new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = '';
    
    // Add day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-header';
        header.textContent = day;
        calendarGrid.appendChild(header);
    });
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendarGrid.appendChild(emptyDay);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayDuties = duties.filter(d => d.duty_date.startsWith(dateStr));
        
        // Check if current user has duty
        const userDuty = dayDuties.find(d => d.user_id === currentUser.id);
        if (userDuty) {
            dayElement.classList.add('has-duty');
        }
        
        // Check for pending swaps
        const pendingSwap = swapRequests.find(s => 
            s.status === 'pending' && 
            (s.requester_duty_date === dateStr || s.requested_duty_date === dateStr)
        );
        if (pendingSwap) {
            dayElement.classList.add('has-swap-pending');
        }
        
        dayElement.innerHTML = `
            <div class="day-number">${day}</div>
            ${dayDuties.length > 0 ? `<div class="duty-indicator">${dayDuties.map(d => d.full_name).join(', ')}</div>` : ''}
        `;
        
        dayElement.addEventListener('click', () => selectDate(dateStr));
        calendarGrid.appendChild(dayElement);
    }
}

// Select a date
function selectDate(dateStr) {
    selectedDate = dateStr;
    showDayDetails(dateStr);
}

// Show day details
function showDayDetails(dateStr) {
    const dayDuties = duties.filter(d => d.duty_date.startsWith(dateStr));
    const modal = document.getElementById('dayDetailsModal');
    const content = document.getElementById('dayDetailsContent');
    
    content.innerHTML = `
        <h3>${new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
        <div class="duties-list">
            ${dayDuties.length === 0 ? '<p>No duties scheduled</p>' : ''}
            ${dayDuties.map(duty => `
                <div class="duty-item">
                    <strong>${duty.full_name}</strong> - ${duty.duty_type}
                    ${duty.notes ? `<br><small>${duty.notes}</small>` : ''}
                    ${duty.user_id === currentUser.id ? 
                        `<button onclick="requestSwap(${duty.id})" class="btn-small">Request Swap</button>` : 
                        ''}
                </div>
            `).join('')}
        </div>
    `;
    
    modal.style.display = 'block';
}

// Request duty swap
async function requestSwap(dutyId) {
    const modal = document.getElementById('swapRequestModal');
    document.getElementById('requesterDutyId').value = dutyId;
    
    // Load available duties for swap
    const availableDuties = duties.filter(d => d.user_id !== currentUser.id);
    const select = document.getElementById('requestedDutyId');
    select.innerHTML = availableDuties.map(d => 
        `<option value="${d.id}">${d.duty_date} - ${d.full_name} (${d.duty_type})</option>`
    ).join('');
    
    modal.style.display = 'block';
}

// Submit swap request
async function submitSwapRequest() {
    const requesterDutyId = document.getElementById('requesterDutyId').value;
    const requestedDutyId = document.getElementById('requestedDutyId').value;
    const reason = document.getElementById('swapReason').value;
    
    try {
        await apiRequest('/swaps', {
            method: 'POST',
            body: JSON.stringify({ requesterDutyId, requestedDutyId, reason })
        });
        
        showNotification('Swap request sent successfully');
        document.getElementById('swapRequestModal').style.display = 'none';
        await loadSwapRequests();
        updateSwapRequestsList();
    } catch (error) {
        showNotification('Failed to send swap request', 'error');
    }
}

// Update swap requests list
function updateSwapRequestsList() {
    const container = document.getElementById('swapRequestsList');
    const pending = swapRequests.filter(s => s.status === 'pending');
    
    container.innerHTML = `
        <h3>Pending Swap Requests</h3>
        ${pending.length === 0 ? '<p>No pending swap requests</p>' : ''}
        ${pending.map(swap => `
            <div class="swap-request-item">
                <div class="swap-info">
                    <strong>${swap.requester_name}</strong> wants to swap<br>
                    ${swap.requester_duty_date} (${swap.requester_duty_type})<br>
                    for ${swap.requested_duty_date} (${swap.requested_duty_type})
                    ${swap.reason ? `<br><small>Reason: ${swap.reason}</small>` : ''}
                </div>
                ${swap.requested_with_id === currentUser.id ? `
                    <div class="swap-actions">
                        <button onclick="respondToSwap(${swap.id}, true)" class="btn-accept">Accept</button>
                        <button onclick="respondToSwap(${swap.id}, false)" class="btn-reject">Reject</button>
                    </div>
                ` : swap.requester_id === currentUser.id ? `
                    <div class="swap-status">Waiting for response</div>
                    <button onclick="cancelSwap(${swap.id})" class="btn-cancel">Cancel</button>
                ` : ''}
            </div>
        `).join('')}
    `;
}

// Respond to swap request
async function respondToSwap(swapId, accept) {
    try {
        await apiRequest(`/swaps/${swapId}/respond`, {
            method: 'PUT',
            body: JSON.stringify({ accept })
        });
        
        showNotification(`Swap request ${accept ? 'accepted' : 'rejected'}`);
        await loadDuties();
        await loadSwapRequests();
        renderCalendar();
        updateSwapRequestsList();
    } catch (error) {
        showNotification('Failed to respond to swap request', 'error');
    }
}

// Cancel swap request
async function cancelSwap(swapId) {
    try {
        await apiRequest(`/swaps/${swapId}`, { method: 'DELETE' });
        showNotification('Swap request cancelled');
        await loadSwapRequests();
        updateSwapRequestsList();
    } catch (error) {
        showNotification('Failed to cancel swap request', 'error');
    }
}

// Calendar subscription
async function createCalendarSubscription() {
    const name = document.getElementById('subscriptionName').value;
    const includeAllDuties = document.getElementById('includeAllDuties').checked;
    
    try {
        const subscription = await apiRequest('/calendar/subscribe', {
            method: 'POST',
            body: JSON.stringify({ name, includeAllDuties })
        });
        
        document.getElementById('subscriptionUrl').value = subscription.url;
        document.getElementById('googleCalendarLink').href = subscription.googleCalendarUrl;
        document.getElementById('subscriptionResult').style.display = 'block';
        
        showNotification('Calendar subscription created');
    } catch (error) {
        showNotification('Failed to create subscription', 'error');
    }
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'auth.html';
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        loadDuties().then(() => renderCalendar());
    });
    
    document.getElementById('nextMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        loadDuties().then(() => renderCalendar());
    });
    
    document.getElementById('todayBtn').addEventListener('click', () => {
        currentDate = new Date();
        loadDuties().then(() => renderCalendar());
    });
    
    // Modal close buttons
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal').style.display = 'none';
        });
    });
    
    // Click outside modal to close
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
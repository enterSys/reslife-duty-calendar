// Modern UI JavaScript
const API_URL = '/api';
let authToken = localStorage.getItem('token');
let currentUser = JSON.parse(localStorage.getItem('user') || 'null');
let currentSection = 'dashboard';
let isAdmin = false;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    if (!checkAuth()) return;
    
    await initializeApp();
    setupEventListeners();
    checkNotifications();
    
    // Check for mobile
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('open');
    }
});

// Authentication
function checkAuth() {
    if (!authToken || !currentUser) {
        window.location.href = 'auth.html';
        return false;
    }
    return true;
}

// Initialize Application
async function initializeApp() {
    // Set user info
    document.getElementById('sidebar-user-name').textContent = currentUser.fullName;
    
    // Check if admin
    try {
        const response = await apiRequest('/auth/me');
        isAdmin = response.role === 'admin';
        document.getElementById('sidebar-user-role').textContent = isAdmin ? 'Administrator' : 'Team Member';
        
        // Show/hide admin features
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = isAdmin ? 'flex' : 'none';
        });
    } catch (error) {
        console.error('Failed to get user info:', error);
    }
    
    // Load initial data
    await loadDashboardData();
    renderCalendar();
}

// API Request Helper
async function apiRequest(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        ...options.headers
    };
    
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        showNotification(error.message, 'error');
        throw error;
    }
}

// Section Navigation
function showSection(section) {
    // Update active section
    document.querySelectorAll('.content-section').forEach(el => {
        el.classList.remove('active');
    });
    document.getElementById(`${section}-section`).classList.add('active');
    
    // Update nav
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.remove('active');
    });
    document.querySelector(`.nav-item[href="#${section}"]`).classList.add('active');
    
    // Update page title
    const titles = {
        dashboard: 'Dashboard',
        calendar: 'Calendar',
        'my-duties': 'My Duties',
        swaps: 'Duty Swaps',
        team: 'Team',
        admin: 'Administration'
    };
    document.getElementById('page-title').textContent = titles[section] || 'Dashboard';
    
    currentSection = section;
    
    // Close mobile sidebar
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('open');
    }
    
    // Load section data
    loadSectionData(section);
}

// Load Section Data
async function loadSectionData(section) {
    switch (section) {
        case 'dashboard':
            await loadDashboardData();
            break;
        case 'calendar':
            await loadCalendarData();
            break;
        case 'my-duties':
            await loadMyDuties();
            break;
        case 'swaps':
            await loadSwaps();
            break;
        case 'team':
            await loadTeam();
            break;
        case 'admin':
            if (isAdmin) await loadAdminData();
            break;
    }
}

// Dashboard Data
async function loadDashboardData() {
    try {
        // Load upcoming duties
        const duties = await apiRequest('/duties?userId=' + currentUser.id);
        const upcomingDuties = duties
            .filter(d => new Date(d.duty_date) >= new Date())
            .sort((a, b) => new Date(a.duty_date) - new Date(b.duty_date));
        
        // Update next duty card
        if (upcomingDuties.length > 0) {
            const nextDuty = upcomingDuties[0];
            const daysUntil = Math.ceil((new Date(nextDuty.duty_date) - new Date()) / (1000 * 60 * 60 * 24));
            
            document.getElementById('next-duty-date').textContent = 
                daysUntil === 0 ? 'Today' : 
                daysUntil === 1 ? 'Tomorrow' : 
                `In ${daysUntil} days`;
        }
        
        // Update duty count badge
        document.getElementById('duties-badge').textContent = upcomingDuties.length;
        
        // Load swap requests
        const swaps = await apiRequest('/swaps');
        const pendingSwaps = swaps.filter(s => s.status === 'pending');
        document.getElementById('swaps-badge').textContent = pendingSwaps.length;
        
        // Update timeline
        updateTimeline(upcomingDuties.slice(0, 3));
        
        // Load recent activity
        await loadRecentActivity();
        
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
    }
}

// Update Timeline
function updateTimeline(duties) {
    const timeline = document.querySelector('.timeline');
    timeline.innerHTML = duties.map(duty => {
        const date = new Date(duty.duty_date);
        const isUrgent = (date - new Date()) < (24 * 60 * 60 * 1000);
        
        return `
            <div class="timeline-item ${isUrgent ? 'urgent' : ''}">
                <div class="timeline-marker"></div>
                <div class="timeline-content">
                    <div class="timeline-date">${formatDate(date)}</div>
                    <div class="timeline-title">${duty.duty_type}</div>
                    <div class="timeline-meta">${duty.notes || 'No additional notes'}</div>
                    <button class="btn-small" onclick="requestSwap(${duty.id})">Request Swap</button>
                </div>
            </div>
        `;
    }).join('');
}

// Calendar
let currentDate = new Date();

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Update month display
    document.getElementById('current-month').textContent = 
        new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = '';
    
    // Day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-header';
        header.textContent = day;
        grid.appendChild(header);
    });
    
    // Empty cells
    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-day empty';
        grid.appendChild(empty);
    }
    
    // Days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        
        const cellDate = new Date(year, month, day);
        if (cellDate.getTime() === today.getTime()) {
            dayEl.classList.add('today');
        }
        
        // Check for duties (would be loaded from API)
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        dayEl.innerHTML = `<span>${day}</span>`;
        dayEl.onclick = () => showDayDetails(dateStr);
        
        grid.appendChild(dayEl);
    }
}

function previousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
    loadCalendarData();
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
    loadCalendarData();
}

function goToToday() {
    currentDate = new Date();
    renderCalendar();
    loadCalendarData();
}

// Load Calendar Data
async function loadCalendarData() {
    try {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const startDate = new Date(year, month, 1).toISOString().split('T')[0];
        const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
        
        const duties = await apiRequest(`/duties?startDate=${startDate}&endDate=${endDate}`);
        
        // Update calendar cells with duty data
        duties.forEach(duty => {
            const date = new Date(duty.duty_date);
            const day = date.getDate();
            const cells = document.querySelectorAll('.calendar-day');
            
            cells.forEach(cell => {
                if (cell.textContent == day && !cell.classList.contains('empty')) {
                    if (duty.user_id === currentUser.id) {
                        cell.classList.add('my-duty');
                    }
                    // Add other styling based on duty status
                }
            });
        });
    } catch (error) {
        console.error('Failed to load calendar data:', error);
    }
}

// Notifications
function checkNotifications() {
    // Check for notifications every 30 seconds
    setInterval(async () => {
        try {
            // This would be an API call in real implementation
            const hasNotifications = Math.random() > 0.8; // Simulated
            
            const dot = document.querySelector('.notification-dot');
            dot.style.display = hasNotifications ? 'block' : 'none';
        } catch (error) {
            console.error('Failed to check notifications:', error);
        }
    }, 30000);
}

function showNotifications() {
    document.getElementById('notification-panel').classList.add('open');
}

function closePanel(panelId) {
    document.getElementById(panelId).classList.remove('open');
}

// Show notification toast
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${type === 'error' ? 'var(--danger)' : 'var(--success)'};
        color: white;
        border-radius: var(--radius-sm);
        box-shadow: var(--shadow-lg);
        z-index: 2000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Utility Functions
function formatDate(date) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow';
    } else {
        return date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
        });
    }
}

// Mobile Sidebar Toggle
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

// Settings
function showSettings() {
    // Would open settings modal
    showNotification('Settings coming soon!');
}

// Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'auth.html';
}

// Event Listeners
function setupEventListeners() {
    // Close panels when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('slide-panel')) {
            e.target.classList.remove('open');
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            document.getElementById('sidebar').classList.remove('open');
        }
    });
}

// Admin Functions
async function loadAdminData() {
    try {
        // Load duty distribution chart
        const duties = await apiRequest('/duties');
        const distribution = {};
        
        duties.forEach(duty => {
            distribution[duty.full_name] = (distribution[duty.full_name] || 0) + 1;
        });
        
        // Would render chart here using Chart.js
        console.log('Duty distribution:', distribution);
        
    } catch (error) {
        console.error('Failed to load admin data:', error);
    }
}

function showAssignDuty() {
    showNotification('Duty assignment modal coming soon!');
}

function showBulkAssign() {
    showNotification('Bulk assignment coming soon!');
}

function showTeamManagement() {
    showNotification('Team management coming soon!');
}

function generateReport() {
    showNotification('Report generation coming soon!');
}
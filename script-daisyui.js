// DaisyUI Version JavaScript
const API_URL = '/api';
let authToken = localStorage.getItem('token');
let currentUser = JSON.parse(localStorage.getItem('user') || 'null');
let currentDate = new Date();

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    if (!checkAuth()) return;
    
    await initializeApp();
    setupEventListeners();
    showSection('dashboard');
});

// Authentication
function checkAuth() {
    if (!authToken || !currentUser) {
        window.location.href = 'auth-daisyui.html';
        return false;
    }
    return true;
}

// Initialize Application
async function initializeApp() {
    // Set user info
    document.getElementById('user-name').textContent = currentUser.fullName;
    
    // Check if admin
    try {
        const response = await apiRequest('/auth/me');
        const isAdmin = response.role === 'admin';
        
        // Show/hide admin features
        if (isAdmin) {
            // Add admin menu item
            const menu = document.querySelector('.menu.menu-horizontal') || document.querySelector('.menu.dropdown-content');
            if (menu) {
                const adminItem = document.createElement('li');
                adminItem.innerHTML = '<a href="#admin">Admin</a>';
                menu.appendChild(adminItem);
            }
        }
    } catch (error) {
        console.error('Failed to get user info:', error);
    }
    
    // Load initial data
    await loadDashboardData();
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
        showToast(error.message, 'error');
        throw error;
    }
}

// Section Navigation
function showSection(section) {
    // Hide all sections
    document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
    
    // Show selected section
    const sectionEl = document.getElementById(`${section}-section`);
    if (sectionEl) {
        sectionEl.classList.remove('hidden');
    }
    
    // Update active menu item
    document.querySelectorAll('.menu a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${section}`) {
            link.classList.add('active');
        }
    });
    
    // Close mobile menu
    const dropdown = document.querySelector('.dropdown');
    if (dropdown) {
        dropdown.removeAttribute('open');
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
            renderCalendar();
            await loadCalendarData();
            break;
        case 'admin':
            await loadAdminData();
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
        
        // Update stats
        if (upcomingDuties.length > 0) {
            const nextDuty = upcomingDuties[0];
            const daysUntil = Math.ceil((new Date(nextDuty.duty_date) - new Date()) / (1000 * 60 * 60 * 24));
            
            // Update next duty stat
            const statValue = document.querySelector('.stat-value.text-primary');
            if (statValue) {
                statValue.textContent = daysUntil === 0 ? 'Today' : 
                                       daysUntil === 1 ? 'Tomorrow' : 
                                       `In ${daysUntil} days`;
            }
        }
        
        // Load swap requests
        const swaps = await apiRequest('/swaps');
        const pendingSwaps = swaps.filter(s => s.status === 'pending');
        
        // Update notification badge
        const badge = document.querySelector('.indicator-item.badge');
        if (badge) {
            badge.textContent = pendingSwaps.length;
        }
        
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
    }
}

// Calendar
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
        header.className = 'text-center font-bold p-2';
        header.textContent = day;
        grid.appendChild(header);
    });
    
    // Empty cells
    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'p-2';
        grid.appendChild(empty);
    }
    
    // Days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'p-2 text-center cursor-pointer hover:bg-base-200 rounded-lg transition-colors';
        
        const cellDate = new Date(year, month, day);
        if (cellDate.getTime() === today.getTime()) {
            dayEl.classList.add('ring-2', 'ring-primary', 'font-bold');
        }
        
        dayEl.innerHTML = `<div>${day}</div>`;
        
        grid.appendChild(dayEl);
    }
}

// Calendar Data
async function loadCalendarData() {
    try {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const startDate = new Date(year, month, 1).toISOString().split('T')[0];
        const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
        
        const duties = await apiRequest(`/duties?startDate=${startDate}&endDate=${endDate}`);
        
        // Update calendar cells with duty data
        const cells = document.querySelectorAll('#calendar-grid > div:not(:first-child)');
        duties.forEach(duty => {
            const date = new Date(duty.duty_date);
            const day = date.getDate();
            const cellIndex = day + 6 + new Date(year, month, 1).getDay();
            
            if (cells[cellIndex]) {
                const cell = cells[cellIndex];
                
                if (duty.user_id === currentUser.id) {
                    cell.innerHTML += '<div class="badge badge-primary badge-xs mt-1">My Duty</div>';
                } else {
                    cell.innerHTML += '<div class="badge badge-xs mt-1">' + duty.full_name.split(' ')[0] + '</div>';
                }
            }
        });
    } catch (error) {
        console.error('Failed to load calendar data:', error);
    }
}

// Calendar Navigation
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

// Admin Functions
async function loadAdminData() {
    // Load admin-specific data
    showToast('Admin data loaded');
}

function showAssignDuty() {
    showToast('Duty assignment coming soon!');
}

function showBulkAssign() {
    showToast('Bulk assignment coming soon!');
}

function showTeamManagement() {
    showToast('Team management coming soon!');
}

function generateReport() {
    showToast('Report generation coming soon!');
}

// Toast Notifications
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    
    const alertTypes = {
        'info': 'alert-info',
        'success': 'alert-success',
        'warning': 'alert-warning',
        'error': 'alert-error'
    };
    
    const toast = document.createElement('div');
    toast.className = `alert ${alertTypes[type] || 'alert-info'} shadow-lg`;
    toast.innerHTML = `
        <div>
            <span>${message}</span>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'auth-daisyui.html';
}

// Setup Event Listeners
function setupEventListeners() {
    // Handle navigation clicks
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('href').substring(1);
            if (section) {
                showSection(section);
            }
        });
    });
    
    // Handle dropdown menus on mobile
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.dropdown')) {
            document.querySelectorAll('.dropdown[open]').forEach(dropdown => {
                dropdown.removeAttribute('open');
            });
        }
    });
}
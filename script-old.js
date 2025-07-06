// Rota data parsed from the spreadsheet
const rotaData = [
    {date: '2025-06-01', ra: 'Gloria R', notes: ''},
    {date: '2025-06-02', ra: 'Mahzyar M', notes: ''},
    {date: '2025-06-03', ra: 'Sarah P', notes: ''},
    {date: '2025-06-04', ra: 'Tasnim S', notes: ''},
    {date: '2025-06-05', ra: 'Emile C', notes: ''},
    {date: '2025-06-06', ra: 'Emile C', notes: ''},
    {date: '2025-06-07', ra: 'Emile C', notes: 'Sarah AL'},
    {date: '2025-06-08', ra: 'Gloria R', notes: 'Sarah AL'},
    {date: '2025-06-09', ra: 'Gloria R', notes: 'Sarah AL'},
    {date: '2025-06-10', ra: 'Emile C', notes: 'Sarah AL'},
    {date: '2025-06-11', ra: 'Anmol', notes: 'Sarah AL'},
    {date: '2025-06-12', ra: 'Emile C', notes: 'Sarah AL'},
    {date: '2025-06-13', ra: 'Catalina D', notes: 'Sarah AL'},
    {date: '2025-06-14', ra: 'Catalina D', notes: 'Sarah AL'},
    {date: '2025-06-15', ra: 'Catalina D', notes: 'Sarah AL'},
    {date: '2025-06-16', ra: 'Catalina D', notes: 'Sarah AL'},
    {date: '2025-06-17', ra: 'Anmol', notes: ''},
    {date: '2025-06-18', ra: 'Tasnim S', notes: ''},
    {date: '2025-06-19', ra: 'Anmol', notes: ''},
    {date: '2025-06-20', ra: 'Gloria R', notes: ''},
    {date: '2025-06-21', ra: 'Gloria R', notes: ''},
    {date: '2025-06-22', ra: 'Sarah P', notes: ''},
    {date: '2025-06-23', ra: 'Anmol', notes: ''},
    {date: '2025-06-24', ra: 'Tasnim S', notes: ''},
    {date: '2025-06-25', ra: 'Anmol', notes: ''},
    {date: '2025-06-26', ra: 'Gloria R', notes: ''},
    {date: '2025-06-27', ra: 'Mahzyar M', notes: ''},
    {date: '2025-06-28', ra: 'Sarah P', notes: ''},
    {date: '2025-06-29', ra: 'Anmol', notes: ''},
    {date: '2025-06-30', ra: 'Tasnim S', notes: ''},
    {date: '2025-07-01', ra: 'Emile C', notes: ''},
    {date: '2025-07-02', ra: 'Sarah P', notes: ''},
    {date: '2025-07-03', ra: 'Mahzyar M', notes: ''},
    {date: '2025-07-04', ra: 'Mahzyar M', notes: ''},
    {date: '2025-07-05', ra: 'Emile C', notes: ''},
    {date: '2025-07-06', ra: 'Anmol', notes: ''},
    {date: '2025-07-07', ra: 'Mahzyar M', notes: ''},
    {date: '2025-07-08', ra: 'Sarah P', notes: ''},
    {date: '2025-07-09', ra: 'Mahzyar M', notes: ''},
    {date: '2025-07-10', ra: 'Sarah P', notes: ''},
    {date: '2025-07-11', ra: 'Anmol', notes: ''},
    {date: '2025-07-12', ra: 'Tasnim S', notes: ''},
    {date: '2025-07-13', ra: 'Tasnim S', notes: ''},
    {date: '2025-07-14', ra: 'Gloria R', notes: ''},
    {date: '2025-07-15', ra: 'Gloria R', notes: ''},
    {date: '2025-07-16', ra: 'Gloria R', notes: ''},
    {date: '2025-07-17', ra: 'Emile C', notes: ''},
    {date: '2025-07-18', ra: 'Anmol', notes: ''},
    {date: '2025-07-19', ra: 'Tasnim S', notes: ''},
    {date: '2025-07-20', ra: 'Mahzyar M', notes: ''},
    {date: '2025-07-21', ra: 'Mahzyar M', notes: ''},
    {date: '2025-07-22', ra: 'Sarah P', notes: ''},
    {date: '2025-07-23', ra: 'Emile C', notes: ''},
    {date: '2025-07-24', ra: 'Anmol', notes: ''},
    {date: '2025-07-25', ra: 'Tasnim S', notes: ''},
    {date: '2025-07-26', ra: 'Emile C', notes: ''},
    {date: '2025-07-27', ra: 'Gloria R', notes: ''},
    {date: '2025-07-28', ra: 'Sarah P', notes: ''},
    {date: '2025-07-29', ra: 'Emile C', notes: ''},
    {date: '2025-07-30', ra: 'Anmol', notes: ''},
    {date: '2025-07-31', ra: 'Tasnim S', notes: ''},
    {date: '2025-08-01', ra: 'Anmol', notes: ''},
    {date: '2025-08-02', ra: 'Gloria R', notes: ''},
    {date: '2025-08-03', ra: 'Mahzyar M', notes: ''},
    {date: '2025-08-04', ra: 'Emile C', notes: ''},
    {date: '2025-08-05', ra: 'Anmol', notes: ''},
    {date: '2025-08-06', ra: 'Tasnim S', notes: ''},
    {date: '2025-08-07', ra: 'Sarah P', notes: ''},
    {date: '2025-08-08', ra: 'Gloria R', notes: ''},
    {date: '2025-08-09', ra: 'Mahzyar M', notes: ''},
    {date: '2025-08-10', ra: 'Sarah P', notes: ''},
    {date: '2025-08-11', ra: 'Anmol', notes: ''},
    {date: '2025-08-12', ra: 'Tasnim S', notes: ''},
    {date: '2025-08-13', ra: 'Mahzyar M', notes: ''},
    {date: '2025-08-14', ra: 'Gloria R', notes: ''},
    {date: '2025-08-15', ra: 'Mahzyar M', notes: ''},
    {date: '2025-08-16', ra: 'Sarah P', notes: ''},
    {date: '2025-08-17', ra: 'Emile C', notes: ''},
    {date: '2025-08-18', ra: 'Tasnim S', notes: ''},
    {date: '2025-08-19', ra: 'Mahzyar M', notes: ''},
    {date: '2025-08-20', ra: 'Gloria R', notes: 'Catalina AL'},
    {date: '2025-08-21', ra: 'Mahzyar M', notes: 'Catalina AL'},
    {date: '2025-08-22', ra: 'Sarah P', notes: 'Catalina AL'},
    {date: '2025-08-23', ra: 'Emile C', notes: 'Catalina AL'},
    {date: '2025-08-24', ra: 'Anmol', notes: 'Catalina AL'},
    {date: '2025-08-25', ra: 'Gloria R', notes: '24 hrs duty Catalina AL'},
    {date: '2025-08-26', ra: 'Gloria R', notes: 'Catalina AL'},
    {date: '2025-08-27', ra: 'Mahzyar M', notes: 'Catalina AL'},
    {date: '2025-08-28', ra: 'Sarah P', notes: 'Catalina AL'},
    {date: '2025-08-29', ra: 'Emile C', notes: 'Catalina AL'},
    {date: '2025-08-30', ra: 'Anmol', notes: 'Catalina AL'},
    {date: '2025-08-31', ra: 'Gloria R', notes: 'Catalina AL'},
    {date: '2025-09-01', ra: 'Catalina D', notes: 'Catalina AL'},
    {date: '2025-09-02', ra: 'Gloria R', notes: 'Catalina AL'},
    {date: '2025-09-03', ra: 'Mahzyar M', notes: 'Catalina AL'},
    {date: '2025-09-04', ra: 'Sarah P', notes: 'Catalina AL'},
    {date: '2025-09-05', ra: 'Emile C', notes: 'Catalina AL'},
    {date: '2025-09-06', ra: 'Anmol', notes: 'Catalina AL'}
];

// RA color and icon mapping (green theme)
const raColors = {
    'Gloria R': { color: '#27ae60', icon: 'GR' },
    'Mahzyar M': { color: '#16a085', icon: 'MM' },
    'Sarah P': { color: '#2ecc71', icon: 'SP' },
    'Tasnim S': { color: '#1abc9c', icon: 'TS' },
    'Emile C': { color: '#52c41a', icon: 'EC' },
    'Anmol': { color: '#389e0d', icon: 'AN' },
    'Catalina D': { color: '#73d13d', icon: 'CD' }
};

// User authentication
let currentUser = null;
let currentDate = new Date();
let currentView = 'month';

// Mock user credentials (in real app, this would be server-side)
const validUsers = {
    'admin': { password: 'admin123', name: 'Administrator' },
    'gloria': { password: 'gloria123', name: 'Gloria R' },
    'mahzyar': { password: 'mahzyar123', name: 'Mahzyar M' },
    'sarah': { password: 'sarah123', name: 'Sarah P' },
    'tasnim': { password: 'tasnim123', name: 'Tasnim S' },
    'emile': { password: 'emile123', name: 'Emile C' },
    'anmol': { password: 'anmol123', name: 'Anmol' },
    'catalina': { password: 'catalina123', name: 'Catalina D' }
};

function login(username, password) {
    const user = validUsers[username.toLowerCase()];
    if (user && user.password === password) {
        currentUser = { username: username, name: user.name };
        document.getElementById('loginModal').style.display = 'none';
        document.getElementById('mainApp').classList.add('logged-in');
        
        // Update user info in header
        const userAvatar = document.getElementById('userAvatar');
        const userName = document.getElementById('userName');
        userAvatar.textContent = user.name.split(' ').map(n => n[0]).join('');
        userName.textContent = user.name;
        
        renderCalendar();
        renderLegend();
        renderStats();
        return true;
    }
    return false;
}

function logout() {
    currentUser = null;
    document.getElementById('loginModal').style.display = 'flex';
    document.getElementById('mainApp').classList.remove('logged-in');
    document.getElementById('loginForm').reset();
}

function getInitials(name) {
    return raColors[name]?.icon || name.split(' ').map(n => n[0]).join('').toUpperCase();
}

function getRAColor(name) {
    return raColors[name]?.color || '#27ae60';
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function parseDate(dateStr) {
    return new Date(dateStr + 'T00:00:00');
}

function getRotaForDate(date) {
    const dateStr = formatDate(date);
    return rotaData.find(entry => entry.date === dateStr);
}

function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    const monthYear = document.getElementById('currentMonth');
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    monthYear.textContent = new Date(year, month).toLocaleDateString('en-GB', {
        month: 'long',
        year: 'numeric'
    });

    // Clear grid
    grid.innerHTML = '';

    // Add day headers
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    dayNames.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-header';
        header.textContent = day;
        grid.appendChild(header);
    });

    // Get first day of month (Monday = 0)
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - (firstDay.getDay() + 6) % 7);

    // Generate calendar days
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 42; i++) {
        const cellDate = new Date(startDate);
        cellDate.setDate(startDate.getDate() + i);

        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';

        if (cellDate.getMonth() !== month) {
            dayCell.classList.add('other-month');
        }

        if (cellDate.getTime() === today.getTime()) {
            dayCell.classList.add('today');
        }

        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = cellDate.getDate();
        dayCell.appendChild(dayNumber);

        // Add duty information
        const rotaEntry = getRotaForDate(cellDate);
        if (rotaEntry) {
            const dutyInfo = document.createElement('div');
            dutyInfo.className = 'duty-info';
            dutyInfo.style.background = `linear-gradient(135deg, ${getRAColor(rotaEntry.ra)}, ${getRAColor(rotaEntry.ra)}dd)`;

            const icon = document.createElement('div');
            icon.className = 'ra-icon';
            icon.textContent = getInitials(rotaEntry.ra);
            icon.style.color = getRAColor(rotaEntry.ra);

            const name = document.createElement('div');
            name.className = 'ra-name';
            name.textContent = rotaEntry.ra;

            dutyInfo.appendChild(icon);
            dutyInfo.appendChild(name);

            // Add tooltip for notes
            if (rotaEntry.notes) {
                const tooltip = document.createElement('div');
                tooltip.className = 'duty-tooltip';
                tooltip.textContent = rotaEntry.notes;
                dutyInfo.appendChild(tooltip);
            }

            dayCell.appendChild(dutyInfo);
        }

        grid.appendChild(dayCell);
    }
}

function renderLegend() {
    const legendGrid = document.getElementById('legendGrid');
    legendGrid.innerHTML = '';

    Object.entries(raColors).forEach(([name, config]) => {
        const item = document.createElement('div');
        item.className = 'legend-item';

        const icon = document.createElement('div');
        icon.className = 'ra-icon';
        icon.textContent = config.icon;
        icon.style.background = config.color;
        icon.style.color = 'white';

        const label = document.createElement('span');
        label.textContent = name;

        item.appendChild(icon);
        item.appendChild(label);
        legendGrid.appendChild(item);
    });
}

function renderStats() {
    const statsGrid = document.getElementById('statsGrid');
    statsGrid.innerHTML = '';

    // Calculate statistics
    const raCounts = {};
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    rotaData.forEach(entry => {
        const entryDate = parseDate(entry.date);
        if (entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear) {
            raCounts[entry.ra] = (raCounts[entry.ra] || 0) + 1;
        }
    });

    const totalShifts = Object.values(raCounts).reduce((sum, count) => sum + count, 0);
    const totalRAs = Object.keys(raCounts).length;

    // Total shifts card
    const totalCard = document.createElement('div');
    totalCard.className = 'stat-card';
    totalCard.innerHTML = `
        <div class="stat-number">${totalShifts}</div>
        <div class="stat-label">Total Duties This Month</div>
    `;
    statsGrid.appendChild(totalCard);

    // Active RAs card
    const rasCard = document.createElement('div');
    rasCard.className = 'stat-card';
    rasCard.innerHTML = `
        <div class="stat-number">${totalRAs}</div>
        <div class="stat-label">Active Residential Advisors</div>
    `;
    statsGrid.appendChild(rasCard);

    // Most duties card
    const mostDuties = Math.max(...Object.values(raCounts));
    const busyRA = Object.entries(raCounts).find(([name, count]) => count === mostDuties)?.[0] || 'N/A';
    const busyCard = document.createElement('div');
    busyCard.className = 'stat-card';
    busyCard.innerHTML = `
        <div class="stat-number">${mostDuties}</div>
        <div class="stat-label">Most Duties (${busyRA})</div>
    `;
    statsGrid.appendChild(busyCard);
}

function previousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
    renderStats();
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
    renderStats();
}

function goToToday() {
    currentDate = new Date();
    renderCalendar();
    renderStats();
}

function setView(view) {
    currentView = view;
    document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    if (view === 'week') {
        alert('Week view coming soon! Currently showing month view.');
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Handle login form
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        if (login(username, password)) {
            document.getElementById('username').value = '';
            document.getElementById('password').value = '';
        } else {
            alert('Invalid username or password. Try: admin/admin123 or gloria/gloria123');
        }
    });

    // Show login modal initially
    document.getElementById('loginModal').style.display = 'flex';
});

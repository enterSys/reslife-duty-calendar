# 🏠 ResLife Duty Rota Calendar

A modern, responsive web application for managing residential life duty rotas. Built specifically for the Ashburne & Sheavyn residential team.

![ResLife Calendar Preview](https://via.placeholder.com/800x400/27ae60/ffffff?text=ResLife+Duty+Calendar)

## ✨ Features

### 🔐 **Secure Authentication**
- Individual user accounts for each Residential Advisor
- Secure login system with personalized dashboards
- User avatar and name display

### 📅 **Interactive Calendar**
- **Month view** with full calendar grid
- **Week view** (coming soon)
- Navigate between months with ease
- "Today" button for quick navigation
- Hover tooltips showing duty notes and annual leave information

### 👥 **Team Management**
- Color-coded shifts for each Residential Advisor
- Unique icons and initials for quick identification
- Comprehensive team legend

### 📊 **Statistics Dashboard**
- Total duties per month tracking
- Active RA count
- Busiest team member identification
- Real-time calculations

### 🎨 **Professional Design**
- Clean, green-themed interface perfect for ResLife
- Fully responsive design (desktop, tablet, mobile)
- Modern hover effects and animations
- Professional residential life branding

## 🚀 Quick Start

### Option 1: Direct Usage
1. Download or clone this repository
2. Open `index.html` in your web browser
3. Login with demo credentials:
   - **Administrator**: `admin` / `admin123`
   - **Individual RAs**: `gloria` / `gloria123`, `mahzyar` / `mahzyar123`, etc.

### Option 2: Local Development
```bash
# Clone the repository
git clone https://github.com/yourusername/reslife-duty-calendar.git

# Navigate to the project directory
cd reslife-duty-calendar

# Open in your preferred browser
open index.html
```

## 👤 Demo User Accounts

| Username | Password | Name |
|----------|----------|------|
| `admin` | `admin123` | Administrator |
| `gloria` | `gloria123` | Gloria R |
| `mahzyar` | `mahzyar123` | Mahzyar M |
| `sarah` | `sarah123` | Sarah P |
| `tasnim` | `tasnim123` | Tasnim S |
| `emile` | `emile123` | Emile C |
| `anmol` | `anmol123` | Anmol |
| `catalina` | `catalina123` | Catalina D |

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Styling**: Custom CSS with modern gradients and animations
- **Icons**: Unicode emojis for cross-platform compatibility
- **Responsive**: CSS Grid and Flexbox for adaptive layouts

## 📱 Browser Compatibility

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🔧 Customization

### Adding New RAs
1. Update the `raColors` object in `script.js` with new team members:
```javascript
const raColors = {
    'New RA': { color: '#your-color', icon: 'NR' },
    // ... existing RAs
};
```

2. Add login credentials in the `validUsers` object:
```javascript
const validUsers = {
    'newra': { password: 'newra123', name: 'New RA' },
    // ... existing users
};
```

3. Update the `rotaData` array with new duty assignments.

### Modifying the Color Scheme
The green theme can be customized by updating CSS variables:
- Primary green: `#27ae60`
- Secondary green: `#2ecc71`
- Accent colors: Various shades of green for different RAs

## 📊 Data Structure

The duty rota data is stored in a simple JavaScript array:
```javascript
const rotaData = [
    {
        date: '2025-06-01',
        ra: 'Gloria R',
        notes: 'Special notes or annual leave info'
    },
    // ... more entries
];
```

## 🚀 Future Enhancements

- [ ] **Week View Implementation**
- [ ] **Duty Swap Request System**
- [ ] **Google Calendar Integration**
- [ ] **Email Notifications**
- [ ] **Annual Leave Dashboard**
- [ ] **Emergency Contact Integration**
- [ ] **Export to PDF/Excel**
- [ ] **Mobile App (PWA)**

## 🤝 Contributing

We welcome contributions! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support, please contact the ResLife team or create an issue in this repository.

---

**Built with ❤️ for the Ashburne & Sheavyn Residential Team**

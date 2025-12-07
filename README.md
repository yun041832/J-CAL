# J-CAL
Calendar, TODO List, Memo, Timer Widget

A modern, responsive web application featuring four essential productivity widgets in one beautiful interface.

![J-CAL Application](https://github.com/user-attachments/assets/70ffb779-2002-4d7a-821a-32e6fbbcc632)

## Features

### 📅 Calendar Widget
- Monthly calendar view with intuitive navigation
- Previous/Next month buttons for easy browsing
- Highlights the current date
- Displays days from adjacent months for context
- Clean, grid-based layout

### ✅ TODO List Widget
- Add new tasks with a simple input field
- Mark tasks as complete with checkboxes
- Visual strike-through for completed items
- Delete tasks individually
- Persistent storage using localStorage
- Data survives page refreshes

### 📝 Memo Widget
- Create memos with title and content
- Edit existing memos inline
- Delete memos with confirmation prompt
- Automatic timestamps (creation and last update)
- Rich text area for detailed notes
- Persistent storage using localStorage

### ⏱️ Timer Widget
Two modes in one widget:

**Stopwatch Mode:**
- Start, pause, and resume functionality
- Reset to zero
- Displays hours:minutes:seconds
- Accurate timing down to 10ms precision

**Countdown Mode:**
- Set custom minutes and seconds
- Start, pause, and resume countdown
- Alert notification when time expires
- Automatic reset after completion

## Technology Stack

- **HTML5**: Semantic structure
- **CSS3**: Modern styling with gradients, flexbox, and grid
- **Vanilla JavaScript**: No external dependencies
- **localStorage API**: Client-side data persistence

## Installation & Usage

1. Clone the repository:
```bash
git clone https://github.com/yun041832/J-CAL.git
cd J-CAL
```

2. Open `index.html` in your web browser:
```bash
# Option 1: Direct open
open index.html  # macOS
start index.html  # Windows
xdg-open index.html  # Linux

# Option 2: Using Python HTTP server
python3 -m http.server 8080
# Then visit http://localhost:8080
```

3. Start using the widgets! All data is automatically saved to your browser's localStorage.

## File Structure

```
J-CAL/
├── index.html      # Main HTML structure
├── styles.css      # All styling and responsive design
├── script.js       # Widget functionality and logic
└── README.md       # This file
```

## Features in Detail

### Responsive Design
- Adapts to different screen sizes
- Mobile-friendly interface
- Grid layout adjusts automatically

### Data Persistence
- TODO items persist across sessions
- Memos are saved automatically
- Uses browser localStorage API

### Modern UI/UX
- Beautiful gradient backgrounds
- Smooth transitions and hover effects
- Intuitive controls
- Color-coded actions (edit, delete, complete)

## Browser Compatibility

Works on all modern browsers that support:
- ES6 JavaScript (Classes, Arrow Functions)
- CSS Grid and Flexbox
- localStorage API
- HTML5

Tested on:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Screenshots

### Initial View
![Initial View](https://github.com/user-attachments/assets/70ffb779-2002-4d7a-821a-32e6fbbcc632)

### With Data
![Application with data](https://github.com/user-attachments/assets/d98ccea3-7bbb-4f3e-9069-6dff5afb1408)

### TODO Completion
![Completed TODO](https://github.com/user-attachments/assets/6c040c24-e273-4fbe-8a3b-23ba3f3b2fc0)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Author

Created by yun041832

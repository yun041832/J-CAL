# J-CAL

A modern, responsive web-based widget dashboard featuring Calendar, TODO List, Memo, and Timer functionality - all in one beautiful interface.

![J-CAL Dashboard](https://github.com/user-attachments/assets/d2b0ed87-37f3-42a8-b72b-6c96a52b8688)

## Features

### 📅 Calendar Widget
- Interactive monthly calendar view
- Navigate between months with previous/next buttons
- Highlights current date
- Click to select any date
- Displays previous and next month dates for context

### ✓ TODO List Widget
- Add tasks with a simple input interface
- Mark tasks as complete with checkboxes
- Delete individual tasks
- Clear all completed tasks at once
- Task counter shows active tasks
- Persistent storage using localStorage

### 📝 Memo Widget
- Create titled memos with rich text content
- Timestamp automatically added to each memo
- Edit-friendly interface with title and content fields
- Delete memos individually
- Memos stored persistently in localStorage
- Scrollable list for multiple memos

### ⏱️ Timer Widget
Two modes in one widget:

**Stopwatch Mode:**
- Start, stop, and reset functionality
- Displays hours, minutes, seconds, and centiseconds
- Accurate timing with 10ms precision

**Countdown Mode:**
- Set custom countdown time (minutes and seconds)
- Visual and audio notification when countdown completes
- Start, stop, and reset controls
- Pause and resume functionality

## Technologies Used

- **HTML5** - Semantic markup and structure
- **CSS3** - Modern styling with gradients, flexbox, and grid
- **JavaScript (ES6+)** - Object-oriented programming with classes
- **localStorage** - Client-side data persistence

## Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- No build tools or dependencies required!

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yun041832/J-CAL.git
cd J-CAL
```

2. Open `index.html` in your web browser:
```bash
# Using Python 3
python3 -m http.server 8080

# Or simply open the file
open index.html  # macOS
start index.html # Windows
xdg-open index.html # Linux
```

3. Navigate to `http://localhost:8080` in your browser (if using Python server)

That's it! No installation or build process needed.

## Usage

### Calendar
- Click the **◀** and **▶** buttons to navigate between months
- Click any date to select it (highlighted in purple)
- Today's date is highlighted in blue

### TODO List
- Type your task in the input field
- Click **Add** or press **Enter** to create a task
- Check the checkbox to mark a task as complete
- Click **Delete** to remove a task
- Click **Clear Completed** to remove all finished tasks

### Memo
- Enter a title in the first field (optional, defaults to "Untitled Memo")
- Write your memo content in the text area
- Click **Save Memo** or press **Ctrl+Enter** to save
- Click **Delete** on any memo to remove it
- Memos are displayed newest first

### Timer
- Switch between **Stopwatch** and **Countdown** tabs
- **Stopwatch**: Click Start to begin timing, Stop to pause, Reset to clear
- **Countdown**: Enter minutes and seconds, click Start to begin countdown
- An alert notification appears when countdown reaches zero

## File Structure

```
J-CAL/
├── index.html      # Main HTML structure
├── styles.css      # All styling and responsive design
├── script.js       # JavaScript functionality for all widgets
└── README.md       # This file
```

## Features Highlights

- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Persistent Storage**: TODOs and Memos are saved automatically
- **Modern UI**: Beautiful gradient design with smooth animations
- **No Dependencies**: Pure vanilla JavaScript, no frameworks needed
- **Fast and Lightweight**: Loads instantly with minimal resource usage

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Screenshots

### Initial View
![Initial View](https://github.com/user-attachments/assets/d2b0ed87-37f3-42a8-b72b-6c96a52b8688)

### With Data
![With Data](https://github.com/user-attachments/assets/63e7b9a5-2532-4655-80a8-7d6f984f2903)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Author

Created with ❤️ for productivity enthusiasts

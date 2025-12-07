// ============================================
// CALENDAR WIDGET
// ============================================
class Calendar {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = null;
        this.init();
    }

    init() {
        this.renderCalendar();
        document.getElementById('prev-month').addEventListener('click', () => this.previousMonth());
        document.getElementById('next-month').addEventListener('click', () => this.nextMonth());
    }

    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.renderCalendar();
    }

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.renderCalendar();
    }

    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Update month display
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];
        document.getElementById('current-month').textContent = `${monthNames[month]} ${year}`;

        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        const calendarDays = document.getElementById('calendar-days');
        calendarDays.innerHTML = '';

        const today = new Date();
        const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

        // Previous month days
        for (let i = firstDay - 1; i >= 0; i--) {
            const day = daysInPrevMonth - i;
            const dayElement = this.createDayElement(day, 'other-month');
            calendarDays.appendChild(dayElement);
        }

        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            let classes = '';
            if (isCurrentMonth && day === today.getDate()) {
                classes = 'today';
            }
            const dayElement = this.createDayElement(day, classes);
            dayElement.addEventListener('click', () => this.selectDate(year, month, day));
            calendarDays.appendChild(dayElement);
        }

        // Next month days
        const totalCells = calendarDays.children.length;
        const remainingCells = 42 - totalCells; // 6 rows * 7 days
        for (let day = 1; day <= remainingCells; day++) {
            const dayElement = this.createDayElement(day, 'other-month');
            calendarDays.appendChild(dayElement);
        }
    }

    createDayElement(day, classes) {
        const div = document.createElement('div');
        div.className = `calendar-day ${classes}`;
        div.textContent = day;
        return div;
    }

    selectDate(year, month, day) {
        this.selectedDate = new Date(year, month, day);
        this.renderCalendar();
        
        // Highlight selected date
        const days = document.querySelectorAll('.calendar-day:not(.other-month)');
        days.forEach(d => {
            if (parseInt(d.textContent) === day) {
                d.classList.add('selected');
            } else {
                d.classList.remove('selected');
            }
        });
    }
}

// ============================================
// TODO LIST WIDGET
// ============================================
class TodoList {
    constructor() {
        this.todos = this.loadFromStorage() || [];
        this.init();
    }

    init() {
        this.render();
        document.getElementById('add-todo').addEventListener('click', () => this.addTodo());
        document.getElementById('todo-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });
        document.getElementById('clear-completed').addEventListener('click', () => this.clearCompleted());
    }

    addTodo() {
        const input = document.getElementById('todo-input');
        const text = input.value.trim();
        
        if (text === '') return;

        const todo = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.todos.push(todo);
        this.saveToStorage();
        this.render();
        input.value = '';
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveToStorage();
            this.render();
        }
    }

    deleteTodo(id) {
        this.todos = this.todos.filter(t => t.id !== id);
        this.saveToStorage();
        this.render();
    }

    clearCompleted() {
        this.todos = this.todos.filter(t => !t.completed);
        this.saveToStorage();
        this.render();
    }

    render() {
        const list = document.getElementById('todo-list');
        list.innerHTML = '';

        this.todos.forEach(todo => {
            const li = document.createElement('li');
            li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'todo-checkbox';
            checkbox.checked = todo.completed;
            checkbox.addEventListener('change', () => this.toggleTodo(todo.id));

            const span = document.createElement('span');
            span.className = 'todo-text';
            span.textContent = todo.text;

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'todo-delete';
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', () => this.deleteTodo(todo.id));

            li.appendChild(checkbox);
            li.appendChild(span);
            li.appendChild(deleteBtn);
            list.appendChild(li);
        });

        // Update count
        const activeCount = this.todos.filter(t => !t.completed).length;
        document.getElementById('todo-count').textContent = 
            `${activeCount} task${activeCount !== 1 ? 's' : ''}`;
    }

    saveToStorage() {
        localStorage.setItem('j-cal-todos', JSON.stringify(this.todos));
    }

    loadFromStorage() {
        const data = localStorage.getItem('j-cal-todos');
        return data ? JSON.parse(data) : null;
    }
}

// ============================================
// MEMO WIDGET
// ============================================
class MemoWidget {
    constructor() {
        this.memos = this.loadFromStorage() || [];
        this.init();
    }

    init() {
        this.render();
        document.getElementById('add-memo').addEventListener('click', () => this.addMemo());
        document.getElementById('memo-content').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) this.addMemo();
        });
    }

    addMemo() {
        const titleInput = document.getElementById('memo-title');
        const contentInput = document.getElementById('memo-content');
        
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();

        if (title === '' && content === '') return;

        const memo = {
            id: Date.now(),
            title: title || 'Untitled Memo',
            content: content,
            createdAt: new Date()
        };

        this.memos.unshift(memo); // Add to beginning
        this.saveToStorage();
        this.render();
        
        titleInput.value = '';
        contentInput.value = '';
    }

    deleteMemo(id) {
        this.memos = this.memos.filter(m => m.id !== id);
        this.saveToStorage();
        this.render();
    }

    render() {
        const list = document.getElementById('memo-list');
        list.innerHTML = '';

        if (this.memos.length === 0) {
            list.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">No memos yet. Create one above!</p>';
            return;
        }

        this.memos.forEach(memo => {
            const div = document.createElement('div');
            div.className = 'memo-item';

            const header = document.createElement('div');
            header.className = 'memo-header';

            const title = document.createElement('div');
            title.className = 'memo-title';
            title.textContent = memo.title;

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'memo-delete';
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', () => this.deleteMemo(memo.id));

            header.appendChild(title);
            header.appendChild(deleteBtn);

            const content = document.createElement('div');
            content.className = 'memo-content';
            content.textContent = memo.content;

            const date = document.createElement('div');
            date.className = 'memo-date';
            date.textContent = new Date(memo.createdAt).toLocaleString();

            div.appendChild(header);
            div.appendChild(content);
            div.appendChild(date);
            list.appendChild(div);
        });
    }

    saveToStorage() {
        localStorage.setItem('j-cal-memos', JSON.stringify(this.memos));
    }

    loadFromStorage() {
        const data = localStorage.getItem('j-cal-memos');
        return data ? JSON.parse(data) : null;
    }
}

// ============================================
// TIMER WIDGET
// ============================================
class TimerWidget {
    constructor() {
        this.stopwatchRunning = false;
        this.stopwatchTime = 0;
        this.stopwatchInterval = null;

        this.countdownRunning = false;
        this.countdownTime = 0;
        this.countdownInterval = null;

        this.init();
    }

    init() {
        // Tab switching
        document.querySelectorAll('.timer-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });

        // Stopwatch controls
        document.getElementById('stopwatch-start').addEventListener('click', () => this.startStopwatch());
        document.getElementById('stopwatch-stop').addEventListener('click', () => this.stopStopwatch());
        document.getElementById('stopwatch-reset').addEventListener('click', () => this.resetStopwatch());

        // Countdown controls
        document.getElementById('countdown-start').addEventListener('click', () => this.startCountdown());
        document.getElementById('countdown-stop').addEventListener('click', () => this.stopCountdown());
        document.getElementById('countdown-reset').addEventListener('click', () => this.resetCountdown());
    }

    switchTab(tab) {
        document.querySelectorAll('.timer-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.timer-panel').forEach(p => p.classList.remove('active'));

        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        document.getElementById(`${tab}-panel`).classList.add('active');
    }

    // Stopwatch methods
    startStopwatch() {
        if (this.stopwatchRunning) return;

        this.stopwatchRunning = true;
        document.getElementById('stopwatch-start').disabled = true;
        document.getElementById('stopwatch-stop').disabled = false;

        const startTime = Date.now() - this.stopwatchTime;
        this.stopwatchInterval = setInterval(() => {
            this.stopwatchTime = Date.now() - startTime;
            this.updateStopwatchDisplay();
        }, 10);
    }

    stopStopwatch() {
        this.stopwatchRunning = false;
        clearInterval(this.stopwatchInterval);
        document.getElementById('stopwatch-start').disabled = false;
        document.getElementById('stopwatch-stop').disabled = true;
    }

    resetStopwatch() {
        this.stopStopwatch();
        this.stopwatchTime = 0;
        this.updateStopwatchDisplay();
    }

    updateStopwatchDisplay() {
        const hours = Math.floor(this.stopwatchTime / 3600000);
        const minutes = Math.floor((this.stopwatchTime % 3600000) / 60000);
        const seconds = Math.floor((this.stopwatchTime % 60000) / 1000);
        const milliseconds = Math.floor((this.stopwatchTime % 1000) / 10);

        document.getElementById('stopwatch-display').textContent =
            `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(2, '0')}`;
    }

    // Countdown methods
    startCountdown() {
        if (this.countdownRunning) return;

        const minutes = parseInt(document.getElementById('countdown-minutes').value) || 0;
        const seconds = parseInt(document.getElementById('countdown-seconds').value) || 0;

        if (this.countdownTime === 0) {
            this.countdownTime = (minutes * 60 + seconds) * 1000;
        }

        if (this.countdownTime === 0) return;

        this.countdownRunning = true;
        document.getElementById('countdown-start').disabled = true;
        document.getElementById('countdown-stop').disabled = false;
        document.getElementById('countdown-minutes').disabled = true;
        document.getElementById('countdown-seconds').disabled = true;

        const startTime = Date.now();
        const endTime = startTime + this.countdownTime;

        this.countdownInterval = setInterval(() => {
            const now = Date.now();
            this.countdownTime = Math.max(0, endTime - now);
            this.updateCountdownDisplay();

            if (this.countdownTime === 0) {
                this.stopCountdown();
                this.playNotification();
            }
        }, 100);
    }

    stopCountdown() {
        this.countdownRunning = false;
        clearInterval(this.countdownInterval);
        document.getElementById('countdown-start').disabled = false;
        document.getElementById('countdown-stop').disabled = true;
        document.getElementById('countdown-minutes').disabled = false;
        document.getElementById('countdown-seconds').disabled = false;
    }

    resetCountdown() {
        this.stopCountdown();
        this.countdownTime = 0;
        document.getElementById('countdown-minutes').value = '';
        document.getElementById('countdown-seconds').value = '';
        this.updateCountdownDisplay();
    }

    updateCountdownDisplay() {
        const minutes = Math.floor(this.countdownTime / 60000);
        const seconds = Math.floor((this.countdownTime % 60000) / 1000);

        document.getElementById('countdown-display').textContent =
            `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    playNotification() {
        // Visual notification
        const display = document.getElementById('countdown-display');
        display.style.color = '#ff4757';
        setTimeout(() => {
            display.style.color = '#333';
        }, 3000);

        // Alert
        if (document.hasFocus()) {
            alert('Countdown finished!');
        }
    }
}

// ============================================
// INITIALIZE ALL WIDGETS
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    new Calendar();
    new TodoList();
    new MemoWidget();
    new TimerWidget();
});

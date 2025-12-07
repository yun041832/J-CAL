// Calendar Widget
class Calendar {
    constructor() {
        this.currentDate = new Date();
        this.init();
    }

    init() {
        this.render();
        document.getElementById('prevMonth').addEventListener('click', () => this.previousMonth());
        document.getElementById('nextMonth').addEventListener('click', () => this.nextMonth());
    }

    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.render();
    }

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.render();
    }

    render() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const today = new Date();

        document.getElementById('monthYear').textContent = 
            `${this.currentDate.toLocaleString('default', { month: 'long' })} ${year}`;

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        let html = '';

        // Previous month days
        for (let i = firstDay - 1; i >= 0; i--) {
            html += `<div class="calendar-day other-month">${daysInPrevMonth - i}</div>`;
        }

        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const isToday = day === today.getDate() && 
                          month === today.getMonth() && 
                          year === today.getFullYear();
            const todayClass = isToday ? 'today' : '';
            html += `<div class="calendar-day ${todayClass}">${day}</div>`;
        }

        // Next month days
        const totalCells = firstDay + daysInMonth;
        const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
        for (let day = 1; day <= remainingCells; day++) {
            html += `<div class="calendar-day other-month">${day}</div>`;
        }

        document.getElementById('calendarDays').innerHTML = html;
    }
}

// TODO List Widget
class TodoList {
    constructor() {
        this.todos = JSON.parse(localStorage.getItem('todos')) || [];
        this.init();
    }

    init() {
        this.render();
        document.getElementById('addTodo').addEventListener('click', () => this.addTodo());
        document.getElementById('todoInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });
    }

    addTodo() {
        const input = document.getElementById('todoInput');
        const text = input.value.trim();
        
        if (text) {
            this.todos.push({
                id: Date.now(),
                text: text,
                completed: false
            });
            input.value = '';
            this.save();
            this.render();
        }
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.save();
            this.render();
        }
    }

    deleteTodo(id) {
        this.todos = this.todos.filter(t => t.id !== id);
        this.save();
        this.render();
    }

    save() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }

    render() {
        const list = document.getElementById('todoList');
        list.innerHTML = this.todos.map(todo => `
            <li class="todo-item ${todo.completed ? 'completed' : ''}">
                <input 
                    type="checkbox" 
                    class="todo-checkbox" 
                    ${todo.completed ? 'checked' : ''}
                    onchange="todoList.toggleTodo(${todo.id})"
                />
                <span class="todo-text">${this.escapeHtml(todo.text)}</span>
                <button class="todo-delete" onclick="todoList.deleteTodo(${todo.id})">Delete</button>
            </li>
        `).join('');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Memo Widget
class MemoApp {
    constructor() {
        this.memos = JSON.parse(localStorage.getItem('memos')) || [];
        this.editingId = null;
        this.init();
    }

    init() {
        this.render();
        document.getElementById('addMemo').addEventListener('click', () => this.saveMemo());
    }

    saveMemo() {
        const title = document.getElementById('memoTitle').value.trim();
        const content = document.getElementById('memoContent').value.trim();

        if (title && content) {
            if (this.editingId) {
                const memo = this.memos.find(m => m.id === this.editingId);
                if (memo) {
                    memo.title = title;
                    memo.content = content;
                    memo.updated = new Date().toLocaleString();
                }
                this.editingId = null;
                document.getElementById('addMemo').textContent = 'Save Memo';
            } else {
                this.memos.unshift({
                    id: Date.now(),
                    title: title,
                    content: content,
                    created: new Date().toLocaleString()
                });
            }

            document.getElementById('memoTitle').value = '';
            document.getElementById('memoContent').value = '';
            this.save();
            this.render();
        }
    }

    editMemo(id) {
        const memo = this.memos.find(m => m.id === id);
        if (memo) {
            document.getElementById('memoTitle').value = memo.title;
            document.getElementById('memoContent').value = memo.content;
            this.editingId = id;
            document.getElementById('addMemo').textContent = 'Update Memo';
            document.getElementById('memoTitle').focus();
        }
    }

    deleteMemo(id) {
        if (confirm('Are you sure you want to delete this memo?')) {
            this.memos = this.memos.filter(m => m.id !== id);
            this.save();
            this.render();
        }
    }

    save() {
        localStorage.setItem('memos', JSON.stringify(this.memos));
    }

    render() {
        const list = document.getElementById('memoList');
        list.innerHTML = this.memos.map(memo => `
            <div class="memo-item">
                <div class="memo-item-header">
                    <div class="memo-title">${this.escapeHtml(memo.title)}</div>
                    <div class="memo-actions">
                        <button class="memo-edit" onclick="memoApp.editMemo(${memo.id})">Edit</button>
                        <button class="memo-delete" onclick="memoApp.deleteMemo(${memo.id})">Delete</button>
                    </div>
                </div>
                <div class="memo-content">${this.escapeHtml(memo.content)}</div>
                <div style="font-size: 0.8em; color: #999; margin-top: 10px;">
                    ${memo.updated ? 'Updated: ' + memo.updated : 'Created: ' + memo.created}
                </div>
            </div>
        `).join('');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Timer Widget
class Timer {
    constructor() {
        this.stopwatchInterval = null;
        this.stopwatchTime = 0;
        this.stopwatchRunning = false;

        this.countdownInterval = null;
        this.countdownTime = 0;
        this.countdownRunning = false;

        this.init();
    }

    init() {
        // Mode switching
        document.getElementById('stopwatchMode').addEventListener('click', () => {
            this.switchMode('stopwatch');
        });

        document.getElementById('countdownMode').addEventListener('click', () => {
            this.switchMode('countdown');
        });

        // Stopwatch controls
        document.getElementById('startStopwatch').addEventListener('click', () => {
            this.toggleStopwatch();
        });

        document.getElementById('resetStopwatch').addEventListener('click', () => {
            this.resetStopwatch();
        });

        // Countdown controls
        document.getElementById('startCountdown').addEventListener('click', () => {
            this.toggleCountdown();
        });

        document.getElementById('resetCountdown').addEventListener('click', () => {
            this.resetCountdown();
        });
    }

    switchMode(mode) {
        const stopwatchBtn = document.getElementById('stopwatchMode');
        const countdownBtn = document.getElementById('countdownMode');
        const stopwatchSection = document.getElementById('stopwatchSection');
        const countdownSection = document.getElementById('countdownSection');

        if (mode === 'stopwatch') {
            stopwatchBtn.classList.add('active');
            countdownBtn.classList.remove('active');
            stopwatchSection.classList.add('active');
            countdownSection.classList.remove('active');
        } else {
            stopwatchBtn.classList.remove('active');
            countdownBtn.classList.add('active');
            stopwatchSection.classList.remove('active');
            countdownSection.classList.add('active');
        }
    }

    // Stopwatch functions
    toggleStopwatch() {
        if (this.stopwatchRunning) {
            this.stopStopwatch();
        } else {
            this.startStopwatch();
        }
    }

    startStopwatch() {
        this.stopwatchRunning = true;
        document.getElementById('startStopwatch').textContent = 'Pause';
        
        this.stopwatchInterval = setInterval(() => {
            this.stopwatchTime += 10;
            this.updateStopwatchDisplay();
        }, 10);
    }

    stopStopwatch() {
        this.stopwatchRunning = false;
        document.getElementById('startStopwatch').textContent = 'Resume';
        clearInterval(this.stopwatchInterval);
    }

    resetStopwatch() {
        this.stopwatchRunning = false;
        this.stopwatchTime = 0;
        document.getElementById('startStopwatch').textContent = 'Start';
        clearInterval(this.stopwatchInterval);
        this.updateStopwatchDisplay();
    }

    updateStopwatchDisplay() {
        const hours = Math.floor(this.stopwatchTime / 3600000);
        const minutes = Math.floor((this.stopwatchTime % 3600000) / 60000);
        const seconds = Math.floor((this.stopwatchTime % 60000) / 1000);
        const milliseconds = Math.floor((this.stopwatchTime % 1000) / 10);

        document.getElementById('stopwatchDisplay').textContent = 
            `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`;
    }

    // Countdown functions
    toggleCountdown() {
        if (this.countdownRunning) {
            this.stopCountdown();
        } else {
            this.startCountdown();
        }
    }

    startCountdown() {
        if (this.countdownTime === 0) {
            const minutes = parseInt(document.getElementById('countdownMinutes').value) || 0;
            const seconds = parseInt(document.getElementById('countdownSeconds').value) || 0;
            this.countdownTime = (minutes * 60 + seconds) * 1000;

            if (this.countdownTime === 0) {
                alert('Please set a time for countdown');
                return;
            }
        }

        this.countdownRunning = true;
        document.getElementById('startCountdown').textContent = 'Pause';
        
        this.countdownInterval = setInterval(() => {
            this.countdownTime -= 10;
            
            if (this.countdownTime <= 0) {
                this.countdownTime = 0;
                this.stopCountdown();
                this.updateCountdownDisplay();
                alert('Countdown finished!');
                this.resetCountdown();
            } else {
                this.updateCountdownDisplay();
            }
        }, 10);
    }

    stopCountdown() {
        this.countdownRunning = false;
        document.getElementById('startCountdown').textContent = 'Resume';
        clearInterval(this.countdownInterval);
    }

    resetCountdown() {
        this.countdownRunning = false;
        this.countdownTime = 0;
        document.getElementById('startCountdown').textContent = 'Start';
        document.getElementById('countdownMinutes').value = '';
        document.getElementById('countdownSeconds').value = '';
        clearInterval(this.countdownInterval);
        this.updateCountdownDisplay();
    }

    updateCountdownDisplay() {
        const hours = Math.floor(this.countdownTime / 3600000);
        const minutes = Math.floor((this.countdownTime % 3600000) / 60000);
        const seconds = Math.floor((this.countdownTime % 60000) / 1000);

        document.getElementById('countdownDisplay').textContent = 
            `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`;
    }

    pad(num) {
        return num.toString().padStart(2, '0');
    }
}

// Initialize all widgets
let calendar, todoList, memoApp, timer;

document.addEventListener('DOMContentLoaded', () => {
    calendar = new Calendar();
    todoList = new TodoList();
    memoApp = new MemoApp();
    timer = new Timer();
});

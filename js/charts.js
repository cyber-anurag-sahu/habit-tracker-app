/**
 * Charts.js
 * Visualizations using Chart.js
 */

const Charts = {
    charts: {},
    currentDate: new Date(),

    render() {
        const habits = Store.getHabits();
        const ctxWeekly = document.getElementById('weeklyChart');
        const ctxMonthly = document.getElementById('monthlyChart');

        if (ctxWeekly && ctxMonthly) {
            this.renderWeekly(ctxWeekly, habits);
            this.renderMonthly(ctxMonthly, habits);
        }

        this.renderCalendar(habits);
    },

    changeMonth(delta) {
        // Adjust current date by delta months
        this.currentDate.setMonth(this.currentDate.getMonth() + delta);
        this.render();
    },

    renderCalendar(habits) {
        const container = document.getElementById('year-container');
        const occasions = Store.getOccasions();

        if (!container) return;

        container.innerHTML = '';

        // We will loop 2 times for 2 months view
        // Starting from this.currentDate
        const startYear = this.currentDate.getFullYear();
        const startMonth = this.currentDate.getMonth();

        for (let i = 0; i < 2; i++) {
            // Calculate actual year/month for this iteration
            const loopDate = new Date(startYear, startMonth + i, 1);
            const year = loopDate.getFullYear();
            const m = loopDate.getMonth();

            const monthDiv = document.createElement('div');
            monthDiv.className = 'month-block';

            const monthName = loopDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
            const title = document.createElement('div');
            title.className = 'month-title';
            title.textContent = monthName;
            monthDiv.appendChild(title);

            const grid = document.createElement('div');
            grid.className = 'mini-calendar-grid';

            // Weekday headers
            const dayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
            dayHeaders.forEach(d => {
                const dh = document.createElement('div');
                dh.className = 'mini-day-header';
                dh.textContent = d;
                grid.appendChild(dh);
            });

            const firstDay = new Date(year, m, 1).getDay();
            const daysInMonth = new Date(year, m + 1, 0).getDate();

            for (let j = 0; j < firstDay; j++) {
                const el = document.createElement('div');
                el.className = 'mini-day empty';
                grid.appendChild(el);
            }

            for (let d = 1; d <= daysInMonth; d++) {
                const localDateStr = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

                const eligible = habits.filter(h => h.createdAt.split('T')[0] <= localDateStr);
                let completed = 0;
                eligible.forEach(h => { if (h.history[localDateStr]) completed++; });
                const total = eligible.length;
                let pct = total > 0 ? completed / total : 0;

                const el = document.createElement('div');
                el.className = 'mini-day';
                el.textContent = d;
                el.dataset.date = localDateStr;

                if (occasions[localDateStr]) {
                    const dot = document.createElement('div');
                    dot.className = 'mini-occasion-dot';
                    el.appendChild(dot);
                }

                let tooltip = `${monthName.split(' ')[0]} ${d}: ${completed}/${total}`;
                if (occasions[localDateStr]) tooltip += ` (${occasions[localDateStr]})`;
                el.dataset.tooltip = tooltip;

                if (total > 0) {
                    const alpha = 0.2 + (pct * 0.8);
                    if (completed > 0) {
                        el.style.background = `rgba(99, 102, 241, ${alpha})`;
                        el.style.color = '#fff';
                    }
                }

                grid.appendChild(el);
            }
            monthDiv.appendChild(grid);
            container.appendChild(monthDiv);
        }
    },

    renderWeekly(ctx, habits) {
        // Last 7 days completion rate
        const labels = [];
        const data = [];

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = Store.getLocalDateString(d);
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
            labels.push(dayName);

            let completedCount = 0;
            habits.forEach(h => {
                if (h.history[dateStr]) completedCount++;
            });
            data.push(completedCount);
        }

        if (this.charts.weekly) this.charts.weekly.destroy();

        this.charts.weekly = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Habits Completed',
                    data: data,
                    backgroundColor: 'rgba(99, 102, 241, 0.6)', // Indigo
                    borderColor: 'rgba(99, 102, 241, 1)',
                    borderWidth: 1,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#94a3b8' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    x: {
                        ticks: { color: '#94a3b8' },
                        grid: { display: false }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    },

    renderMonthly(ctx, habits) {
        // Simple line chart showing total completions per day for last 30 days
        const labels = [];
        const data = [];

        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = Store.getLocalDateString(d);
            labels.push(d.getDate()); // Just day number

            let completedCount = 0;
            habits.forEach(h => {
                if (h.history[dateStr]) completedCount++;
            });
            data.push(completedCount);
        }

        if (this.charts.monthly) this.charts.monthly.destroy();

        this.charts.monthly = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Consistency',
                    data: data,
                    borderColor: '#22c55e', // Green
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        display: false
                    },
                    x: {
                        display: false
                    }
                },
                plugins: {
                    legend: { display: false }
                },
                elements: {
                    point: { radius: 0, hitRadius: 10 }
                }
            }
        });
    }
};

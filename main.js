document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const clockEl = document.getElementById('digital-clock');
    const dateEl = document.getElementById('current-date');
    const btnClockIn = document.getElementById('btn-clock-in');
    const btnClockOut = document.getElementById('btn-clock-out');
    const statusBadge = document.getElementById('work-status');
    const historyBody = document.getElementById('history-body');

    // State
    let isWorking = false;
    let attendanceHistory = JSON.parse(localStorage.getItem('attendanceHistory')) || [];

    // Initialize
    updateClock();
    setInterval(updateClock, 1000);
    renderHistory();
    checkCurrentStatus();

    // Clock functions
    function updateClock() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        clockEl.textContent = `${hours}:${minutes}:${seconds}`;

        const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
        dateEl.textContent = now.toLocaleDateString('ja-JP', options);
    }

    // Attendance functions
    function checkCurrentStatus() {
        // 現在進行中の記録（退勤が空のもの）があるか確認
        const activeRecord = attendanceHistory.find(record => record.clockOut === null);
        if (activeRecord) {
            isWorking = true;
            statusBadge.textContent = '勤務中';
            statusBadge.style.color = '#34d399';
            statusBadge.style.borderColor = 'rgba(52, 211, 153, 0.3)';
            btnClockIn.disabled = true;
            btnClockOut.disabled = false;
        } else {
            isWorking = false;
            statusBadge.textContent = '勤務外';
            statusBadge.style.color = '#818cf8';
            statusBadge.style.borderColor = 'rgba(129, 140, 248, 0.3)';
            btnClockIn.disabled = false;
            btnClockOut.disabled = true;
        }
    }

    btnClockIn.addEventListener('click', () => {
        const now = new Date();
        const today = now.toLocaleDateString('ja-JP');

        // すでに今日の記録があるか確認
        const existingRecord = attendanceHistory.find(record => record.date === today);
        if (existingRecord) {
            alert('本日は既に打刻されています。履歴から編集してください。');
            return;
        }

        const record = {
            id: Date.now(),
            date: today,
            clockIn: now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
            clockOut: null,
            duration: '-'
        };
        attendanceHistory.unshift(record);
        saveHistory();
        renderHistory();
        checkCurrentStatus();
    });

    btnClockOut.addEventListener('click', () => {
        const now = new Date();
        const today = now.toLocaleDateString('ja-JP');
        const activeRecord = attendanceHistory.find(record => record.date === today && record.clockOut === null);

        if (activeRecord) {
            activeRecord.clockOut = now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
            activeRecord.duration = calculateDuration(activeRecord.clockIn, activeRecord.clockOut);

            saveHistory();
            renderHistory();
            checkCurrentStatus();
        }
    });

    function calculateDuration(start, end) {
        if (!start || !end) return '-';
        const [sH, sM] = start.split(':').map(Number);
        const [eH, eM] = end.split(':').map(Number);
        let totalMinutes = (eH * 60 + eM) - (sH * 60 + sM);
        if (totalMinutes < 0) totalMinutes = 0;
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        return `${h}h ${m}m`;
    }

    function saveHistory() {
        localStorage.setItem('attendanceHistory', JSON.stringify(attendanceHistory));
    }

    function renderHistory() {
        const today = new Date().toLocaleDateString('ja-JP');
        historyBody.innerHTML = '';
        const todayHistory = attendanceHistory.filter(record => record.date === today);

        todayHistory.forEach(record => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${record.date}</td>
                <td>${record.clockIn}</td>
                <td>${record.clockOut || '--:--'}</td>
                <td>${record.duration}</td>
            `;
            historyBody.appendChild(tr);
        });
    }
});

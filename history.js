document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const historyBody = document.getElementById('history-body');
    const monthSelect = document.getElementById('month-select');
    const statDays = document.getElementById('stat-days');
    const statTotalWork = document.getElementById('stat-total-work');
    const statTotalOvertime = document.getElementById('stat-total-overtime');

    // Modal Elements
    const modal = document.getElementById('edit-modal');
    const modalDate = document.getElementById('modal-date');
    const modalClockIn = document.getElementById('modal-clock-in');
    const modalClockOut = document.getElementById('modal-clock-out');
    const modalSave = document.getElementById('modal-save');
    const modalCancel = document.getElementById('modal-cancel');

    let attendanceHistory = JSON.parse(localStorage.getItem('attendanceHistory')) || [];
    let currentEditDate = null;

    // Initialize
    initMonthSelector();
    renderHistory();

    function initMonthSelector() {
        const now = new Date();
        for (let i = 0; i < 6; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const year = d.getFullYear();
            const month = d.getMonth() + 1;
            const monthVal = `${year}/${month}`;
            const option = document.createElement('option');
            option.value = monthVal;
            option.textContent = `${year}年 ${month}月`;
            monthSelect.appendChild(option);
        }
        monthSelect.addEventListener('change', renderHistory);
    }

    function renderHistory() {
        const [year, month] = monthSelect.value.split('/').map(Number);
        historyBody.innerHTML = '';

        const lastDay = new Date(year, month, 0).getDate();
        let monthWorkMinutes = 0;
        let monthOvertimeMinutes = 0;
        let attendanceDays = 0;

        for (let day = 1; day <= lastDay; day++) {
            const dateStr = `${year}/${month}/${day}`;
            const dateObj = new Date(year, month - 1, day);
            const dayOfWeek = dateObj.getDay();
            const dayName = ['日', '月', '火', '水', '木', '金', '土'][dayOfWeek];

            const record = attendanceHistory.find(r => normalizeDate(r.date) === normalizeDate(dateStr));

            const tr = document.createElement('tr');
            if (dayOfWeek === 0) tr.classList.add('sunday');
            if (dayOfWeek === 6) tr.classList.add('saturday');

            if (record && record.clockIn && record.clockOut) {
                attendanceDays++;
                const { workMin, breakMin, overtimeMin } = record.calculations || calculateAll(record.clockIn, record.clockOut);
                monthWorkMinutes += workMin;
                monthOvertimeMinutes += overtimeMin;

                tr.innerHTML = `
                    <td>${day}日 (${dayName})</td>
                    <td>${record.clockIn}</td>
                    <td>${record.clockOut}</td>
                    <td>${formatMinutes(workMin)}</td>
                    <td>${formatMinutes(breakMin)}</td>
                    <td>${overtimeMin > 0 ? formatMinutes(overtimeMin) : '-'}</td>
                    <td>
                        <button class="action-icon-btn edit-btn" onclick="openModal('${dateStr}')">✏️</button>
                        <button class="action-icon-btn delete-btn" onclick="deleteRecord(${record.id})">🗑️</button>
                    </td>
                `;
            } else {
                tr.innerHTML = `
                    <td>${day}日 (${dayName})</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>
                        <button class="action-icon-btn edit-btn" onclick="openModal('${dateStr}')">➕</button>
                    </td>
                `;
            }
            historyBody.appendChild(tr);
        }

        // Update stats
        statDays.textContent = attendanceDays;
        statTotalWork.textContent = formatMinutes(monthWorkMinutes);
        statTotalOvertime.textContent = formatMinutes(monthOvertimeMinutes);
    }

    // Advanced Calculation Logic
    function calculateAll(rawIn, rawOut) {
        // Rounding
        const clockIn = roundTime(rawIn, 'up'); // 15min round up
        const clockOut = roundTime(rawOut, 'down'); // 15min round down

        const [sH, sM] = clockIn.split(':').map(Number);
        const [eH, eM] = clockOut.split(':').map(Number);

        let totalMinutes = (eH * 60 + eM) - (sH * 60 + sM);
        if (totalMinutes < 0) totalMinutes = 0;

        // Break logic: >6h -> 45m, >=8h -> 60m
        let breakMin = 0;
        if (totalMinutes >= 480) breakMin = 60; // 8h
        else if (totalMinutes > 360) breakMin = 45; // 6h

        // Work duration (excluding break)
        let workMin = totalMinutes - breakMin;
        if (workMin < 0) workMin = 0;

        // Overtime: workMin - 8h (480m)
        let overtimeMin = workMin - 480;
        if (overtimeMin < 0) overtimeMin = 0;

        return { workMin, breakMin, overtimeMin };
    }

    function roundTime(timeStr, type) {
        if (!timeStr) return '';
        let [h, m] = timeStr.split(':').map(Number);
        if (type === 'up') {
            m = Math.ceil(m / 15) * 15;
            if (m === 60) { h++; m = 0; }
        } else {
            m = Math.floor(m / 15) * 15;
        }
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    function formatMinutes(min) {
        const h = Math.floor(min / 60);
        const m = min % 60;
        return `${h}h ${m}m`;
    }

    function normalizeDate(dStr) {
        return dStr.split('/').map(p => parseInt(p)).join('/');
    }

    // Modal Functions
    window.openModal = function (dateStr) {
        currentEditDate = dateStr;
        const record = attendanceHistory.find(r => normalizeDate(r.date) === normalizeDate(dateStr));
        modalDate.textContent = dateStr;
        modalClockIn.value = record ? record.clockIn : '';
        modalClockOut.value = record ? (record.clockOut || '') : '';
        modal.classList.add('active');
    };

    modalCancel.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    modalSave.addEventListener('click', () => {
        const clockIn = modalClockIn.value;
        const clockOut = modalClockOut.value;

        let record = attendanceHistory.find(r => normalizeDate(r.date) === normalizeDate(currentEditDate));

        if (!record) {
            record = {
                id: Date.now(),
                date: currentEditDate,
                clockIn: clockIn,
                clockOut: clockOut,
                calculations: clockIn && clockOut ? calculateAll(clockIn, clockOut) : null
            };
            attendanceHistory.push(record);
        } else {
            record.clockIn = clockIn;
            record.clockOut = clockOut;
            record.calculations = clockIn && clockOut ? calculateAll(clockIn, clockOut) : null;
        }

        saveHistory();
        renderHistory();
        modal.classList.remove('active');
    });

    window.deleteRecord = function (recordId) {
        const record = attendanceHistory.find(r => r.id === recordId);
        if (record && confirm(`${record.date} の記録を削除してもよろしいですか？`)) {
            attendanceHistory = attendanceHistory.filter(r => r.id !== recordId);
            saveHistory();
            renderHistory();
        }
    };

    function saveHistory() {
        localStorage.setItem('attendanceHistory', JSON.stringify(attendanceHistory));
    }
});

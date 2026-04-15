/* ============================================
   DayLog — Interaction Logic
   Prototype only — no data persistence
   ============================================ */

(function () {
  'use strict';

  // --- Mood Pills ---
  const moodPills = document.querySelectorAll('.mood__pill');
  const moodNoteWrap = document.getElementById('mood-note-wrap');

  moodPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const wasActive = pill.classList.contains('is-active');

      // Deselect all
      moodPills.forEach(p => p.classList.remove('is-active'));

      if (!wasActive) {
        pill.classList.add('is-active');
        moodNoteWrap.classList.add('is-visible');
      } else {
        moodNoteWrap.classList.remove('is-visible');
      }

      vibrate();
    });
  });

  // --- Meal Rows ---
  const mealRows = document.querySelectorAll('.meal-row');

  mealRows.forEach(row => {
    const value = row.querySelector('.meal-row__value');
    const input = row.querySelector('.meal-row__input');

    // Tap row to edit
    row.addEventListener('click', (e) => {
      if (e.target === input) return;
      openMealInput(row, input, value);
    });

    // Blur to save
    input.addEventListener('blur', () => {
      closeMealInput(row, input, value);
    });

    // Enter to save
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        input.blur();
      }
    });
  });

  function openMealInput(row, input, value) {
    // Close any other open meal inputs
    mealRows.forEach(r => {
      if (r !== row && r.classList.contains('is-editing')) {
        const v = r.querySelector('.meal-row__value');
        const i = r.querySelector('.meal-row__input');
        closeMealInput(r, i, v);
      }
    });

    row.classList.add('is-editing');
    input.value = value.textContent === '—' ? '' : value.textContent;
    input.focus();
  }

  function closeMealInput(row, input, value) {
    row.classList.remove('is-editing');
    const text = input.value.trim();
    if (text) {
      value.textContent = text;
      value.classList.remove('is-placeholder');
    } else {
      value.textContent = '—';
      value.classList.add('is-placeholder');
    }
  }

  // Initialize placeholders
  document.querySelectorAll('.meal-row__value').forEach(v => {
    if (v.textContent === '—') v.classList.add('is-placeholder');
  });

  // --- Counters ---
  const counters = document.querySelectorAll('.counter');

  counters.forEach(counter => {
    const valueEl = counter.querySelector('.counter__value');
    const minusBtn = counter.querySelector('.counter__btn--minus');
    const plusBtn = counter.querySelector('.counter__btn--plus');
    let count = 0;

    plusBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      count++;
      updateCounter(valueEl, count);
      vibrate();
    });

    minusBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (count > 0) {
        count--;
        updateCounter(valueEl, count);
        vibrate();
      }
    });
  });

  function updateCounter(el, value) {
    el.textContent = value;
    // Bump animation
    el.classList.add('is-bumping');
    setTimeout(() => el.classList.remove('is-bumping'), 250);
  }

  // --- Sleep ---
  const bedtimeInput = document.getElementById('sleep-bedtime');
  const waketimeInput = document.getElementById('sleep-waketime');
  const durationEl = document.getElementById('sleep-duration');

  function calculateSleep() {
    if (!bedtimeInput.value || !waketimeInput.value) {
      durationEl.textContent = '';
      return;
    }

    const [bedH, bedM] = bedtimeInput.value.split(':').map(Number);
    const [wakeH, wakeM] = waketimeInput.value.split(':').map(Number);

    let bedMinutes = bedH * 60 + bedM;
    let wakeMinutes = wakeH * 60 + wakeM;

    // If wake is before bed, it means wake is next day
    if (wakeMinutes <= bedMinutes) {
      wakeMinutes += 24 * 60;
    }

    const diff = wakeMinutes - bedMinutes;
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;

    if (mins === 0) {
      durationEl.textContent = hours + ' hrs';
    } else {
      durationEl.textContent = hours + 'h ' + mins + 'm';
    }
  }

  bedtimeInput.addEventListener('change', calculateSleep);
  waketimeInput.addEventListener('change', calculateSleep);

  // --- Gym Toggle ---
  const gymToggle = document.getElementById('gym-toggle');
  const gymNoteWrap = document.getElementById('gym-note-wrap');
  let gymActive = false;

  gymToggle.addEventListener('click', () => {
    gymActive = !gymActive;
    gymToggle.classList.toggle('is-active', gymActive);
    gymNoteWrap.classList.toggle('is-visible', gymActive);
    vibrate();
  });

  // --- View Toggle ---
  const viewToday = document.getElementById('view-today');
  const viewHistory = document.getElementById('view-history');
  const dateToggle = document.getElementById('date-toggle');
  const historyBack = document.getElementById('history-back');

  dateToggle.addEventListener('click', () => {
    viewToday.style.display = 'none';
    viewHistory.style.display = 'block';
  });

  historyBack.addEventListener('click', () => {
    viewHistory.style.display = 'none';
    viewToday.style.display = 'block';
  });

  // --- Calendar ---
  const calGrid = document.getElementById('cal-grid');
  const calMonth = document.getElementById('cal-month');
  const calPrev = document.getElementById('cal-prev');
  const calNext = document.getElementById('cal-next');

  let currentMonth = 3; // April (0-indexed)
  let currentYear = 2026;

  // Sample mood data (hardcoded for prototype)
  const sampleData = {
    '2026-04-01': 'great',
    '2026-04-02': 'good',
    '2026-04-03': 'good',
    '2026-04-04': 'ok',
    '2026-04-05': 'low',
    '2026-04-06': 'bad',
    '2026-04-07': 'low',
    '2026-04-08': 'ok',
    '2026-04-09': 'good',
    '2026-03-25': 'good',
    '2026-03-26': 'great',
    '2026-03-27': 'ok',
    '2026-03-28': 'good',
    '2026-03-29': 'low',
    '2026-03-30': 'ok',
    '2026-03-31': 'good',
  };

  const moodColors = {
    great: '#6B8F71',
    good: '#8BAF91',
    ok: '#B8B4AE',
    low: '#C4907C',
    bad: '#B07264',
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  function renderCalendar() {
    calGrid.innerHTML = '';
    calMonth.textContent = monthNames[currentMonth] + ' ' + currentYear;

    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Monday = 0, Sunday = 6
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;

    const today = new Date();
    const todayStr = today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0');

    // Empty cells before first day
    for (let i = 0; i < startDay; i++) {
      const empty = document.createElement('div');
      empty.className = 'cal-day cal-day--empty';
      empty.innerHTML = '<span class="cal-day__num">0</span><span class="cal-day__dot"></span>';
      calGrid.appendChild(empty);
    }

    // Day cells
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = currentYear + '-' +
        String(currentMonth + 1).padStart(2, '0') + '-' +
        String(d).padStart(2, '0');

      const cell = document.createElement('div');
      cell.className = 'cal-day';

      const isToday = dateStr === todayStr;
      const isFuture = new Date(currentYear, currentMonth, d) > today;

      if (isToday) cell.classList.add('cal-day--today');
      if (isFuture) cell.classList.add('cal-day--future');

      const numSpan = document.createElement('span');
      numSpan.className = 'cal-day__num';
      numSpan.textContent = d;

      const dotSpan = document.createElement('span');
      dotSpan.className = 'cal-day__dot';

      if (sampleData[dateStr] && !isFuture) {
        dotSpan.classList.add('has-data');
        dotSpan.style.background = moodColors[sampleData[dateStr]];
      }

      cell.appendChild(numSpan);
      cell.appendChild(dotSpan);
      calGrid.appendChild(cell);
    }
  }

  calPrev.addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    renderCalendar();
  });

  calNext.addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    renderCalendar();
  });

  renderCalendar();

  // --- Haptic Feedback ---
  function vibrate() {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  }

  // --- Prevent section scale on internal interactions ---
  document.querySelectorAll('.section').forEach(section => {
    const interactives = section.querySelectorAll('button, input, .meal-row');
    interactives.forEach(el => {
      el.addEventListener('mousedown', (e) => e.stopPropagation());
      el.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
    });
  });

})();

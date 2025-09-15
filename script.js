let totalScrolls = 0;
let inScroll = false;
let scrollInputs = 0;
let scrollStart = 0;
let scrollEnd = 0;
let scrollTimeout = null;
let scrollHistory = [];

const scrollCountElem = document.getElementById('scrollCount');
const inputsInScrollElem = document.getElementById('inputsInScroll');
const scrollDurationElem = document.getElementById('scrollDuration');
const inputsPerSecondElem = document.getElementById('inputsPerSecond');
const avgInputsPerSecondElem = document.getElementById('avgInputsPerSecond');
const scrollHistoryElem = document.getElementById('scrollHistory');

function resetScrollSession() {
  scrollInputs = 0;
  scrollStart = 0;
  scrollEnd = 0;
}

function updateDisplay() {
  scrollCountElem.textContent = totalScrolls;
  inputsInScrollElem.textContent = scrollInputs;
  const duration = scrollEnd && scrollStart ? (scrollEnd - scrollStart) : 0;
  scrollDurationElem.textContent = duration;
  let ips = 0;
  if (duration > 0 && scrollInputs > 0) {
    ips = (scrollInputs / (duration / 1000));
  }
  inputsPerSecondElem.textContent = ips.toFixed(2);

  // Update scroll history table
  scrollHistoryElem.innerHTML = scrollHistory.map((item, idx) => {
    return `<tr><td>${idx + 1}</td><td>${item.inputs}</td><td>${item.duration}</td><td>${item.ips.toFixed(2)}</td></tr>`;
  }).join('');

  // Update average inputs per second
  if (scrollHistory.length > 0) {
    const avg = scrollHistory.reduce((sum, item) => sum + item.ips, 0) / scrollHistory.length;
    avgInputsPerSecondElem.textContent = avg.toFixed(2);
  } else {
    avgInputsPerSecondElem.textContent = '0.00';
  }
}

window.addEventListener('wheel', () => {
  const now = Date.now();
  if (!inScroll) {
    inScroll = true;
    scrollInputs = 1;
    scrollStart = now;
    scrollEnd = now;
    totalScrolls++;
    updateDisplay();
    if (scrollTimeout) clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      inScroll = false;
      // Record scroll session
      const duration = scrollEnd && scrollStart ? (scrollEnd - scrollStart) : 0;
      let ips = 0;
      if (duration > 0 && scrollInputs > 0) {
        ips = (scrollInputs / (duration / 1000));
      }
      if (scrollInputs > 0 && duration > 0) {
        scrollHistory.push({ inputs: scrollInputs, duration, ips });
      }
      updateDisplay();
      resetScrollSession();
      updateDisplay();
    }, 300);
  } else {
    scrollInputs++;
    scrollEnd = now;
    updateDisplay();
    if (scrollTimeout) clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      inScroll = false;
      // Record scroll session
      const duration = scrollEnd && scrollStart ? (scrollEnd - scrollStart) : 0;
      let ips = 0;
      if (duration > 0 && scrollInputs > 0) {
        ips = (scrollInputs / (duration / 1000));
      }
      if (scrollInputs > 0 && duration > 0) {
        scrollHistory.push({ inputs: scrollInputs, duration, ips });
      }
      updateDisplay();
      resetScrollSession();
      updateDisplay();
    }, 300);
  }
});

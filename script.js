
let totalScrolls = 0;
let inScroll = false;
let scrollInputs = 0;
let scrollStart = 0;
let scrollEnd = 0;
let scrollTimeout = null;
let scrollHistory = [];
let scrollTimestamps = [];

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
  scrollTimestamps = [];
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
    // Show CV as 'Variation', multiplied by 100, 4 significant figures
    let variation = '';
    if (item.cv !== undefined) {
      variation = (item.cv * 100).toPrecision(4);
    }
    // Interpolate color for Inputs/sec
    const target = 33.33;
    const maxDist = 20;
    const dist = Math.abs(item.ips - target);
    let color = '#1db954'; // green
    if (dist <= maxDist) {
      // 0 = green, 10 = yellow, 20 = red
      if (dist <= 10) {
        // Green to yellow
        // green: #1db954 (29,185,84), yellow: #ffd600 (255,214,0)
        const t = dist / 10;
        const r = Math.round(29 + (255 - 29) * t);
        const g = Math.round(185 + (214 - 185) * t);
        const b = Math.round(84 + (0 - 84) * t);
        color = `rgb(${r},${g},${b})`;
      } else {
        // Yellow to red
        // yellow: #ffd600 (255,214,0), red: #e53935 (229,57,53)
        const t = (dist - 10) / 10;
        const r = Math.round(255 + (229 - 255) * t);
        const g = Math.round(214 + (57 - 214) * t);
        const b = Math.round(0 + (53 - 0) * t);
        color = `rgb(${r},${g},${b})`;
      }
    } else {
      color = '#e53935'; // red
    }

    // Interpolate color for Variation
    let variationColor = '#1db954'; // green
    let variationValue = parseFloat(variation);
    if (!isNaN(variationValue)) {
      if (variationValue < 10) {
        variationColor = '#1db954';
      } else if (variationValue < 30) {
        // Interpolate green to red
        // green: #1db954 (29,185,84), red: #e53935 (229,57,53)
        const t = (variationValue - 10) / 20;
        const r = Math.round(29 + (229 - 29) * t);
        const g = Math.round(185 + (57 - 185) * t);
        const b = Math.round(84 + (53 - 84) * t);
        variationColor = `rgb(${r},${g},${b})`;
      } else {
        variationColor = '#e53935';
      }
    }

    // Visual distribution bar for scrolls
    let distribution = '';
    if (item.timestamps && item.timestamps.length > 1) {
    const min = item.timestamps[0];
    const max = item.timestamps[item.timestamps.length - 1];
    const range = max - min || 1;
    const barWidth = 240;
  const dotRadius = 4; // px (for 8px dot)
  const leftPad = dotRadius + 2; // px, gap from left
  const rightPad = dotRadius + 12; // px, increased gap from right for breathing room
    distribution = `<div style="position:relative;width:${barWidth}px;height:16px;background:#eee;border-radius:8px;overflow:hidden;display:inline-block;">`;

      // Section coloring logic
      const interval = 15; // ms
      const sectionCount = Math.ceil((max - min) / interval);
      for (let s = 0; s < sectionCount; s++) {
        const sectionStart = min + s * interval;
        const sectionEnd = sectionStart + interval;
        // Check if any scroll input lands within this section
        const hasScroll = item.timestamps.some(ts => ts >= sectionStart && ts < sectionEnd);
        if (hasScroll) {
          // Color the section background
          const left = leftPad + ((sectionStart - min) / range) * (barWidth - leftPad - rightPad);
          const width = (interval / range) * (barWidth - leftPad - rightPad);
          distribution += `<span style='position:absolute;left:${left}px;top:0;width:${width}px;height:100%;background:#b3e5fc;opacity:0.5;z-index:0;'></span>`;
        }
      }

      // Add vertical dividers every 0.015s (15ms)
      for (let t = min + interval; t <= max; t += interval) {
        const left = leftPad + ((t - min) / range) * (barWidth - leftPad - rightPad);
        distribution += `<span style='position:absolute;left:${left}px;top:0;width:2px;height:100%;background:#bbb;opacity:0.7;z-index:1;'></span>`;
      }

      // Add scroll dots
      item.timestamps.forEach((ts) => {
        const left = leftPad + ((ts - min) / range) * (barWidth - leftPad - rightPad);
        const style = `position:absolute;left:${left}px;top:3px;width:8px;height:8px;background:#333;border-radius:50%;display:block;z-index:2;`;
        distribution += `<span style='${style}'></span>`;
      });
      distribution += '</div>';
    }
    return `<tr><td>${idx + 1}</td><td>${item.inputs}</td><td>${item.duration}</td><td style=\"color:${color};font-weight:bold\">${item.ips.toFixed(2)}</td><td style=\"color:${variationColor};font-weight:bold\">${variation}</td><td>${distribution}</td></tr>`;
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
    scrollTimestamps = [now];
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
      // Calculate CV
      let cv = undefined;
      if (scrollTimestamps.length > 1) {
        const intervals = [];
        for (let i = 1; i < scrollTimestamps.length; i++) {
          intervals.push(scrollTimestamps[i] - scrollTimestamps[i - 1]);
        }
        const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const std = Math.sqrt(intervals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / intervals.length);
        if (mean !== 0) {
          cv = std / mean;
        }
      }
      if (scrollInputs > 0 && duration > 0) {
        scrollHistory.push({ inputs: scrollInputs, duration, ips, cv, timestamps: [...scrollTimestamps] });
      }
      updateDisplay();
      resetScrollSession();
      updateDisplay();
    }, 300);
  } else {
    scrollInputs++;
    scrollEnd = now;
    scrollTimestamps.push(now);
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
      // Calculate CV
      let cv = undefined;
      if (scrollTimestamps.length > 1) {
        const intervals = [];
        for (let i = 1; i < scrollTimestamps.length; i++) {
          intervals.push(scrollTimestamps[i] - scrollTimestamps[i - 1]);
        }
        const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const std = Math.sqrt(intervals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / intervals.length);
        if (mean !== 0) {
          cv = std / mean;
        }
      }
      if (scrollInputs > 0 && duration > 0) {
        scrollHistory.push({ inputs: scrollInputs, duration, ips, cv, timestamps: [...scrollTimestamps] });
      }
      updateDisplay();
      resetScrollSession();
      updateDisplay();
    }, 300);
  }
});

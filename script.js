document.addEventListener("DOMContentLoaded", () => {
  const timersContainer = document.getElementById("timers-container");
  const addTimerBtn = document.getElementById("add-timer-btn");
  const themeToggleBtn = document.getElementById("theme-toggle-btn");

  let timers = JSON.parse(localStorage.getItem("cooldownTimers")) || [];
  let intervals = {};

  const saveTimers = () => {
    localStorage.setItem(
      "cooldownTimers",
      JSON.stringify(
        timers.map((t) => {
          const { interval, ...timer } = t;
          return timer;
        }),
      ),
    );
  };

  const formatTime = (seconds) => {
    if (seconds > 86400) {
      const days = Math.floor(seconds / 86400);
      return `${days} day${days > 1 ? "s" : ""}`;
    }
    if (seconds > 3600) {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
    }
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const renderTimers = () => {
    timersContainer.innerHTML = "";
    timers.forEach((timer) => {
      const timerElement = document.createElement("div");
      timerElement.classList.add("timer");
      timerElement.dataset.id = timer.id;

      let timeDisplay;
      if (timer.isRunning) {
        const remaining = Math.round((timer.endTime - Date.now()) / 1000);
        timeDisplay = remaining > 0 ? formatTime(remaining) : "Ready";
        const progress = Math.max(
          0,
          ((timer.duration - remaining) / timer.duration) * 100,
        );
        timerElement.style.background = `linear-gradient(to right, var(--progress-bar-color) ${progress}%, var(--timer-background) ${progress}%)`;
      } else {
        timeDisplay = "Ready";
        timerElement.classList.add("timer-ready");
      }

      timerElement.innerHTML = `
                <div class="timer-info">
                    <div class="timer-name">${timer.name}</div>
                    <div class="timer-time">${timeDisplay}</div>
                </div>
                <div class="timer-buttons">
                    <button class="btn start-btn">${timer.isRunning ? "Pause" : "Start"}</button>
                    <button class="btn reset-btn" style="display: ${timer.isRunning ? "inline-block" : "none"}">Reset</button>
                </div>
            `;

      timersContainer.appendChild(timerElement);
    });
  };

  const updateTimers = () => {
    let needsRender = false;
    timers.forEach((timer) => {
      if (timer.isRunning) {
        const remaining = timer.endTime - Date.now();
        if (remaining <= 0) {
          timer.isRunning = false;
          clearInterval(intervals[timer.id]);
          delete intervals[timer.id];
          needsRender = true;
        }
      }
    });
    if (needsRender) {
      saveTimers();
      renderTimers();
    }
  };

  const tick = () => {
    updateTimers();
    renderTimers();
  };

  const addTimer = () => {
    const name = prompt("Enter timer name:");
    if (!name) return;

    const durationInput = prompt("Enter duration in seconds:");
    const duration = parseInt(durationInput, 10);

    if (isNaN(duration) || duration <= 0) {
      alert("Please enter a valid duration.");
      return;
    }

    const newTimer = {
      id: Date.now(),
      name,
      duration,
      isRunning: false,
      endTime: 0,
    };

    timers.push(newTimer);
    saveTimers();
    renderTimers();
  };

  const setInitialTheme = () => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      document.body.classList.toggle("dark-mode", savedTheme === "dark");
      return;
    }

    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      document.body.classList.add("dark-mode");
    }
  };

  timersContainer.addEventListener("click", (e) => {
    const id = parseInt(e.target.closest(".timer").dataset.id, 10);
    const timer = timers.find((t) => t.id === id);

    if (e.target.classList.contains("start-btn")) {
      if (timer.isRunning) {
        timer.isRunning = false;
        clearInterval(intervals[timer.id]);
        delete intervals[timer.id];
      } else {
        timer.isRunning = true;
        timer.endTime = Date.now() + timer.duration * 1000;
      }
      saveTimers();
      renderTimers();
    }

    if (e.target.classList.contains("reset-btn")) {
      timer.isRunning = true;
      timer.endTime = Date.now() + timer.duration * 1000;
      saveTimers();
      renderTimers();
    }
  });

  addTimerBtn.addEventListener("click", addTimer);

  themeToggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const isDarkMode = document.body.classList.contains("dark-mode");
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  });

  // Initialize timers on load
  timers.forEach((timer) => {
    if (timer.isRunning) {
      const remaining = timer.endTime - Date.now();
      if (remaining > 0) {
        intervals[timer.id] = setInterval(tick, 1000);
      } else {
        timer.isRunning = false;
      }
    }
  });
  setInitialTheme();
  saveTimers();
  renderTimers();
  setInterval(tick, 1000);

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SW registered: ", registration);
        })
        .catch((registrationError) => {
          console.log("SW registration failed: ", registrationError);
        });
    });
  }
});

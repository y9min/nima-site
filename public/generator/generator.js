(function () {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const params = new URLSearchParams(location.search);
  const colors = { social: "bar-social", work: "bar-work", other: "bar-other" };
  const suspiciousAppPool = [
    ["PolyBuzz", "Entertainment", .5, "#7357ff", "P", "polybuzz.jpg"],
    ["Character.AI", "Entertainment", .5, "#111", "C", "character-ai.jpg"],
    ["Grindr", "Social", .5, "#ffd629", "G", "grindr.jpg"],
    ["Roblox", "Entertainment", .5, "#111", "R", "roblox.jpg"],
    ["NordVPN", "Productivity & Finance", .5, "#477cf3", "N", "nordvpn.jpg"]
  ];
  const appProfiles = {
    social: [
      ["TikTok", "Social", 1.9, "#101010", "♪", "tiktok.jpg"], ["Instagram", "Social", 1.15, "#d62976", "IG", "instagram.jpg"],
      ["X", "Social", .26, "#111", "𝕏", "x.jpg"], ["YouTube", "Entertainment", .23, "#f00", "▶", "youtube.jpg"],
      ["Messages", "Social", .17, "#34c759", "●", "messages.jpg"], ["Safari", "Productivity & Finance", .14, "#147efb", "◉", "safari.jpg"]
    ],
    balanced: [
      ["Safari", "Productivity & Finance", 1, "#147efb", "◉", "safari.jpg"], ["Messages", "Social", .85, "#34c759", "●", "messages.jpg"],
      ["YouTube", "Entertainment", .8, "#f00", "▶", "youtube.jpg"], ["Instagram", "Social", .65, "#d62976", "IG", "instagram.jpg"],
      ["Mail", "Productivity & Finance", .48, "#1688f8", "✉", "mail.jpg"], ["Maps", "Other", .36, "#37b45b", "↗", "maps.jpg"]
    ],
    night: [
      ["TikTok", "Social", 1.1, "#101010", "♪", "tiktok.jpg"], ["YouTube", "Entertainment", .95, "#f00", "▶", "youtube.jpg"],
      ["Instagram", "Social", .8, "#d62976", "IG", "instagram.jpg"], ["Safari", "Productivity & Finance", .52, "#147efb", "◉", "safari.jpg"],
      ["Reddit", "Social", .44, "#ff4500", "r", "reddit.jpg"], ["Messages", "Social", .32, "#34c759", "●", "messages.jpg"]
    ],
    productive: [
      ["Safari", "Productivity & Finance", 1.15, "#147efb", "◉", "safari.jpg"], ["Notion", "Productivity & Finance", .9, "#f5f5f5", "N", "notion.jpg"],
      ["Mail", "Productivity & Finance", .72, "#1688f8", "✉", "mail.jpg"], ["Messages", "Social", .45, "#34c759", "●", "messages.jpg"],
      ["Calendar", "Productivity & Finance", .4, "#fff", "13", "calendar.jpg"], ["YouTube", "Entertainment", .34, "#f00", "▶", "youtube.jpg"]
    ]
  };

  let state = readState();
  let view = params.get("view") === "week" ? "week" : "day";
  let categoryMode = false;
  const requestedDayParam = params.get("day");
  const requestedDay = requestedDayParam === null ? NaN : Number(requestedDayParam);
  let selectedIndex = Number.isInteger(requestedDay) && requestedDay >= 0 && requestedDay <= 6
    ? requestedDay
    : (new Date(`${state.date}T12:00:00`).getDay() + 6) % 7;

  function hashSeed(text) {
    let hash = 2166136261;
    for (let i = 0; i < text.length; i++) { hash ^= text.charCodeAt(i); hash = Math.imul(hash, 16777619); }
    return hash >>> 0;
  }

  function rng(seed) {
    let n = seed || 1;
    return function () { n += 0x6D2B79F5; let t = n; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }

  function localDateValue(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function readState() {
    const today = localDateValue(new Date());
    const minutes = Math.max(1, Math.min(1439, Number(params.get("minutes")) || 425));
    return {
      name: (params.get("name") || "Ella’s iPhone").slice(0, 24),
      minutes,
      profile: appProfiles[params.get("profile")] ? params.get("profile") : "social",
      theme: params.get("theme") === "light" ? "light" : "dark",
      date: /^\d{4}-\d{2}-\d{2}$/.test(params.get("date") || "") ? params.get("date") : today,
      seed: Number(params.get("seed")) || hashSeed(`${minutes}-${today}-social`)
    };
  }

  function partition(total, entries, random) {
    const weights = entries.map((entry) => entry[2] * (.78 + random() * .44));
    const sum = weights.reduce((a, b) => a + b, 0);
    const values = weights.map((weight) => Math.floor(total * weight / sum));
    let remaining = total - values.reduce((a, b) => a + b, 0);
    while (remaining-- > 0) values[Math.floor(random() * values.length)]++;
    return values;
  }

  function allocateHours(total, profile, random) {
    const profiles = {
      social: [.34,.13,0,0,0,0,0,.25,.55,.52,.7,.82,.65,.78,.72,.86,.9,.95,.72,.84,1,1.08,.9,.55],
      balanced: [.2,.06,0,0,0,0,0,.32,.68,.62,.74,.8,.65,.82,.72,.86,.88,.78,.62,.7,.82,.76,.58,.34],
      night: [.8,.55,.18,0,0,0,0,.08,.25,.4,.48,.6,.62,.72,.7,.8,.92,1,.9,1.02,1.12,1.2,1.15,.98],
      productive: [.1,0,0,0,0,0,0,.22,.64,1,1.06,.95,.7,.92,1.08,1,.9,.72,.42,.38,.32,.28,.2,.12]
    };
    const weights = profiles[profile].map((weight) => weight ? weight * (.78 + random() * .44) : 0);
    const awake = weights.map((weight, index) => weight > 0 && index > 6 ? index : -1).filter((index) => index >= 0);
    const gapCount = total < 480 ? 4 : total < 720 ? 2 : total < 960 ? 1 : 0;
    for (let i = 0; i < gapCount && awake.length; i++) {
      const pick = Math.floor(random() * awake.length);
      weights[awake.splice(pick, 1)[0]] = 0;
    }
    const availableCapacity = weights.filter(Boolean).length * 60;
    if (total > availableCapacity) weights.forEach((weight, index) => { if (!weight) weights[index] = .025; });

    const result = Array(24).fill(0);
    for (let minute = 0; minute < total; minute++) {
      let candidates = weights.map((weight, index) => ({weight, index})).filter((entry) => entry.weight > 0 && result[entry.index] < 60);
      if (!candidates.length) candidates = result.map((value, index) => ({weight:.01,index})).filter((entry) => result[entry.index] < 60);
      const weightTotal = candidates.reduce((sum, entry) => sum + entry.weight, 0);
      let roll = random() * weightTotal;
      const chosen = candidates.find((entry) => (roll -= entry.weight) <= 0) || candidates[candidates.length - 1];
      result[chosen.index]++;
    }
    return result;
  }

  function getWeekDate(index) {
    const anchor = new Date(`${state.date}T12:00:00`);
    const anchorIndex = (anchor.getDay() + 6) % 7;
    anchor.setDate(anchor.getDate() - anchorIndex + index);
    return anchor;
  }

  function generateData() {
    const weekRandom = rng(hashSeed(`${state.seed}-week`));
    const currentIndex = (new Date(`${state.date}T12:00:00`).getDay() + 6) % 7;
    const offsets = [];
    for (let pair = 0; pair < 3; pair++) {
      const difference = 45 + Math.floor(weekRandom() * 91);
      offsets.push(difference, -difference);
    }
    for (let i = offsets.length - 1; i > 0; i--) {
      const target = Math.floor(weekRandom() * (i + 1));
      [offsets[i], offsets[target]] = [offsets[target], offsets[i]];
    }
    let comparisonIndex = 0;
    const week = Array.from({length:7}, (_, i) => i === currentIndex
      ? state.minutes
      : Math.max(1, Math.min(1439, state.minutes + offsets[comparisonIndex++])));
    const selectedMinutes = week[selectedIndex];
    const random = rng(hashSeed(`${state.seed}-day-${selectedIndex}`));
    let apps = appProfiles[state.profile];
    if (state.profile === "social") {
      const suspiciousApp = suspiciousAppPool[hashSeed(`${state.seed}-sus-${selectedIndex}`) % suspiciousAppPool.length];
      apps = [apps[0], apps[1], suspiciousApp, ...apps.slice(2)];
    }
    const appMinutes = partition(selectedMinutes, apps, random);
    const appData = apps.map((app, i) => ({ name: app[0], category: app[1], minutes: appMinutes[i], color: app[3], glyph: app[4], icon: app[5] })).sort((a,b) => b.minutes-a.minutes);
    const hours = allocateHours(selectedMinutes, state.profile, random);
    const categoryTotals = { social: 0, work: 0, other: 0 };
    appData.forEach((app) => {
      if (app.category === "Social" || app.category === "Entertainment") categoryTotals.social += app.minutes;
      else if (app.category === "Productivity & Finance") categoryTotals.work += app.minutes;
      else categoryTotals.other += app.minutes;
    });
    if (!categoryTotals.other) { const moved = Math.max(2, Math.round(selectedMinutes * .01)); categoryTotals.other = moved; categoryTotals.social = Math.max(0, categoryTotals.social - moved); }
    return { appData, hours, categoryTotals, week, currentIndex, selectedMinutes };
  }

  function formatMinutes(minutes) {
    const h = Math.floor(minutes / 60), m = minutes % 60;
    return h && m ? `${h}h ${m}m` : h ? `${h}h` : `${m}m`;
  }

  function render() {
    document.documentElement.dataset.theme = state.theme;
    $("meta[name='theme-color']").content = state.theme === "light" ? "#f2f2f7" : "#000000";
    $("meta[name='apple-mobile-web-app-status-bar-style']").content = state.theme === "light" ? "default" : "black";
    const data = generateData();
    const date = getWeekDate(selectedIndex);
    const selectedDate = localDateValue(date);
    const today = localDateValue(new Date()) === selectedDate;
    const dateText = date.toLocaleDateString("en-GB", { day: "numeric", month: "long" });
    $("#device-name").textContent = state.name;
    $("#date-label").textContent = `${today ? "Today" : date.toLocaleDateString("en-GB", {weekday:"long"})}, ${dateText}`;
    $("#total-label").textContent = view === "week" ? `${formatMinutes(data.week.reduce((a,b)=>a+b,0))}` : formatMinutes(data.selectedMinutes);
    $("#week-tab").classList.toggle("selected", view === "week");
    $("#day-tab").classList.toggle("selected", view === "day");
    $("#week-tab").setAttribute("aria-selected", String(view === "week"));
    $("#day-tab").setAttribute("aria-selected", String(view === "day"));

    const maxWeek = Math.max(480, Math.ceil(Math.max(...data.week) / 120) * 120);
    const average = data.week.reduce((sum, minutes) => sum + minutes, 0) / 7;
    $("#week-axis-top").textContent = `${maxWeek / 60}h`;
    $("#week-axis-mid").textContent = `${maxWeek / 120}h`;
    $("#average-line").style.top = `${Math.max(0, Math.min(100, 100 - average / maxWeek * 100))}%`;
    $("#average-line").setAttribute("aria-label", `Weekly average ${formatMinutes(Math.round(average))}`);
    $("#average-line").title = `Weekly average: ${formatMinutes(Math.round(average))}`;
    $("#week-bars").innerHTML = data.week.map((minutes, i) => {
      const current = i === selectedIndex;
      const usedHeight = Math.min(100, minutes / maxWeek * 100);
      const workRatio = data.categoryTotals.work / data.selectedMinutes;
      const otherRatio = data.categoryTotals.other / data.selectedMinutes;
      const label = getWeekDate(i).toLocaleDateString("en-GB", {weekday:"long",day:"numeric",month:"long"});
      return `<button class="day-column" data-day="${i}" aria-label="${label}, ${formatMinutes(minutes)}" aria-pressed="${current}"><span class="day-stack" style="height:${usedHeight}%">${current ? `<i class="bar-social" style="height:${Math.max(0, 100-workRatio*100-otherRatio*100)}%"></i><i class="bar-work" style="height:${workRatio*100}%"></i><i class="bar-other" style="height:${otherRatio*100}%"></i>` : `<i class="unused"></i>`}</span><i class="day-letter">${["M","T","W","T","F","S","S"][i]}</i></button>`;
    }).join("");
    $("#week-bars").querySelectorAll("[data-day]").forEach((button) => button.addEventListener("click", () => { selectedIndex = Number(button.dataset.day); render(); }));

    $("#hour-bars").innerHTML = data.hours.map((minutes, i) => {
      let social = data.categoryTotals.social / data.selectedMinutes;
      let work = data.categoryTotals.work / data.selectedMinutes;
      let other = data.categoryTotals.other / data.selectedMinutes;
      if (i >= 9 && i <= 17) work *= 1.35;
      if (i >= 19 || i <= 1) social *= 1.2;
      const total = social + work + other;
      const neutral = minutes && (i * 11 + state.seed + selectedIndex) % 5 < 2 ? .2 + ((i + selectedIndex) % 3) * .05 : 0;
      social = social / total * (1 - neutral); work = work / total * (1 - neutral); other = other / total * (1 - neutral);
      return `<div class="hour-stack" title="${i}:00 — ${minutes} min" style="height:${minutes/60*100}%"><i class="bar-social" style="height:${social*100}%"></i><i class="bar-work" style="height:${work*100}%"></i><i class="bar-other" style="height:${other*100}%"></i><i class="bar-neutral" style="height:${neutral*100}%"></i></div>`;
    }).join("");

    const cats = [
      ["social", "Social", data.categoryTotals.social],
      ["work", "Productivity & Finance", data.categoryTotals.work],
      ["other", "Other", data.categoryTotals.other]
    ];
    $("#categories").innerHTML = cats.map(([cls, name, minutes]) => `<div class="category ${cls}"><strong>${name}</strong><span>${formatMinutes(minutes)}</span></div>`).join("");

    const list = categoryMode ? cats.map(([cls, name, minutes]) => ({name, minutes, color: cls === "social" ? "#0a84ff" : cls === "work" ? "#18c8d1" : "#ff9f2f", glyph: ""})) : data.appData;
    const maximumUsage = Math.max(1, ...list.map((app) => app.minutes));
    $("#app-list").innerHTML = list.map((app) => {
      const icon = app.icon
        ? `<img class="app-icon" src="./assets/app-icons/${app.icon}" alt="">`
        : `<i class="app-icon" style="background:${app.color};color:${app.color === "#fff" || app.color === "#f5f5f5" ? "#111" : "#fff"}">${app.glyph || ""}</i>`;
      const barWidth = Math.max(4, app.minutes / maximumUsage * 72);
      return `<button class="app-usage-row">${icon}<span class="app-details"><span class="app-name">${app.name}</span><span class="usage-line"><i class="usage-bar" style="width:${barWidth}%"></i><span class="usage-time">${formatMinutes(app.minutes)}</span></span></span><i class="row-chevron">›</i></button>`;
    }).join("");
    $("#category-toggle").textContent = categoryMode ? "Show Apps" : "Show Categories";
    updateUrl();
  }

  function updateUrl() {
    const next = new URLSearchParams({ minutes: state.minutes, profile: state.profile, theme: state.theme, date: state.date, seed: state.seed, name: state.name, day: selectedIndex });
    if (view === "week") next.set("view", "week");
    history.replaceState(null, "", `${location.pathname}?${next}`);
  }

  function openEditor() {
    $("#name-input").value = state.name;
    $("#hours-input").value = Math.floor(state.minutes / 60);
    $("#minutes-input").value = state.minutes % 60;
    $("#profile-input").value = state.profile;
    $("#theme-input").checked = state.theme === "light";
    $("#date-input").value = state.date;
    $("#editor").classList.add("open");
    $("#editor").setAttribute("aria-hidden", "false");
  }

  function closeEditor() { $("#editor").classList.remove("open"); $("#editor").setAttribute("aria-hidden", "true"); }
  function toast(message) { const el = $("#toast"); el.textContent = message; el.classList.add("show"); clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove("show"), 1800); }
  function setView(next) { view = next; render(); }

  $("#generator-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const hours = Math.max(0, Math.min(23, Number($("#hours-input").value) || 0));
    const minutes = Math.max(0, Math.min(59, Number($("#minutes-input").value) || 0));
    const nextName = $("#name-input").value.trim() || "Ella’s iPhone";
    const nextMinutes = Math.max(1, hours * 60 + minutes);
    const nextProfile = $("#profile-input").value;
    const nextDate = $("#date-input").value || localDateValue(new Date());
    const generationChanged = nextName !== state.name || nextMinutes !== state.minutes || nextProfile !== state.profile || nextDate !== state.date;
    state = {
      name: nextName,
      minutes: nextMinutes,
      profile: nextProfile,
      theme: $("#theme-input").checked ? "light" : "dark",
      date: nextDate,
      seed: generationChanged ? Math.floor(Math.random() * 2147483647) : state.seed
    };
    selectedIndex = (new Date(`${state.date}T12:00:00`).getDay() + 6) % 7;
    render(); closeEditor(); toast("New Screen Time generated");
  });
  $("#randomize-time").addEventListener("click", () => {
    const value = new Uint32Array(1);
    crypto.getRandomValues(value);
    const totalMinutes = 60 + value[0] % 1140;
    $("#hours-input").value = Math.floor(totalMinutes / 60);
    $("#minutes-input").value = totalMinutes % 60;
  });
  $("#apply-editor").addEventListener("click", () => $("#generator-form").requestSubmit());
  $("#cancel-editor").addEventListener("click", closeEditor);
  $("#sheet-backdrop").addEventListener("click", closeEditor);
  $("#customize-button").addEventListener("click", openEditor);
  $("#edit-trigger").addEventListener("click", openEditor);
  $("#screen-title").addEventListener("dblclick", openEditor);
  $("#day-tab").addEventListener("click", () => setView("day"));
  $("#week-tab").addEventListener("click", () => setView("week"));
  $("#category-toggle").addEventListener("click", () => { categoryMode = !categoryMode; render(); });
  $("#back-button").addEventListener("click", () => history.length > 1 ? history.back() : toast("Screen Time settings"));
  $("#devices-button").addEventListener("click", () => toast(`${state.name} is selected`));
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeEditor(); });

  const now = new Date();
  const timeText = now.toLocaleTimeString("en-US", {hour:"numeric",minute:"2-digit",hour12:true}).replace(/\s[AP]M$/i, "");
  const updatedTime = now.toLocaleTimeString("en-US", {hour:"numeric",minute:"2-digit",hour12:true}).replace(/\s/g, "").toLowerCase();
  $("#status-time").textContent = timeText;
  $("#updated-label").textContent = `Updated today at ${updatedTime}`;
  $("#date-input").value = state.date;
  render();
  if (!params.has("minutes")) setTimeout(openEditor, 320);

  if ("serviceWorker" in navigator) navigator.serviceWorker.register("./service-worker.js").catch(() => {});
})();

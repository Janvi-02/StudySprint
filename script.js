/**
 * ============================================================================
 * StudySprint - Vanilla JavaScript Application Logic
 * ============================================================================
 * Clean, modular architecture for managing subjects, topics, smart daily queues,
 * deadline calculations, progress metrics, and the 10-Minute Mission engine.
 */

(function () {
  'use strict';

  // --- Constants & Storage Keys ---
  const STORAGE_KEY = 'studysprint_app_v1';

  // --- Default Starter Sample Data for Instant Demo Experience ---
  const SAMPLE_SUBJECTS = [
    { id: 'subj-1', name: 'Data Structures & Algorithms', color: '#4f46e5', createdAt: Date.now() - 86400000 * 5 },
    { id: 'subj-2', name: 'Web Development', color: '#06b6d4', createdAt: Date.now() - 86400000 * 4 },
    { id: 'subj-3', name: 'Operating Systems', color: '#8b5cf6', createdAt: Date.now() - 86400000 * 3 },
    { id: 'subj-4', name: 'Discrete Mathematics', color: '#10b981', createdAt: Date.now() - 86400000 * 2 }
  ];

  // Helper to get formatted dates relative to today in local timezone
  function getRelativeDateString(daysOffset) {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const SAMPLE_TOPICS = [
    {
      id: 'topic-1',
      subjectId: 'subj-1',
      name: 'Binary Search & Two Pointers',
      difficulty: 'Medium',
      deadline: getRelativeDateString(0), // Due today
      estimatedMinutes: 45,
      priority: 'High',
      completed: false,
      completedAt: null
    },
    {
      id: 'topic-2',
      subjectId: 'subj-3',
      name: 'Process Synchronization & Semaphores',
      difficulty: 'Hard',
      deadline: getRelativeDateString(1), // Due tomorrow
      estimatedMinutes: 60,
      priority: 'High',
      completed: false,
      completedAt: null
    },
    {
      id: 'topic-3',
      subjectId: 'subj-2',
      name: 'CSS Grid & Flexbox Layouts',
      difficulty: 'Easy',
      deadline: getRelativeDateString(3),
      estimatedMinutes: 30,
      priority: 'Medium',
      completed: false,
      completedAt: null
    },
    {
      id: 'topic-4',
      subjectId: 'subj-4',
      name: 'Graph Theory & Euler Paths',
      difficulty: 'Medium',
      deadline: getRelativeDateString(5),
      estimatedMinutes: 45,
      priority: 'Medium',
      completed: false,
      completedAt: null
    },
    {
      id: 'topic-5',
      subjectId: 'subj-1',
      name: 'Arrays & String Manipulation',
      difficulty: 'Easy',
      deadline: getRelativeDateString(-2),
      estimatedMinutes: 30,
      priority: 'Medium',
      completed: true,
      completedAt: Date.now() - 86400000
    },
    {
      id: 'topic-6',
      subjectId: 'subj-2',
      name: 'JavaScript DOM Manipulation',
      difficulty: 'Medium',
      deadline: getRelativeDateString(-1),
      estimatedMinutes: 45,
      priority: 'High',
      completed: true,
      completedAt: Date.now() - 86400000
    }
  ];

  // ==========================================================================
  // STATE MANAGEMENT MODULE
  // ==========================================================================
  const AppState = {
    data: {
      subjects: [],
      topics: [],
      stats: {
        studyWins: 4,
        currentStreak: 2,
        lastActiveDate: getRelativeDateString(0),
        totalMinutesStudied: 120,
        missionsCompleted: 3
      },
      preferences: {
        theme: 'light'
      }
    },

    init() {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          this.data = JSON.parse(stored);
        } catch (e) {
          console.error('Failed to parse localStorage data, initializing sample data', e);
          this.loadSampleData(false);
        }
      } else {
        // Load starter sample data for first-time visitors
        this.loadSampleData(false);
      }
      this.checkStreakStatus();
      this.save();
    },

    save() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      } catch (err) {
        console.error('Failed to save to localStorage:', err);
      }
    },

    loadSampleData(shouldSave = true) {
      this.data.subjects = JSON.parse(JSON.stringify(SAMPLE_SUBJECTS));
      this.data.topics = JSON.parse(JSON.stringify(SAMPLE_TOPICS));
      this.data.stats = {
        studyWins: 5,
        currentStreak: 3,
        lastActiveDate: getRelativeDateString(0),
        totalMinutesStudied: 150,
        missionsCompleted: 4
      };
      if (shouldSave) {
        this.save();
      }
    },

    clearAllData() {
      this.data.subjects = [];
      this.data.topics = [];
      this.data.stats = {
        studyWins: 0,
        currentStreak: 0,
        lastActiveDate: null,
        totalMinutesStudied: 0,
        missionsCompleted: 0
      };
      this.save();
    },

    // --- Streak & Study Win Management ---
    checkStreakStatus() {
      const todayStr = getRelativeDateString(0);
      const lastActive = this.data.stats.lastActiveDate;

      if (!lastActive) {
        this.data.stats.currentStreak = 0;
        return;
      }

      const today = new Date(todayStr);
      const last = new Date(lastActive);
      const diffTime = today.getTime() - last.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      // If more than 1 day has passed without activity, streak is broken
      if (diffDays > 1) {
        this.data.stats.currentStreak = 0;
      }
    },

    recordStudyActivity(minutes = 10, isMission = false) {
      const todayStr = getRelativeDateString(0);
      const lastActive = this.data.stats.lastActiveDate;

      if (!lastActive) {
        this.data.stats.currentStreak = 1;
      } else {
        const today = new Date(todayStr);
        const last = new Date(lastActive);
        const diffTime = today.getTime() - last.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          // Consecutive day: increment streak
          this.data.stats.currentStreak += 1;
        } else if (diffDays === 0) {
          // Same day: streak stays intact
          if (this.data.stats.currentStreak === 0) {
            this.data.stats.currentStreak = 1;
          }
        } else if (diffDays > 1) {
          // Missed days: reset to 1
          this.data.stats.currentStreak = 1;
        }
      }

      this.data.stats.lastActiveDate = todayStr;
      this.data.stats.studyWins += 1;
      this.data.stats.totalMinutesStudied += minutes;
      if (isMission) {
        this.data.stats.missionsCompleted += 1;
      }

      this.save();
    },

    // --- Subject Operations ---
    addSubject(name, color = '#4f46e5') {
      const trimmed = name.trim();
      if (!trimmed) return null;
      const newSubject = {
        id: 'subj-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        name: trimmed,
        color: color,
        createdAt: Date.now()
      };
      this.data.subjects.push(newSubject);
      this.save();
      return newSubject;
    },

    deleteSubject(subjectId) {
      this.data.subjects = this.data.subjects.filter(s => s.id !== subjectId);
      // Also remove all associated topics
      this.data.topics = this.data.topics.filter(t => t.subjectId !== subjectId);
      this.save();
    },

    getSubject(subjectId) {
      return this.data.subjects.find(s => s.id === subjectId) || {
        id: 'unknown',
        name: 'General',
        color: '#64748b'
      };
    },

    // --- Topic Operations ---
    addTopic({ name, subjectId, difficulty, deadline, estimatedMinutes, priority }) {
      const newTopic = {
        id: 'topic-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        name: name.trim(),
        subjectId: subjectId,
        difficulty: difficulty || 'Medium',
        deadline: deadline || getRelativeDateString(3),
        estimatedMinutes: parseInt(estimatedMinutes, 10) || 45,
        priority: priority || 'Medium',
        completed: false,
        completedAt: null
      };
      this.data.topics.push(newTopic);
      this.save();
      return newTopic;
    },

    toggleTopicComplete(topicId) {
      const topic = this.data.topics.find(t => t.id === topicId);
      if (topic) {
        topic.completed = !topic.completed;
        topic.completedAt = topic.completed ? Date.now() : null;
        if (topic.completed) {
          this.recordStudyActivity(topic.estimatedMinutes || 30, false);
        }
        this.save();
        return topic;
      }
      return null;
    },

    deleteTopic(topicId) {
      this.data.topics = this.data.topics.filter(t => t.id !== topicId);
      this.save();
    }
  };

  // ==========================================================================
  // SMART ALGORITHM & CALCULATIONS
  // ==========================================================================
  const AnalyticsEngine = {
    // Computes overall completion and stats
    getOverallStats() {
      const total = AppState.data.topics.length;
      const completed = AppState.data.topics.filter(t => t.completed).length;
      const remaining = total - completed;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        total,
        completed,
        remaining,
        percentage,
        studyWins: AppState.data.stats.studyWins,
        currentStreak: AppState.data.stats.currentStreak
      };
    },

    // Calculates stats per subject
    getSubjectStats(subjectId) {
      const topics = AppState.data.topics.filter(t => t.subjectId === subjectId);
      const total = topics.length;
      const completed = topics.filter(t => t.completed).length;
      const remaining = total - completed;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { total, completed, remaining, percentage };
    },

    // Calculates difference in days from today (e.g. 0 = today, -1 = yesterday/overdue, 2 = in 2 days)
    getDaysUntilDeadline(deadlineStr) {
      if (!deadlineStr) return 999;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const parts = deadlineStr.split('-');
      if (parts.length === 3) {
        const target = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        target.setHours(0, 0, 0, 0);
        const diffTime = target.getTime() - today.getTime();
        return Math.round(diffTime / (1000 * 60 * 60 * 24));
      }
      return 0;
    },

    // Formats a date nicely for humans (e.g. "15 September" or "Aug 30, 2026")
    formatDate(dateStr) {
      if (!dateStr) return 'No deadline';
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      }
      return dateStr;
    },

    // Smart priority scoring for "Today's Study Plan"
    getSmartTodaysPlan() {
      const incomplete = AppState.data.topics.filter(t => !t.completed);

      const scored = incomplete.map(topic => {
        let score = 0;
        const days = this.getDaysUntilDeadline(topic.deadline);

        // 1. Deadline Urgency Factor
        if (days < 0) {
          score += 1200; // Overdue tasks take absolute top priority
        } else if (days === 0) {
          score += 900; // Due today
        } else if (days === 1) {
          score += 700; // Due tomorrow
        } else if (days <= 3) {
          score += 450; // Due within 3 days
        } else if (days <= 7) {
          score += 250; // Due this week
        } else {
          score += 50;
        }

        // 2. Priority Weight
        if (topic.priority === 'High') score += 300;
        else if (topic.priority === 'Medium') score += 150;
        else score += 50;

        // 3. Difficulty/Time Balancing
        if (topic.difficulty === 'Easy') score += 50; // Easy quick wins boost early momentum
        else if (topic.difficulty === 'Medium') score += 40;
        else score += 20;

        return { topic, score, days };
      });

      // Sort descending by score
      scored.sort((a, b) => b.score - a.score);
      return scored.map(item => item.topic);
    },

    // Chronologically sorted upcoming deadlines list
    getSortedDeadlines() {
      const incomplete = AppState.data.topics.filter(t => !t.completed);
      return incomplete.sort((a, b) => {
        const daysA = this.getDaysUntilDeadline(a.deadline);
        const daysB = this.getDaysUntilDeadline(b.deadline);
        return daysA - daysB;
      });
    },

    // Intelligent selector for 10-Minute Mission
    selectMissionTopic(chosenMinutes = 10) {
      const incomplete = AppState.data.topics.filter(t => !t.completed);
      if (incomplete.length === 0) return null;

      // Filter candidates based on selected time
      let candidates = [...incomplete];

      // If user chose only 10 minutes, filter out 'Hard' topics unless only Hard remain
      if (chosenMinutes === 10) {
        const nonHard = candidates.filter(t => t.difficulty !== 'Hard');
        if (nonHard.length > 0) {
          candidates = nonHard;
        }
      }

      // Rank remaining candidates by (High Priority > Approaching Deadline > Shorter estimated time)
      candidates.sort((a, b) => {
        const prioMap = { High: 3, Medium: 2, Low: 1 };
        const prioDiff = (prioMap[b.priority] || 2) - (prioMap[a.priority] || 2);
        if (prioDiff !== 0) return prioDiff;

        const daysA = AnalyticsEngine.getDaysUntilDeadline(a.deadline);
        const daysB = AnalyticsEngine.getDaysUntilDeadline(b.deadline);
        if (daysA !== daysB) return daysA - daysB;

        return (a.estimatedMinutes || 30) - (b.estimatedMinutes || 30);
      });

      const selected = candidates[0];

      // Tailored micro-mission prompt generation
      let missionPrompt = '';
      if (chosenMinutes === 10) {
        missionPrompt = `Spend 5 minutes reviewing key concepts of "${selected.name}", then outline or solve 1 quick problem. Stop immediately when time is up!`;
      } else if (chosenMinutes === 20) {
        missionPrompt = `Spend 10 minutes reading core definitions and formula sheets for "${selected.name}", followed by 10 minutes of active problem solving.`;
      } else {
        missionPrompt = `Deep focus block: 15 minutes reviewing difficult subtopics in "${selected.name}", followed by 15 minutes of uninterrupted practice problems.`;
      }

      return {
        topic: selected,
        prompt: missionPrompt,
        durationMinutes: chosenMinutes
      };
    }
  };

  // ==========================================================================
  // UI RENDERERS & VIEW CONTROLLER
  // ==========================================================================
  const UI = {
    // Initialize DOM elements and bind all events
    init() {
      this.cacheDOM();
      this.bindEvents();
      this.renderAll();
      this.updateDateDisplay();
    },

    cacheDOM() {
      // Header & Navigation
      this.navLinks = document.querySelectorAll('.nav-link');
      this.sections = document.querySelectorAll('.content-section');
      this.mobileToggle = document.getElementById('mobile-menu-toggle');
      this.mainNav = document.getElementById('main-nav');
      this.headerAddTopicBtn = document.getElementById('header-add-topic-btn');
      this.navMissionBtn = document.getElementById('nav-mission-btn');
      this.heroMissionBtn = document.getElementById('hero-start-mission-btn');

      // Date & Hero Stats
      this.dateDisplay = document.getElementById('current-date-display');
      this.heroStreak = document.getElementById('hero-streak-count');
      this.heroWins = document.getElementById('hero-wins-count');

      // Dashboard Metrics
      this.dashPctBadge = document.getElementById('dash-pct-badge');
      this.dashProgressRatio = document.getElementById('dash-progress-ratio');
      this.dashProgressFill = document.getElementById('dash-progress-fill');
      this.dashProgressAria = document.getElementById('dash-progress-aria');
      this.dashRemainingCount = document.getElementById('dash-remaining-count');
      this.dashDueTodayNote = document.getElementById('dash-due-today-note');
      this.dashWinsCount = document.getElementById('dash-wins-count');
      this.dashStreakCount = document.getElementById('dash-streak-count');
      this.dashTodayTasksList = document.getElementById('dash-today-tasks-list');
      this.dashDeadlinesPreview = document.getElementById('dash-deadlines-preview-list');
      this.dashTodayCount = document.getElementById('dash-today-count');
      this.dashUrgentCount = document.getElementById('dash-urgent-count');

      // Today's Plan View
      this.todayTasksContainer = document.getElementById('today-tasks-container');
      this.todayFilters = document.getElementById('today-filters');
      this.todayAddTopicBtn = document.getElementById('today-add-topic-btn');
      this.todayFilterSummary = document.getElementById('today-filter-summary');

      // Subjects View
      this.subjectsGrid = document.getElementById('subjects-grid');
      this.openAddSubjectBtn = document.getElementById('open-add-subject-modal-btn');

      // Deadlines View
      this.deadlinesContainer = document.getElementById('deadlines-container');

      // Progress View
      this.subjectProgressList = document.getElementById('subject-progress-bars-list');
      this.difficultyContainer = document.getElementById('difficulty-breakdown-container');
      this.btnLoadDemo = document.getElementById('btn-load-demo');
      this.btnExportData = document.getElementById('btn-export-data');
      this.fileImportData = document.getElementById('file-import-data');
      this.btnClearData = document.getElementById('btn-clear-data');

      // Modals
      this.modalAddSubject = document.getElementById('modal-add-subject');
      this.formAddSubject = document.getElementById('form-add-subject');
      this.subjectNameInput = document.getElementById('subject-name-input');

      this.modalAddTopic = document.getElementById('modal-add-topic');
      this.formAddTopic = document.getElementById('form-add-topic');
      this.topicSubjectSelect = document.getElementById('topic-subject-select');
      this.topicNameInput = document.getElementById('topic-name-input');
      this.topicDiffSelect = document.getElementById('topic-difficulty-select');
      this.topicDeadlineInput = document.getElementById('topic-deadline-input');
      this.topicPrioritySelect = document.getElementById('topic-priority-select');
      this.topicTimeInput = document.getElementById('topic-time-input');

      // Mission Modal
      this.modalMission = document.getElementById('modal-mission');
      this.missionStageSelect = document.getElementById('mission-stage-select');
      this.missionStageActive = document.getElementById('mission-stage-active');
      this.missionStageComplete = document.getElementById('mission-stage-complete');
      this.missionTopicTitle = document.getElementById('mission-topic-title');
      this.missionSubjectTag = document.getElementById('mission-subject-tag');
      this.missionDiffTag = document.getElementById('mission-diff-tag');
      this.missionPrioTag = document.getElementById('mission-prio-tag');
      this.missionInstructionText = document.getElementById('mission-instruction-text');
      this.missionTimerDisplay = document.getElementById('mission-timer-display');
      this.missionTimerBar = document.getElementById('mission-timer-bar');
      this.missionTimerStatus = document.getElementById('mission-timer-status');
      this.missionPauseBtn = document.getElementById('mission-pause-btn');
      this.missionPauseText = document.getElementById('mission-pause-text');
      this.missionPauseIcon = document.getElementById('mission-pause-icon');
      this.missionFinishEarlyBtn = document.getElementById('mission-finish-early-btn');
      this.missionCompleteBtn = document.getElementById('mission-complete-btn');
      this.missionAbortBtn = document.getElementById('mission-abort-btn');
      this.missionClaimWinBtn = document.getElementById('mission-claim-win-btn');
      this.missionMarkTopicCompletedCb = document.getElementById('mission-mark-topic-completed-cb');
      this.missionCompletedTopicName = document.getElementById('mission-completed-topic-name');
      this.missionNoTasksWarning = document.getElementById('mission-no-tasks-warning');
    },

    bindEvents() {
      // Tab Navigation
      this.navLinks.forEach(link => {
        link.addEventListener('click', e => {
          e.preventDefault();
          const targetSection = link.getAttribute('data-section');
          this.switchSection(targetSection);
          if (this.mainNav.classList.contains('mobile-open')) {
            this.mainNav.classList.remove('mobile-open');
          }
        });
      });

      // Mobile Menu Toggle
      this.mobileToggle.addEventListener('click', () => {
        this.mainNav.classList.toggle('mobile-open');
      });

      // Quick Action Buttons
      this.headerAddTopicBtn.addEventListener('click', () => this.openAddTopicModal());
      if (this.todayAddTopicBtn) {
        this.todayAddTopicBtn.addEventListener('click', () => this.openAddTopicModal());
      }
      this.openAddSubjectBtn.addEventListener('click', () => this.openAddSubjectModal());

      // 10-Minute Mission Triggers
      this.navMissionBtn.addEventListener('click', () => MissionRunner.open());
      this.heroMissionBtn.addEventListener('click', () => MissionRunner.open());

      // Modal Close Buttons
      document.querySelectorAll('[data-close-dialog]').forEach(btn => {
        btn.addEventListener('click', () => {
          const dialogId = btn.getAttribute('data-close-dialog');
          const dialog = document.getElementById(dialogId);
          if (dialog) dialog.close();
        });
      });

      // Quick Time Preset Buttons inside Add Topic Form
      document.querySelectorAll('.btn-time-preset').forEach(btn => {
        btn.addEventListener('click', () => {
          this.topicTimeInput.value = btn.getAttribute('data-time');
        });
      });

      // Form Submissions
      this.formAddSubject.addEventListener('submit', e => {
        e.preventDefault();
        this.handleAddSubject();
      });

      this.formAddTopic.addEventListener('submit', e => {
        e.preventDefault();
        this.handleAddTopic();
      });

      // Today's Filter Chips
      this.todayFilters.addEventListener('click', e => {
        if (e.target.classList.contains('chip')) {
          this.todayFilters.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
          e.target.classList.add('active');
          const filter = e.target.getAttribute('data-filter');
          this.renderTodayTasks(filter);
        }
      });

      // Utility & Data Management Actions
      this.btnLoadDemo.addEventListener('click', () => {
        if (confirm('Load sample college subjects and topics? This will give you a pre-filled planner to explore.')) {
          AppState.loadSampleData(true);
          this.renderAll();
          this.showToast('Sample college data loaded successfully!', 'success');
        }
      });

      this.btnExportData.addEventListener('click', () => {
        const jsonStr = JSON.stringify(AppState.data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `studysprint_backup_${getRelativeDateString(0)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.showToast('StudySprint data exported successfully!', 'info');
      });

      this.fileImportData.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = event => {
          try {
            const imported = JSON.parse(event.target.result);
            if (imported.subjects && imported.topics) {
              AppState.data = imported;
              AppState.save();
              this.renderAll();
              this.showToast('Data imported successfully!', 'success');
            } else {
              alert('Invalid StudySprint backup file.');
            }
          } catch (err) {
            alert('Failed to read JSON backup file.');
          }
        };
        reader.readAsText(file);
      });

      this.btnClearData.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all your subjects, topics, and study progress? This cannot be undone.')) {
          AppState.clearAllData();
          this.renderAll();
          this.showToast('All data cleared.', 'info');
        }
      });

      // Listen to window hash changes for deep linking
      window.addEventListener('hashchange', () => {
        const hash = window.location.hash.replace('#', '');
        if (hash) this.switchSection(hash);
      });
    },

    updateDateDisplay() {
      const now = new Date();
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      this.dateDisplay.textContent = now.toLocaleDateString('en-US', options);
    },

    switchSection(sectionId) {
      const targetSection = document.getElementById(sectionId);
      if (!targetSection) return;

      this.sections.forEach(sec => sec.classList.remove('active'));
      targetSection.classList.add('active');

      this.navLinks.forEach(link => {
        if (link.getAttribute('data-section') === sectionId) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });

      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    // Master Render Method
    renderAll() {
      this.renderHeroStats();
      this.renderDashboard();
      this.renderTodayTasks();
      this.renderSubjects();
      this.renderDeadlines();
      this.renderProgressHub();
    },

    renderHeroStats() {
      const stats = AnalyticsEngine.getOverallStats();
      this.heroStreak.textContent = stats.currentStreak;
      this.heroWins.textContent = stats.studyWins;
    },

    renderDashboard() {
      const stats = AnalyticsEngine.getOverallStats();
      this.dashPctBadge.textContent = `${stats.percentage}%`;
      this.dashProgressRatio.textContent = `${stats.completed} / ${stats.total}`;
      this.dashProgressFill.style.width = `${stats.percentage}%`;
      this.dashProgressAria.setAttribute('aria-valuenow', stats.percentage);

      this.dashRemainingCount.textContent = stats.remaining;
      this.dashWinsCount.textContent = stats.studyWins;
      this.dashStreakCount.textContent = stats.currentStreak;

      // Count tasks due today or overdue
      const overdueOrToday = AppState.data.topics.filter(t => !t.completed && AnalyticsEngine.getDaysUntilDeadline(t.deadline) <= 1).length;
      this.dashDueTodayNote.textContent = `${overdueOrToday} task${overdueOrToday === 1 ? '' : 's'} due soon`;

      // Render Dashboard Today's Preview (Top 3)
      const todayTasks = AnalyticsEngine.getSmartTodaysPlan().slice(0, 3);
      this.dashTodayCount.textContent = todayTasks.length;

      if (todayTasks.length === 0) {
        this.dashTodayTasksList.innerHTML = `
          <div class="empty-state" style="padding: 1.5rem 1rem;">
            <div class="empty-state-icon" style="font-size: 2rem;">🎉</div>
            <h3 style="font-size: 1.05rem;">All tasks completed!</h3>
            <p style="font-size: 0.85rem; margin-bottom: 0.75rem;">You're fully caught up for today.</p>
            <button class="btn btn-primary btn-sm" onclick="window.StudySprintUI.openAddTopicModal()">+ Add Topic</button>
          </div>
        `;
      } else {
        this.dashTodayTasksList.innerHTML = todayTasks.map(t => this.createTaskCardHTML(t, true)).join('');
      }

      // Render Dashboard Urgent Deadlines Preview (Top 3)
      const deadlines = AnalyticsEngine.getSortedDeadlines().slice(0, 3);
      this.dashUrgentCount.textContent = deadlines.length;

      if (deadlines.length === 0) {
        this.dashDeadlinesPreview.innerHTML = `
          <div class="empty-state" style="padding: 1.5rem 1rem;">
            <div class="empty-state-icon" style="font-size: 2rem;">🏖️</div>
            <h3 style="font-size: 1.05rem;">No upcoming deadlines</h3>
            <p style="font-size: 0.85rem; margin-bottom: 0.75rem;">Add topic deadlines to stay organized.</p>
          </div>
        `;
      } else {
        this.dashDeadlinesPreview.innerHTML = deadlines.map(t => this.createDeadlineCardHTML(t)).join('');
      }

      this.attachTaskListeners();
    },

    renderTodayTasks(filter = 'all') {
      let tasks = AnalyticsEngine.getSmartTodaysPlan();

      if (filter === 'High') {
        tasks = tasks.filter(t => t.priority === 'High');
      } else if (filter === 'quick') {
        tasks = tasks.filter(t => (t.estimatedMinutes || 30) <= 30);
      } else if (filter === 'approaching') {
        tasks = tasks.filter(t => AnalyticsEngine.getDaysUntilDeadline(t.deadline) <= 7);
      }

      if (tasks.length === 0) {
        this.todayTasksContainer.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">📋</div>
            <h3>Nothing scheduled in this view</h3>
            <p>Add new topics to your subjects or load sample data to generate your personalized study queue.</p>
            <button class="btn btn-primary" onclick="window.StudySprintUI.openAddTopicModal()">+ Add Topic</button>
          </div>
        `;
      } else {
        this.todayTasksContainer.innerHTML = tasks.map(t => this.createTaskCardHTML(t, false)).join('');
      }

      this.attachTaskListeners();
    },

    renderSubjects() {
      const subjects = AppState.data.subjects;
      if (subjects.length === 0) {
        this.subjectsGrid.innerHTML = `
          <div class="empty-state" style="grid-column: 1 / -1;">
            <div class="empty-state-icon">📚</div>
            <h3>You don't have any subjects yet.</h3>
            <p>Create your coursework subjects (e.g. DSA, Calculus, History) to start adding topics.</p>
            <button class="btn btn-primary" onclick="window.StudySprintUI.openAddSubjectModal()">+ Add Your First Subject</button>
          </div>
        `;
        return;
      }

      this.subjectsGrid.innerHTML = subjects.map(subject => {
        const stats = AnalyticsEngine.getSubjectStats(subject.id);
        return `
          <div class="subject-card" data-subject-id="${subject.id}">
            <div>
              <div class="subject-card-top">
                <div class="subject-badge-wrap">
                  <span class="subject-color-dot" style="background-color: ${subject.color};"></span>
                  <h3 class="subject-name">${escapeHTML(subject.name)}</h3>
                </div>
                <button class="btn-icon-action btn-delete-subject" data-subject-id="${subject.id}" title="Delete subject" aria-label="Delete subject">
                  🗑️
                </button>
              </div>

              <div class="subject-card-stats">
                <span><strong>${stats.completed}</strong> completed</span>
                <span><strong>${stats.remaining}</strong> remaining</span>
              </div>

              <div class="subject-progress-wrap">
                <div class="progress-bar-bg">
                  <div class="progress-bar-fill" style="width: ${stats.percentage}%; background: ${subject.color};"></div>
                </div>
              </div>
            </div>

            <div class="subject-card-actions">
              <span class="stat-badge">${stats.percentage}% done</span>
              <button class="btn btn-secondary btn-sm btn-quick-add-topic" data-subject-id="${subject.id}">
                + Add Topic
              </button>
            </div>
          </div>
        `;
      }).join('');

      // Attach subject delete and quick-add listeners
      document.querySelectorAll('.btn-delete-subject').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          const subjId = btn.getAttribute('data-subject-id');
          const subject = AppState.getSubject(subjId);
          if (confirm(`Are you sure you want to delete "${subject.name}" and all its topics?`)) {
            AppState.deleteSubject(subjId);
            this.renderAll();
            this.showToast(`Deleted subject "${subject.name}"`, 'info');
          }
        });
      });

      document.querySelectorAll('.btn-quick-add-topic').forEach(btn => {
        btn.addEventListener('click', () => {
          const subjId = btn.getAttribute('data-subject-id');
          this.openAddTopicModal(subjId);
        });
      });
    },

    renderDeadlines() {
      const deadlines = AnalyticsEngine.getSortedDeadlines();
      if (deadlines.length === 0) {
        this.deadlinesContainer.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">🎯</div>
            <h3>No pending deadlines</h3>
            <p>All your coursework tasks are finished or have no deadlines assigned.</p>
            <button class="btn btn-primary" onclick="window.StudySprintUI.openAddTopicModal()">+ Add Topic</button>
          </div>
        `;
        return;
      }

      this.deadlinesContainer.innerHTML = deadlines.map(topic => this.createDeadlineCardHTML(topic)).join('');
      this.attachTaskListeners();
    },

    renderProgressHub() {
      const subjects = AppState.data.subjects;
      if (subjects.length === 0) {
        this.subjectProgressList.innerHTML = '<p class="field-hint">Add subjects to view progress breakdowns.</p>';
      } else {
        this.subjectProgressList.innerHTML = subjects.map(subject => {
          const stats = AnalyticsEngine.getSubjectStats(subject.id);
          return `
            <div class="subject-bar-row">
              <div class="subject-bar-label">
                <span style="display:flex; align-items:center; gap:0.4rem;">
                  <span class="subject-color-dot" style="background-color:${subject.color};"></span>
                  <strong>${escapeHTML(subject.name)}</strong>
                </span>
                <span>${stats.completed}/${stats.total} topics (${stats.percentage}%)</span>
              </div>
              <div class="progress-bar-bg">
                <div class="progress-bar-fill" style="width: ${stats.percentage}%; background-color: ${subject.color};"></div>
              </div>
            </div>
          `;
        }).join('');
      }

      // Difficulty distribution
      const topics = AppState.data.topics;
      const counts = { Easy: 0, Medium: 0, Hard: 0 };
      topics.forEach(t => {
        if (counts[t.difficulty] !== undefined) counts[t.difficulty]++;
      });

      const total = topics.length || 1;
      this.difficultyContainer.innerHTML = `
        <div class="subject-bar-row">
          <div class="subject-bar-label">
            <span>🟢 Easy (${counts.Easy})</span>
            <span>${Math.round((counts.Easy / total) * 100)}%</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${Math.round((counts.Easy / total) * 100)}%; background-color: #10b981;"></div>
          </div>
        </div>
        <div class="subject-bar-row">
          <div class="subject-bar-label">
            <span>🟡 Medium (${counts.Medium})</span>
            <span>${Math.round((counts.Medium / total) * 100)}%</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${Math.round((counts.Medium / total) * 100)}%; background-color: #f59e0b;"></div>
          </div>
        </div>
        <div class="subject-bar-row">
          <div class="subject-bar-label">
            <span>🔴 Hard (${counts.Hard})</span>
            <span>${Math.round((counts.Hard / total) * 100)}%</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${Math.round((counts.Hard / total) * 100)}%; background-color: #ef4444;"></div>
          </div>
        </div>
      `;
    },

    // HTML Generator Helpers
    createTaskCardHTML(topic, isCompact = false) {
      const subject = AppState.getSubject(topic.subjectId);
      const days = AnalyticsEngine.getDaysUntilDeadline(topic.deadline);
      const isCompleted = topic.completed;

      let deadlineDisplay = AnalyticsEngine.formatDate(topic.deadline);
      if (days < 0) deadlineDisplay = `⚠️ Overdue (${Math.abs(days)}d ago)`;
      else if (days === 0) deadlineDisplay = `🔥 Due Today`;
      else if (days === 1) deadlineDisplay = `⏳ Due Tomorrow`;

      return `
        <div class="task-card ${isCompleted ? 'completed' : ''}" data-topic-id="${topic.id}">
          <div class="task-left">
            <button class="custom-checkbox ${isCompleted ? 'checked' : ''} btn-toggle-complete" data-topic-id="${topic.id}" aria-label="Mark task complete">
              ${isCompleted ? '✓' : ''}
            </button>
            <div class="task-info">
              <div class="task-name">${escapeHTML(topic.name)}</div>
              <div class="task-meta">
                <span class="tag tag-subject" style="background-color: ${subject.color}18; color: ${subject.color};">
                  ${escapeHTML(subject.name)}
                </span>
                <span class="tag tag-difficulty diff-${topic.difficulty.toLowerCase()}">${topic.difficulty}</span>
                <span class="tag tag-prio-${topic.priority}">${topic.priority}</span>
                <span class="task-time">⏱️ ${topic.estimatedMinutes || 45}m</span>
                <span class="task-deadline">📅 ${deadlineDisplay}</span>
              </div>
            </div>
          </div>

          <div class="task-right">
            ${!isCompact ? `
              <button class="btn-icon-action btn-delete-topic" data-topic-id="${topic.id}" title="Delete topic" aria-label="Delete topic">
                🗑️
              </button>
            ` : ''}
          </div>
        </div>
      `;
    },

    createDeadlineCardHTML(topic) {
      const subject = AppState.getSubject(topic.subjectId);
      const days = AnalyticsEngine.getDaysUntilDeadline(topic.deadline);

      let stateClass = 'state-normal';
      let countdownBadge = '';

      if (days < 0) {
        stateClass = 'state-overdue';
        countdownBadge = `<span class="deadline-countdown-badge countdown-overdue">⚠️ Overdue by ${Math.abs(days)}d</span>`;
      } else if (days === 0) {
        stateClass = 'state-today';
        countdownBadge = `<span class="deadline-countdown-badge countdown-today">🔥 Due Today</span>`;
      } else if (days === 1) {
        stateClass = 'state-today';
        countdownBadge = `<span class="deadline-countdown-badge countdown-today">⏳ Due Tomorrow</span>`;
      } else if (days <= 3) {
        stateClass = 'state-today';
        countdownBadge = `<span class="deadline-countdown-badge countdown-today">In ${days} days</span>`;
      } else {
        countdownBadge = `<span class="deadline-countdown-badge countdown-normal">In ${days} days</span>`;
      }

      return `
        <div class="deadline-card ${stateClass}" data-topic-id="${topic.id}">
          <div class="deadline-info">
            <div class="deadline-topic">${escapeHTML(topic.name)}</div>
            <div class="deadline-meta">
              <span class="tag tag-subject" style="background-color: ${subject.color}18; color: ${subject.color};">
                ${escapeHTML(subject.name)}
              </span>
              <span class="tag tag-prio-${topic.priority}">${topic.priority} Priority</span>
              <span>📅 ${AnalyticsEngine.formatDate(topic.deadline)}</span>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:0.75rem;">
            ${countdownBadge}
            <button class="btn btn-secondary btn-sm btn-toggle-complete" data-topic-id="${topic.id}">
              Complete
            </button>
          </div>
        </div>
      `;
    },

    attachTaskListeners() {
      // Complete buttons and checkboxes
      document.querySelectorAll('.btn-toggle-complete').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          const topicId = btn.getAttribute('data-topic-id');
          const topic = AppState.toggleTopicComplete(topicId);
          if (topic) {
            if (topic.completed) {
              this.showToast(`Completed "${topic.name}"! +1 Study Win`, 'success');
              Confetti.trigger();
            }
            this.renderAll();
          }
        });
      });

      // Delete topic buttons
      document.querySelectorAll('.btn-delete-topic').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          const topicId = btn.getAttribute('data-topic-id');
          AppState.deleteTopic(topicId);
          this.renderAll();
          this.showToast('Topic deleted', 'info');
        });
      });
    },

    // Modal Opening & Form Handling
    openAddSubjectModal() {
      this.formAddSubject.reset();
      this.modalAddSubject.showModal();
      this.subjectNameInput.focus();
    },

    handleAddSubject() {
      const name = this.subjectNameInput.value;
      const checkedColor = document.querySelector('input[name="subject-color"]:checked');
      const color = checkedColor ? checkedColor.value : '#4f46e5';

      const created = AppState.addSubject(name, color);
      if (created) {
        this.modalAddSubject.close();
        this.renderAll();
        this.showToast(`Subject "${created.name}" created!`, 'success');
      }
    },

    openAddTopicModal(preselectedSubjectId = null) {
      if (AppState.data.subjects.length === 0) {
        alert('Please create at least one subject first.');
        this.openAddSubjectModal();
        return;
      }

      // Populate subject select dropdown
      this.topicSubjectSelect.innerHTML = AppState.data.subjects.map(s => {
        const selected = preselectedSubjectId === s.id ? 'selected' : '';
        return `<option value="${s.id}" ${selected}>${escapeHTML(s.name)}</option>`;
      }).join('');

      // Default deadline to 3 days ahead
      this.topicDeadlineInput.value = getRelativeDateString(3);
      this.topicNameInput.value = '';
      this.topicTimeInput.value = 45;
      this.topicDiffSelect.value = 'Medium';
      this.topicPrioritySelect.value = 'Medium';

      this.modalAddTopic.showModal();
      this.topicNameInput.focus();
    },

    handleAddTopic() {
      const topicData = {
        name: this.topicNameInput.value,
        subjectId: this.topicSubjectSelect.value,
        difficulty: this.topicDiffSelect.value,
        deadline: this.topicDeadlineInput.value,
        estimatedMinutes: this.topicTimeInput.value,
        priority: this.topicPrioritySelect.value
      };

      const created = AppState.addTopic(topicData);
      if (created) {
        this.modalAddTopic.close();
        this.renderAll();
        this.showToast(`Added topic "${created.name}"!`, 'success');
      }
    },

    showToast(message, type = 'info') {
      const container = document.getElementById('toast-container');
      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      toast.innerHTML = `<span>${type === 'success' ? '🎉' : 'ℹ️'}</span><span>${escapeHTML(message)}</span>`;
      container.appendChild(toast);

      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 200ms ease';
        setTimeout(() => toast.remove(), 200);
      }, 3200);
    }
  };

  // ==========================================================================
  // 10-MINUTE MISSION ENGINE
  // ==========================================================================
  const MissionRunner = {
    timerInterval: null,
    totalSeconds: 600,
    remainingSeconds: 600,
    isPaused: false,
    currentMission: null,

    init() {
      // Bind duration choice buttons
      document.querySelectorAll('.btn-time-choice').forEach(btn => {
        btn.addEventListener('click', () => {
          const minutes = parseInt(btn.getAttribute('data-mission-time'), 10);
          this.startMission(minutes);
        });
      });

      // Bind controls
      UI.missionPauseBtn.addEventListener('click', () => this.togglePause());
      UI.missionFinishEarlyBtn.addEventListener('click', () => this.completeMission());
      UI.missionCompleteBtn.addEventListener('click', () => this.completeMission());
      UI.missionAbortBtn.addEventListener('click', () => this.abort());
      UI.missionClaimWinBtn.addEventListener('click', () => this.claimWin());
    },

    open() {
      this.resetToStage1();
      const incomplete = AppState.data.topics.filter(t => !t.completed);
      if (incomplete.length === 0) {
        UI.missionNoTasksWarning.style.display = 'block';
      } else {
        UI.missionNoTasksWarning.style.display = 'none';
      }
      UI.modalMission.showModal();
    },

    resetToStage1() {
      this.clearTimer();
      UI.missionStageSelect.classList.add('active');
      UI.missionStageActive.classList.remove('active');
      UI.missionStageComplete.classList.remove('active');
    },

    startMission(minutes = 10) {
      const selected = AnalyticsEngine.selectMissionTopic(minutes);
      if (!selected) {
        alert('Please add at least one incomplete topic before starting a mission.');
        UI.modalMission.close();
        UI.openAddTopicModal();
        return;
      }

      this.currentMission = selected;
      const topic = selected.topic;
      const subject = AppState.getSubject(topic.subjectId);

      // Populate stage 2 data
      UI.missionTopicTitle.textContent = topic.name;
      UI.missionSubjectTag.textContent = subject.name;
      UI.missionSubjectTag.style.backgroundColor = `${subject.color}20`;
      UI.missionSubjectTag.style.color = subject.color;

      UI.missionDiffTag.textContent = topic.difficulty;
      UI.missionDiffTag.className = `tag tag-difficulty diff-${topic.difficulty.toLowerCase()}`;

      UI.missionPrioTag.textContent = `${topic.priority} Priority`;
      UI.missionPrioTag.className = `tag tag-prio-${topic.priority}`;

      UI.missionInstructionText.textContent = selected.prompt;

      // Timer setup
      this.totalSeconds = minutes * 60;
      this.remainingSeconds = this.totalSeconds;
      this.isPaused = false;
      this.updateTimerDisplay();

      UI.missionPauseText.textContent = 'Pause';
      UI.missionPauseIcon.textContent = '⏸️';
      UI.missionTimerStatus.textContent = 'Focus mode active. You’ve got this!';

      // Transition to Stage 2
      UI.missionStageSelect.classList.remove('active');
      UI.missionStageActive.classList.add('active');

      this.runTimer();
    },

    runTimer() {
      this.clearTimer();
      this.timerInterval = setInterval(() => {
        if (!this.isPaused) {
          this.remainingSeconds -= 1;
          this.updateTimerDisplay();

          if (this.remainingSeconds <= 0) {
            this.completeMission();
          }
        }
      }, 1000);
    },

    updateTimerDisplay() {
      const m = Math.floor(this.remainingSeconds / 60);
      const s = this.remainingSeconds % 60;
      const formatted = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      UI.missionTimerDisplay.textContent = formatted;

      const pct = Math.max(0, (this.remainingSeconds / this.totalSeconds) * 100);
      UI.missionTimerBar.style.width = `${pct}%`;
    },

    togglePause() {
      this.isPaused = !this.isPaused;
      if (this.isPaused) {
        UI.missionPauseText.textContent = 'Resume';
        UI.missionPauseIcon.textContent = '▶️';
        UI.missionTimerStatus.textContent = 'Paused. Take a deep breath.';
      } else {
        UI.missionPauseText.textContent = 'Pause';
        UI.missionPauseIcon.textContent = '⏸️';
        UI.missionTimerStatus.textContent = 'Focus mode active. Keep going!';
      }
    },

    completeMission() {
      this.clearTimer();
      const minutesSpent = Math.max(1, Math.round((this.totalSeconds - this.remainingSeconds) / 60)) || this.currentMission.durationMinutes;

      // Transition to Stage 3 Celebration
      UI.missionStageActive.classList.remove('active');
      UI.missionStageComplete.classList.add('active');

      const subtitle = document.getElementById('mission-complete-subtitle');
      subtitle.textContent = `You completed a ${this.currentMission.durationMinutes}-minute study session.`;

      UI.missionCompletedTopicName.textContent = this.currentMission.topic.name;

      // Trigger Confetti
      Confetti.trigger();
    },

    claimWin() {
      if (this.currentMission) {
        const shouldMarkTopic = UI.missionMarkTopicCompletedCb.checked;
        if (shouldMarkTopic) {
          AppState.toggleTopicComplete(this.currentMission.topic.id);
        } else {
          // Record mission win without marking whole topic complete
          AppState.recordStudyActivity(this.currentMission.durationMinutes, true);
        }
      }

      UI.modalMission.close();
      UI.renderAll();
      UI.showToast('+1 Study Win recorded! Streak maintained 🔥', 'success');
    },

    abort() {
      if (confirm('Cancel this study mission? Your timer will stop.')) {
        this.clearTimer();
        UI.modalMission.close();
      }
    },

    clearTimer() {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
    }
  };

  // ==========================================================================
  // CONFETTI CELEBRATION COMPONENT (Vanilla HTML5 Canvas)
  // ==========================================================================
  const Confetti = {
    canvas: null,
    ctx: null,
    particles: [],
    animationId: null,

    init() {
      this.canvas = document.getElementById('confetti-canvas');
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      this.resize();
      window.addEventListener('resize', () => this.resize());
    },

    resize() {
      if (!this.canvas) return;
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    },

    trigger() {
      if (!this.canvas || !this.ctx) return;
      this.particles = [];
      const colors = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

      for (let i = 0; i < 90; i++) {
        this.particles.push({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
          r: Math.random() * 6 + 4,
          d: Math.random() * 90,
          color: colors[Math.floor(Math.random() * colors.length)],
          tilt: Math.floor(Math.random() * 10) - 10,
          tiltAngleIncremental: Math.random() * 0.07 + 0.05,
          tiltAngle: 0,
          vx: (Math.random() - 0.5) * 16,
          vy: (Math.random() - 0.7) * 16 - 3,
          gravity: 0.25,
          opacity: 1
        });
      }

      if (this.animationId) cancelAnimationFrame(this.animationId);
      this.animate();
    },

    animate() {
      if (!this.ctx) return;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      let alive = false;
      this.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.tiltAngle += p.tiltAngleIncremental;
        p.tilt = Math.sin(p.tiltAngle) * 12;
        p.opacity -= 0.012;

        if (p.opacity > 0) {
          alive = true;
          this.ctx.beginPath();
          this.ctx.lineWidth = p.r / 2;
          this.ctx.strokeStyle = p.color;
          this.ctx.globalAlpha = Math.max(0, p.opacity);
          this.ctx.moveTo(p.x + p.tilt + p.r / 4, p.y);
          this.ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 4);
          this.ctx.stroke();
        }
      });

      if (alive) {
        this.animationId = requestAnimationFrame(() => this.animate());
      } else {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    }
  };

  // Helper to prevent XSS in rendered text
  function escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- Bootstrap on DOM Ready ---
  document.addEventListener('DOMContentLoaded', () => {
    AppState.init();
    UI.init();
    MissionRunner.init();
    Confetti.init();

    // Expose UI helper globally for inline buttons
    window.StudySprintUI = UI;
  });

})();

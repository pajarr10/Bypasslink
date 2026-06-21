/**
 * BipaSunlok - Admin Dashboard Script
 * Developed by Pajar
 */

(function () {
  'use strict';

  const ADMIN_VERIFY_URL = '/api/admin/verify';
  const ADMIN_STATS_URL = '/api/admin/stats';
  const SESSION_KEY = 'bipasunlok_admin_key';
  const REFRESH_INTERVAL = 5000;

  const elements = {
    loginScreen: document.getElementById('loginScreen'),
    dashboard: document.getElementById('dashboard'),
    adminKeyInput: document.getElementById('adminKeyInput'),
    loginBtn: document.getElementById('loginBtn'),
    loginError: document.getElementById('loginError'),
    logoutBtn: document.getElementById('logoutBtn'),
    toast: document.getElementById('toast'),
    toastIcon: document.getElementById('toastIcon'),
    toastMsg: document.getElementById('toastMsg'),
    statTotalVisitors: document.getElementById('statTotalVisitors'),
    statTodayVisitors: document.getElementById('statTodayVisitors'),
    statOnlineVisitors: document.getElementById('statOnlineVisitors'),
    statTotalRequests: document.getElementById('statTotalRequests'),
    statSuccessRate: document.getElementById('statSuccessRate'),
    statAvgResponse: document.getElementById('statAvgResponse'),
    recentBypassList: document.getElementById('recentBypassList'),
    recentVisitorsList: document.getElementById('recentVisitorsList'),
    recentLogsTable: document.getElementById('recentLogsTable'),
    bypassCountBadge: document.getElementById('bypassCountBadge'),
    visitorCountBadge: document.getElementById('visitorCountBadge'),
    logsCountBadge: document.getElementById('logsCountBadge')
  };

  let adminKey = sessionStorage.getItem(SESSION_KEY) || '';
  let refreshTimer = null;
  let charts = {};

  // Toast
  function showToast(message, type = 'success') {
    const { toast, toastIcon, toastMsg } = elements;
    toastMsg.textContent = message;
    toastIcon.textContent = type === 'success' ? '✓' : '!';
    toast.classList.toggle('error', type === 'error');
    toast.classList.remove('hidden');

    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        toast.classList.add('hidden');
      }, 300);
    }, 2800);
  }

  // Format helpers
  function formatNumber(num) {
    return new Intl.NumberFormat('id-ID').format(num || 0);
  }

  function formatTime(timestamp) {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }

  // Login
  async function handleLogin() {
    const key = elements.adminKeyInput.value.trim();
    if (!key) {
      showToast('Masukkan Admin Key', 'error');
      return;
    }

    try {
      const response = await fetch(ADMIN_VERIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key })
      });

      const data = await response.json();

      if (response.ok && data.status) {
        adminKey = key;
        sessionStorage.setItem(SESSION_KEY, key);
        showLoginSuccess();
        showToast('Login berhasil');
        loadDashboard();
      } else {
        throw new Error(data.message || 'Unauthorized');
      }
    } catch (error) {
      elements.loginError.classList.remove('hidden');
      elements.adminKeyInput.value = '';
      elements.adminKeyInput.focus();
      showToast('Admin Key salah', 'error');
    }
  }

  function showLoginSuccess() {
    elements.loginScreen.classList.add('hidden');
    elements.dashboard.classList.remove('hidden');
  }

  function showLoginScreen() {
    elements.loginScreen.classList.remove('hidden');
    elements.dashboard.classList.add('hidden');
    elements.adminKeyInput.value = '';
    elements.adminKeyInput.focus();
  }

  function handleLogout() {
    adminKey = '';
    sessionStorage.removeItem(SESSION_KEY);
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
    showLoginScreen();
    showToast('Keluar dari dashboard');
  }

  // Fetch stats
  async function fetchStats() {
    const response = await fetch(ADMIN_STATS_URL, {
      method: 'GET',
      headers: {
        'x-admin-key': adminKey,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 401) {
      handleLogout();
      throw new Error('Unauthorized');
    }

    const data = await response.json();
    if (!data.status) throw new Error(data.message || 'Failed to load stats');
    return data.data;
  }

  // Update stats UI
  function updateStats(data) {
    const v = data.visitor || {};
    const r = data.request || {};

    elements.statTotalVisitors.textContent = formatNumber(v.total);
    elements.statTodayVisitors.textContent = formatNumber(v.today);
    elements.statOnlineVisitors.textContent = formatNumber(v.online);
    elements.statTotalRequests.textContent = formatNumber(r.total);
    elements.statSuccessRate.textContent = `${r.successRate || 0}%`;
    elements.statAvgResponse.textContent = `${r.avgResponseTime || 0}ms`;
  }

  // Chart config
  function createChart(ctx, type, labels, data, colors) {
    return new Chart(ctx, {
      type: type,
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderColor: 'transparent',
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: 'rgba(255, 255, 255, 0.7)',
              font: { family: 'Inter', size: 11 },
              padding: 16,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(28, 28, 30, 0.95)',
            titleColor: '#fff',
            bodyColor: 'rgba(255, 255, 255, 0.8)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 12,
            displayColors: true
          }
        },
        cutout: type === 'doughnut' ? '65%' : 0,
        scales: type === 'bar' ? {
          x: {
            grid: { display: false, drawBorder: false },
            ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { size: 10 } }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.06)', drawBorder: false },
            ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { size: 10 }, beginAtZero: true }
          }
        } : {}
      }
    });
  }

  const CHART_COLORS = [
    '#0a84ff',
    '#5ac8fa',
    '#30d158',
    '#ff9f0a',
    '#bf5af2',
    '#ff453a',
    '#64d2ff',
    '#a2845e'
  ];

  function renderCharts(data) {
    const chartsData = data.charts || {};

    const chartsConfig = [
      { id: 'browserChart', data: chartsData.browsers || [], type: 'doughnut' },
      { id: 'osChart', data: chartsData.os || [], type: 'doughnut' },
      { id: 'deviceChart', data: chartsData.devices || [], type: 'bar' }
    ];

    chartsConfig.forEach(config => {
      const ctx = document.getElementById(config.id);
      if (!ctx) return;

      const labels = config.data.map(item => item.name);
      const values = config.data.map(item => item.value);
      const colors = CHART_COLORS.slice(0, values.length);

      if (charts[config.id]) {
        charts[config.id].destroy();
      }

      charts[config.id] = createChart(ctx, config.type, labels, values, colors);
    });
  }

  // Render lists
  function renderBypass(list) {
    elements.bypassCountBadge.textContent = list.length;

    if (!list.length) {
      elements.recentBypassList.innerHTML = '<div class="empty-state">Belum ada data</div>';
      return;
    }

    elements.recentBypassList.innerHTML = list.map(item => `
      <div class="data-item">
        <div class="data-status ${item.status ? 'success' : 'failed'}"></div>
        <div class="data-content">
          <div class="data-title">${item.status ? item.result : (item.error || 'Gagal')}</div>
          <div class="data-subtitle">${item.input}</div>
        </div>
        <div class="data-meta">
          <span class="data-tag">${formatDuration(item.duration)}</span>
          <span class="data-time">${formatTime(item.timestamp)}</span>
        </div>
      </div>
    `).join('');
  }

  function renderVisitors(list) {
    elements.visitorCountBadge.textContent = list.length;

    if (!list.length) {
      elements.recentVisitorsList.innerHTML = '<div class="empty-state">Belum ada data</div>';
      return;
    }

    elements.recentVisitorsList.innerHTML = list.map(item => `
      <div class="data-item">
        <div class="data-status success"></div>
        <div class="data-content">
          <div class="data-title">${item.browser} · ${item.os}</div>
          <div class="data-subtitle">${item.country} · ${item.page}</div>
        </div>
        <div class="data-meta">
          <span class="data-tag">${item.device}</span>
          <span class="data-time">${formatTime(item.timestamp)}</span>
        </div>
      </div>
    `).join('');
  }

  function renderLogs(list) {
    elements.logsCountBadge.textContent = list.length;

    if (!list.length) {
      elements.recentLogsTable.querySelector('tbody').innerHTML = `
        <tr><td colspan="5" class="empty-cell">Belum ada data</td></tr>
      `;
      return;
    }

    const rows = list.map(item => `
      <tr>
        <td>${formatTime(item.timestamp)}</td>
        <td>${item.endpoint}</td>
        <td>${item.method}</td>
        <td><span class="status-badge ${item.statusCode >= 400 ? 'error' : 'success'}">${item.statusCode}</span></td>
        <td>${item.error || '-'}</td>
      </tr>
    `).join('');

    elements.recentLogsTable.querySelector('tbody').innerHTML = rows;
  }

  // Load dashboard
  async function loadDashboard() {
    if (!adminKey) return;

    try {
      const data = await fetchStats();
      updateStats(data);
      renderCharts(data);
      renderBypass(data.recentBypass || []);
      renderVisitors(data.recentVisitors || []);
      renderLogs(data.recentLogs || []);
    } catch (error) {
      if (error.message !== 'Unauthorized') {
        showToast(error.message || 'Gagal memuat data', 'error');
      }
    }
  }

  // Auto refresh
  function startAutoRefresh() {
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = setInterval(() => {
      if (adminKey) {
        loadDashboard();
      }
    }, REFRESH_INTERVAL);
  }

  // Initialize
  function init() {
    if (adminKey) {
      showLoginSuccess();
      loadDashboard();
      startAutoRefresh();
    } else {
      showLoginScreen();
    }

    elements.loginBtn.addEventListener('click', handleLogin);
    elements.adminKeyInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleLogin();
    });
    elements.logoutBtn.addEventListener('click', handleLogout);
  }

  document.addEventListener('DOMContentLoaded', init);
})();

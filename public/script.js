/**
 * BipaSunlok - Frontend Script
 * Developed by Pajar
 */

(function () {
  'use strict';

  const API_URL = '/api/bypass';
  const VISITOR_URL = '/api/visitor';
  const HISTORY_KEY = 'bipasunlok_history';
  const MAX_HISTORY = 50;

  const elements = {
    urlInput: document.getElementById('urlInput'),
    pasteBtn: document.getElementById('pasteBtn'),
    bypassBtn: document.getElementById('bypassBtn'),
    loadingState: document.getElementById('loadingState'),
    progressFill: document.getElementById('progressFill'),
    resultCard: document.getElementById('resultCard'),
    resultUrl: document.getElementById('resultUrl'),
    resultMeta: document.getElementById('resultMeta'),
    closeResult: document.getElementById('closeResult'),
    copyBtn: document.getElementById('copyBtn'),
    openBtn: document.getElementById('openBtn'),
    shareBtn: document.getElementById('shareBtn'),
    clearBtn: document.getElementById('clearBtn'),
    historyList: document.getElementById('historyList'),
    clearHistory: document.getElementById('clearHistory'),
    toast: document.getElementById('toast'),
    toastIcon: document.getElementById('toastIcon'),
    toastMsg: document.getElementById('toastMsg')
  };

  let currentResult = null;
  let progressInterval = null;

  // Track visitor on page load
  async function trackVisitor() {
    try {
      await fetch(VISITOR_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page: window.location.pathname,
          referrer: document.referrer || 'Direct'
        })
      });
    } catch (error) {
      // Silent fail - analytics optional
      console.error('[Visitor] Track failed:', error.message);
    }
  }

  // Utility: Toast
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

  // Utility: Format time
  function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Baru saja';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m lalu`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}j lalu`;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  }

  // Utility: Validate URL
  function isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  }

  // Paste button
  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        elements.urlInput.value = text.trim();
        elements.urlInput.focus();
      }
    } catch (error) {
      showToast('Akses clipboard ditolak', 'error');
    }
  }

  // Progress animation
  function startProgress() {
    let progress = 0;
    elements.progressFill.style.width = '0%';

    progressInterval = setInterval(() => {
      if (progress < 85) {
        progress += Math.random() * 12 + 3;
        if (progress > 85) progress = 85;
      } else if (progress < 95) {
        progress += Math.random() * 2;
      }
      elements.progressFill.style.width = `${Math.min(progress, 95)}%`;
    }, 300);
  }

  function stopProgress() {
    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = null;
    }
    elements.progressFill.style.width = '100%';
    setTimeout(() => {
      elements.progressFill.style.width = '0%';
    }, 500);
  }

  // Bypass function
  async function handleBypass() {
    const url = elements.urlInput.value.trim();

    if (!url) {
      showToast('Masukkan URL terlebih dahulu', 'error');
      elements.urlInput.focus();
      return;
    }

    if (!isValidUrl(url)) {
      showToast('URL tidak valid', 'error');
      elements.urlInput.focus();
      return;
    }

    setLoading(true);
    startProgress();
    const startTime = Date.now();

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const data = await response.json();
      const duration = Date.now() - startTime;

      if (!response.ok || !data.status) {
        throw new Error(data.message || 'Gagal bypass link');
      }

      currentResult = data.result;

      const record = {
        input: url,
        result: data.result,
        status: true,
        duration,
        timestamp: Date.now()
      };

      addToHistory(record);
      showResult(data.result, duration);
      showToast('Link berhasil di bypass');
    } catch (error) {
      const duration = Date.now() - startTime;
      const record = {
        input: url,
        result: null,
        status: false,
        duration,
        error: error.message,
        timestamp: Date.now()
      };
      addToHistory(record);
      showToast(error.message || 'Gagal memproses link', 'error');
    } finally {
      stopProgress();
      setLoading(false);
    }
  }

  function setLoading(loading) {
    elements.bypassBtn.disabled = loading;
    elements.bypassBtn.classList.toggle('loading', loading);

    if (loading) {
      elements.loadingState.classList.remove('hidden');
      elements.resultCard.classList.add('hidden');
    } else {
      elements.loadingState.classList.add('hidden');
    }
  }

  function showResult(url, durationMs) {
    elements.resultUrl.textContent = url;
    elements.resultMeta.textContent = `Diproses dalam ${(durationMs / 1000).toFixed(2)} detik`;
    elements.resultCard.classList.remove('hidden');
    elements.resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function hideResult() {
    elements.resultCard.classList.add('hidden');
    currentResult = null;
  }

  // Result actions
  async function copyResult() {
    if (!currentResult) return;
    try {
      await navigator.clipboard.writeText(currentResult);
      showToast('Link disalin ke clipboard');
    } catch {
      showToast('Gagal menyalin link', 'error');
    }
  }

  function openResult() {
    if (!currentResult) return;
    window.open(currentResult, '_blank', 'noopener,noreferrer');
  }

  async function shareResult() {
    if (!currentResult) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'BipaSunlok - Hasil Bypass',
          url: currentResult
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          showToast('Gagal membagikan', 'error');
        }
      }
    } else {
      copyResult();
      showToast('Link disalin untuk dibagikan');
    }
  }

  function clearResult() {
    hideResult();
    elements.urlInput.value = '';
    elements.urlInput.focus();
  }

  // History
  function getHistory() {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveHistory(history) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
  }

  function addToHistory(record) {
    const history = getHistory();
    history.unshift(record);
    saveHistory(history);
    renderHistory();
  }

  function clearAllHistory() {
    localStorage.removeItem(HISTORY_KEY);
    renderHistory();
    showToast('Riwayat dihapus');
  }

  function renderHistory() {
    const history = getHistory();

    if (history.length === 0) {
      elements.historyList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span>Belum ada riwayat</span>
        </div>
      `;
      return;
    }

    elements.historyList.innerHTML = history.map(item => `
      <div class="history-item" data-url="${item.result || item.input}" data-status="${item.status ? 'success' : 'failed'}">
        <div class="history-status ${item.status ? 'success' : 'failed'}"></div>
        <div class="history-content">
          <div class="history-url">${item.status ? item.result : (item.error || 'Gagal')}</div>
          <div class="history-input">${item.input}</div>
        </div>
        <div class="history-time">${formatTime(item.timestamp)}</div>
      </div>
    `).join('');

    // Add click handlers to history items
    elements.historyList.querySelectorAll('.history-item').forEach(item => {
      item.addEventListener('click', () => {
        const url = item.dataset.url;
        const status = item.dataset.status === 'success';
        if (status && url) {
          window.open(url, '_blank', 'noopener,noreferrer');
        } else {
          elements.urlInput.value = url;
          showToast('URL dimuat ke input', 'success');
        }
      });
    });
  }

  // Event listeners
  elements.pasteBtn.addEventListener('click', handlePaste);
  elements.bypassBtn.addEventListener('click', handleBypass);
  elements.urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleBypass();
  });
  elements.closeResult.addEventListener('click', hideResult);
  elements.copyBtn.addEventListener('click', copyResult);
  elements.openBtn.addEventListener('click', openResult);
  elements.shareBtn.addEventListener('click', shareResult);
  elements.clearBtn.addEventListener('click', clearResult);
  elements.clearHistory.addEventListener('click', clearAllHistory);

  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    trackVisitor();
    renderHistory();
    elements.urlInput.focus();
  });
})();

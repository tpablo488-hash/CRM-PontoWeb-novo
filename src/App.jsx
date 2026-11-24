import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { supabase } from './supabaseClient';
import {
  Shield, Lock, Mail, Eye, EyeOff, Sun, Moon, Volume2, VolumeX,
  Play, Pause, LogOut, CheckCircle2, AlertTriangle, XCircle,
  Bell, User, KeyRound, Activity, Terminal, Sparkles, ArrowRight,
  RefreshCw, Users, Check, Info, LayoutDashboard, UserPlus,
  Calendar, DollarSign, FileText, Settings, Phone, Copy,
  ExternalLink, Clock, Send, ArrowLeftRight, Building2, MessageSquare,
  ChevronRight, Wifi, WifiOff, ClipboardCheck, AlertCircle, CalendarClock,
  FileSpreadsheet, CheckCheck, X, Briefcase, Target, TrendingUp,
  Search, Filter, Award, ArrowUpRight, Trash2, UserMinus, UserCheck,
  Wallet, CreditCard, BarChart3, PieChart, ListFilter, Layers
} from 'lucide-react';

/**
 * ============================================================================
 * PONTOWEB CRM — SISTEMA COMERCIAL INTEGRADO
 * ============================================================================
 * Atualizações aplicadas:
 * 1. Card "Contagem de Vendas" (sem gráfico e sem emoji) com comissão no topo
 *    direito e metas progressivas (Meta Mínima = 4 vendas | Meta Máxima = +7 vendas).
 * 2. Dia da semana exibido junto à data e horário da reunião nos cards e pendências.
 * 3. Botão "WhatsApp" funcional ao lado de "Já fiz" abrindo wa.me do cliente.
 * 4. Placeholder "Ex: Maria, Gabriel..." no campo Nome do cliente (Admin).
 * ============================================================================
 */

const DB_KEY = 'pontoweb_crm_db_v1';
const SESSION_KEY = 'pontoweb_crm_session_v1';
const PREFS_KEY = 'pontoweb_crm_prefs_v1';
const CHANNEL_NAME = 'pontoweb_crm_sync_channel';

const MASTER_ADMIN_EMAIL = 'tpablo488@gmail.com';
const INITIAL_SELLER_EMAIL = 'rayvenart3@gmail.com';
const YOUTUBE_BG_VIDEO_ID = '77Y3r6hQbKE';

const DESIGN_TOKENS = {
  dark: {
    primary: '#8017FF',
    primaryDark: '#5010A8',
    primaryLight: '#EDE0FF',
    bg: '#080808',
    surface: '#121214',
    surfaceElevated: '#18181C',
    textPrimary: '#F4F1F8',
    textSecondary: '#A89FB3',
    border: '#2A2531',
    success: '#16845B',
    warning: '#B7791F',
    error: '#C83E4D',
    glow: '0 0 24px rgba(128, 23, 255, 0.28)',
    glowStrong: '0 0 32px rgba(128, 23, 255, 0.45)',
  },
  light: {
    primary: '#8017FF',
    primaryDark: '#5010A8',
    primaryLight: '#EDE0FF',
    bg: '#F7F5FA',
    surface: '#FFFFFF',
    surfaceElevated: '#F1EDF7',
    textPrimary: '#241A2D',
    textSecondary: '#746B7D',
    border: '#E8E2ED',
    success: '#16845B',
    warning: '#B7791F',
    error: '#C83E4D',
    glow: '0 4px 20px rgba(128, 23, 255, 0.14)',
    glowStrong: '0 6px 28px rgba(128, 23, 255, 0.24)',
  }
};

function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function hashPasswordSync(plain) {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  const salted = `PW_CRM_SALT_2026::${plain}`;
  for (let i = 0; i < salted.length; i++) {
    const ch = salted.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 'pw_' + (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

function formatSaoPauloDateTime(isoString = new Date().toISOString()) {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(isoString));
  } catch {
    return new Date(isoString).toLocaleString('pt-BR');
  }
}

function getSaoPauloWeekday(dateStr) {
  if (!dateStr) return '';
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const utcDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    const weekday = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      weekday: 'long',
    }).format(utcDate);
    return weekday.charAt(0).toUpperCase() + weekday.slice(1);
  } catch {
    return '';
  }
}

function formatMeetingSchedule(dateStr, timeStr, includeWeekday = false) {
  if (!dateStr) return 'Não agendada';
  const [y, m, d] = dateStr.split('-');
  const weekday = includeWeekday ? getSaoPauloWeekday(dateStr) : '';
  const prefix = weekday ? `${weekday}, ` : '';
  return `${prefix}${d}/${m}/${y}${timeStr ? ` às ${timeStr}` : ''}`;
}

function formatCurrencyBRL(value) {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(num);
}

function sanitizeWhatsAppNumber(raw) {
  const digits = (raw || '').replace(/\D/g, '');
  return digits;
}

function formatWhatsAppDisplay(raw) {
  const digits = sanitizeWhatsAppNumber(raw);
  if (digits.length === 13 && digits.startsWith('55')) {
    return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }
  if (digits.length === 12 && digits.startsWith('55')) {
    return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 8)}-${digits.slice(8)}`;
  }
  return raw;
}

function buildWhatsAppLink(raw, clientName = '') {
  const digits = sanitizeWhatsAppNumber(raw);
  const text = encodeURIComponent(`Olá ${clientName}, tudo bem? Aqui é da PontoWeb!`);
  return `https://wa.me/${digits}?text=${text}`;
}

function getTodaySaoPauloISO() {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());
    const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
    return `${map.year}-${map.month}-${map.day}`;
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function getCommissionPercentage(salesCount) {
  if (salesCount >= 10) return 50;
  if (salesCount === 9) return 45;
  if (salesCount === 8) return 40;
  if (salesCount >= 6) return 35;
  return 30;
}

/**
 * ============================================================================
 * IDENTIDADE SONORA — MOTOR HÍBRIDO YOUTUBE LOOP + SÍNTESE EXECUTIVE LUXURY
 * ============================================================================
 */
class PontoWebAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMusicPlaying = false;
    this.musicVolume = 0.25;
    this.sfxVolume = 0.45;
    this.sfxEnabled = true;
    this.lastSfxTime = 0;

    // YouTube IFrame Player + Fallback Sintetizado 98 BPM
    this.ytPlayer = null;
    this.ytReady = false;
    this.ytFailed = false;
    this.ytContainer = null;
    this.initPromise = null;

    this.fallbackTimer = null;
    this.fallbackStep = 0;
  }

  ensureContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  loadPreferences() {
    try {
      const saved = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
      if (typeof saved.musicVolume === 'number') this.musicVolume = saved.musicVolume;
      if (typeof saved.sfxVolume === 'number') this.sfxVolume = saved.sfxVolume;
      if (typeof saved.sfxEnabled === 'boolean') this.sfxEnabled = saved.sfxEnabled;
    } catch {}
  }

  savePreferences(partial) {
    try {
      const current = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
      localStorage.setItem(PREFS_KEY, JSON.stringify({ ...current, ...partial }));
    } catch {}
  }

  initYouTubePlayer() {
    if (typeof window === 'undefined') return Promise.resolve(false);
    if (this.ytReady && this.ytPlayer) return Promise.resolve(true);
    if (this.ytFailed) return Promise.resolve(false);
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve) => {
      const timeout = setTimeout(() => {
        if (!this.ytReady) {
          this.ytFailed = true;
          resolve(false);
        }
      }, 6500);

      const createPlayer = () => {
        try {
          if (!this.ytContainer) {
            this.ytContainer = document.createElement('div');
            this.ytContainer.id = 'pw-yt-bg-audio-host';
            this.ytContainer.style.cssText =
              'position:fixed;bottom:0;right:0;width:200px;height:200px;opacity:0.001;pointer-events:none;z-index:-1;';
            const inner = document.createElement('div');
            inner.id = 'pw-yt-bg-iframe';
            this.ytContainer.appendChild(inner);
            document.body.appendChild(this.ytContainer);
          }

          this.ytPlayer = new window.YT.Player('pw-yt-bg-iframe', {
            height: '200',
            width: '200',
            videoId: YOUTUBE_BG_VIDEO_ID,
            playerVars: {
              autoplay: 0,
              controls: 0,
              disablekb: 1,
              fs: 0,
              loop: 1,
              playlist: YOUTUBE_BG_VIDEO_ID,
              modestbranding: 1,
              playsinline: 1,
              rel: 0,
              origin: window.location.origin,
            },
            events: {
              onReady: (event) => {
                clearTimeout(timeout);
                this.ytReady = true;
                try {
                  event.target.setVolume(Math.round(this.musicVolume * 100));
                  if (this.isMusicPlaying) {
                    event.target.unMute();
                    event.target.playVideo();
                  }
                } catch {}
                resolve(true);
              },
              onStateChange: (event) => {
                if (event.data === 0 && this.isMusicPlaying) {
                  try {
                    event.target.seekTo(0);
                    event.target.playVideo();
                  } catch {}
                }
              },
              onError: () => {
                clearTimeout(timeout);
                this.ytFailed = true;
                if (this.isMusicPlaying) {
                  this.startFallbackAmbient();
                }
                resolve(false);
              },
            },
          });
        } catch {
          clearTimeout(timeout);
          this.ytFailed = true;
          resolve(false);
        }
      };

      if (window.YT && window.YT.Player) {
        createPlayer();
      } else {
        const prevReady = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
          if (typeof prevReady === 'function') prevReady();
          createPlayer();
        };
        if (!document.getElementById('pw-yt-iframe-api')) {
          const tag = document.createElement('script');
          tag.id = 'pw-yt-iframe-api';
          tag.src = 'https://www.youtube.com/iframe_api';
          tag.onerror = () => {
            clearTimeout(timeout);
            this.ytFailed = true;
            resolve(false);
          };
          document.head.appendChild(tag);
        }
      }
    });

    return this.initPromise;
  }

  startFallbackAmbient() {
    if (this.fallbackTimer) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const beatDuration = 60 / 98;
    const playPulse = () => {
      if (!this.isMusicPlaying || !this.ctx) return;
      const now = this.ctx.currentTime;
      const step = this.fallbackStep % 16;

      if (step % 4 === 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        osc.type = 'sine';
        const roots = [55, 55, 48.99, 65.41];
        osc.frequency.setValueAtTime(roots[Math.floor(step / 4) % roots.length], now);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(140, now);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(this.musicVolume * 0.22, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + beatDuration * 3.6);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + beatDuration * 3.8);
      }

      if (step === 2 || step === 10) {
        const notes = [220, 261.63, 329.63, 392.0];
        const freq = notes[(this.fallbackStep / 2) % notes.length];
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(this.musicVolume * 0.08, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 1.5);
      }

      this.fallbackStep += 1;
    };

    playPulse();
    this.fallbackTimer = setInterval(playPulse, beatDuration * 1000);
  }

  stopFallbackAmbient() {
    if (this.fallbackTimer) {
      clearInterval(this.fallbackTimer);
      this.fallbackTimer = null;
    }
  }

  async startMusic() {
    if (this.isMusicPlaying) return;
    this.isMusicPlaying = true;
    this.ensureContext();

    if (this.ytReady && this.ytPlayer) {
      try {
        this.ytPlayer.setVolume(Math.round(this.musicVolume * 100));
        this.ytPlayer.unMute();
        this.ytPlayer.playVideo();
        return;
      } catch {}
    }

    const ok = await this.initYouTubePlayer();
    if (ok && this.ytPlayer && this.isMusicPlaying) {
      try {
        this.ytPlayer.setVolume(Math.round(this.musicVolume * 100));
        this.ytPlayer.unMute();
        this.ytPlayer.playVideo();
      } catch {
        this.startFallbackAmbient();
      }
    } else if (this.isMusicPlaying) {
      this.startFallbackAmbient();
    }
  }

  stopMusic() {
    this.isMusicPlaying = false;
    this.stopFallbackAmbient();
    if (this.ytReady && this.ytPlayer) {
      try {
        this.ytPlayer.pauseVideo();
      } catch {}
    }
  }

  setMusicVolume(val) {
    this.musicVolume = Math.max(0, Math.min(1, val));
    if (this.ytReady && this.ytPlayer) {
      try {
        this.ytPlayer.setVolume(Math.round(this.musicVolume * 100));
      } catch {}
    }
    this.savePreferences({ musicVolume: this.musicVolume });
  }

  setSfxVolume(val) {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    this.savePreferences({ sfxVolume: this.sfxVolume });
  }

  setSfxEnabled(enabled) {
    this.sfxEnabled = Boolean(enabled);
    this.savePreferences({ sfxEnabled: this.sfxEnabled });
  }

  playSfx(type) {
    if (!this.sfxEnabled || this.sfxVolume <= 0.005) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    if (now - this.lastSfxTime < 0.045) return;
    this.lastSfxTime = now;

    const v = this.sfxVolume;

    switch (type) {
      case 'click': {
        const bodyOsc = ctx.createOscillator();
        const bodyGain = ctx.createGain();
        bodyOsc.type = 'sine';
        bodyOsc.frequency.setValueAtTime(195, now);
        bodyOsc.frequency.exponentialRampToValueAtTime(72, now + 0.028);
        bodyGain.gain.setValueAtTime(v * 0.24, now);
        bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.032);
        bodyOsc.connect(bodyGain);
        bodyGain.connect(ctx.destination);
        bodyOsc.start(now);
        bodyOsc.stop(now + 0.036);

        const tickOsc = ctx.createOscillator();
        const tickGain = ctx.createGain();
        tickOsc.type = 'triangle';
        tickOsc.frequency.setValueAtTime(1480, now);
        tickOsc.frequency.exponentialRampToValueAtTime(640, now + 0.014);
        tickGain.gain.setValueAtTime(v * 0.09, now);
        tickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.016);
        tickOsc.connect(tickGain);
        tickGain.connect(ctx.destination);
        tickOsc.start(now);
        tickOsc.stop(now + 0.02);
        break;
      }

      case 'success': {
        const sub = ctx.createOscillator();
        const subGain = ctx.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(110, now);
        sub.frequency.exponentialRampToValueAtTime(82.41, now + 0.26);
        subGain.gain.setValueAtTime(v * 0.24, now);
        subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
        sub.connect(subGain);
        subGain.connect(ctx.destination);
        sub.start(now);
        sub.stop(now + 0.3);

        [220, 329.63].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const filter = ctx.createBiquadFilter();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.075);
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(1250, now + idx * 0.075);

          gain.gain.setValueAtTime(0.0001, now + idx * 0.075);
          gain.gain.linearRampToValueAtTime(v * 0.22, now + idx * 0.075 + 0.012);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.075 + 0.34);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.075);
          osc.stop(now + idx * 0.075 + 0.36);
        });
        break;
      }

      case 'notification': {
        [659.25, 987.77].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.025);
          gain.gain.setValueAtTime(0.0001, now + i * 0.025);
          gain.gain.linearRampToValueAtTime(v * (i === 0 ? 0.2 : 0.11), now + i * 0.025 + 0.008);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.025);
          osc.stop(now + 0.44);
        });
        break;
      }

      case 'modal': {
        const bufferSize = Math.floor(ctx.sampleRate * 0.14);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.Q.setValueAtTime(4.2, now);
        filter.frequency.setValueAtTime(140, now);
        filter.frequency.exponentialRampToValueAtTime(520, now + 0.13);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(v * 0.2, now + 0.035);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(now);
        break;
      }

      case 'error': {
        [92.5, 65.41].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.085);
          gain.gain.setValueAtTime(0.0001, now + i * 0.085);
          gain.gain.linearRampToValueAtTime(v * 0.3, now + i * 0.085 + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.085 + 0.13);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.085);
          osc.stop(now + i * 0.085 + 0.15);
        });
        break;
      }

      case 'warning': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(293.66, now);
        osc.frequency.linearRampToValueAtTime(277.18, now + 0.16);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(900, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(v * 0.2, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.24);
        break;
      }

      default:
        break;
    }
  }
}

const soundEngine = new PontoWebAudioEngine();

/**
 * ============================================================================
 * CAMADA DE DADOS E SEGURANÇA — INTEGRIDADE RELACIONAL COMPLETA
 * ============================================================================
 */
class PontoWebDataEngine {
  constructor() {
    this.channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL_NAME) : null;
  }

  broadcast(eventType, payload = {}) {
    const packet = { eventType, payload, ts: Date.now() };
    if (this.channel) {
      try {
        this.channel.postMessage(packet);
      } catch {}
    }
    try {
      localStorage.setItem('pontoweb_crm_last_sync', JSON.stringify(packet));
    } catch {}
  }

  normalizeDb(raw) {
    return {
      version: 4,
      initializedAt: raw?.initializedAt || new Date().toISOString(),
      users: Array.isArray(raw?.users) ? raw.users : [],
      clients: Array.isArray(raw?.clients) ? raw.clients : [],
      tasks: Array.isArray(raw?.tasks) ? raw.tasks : [],
      meetings: Array.isArray(raw?.meetings) ? raw.meetings : [],
      meetingReports: Array.isArray(raw?.meetingReports) ? raw.meetingReports : [],
      noShowOccurrences: Array.isArray(raw?.noShowOccurrences) ? raw.noShowOccurrences : [],
      rescheduleRecords: Array.isArray(raw?.rescheduleRecords) ? raw.rescheduleRecords : [],
      sales: Array.isArray(raw?.sales) ? raw.sales : [],
      notifications: Array.isArray(raw?.notifications) ? raw.notifications : [],
      auditLogs: Array.isArray(raw?.auditLogs) ? raw.auditLogs : [],
    };
  }

  initializeDatabase() {
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (raw) {
        const parsed = this.normalizeDb(JSON.parse(raw));
        const hasAdmin = parsed.users.some((u) => u.email === MASTER_ADMIN_EMAIL && u.role === 'admin');
        if (hasAdmin) {
          this.saveDb(parsed, false);
          return parsed;
        }
      }
    } catch {}

    const now = new Date().toISOString();
    const initialDb = this.normalizeDb({
      version: 4,
      initializedAt: now,
      users: [
        {
          id: generateUUID(),
          name: 'Pablo — Diretoria PontoWeb',
          email: MASTER_ADMIN_EMAIL,
          passwordHash: hashPasswordSync('PontoWeb@2026'),
          role: 'admin',
          status: 'active',
          createdAt: now,
          updatedAt: now,
          createdBy: 'SYSTEM_BOOTSTRAP',
        },
        {
          id: generateUUID(),
          name: 'Rayven — Consultor Comercial',
          email: INITIAL_SELLER_EMAIL,
          passwordHash: hashPasswordSync('Vendas@2026'),
          role: 'seller',
          status: 'active',
          createdAt: now,
          updatedAt: now,
          createdBy: 'SYSTEM_BOOTSTRAP',
        },
      ],
      auditLogs: [
        {
          id: generateUUID(),
          timestamp: now,
          actorEmail: 'SYSTEM_BOOTSTRAP',
          action: 'SYSTEM_INIT',
          details: 'Banco relacional inicializado com contas oficiais de Administrador e Vendedor.',
        },
      ],
    });

    this.saveDb(initialDb, false);
    return initialDb;
  }

  getDb() {
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (!raw) return this.initializeDatabase();
      return this.normalizeDb(JSON.parse(raw));
    } catch {
      return this.initializeDatabase();
    }
  }

  saveDb(db, shouldBroadcast = true) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    if (shouldBroadcast) {
      this.broadcast('DB_UPDATED');
    }
    // Hybrid sync: persist to Supabase (fire-and-forget)
    this.syncToSupabase(db).catch(() => {});
  }

  async syncToSupabase(db) {
    try {
      if (Array.isArray(db.users) && db.users.length) {
        await supabase.from('users').upsert(
          db.users.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            password_hash: u.passwordHash || 'supabase_auth',
            role: u.role,
            status: u.status,
            created_at: u.createdAt,
            updated_at: u.updatedAt,
            created_by: u.createdBy,
            deleted_at: u.deletedAt,
            deleted_by: u.deletedBy,
          })),
          { onConflict: 'id' }
        );
      }
      if (Array.isArray(db.clients) && db.clients.length) {
        await supabase.from('clients').upsert(
          db.clients.map((c) => ({
            id: c.id,
            name: c.name,
            segment: c.segment,
            whatsapp: c.whatsapp,
            notes: c.notes,
            assigned_seller_id: c.assignedSellerId,
            assigned_seller_name: c.assignedSellerName,
            first_contact_status: c.firstContactStatus,
            first_contact_at: c.firstContactAt,
            first_contact_by: c.firstContactBy,
            active_meeting_id: c.activeMeetingId,
            meeting_status: c.meetingStatus,
            meeting_date: c.meetingDate,
            meeting_time: c.meetingTime,
            has_sale: c.hasSale,
            created_at: c.createdAt,
            updated_at: c.updatedAt,
            created_by: c.createdBy,
            history: c.history || [],
          })),
          { onConflict: 'id' }
        );
      }
      if (Array.isArray(db.tasks) && db.tasks.length) {
        await supabase.from('tasks').upsert(
          db.tasks.map((t) => ({
            id: t.id,
            type: t.type,
            client_id: t.clientId,
            client_name: t.clientName,
            assigned_seller_id: t.assignedSellerId,
            status: t.status,
            due_date: t.dueDate,
            created_at: t.createdAt,
            completed_at: t.completedAt,
            completed_by: t.completedBy,
          })),
          { onConflict: 'id' }
        );
      }
      if (Array.isArray(db.meetings) && db.meetings.length) {
        await supabase.from('meetings').upsert(
          db.meetings.map((m) => ({
            id: m.id,
            type: m.type,
            client_id: m.clientId,
            client_name: m.clientName,
            client_segment: m.clientSegment,
            assigned_seller_id: m.assignedSellerId,
            assigned_seller_name: m.assignedSellerName,
            scheduled_date: m.scheduledDate,
            scheduled_time: m.scheduledTime,
            timezone: m.timezone,
            status: m.status,
            reschedule_count: m.rescheduleCount,
            previous_schedules: m.previousSchedules || [],
            report_id: m.reportId,
            created_at: m.createdAt,
            updated_at: m.updatedAt,
            completed_at: m.completedAt,
          })),
          { onConflict: 'id' }
        );
      }
      if (Array.isArray(db.meetingReports) && db.meetingReports.length) {
        await supabase.from('meeting_reports').upsert(
          db.meetingReports.map((r) => ({
            id: r.id,
            client_id: r.clientId,
            client_name: r.clientName,
            client_segment: r.clientSegment,
            meeting_id: r.meetingId,
            seller_id: r.sellerId,
            seller_name: r.sellerName,
            submitted_by_id: r.submittedById,
            submitted_by_name: r.submittedByName,
            is_read_by_admin: r.isReadByAdmin,
            read_by_admin_at: r.readByAdminAt,
            read_by_admin_name: r.readByAdminName,
            created_at: r.createdAt,
            section_a: r.sectionA,
            sale_info: r.saleInfo,
            section_b: r.sectionB,
            section_c: r.sectionC,
            section_f: r.sectionF,
          })),
          { onConflict: 'id' }
        );
      }
      if (Array.isArray(db.sales) && db.sales.length) {
        await supabase.from('sales').upsert(db.sales.map((s) => ({
          id: s.id,
          client_id: s.clientId,
          status: s.status,
          payment_structure: s.paymentStructure,
          sale_value: s.saleValue,
          sent_value: s.sentValue,
          payment_method: s.paymentMethod,
          created_at: s.createdAt,
        })), { onConflict: 'id' });
      }
      if (Array.isArray(db.notifications) && db.notifications.length) {
        await supabase.from('notifications').upsert(db.notifications.map((n) => ({
          id: n.id,
          user_id: n.userId,
          title: n.title,
          message: n.message,
          type: n.type,
          related_id: n.relatedId,
          read: n.read,
          created_at: n.createdAt,
        })), { onConflict: 'id' });
      }
      if (Array.isArray(db.auditLogs) && db.auditLogs.length) {
        await supabase.from('audit_logs').upsert(db.auditLogs.map((a) => ({
          id: a.id,
          timestamp: a.timestamp,
          actor_email: a.actorEmail,
          action: a.action,
          details: a.details,
          extra: a.extra || null,
        })), { onConflict: 'id' });
      }
    } catch (e) {
      console.warn('syncToSupabase failed', e?.message);
    }
  }

  async syncFromSupabase() {
    try {
      const [users, clients, tasks, meetings, reports, sales, notifications, audits] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('clients').select('*'),
        supabase.from('tasks').select('*'),
        supabase.from('meetings').select('*'),
        supabase.from('meeting_reports').select('*'),
        supabase.from('sales').select('*'),
        supabase.from('notifications').select('*'),
        supabase.from('audit_logs').select('*'),
      ]);

      const db = this.getDb();
      if (users.data?.length) db.users = users.data.map((u) => ({
        id: u.id, name: u.name, email: u.email, passwordHash: u.password_hash,
        role: u.role, status: u.status, createdAt: u.created_at, updatedAt: u.updated_at,
        createdBy: u.created_by, deletedAt: u.deleted_at, deletedBy: u.deleted_by,
      }));
      if (clients.data?.length) db.clients = clients.data.map((c) => ({
        id: c.id, name: c.name, segment: c.segment, whatsapp: c.whatsapp, notes: c.notes,
        assignedSellerId: c.assigned_seller_id, assignedSellerName: c.assigned_seller_name,
        firstContactStatus: c.first_contact_status, firstContactAt: c.first_contact_at,
        firstContactBy: c.first_contact_by, activeMeetingId: c.active_meeting_id,
        meetingStatus: c.meeting_status, meetingDate: c.meeting_date, meetingTime: c.meeting_time,
        hasSale: c.has_sale, createdAt: c.created_at, updatedAt: c.updated_at,
        createdBy: c.created_by, history: c.history || [],
      }));
      if (tasks.data?.length) db.tasks = tasks.data.map((t) => ({
        id: t.id, type: t.type, clientId: t.client_id, clientName: t.client_name,
        assignedSellerId: t.assigned_seller_id, status: t.status, dueDate: t.due_date,
        createdAt: t.created_at, completedAt: t.completed_at, completedBy: t.completed_by,
      }));
      if (meetings.data?.length) db.meetings = meetings.data.map((m) => ({
        id: m.id, type: m.type, clientId: m.client_id, clientName: m.client_name,
        clientSegment: m.client_segment, assignedSellerId: m.assigned_seller_id,
        assignedSellerName: m.assigned_seller_name, scheduledDate: m.scheduled_date,
        scheduledTime: m.scheduled_time, timezone: m.timezone, status: m.status,
        rescheduleCount: m.reschedule_count, previousSchedules: m.previous_schedules || [],
        reportId: m.report_id, createdAt: m.created_at, updatedAt: m.updated_at,
        completedAt: m.completed_at,
      }));
      if (reports.data?.length) db.meetingReports = reports.data.map((r) => ({
        id: r.id, clientId: r.client_id, clientName: r.client_name, clientSegment: r.client_segment,
        meetingId: r.meeting_id, sellerId: r.seller_id, sellerName: r.seller_name,
        submittedById: r.submitted_by_id, submittedByName: r.submitted_by_name,
        isReadByAdmin: r.is_read_by_admin, readByAdminAt: r.read_by_admin_at,
        readByAdminName: r.read_by_admin_name, createdAt: r.created_at,
        sectionA: r.section_a, saleInfo: r.sale_info, sectionB: r.section_b,
        sectionC: r.section_c, sectionF: r.section_f,
      }));
      if (sales.data?.length) db.sales = sales.data.map((s) => ({
        id: s.id, clientId: s.client_id, status: s.status, paymentStructure: s.payment_structure,
        saleValue: s.sale_value, sentValue: s.sent_value, paymentMethod: s.payment_method,
        createdAt: s.created_at,
      }));
      if (notifications.data?.length) db.notifications = notifications.data.map((n) => ({
        id: n.id, userId: n.user_id, title: n.title, message: n.message, type: n.type,
        relatedId: n.related_id, read: n.read, createdAt: n.created_at,
      }));
      if (audits.data?.length) db.auditLogs = audits.data.map((a) => ({
        id: a.id, timestamp: a.timestamp, actorEmail: a.actor_email, action: a.action,
        details: a.details, extra: a.extra,
      }));
      this.saveDb(db, false);
    } catch (e) {
      console.warn('syncFromSupabase failed', e?.message);
    }
  }

  appendAudit(db, actorEmail, action, details, extra = {}) {
    db.auditLogs.unshift({
      id: generateUUID(),
      timestamp: new Date().toISOString(),
      actorEmail,
      action,
      details,
      ...extra,
    });
    if (db.auditLogs.length > 500) {
      db.auditLogs = db.auditLogs.slice(0, 500);
    }
  }

  pushNotification(db, targetUserId, title, message, type = 'info', relatedId = null) {
    db.notifications.unshift({
      id: generateUUID(),
      userId: targetUserId,
      title,
      message,
      type,
      relatedId,
      read: false,
      createdAt: new Date().toISOString(),
    });
    if (db.notifications.length > 300) {
      db.notifications = db.notifications.slice(0, 300);
    }
  }

  resolveUserLabel(db, userId, fallbackName = '') {
    if (!userId) return fallbackName || 'Não atribuído';
    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      return fallbackName ? `${fallbackName} (conta excluída)` : 'Usuário (conta excluída)';
    }
    if (user.status === 'deleted') {
      return `${user.name} (conta excluída)`;
    }
    if (user.status === 'inactive') {
      return `${user.name} (desativada)`;
    }
    return user.name;
  }

  async authenticate(email, password) {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !password) {
      return { ok: false, code: 'VALIDATION_ERROR', message: 'Informe e-mail e senha para acessar.' };
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (authError || !authData?.user) {
      return { ok: false, code: 'INVALID_CREDENTIALS', message: 'Credenciais inválidas. Verifique seus dados.' };
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      await supabase.auth.signOut();
      return { ok: false, code: 'USER_NOT_FOUND', message: 'Perfil de usuário não encontrado.' };
    }

    if (profile.status === 'deleted') {
      await supabase.auth.signOut();
      return { ok: false, code: 'ACCOUNT_DELETED', message: 'Esta conta foi excluída e não possui mais acesso.' };
    }

    if (profile.status === 'inactive') {
      await supabase.auth.signOut();
      return {
        ok: false,
        code: 'ACCOUNT_DISABLED',
        message: 'Sua conta está desativada. Contate o administrador da PontoWeb.',
      };
    }

    const { passwordHash, ...safeUser } = profile;
    return { ok: true, user: safeUser, session: authData.session };
  }

  async validateSession() {
    try {
      const { data } = await supabase.auth.getSession();
      if (!data?.session) return { valid: false, reason: 'NO_SESSION' };

      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.session.user.id)
        .single();

      if (error || !profile) {
        await supabase.auth.signOut();
        return { valid: false, reason: 'USER_NOT_FOUND' };
      }

      if (profile.status !== 'active') {
        await supabase.auth.signOut();
        return {
          valid: false,
          reason: 'ACCOUNT_REVOKED',
          message: 'Sua sessão foi encerrada imediatamente porque esta conta foi desativada ou excluída.',
        };
      }

      const { passwordHash, ...safeUser } = profile;
      return { valid: true, user: safeUser, session: data.session };
    } catch {
      await supabase.auth.signOut();
      return { valid: false, reason: 'CORRUPT_SESSION' };
    }
  }

  async clearSession(actorEmail = null) {
    if (actorEmail) {
      try {
        await supabase.from('audit_logs').insert({
          actor_email: actorEmail,
          action: 'LOGOUT',
          details: 'Sessão encerrada pelo usuário.',
        });
      } catch {}
    }
    await supabase.auth.signOut();
  }

  requestPasswordRecovery(email) {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return { ok: false, message: 'Informe um endereço de e-mail válido.' };
    }

    const db = this.getDb();
    const user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user || user.status !== 'active') {
      this.appendAudit(db, cleanEmail, 'PASSWORD_RECOVERY_REQUEST', 'Solicitação de recuperação recebida.');
      this.saveDb(db);
      return {
        ok: true,
        message: 'Se o e-mail estiver ativo na base da PontoWeb, as instruções de redefinição foram processadas.',
      };
    }

    const recoveryCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.recoveryToken = recoveryCode;
    user.recoveryExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    this.appendAudit(db, cleanEmail, 'PASSWORD_RECOVERY_ISSUED', 'Token temporário de redefinição emitido.');
    this.saveDb(db);

    return {
      ok: true,
      message: 'Código de recuperação gerado com segurança (válido por 15 minutos).',
      demoCode: recoveryCode,
    };
  }

  resetPasswordWithCode(email, code, newPassword) {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!newPassword || newPassword.length < 8) {
      return { ok: false, message: 'A nova senha deve ter no mínimo 8 caracteres.' };
    }

    const db = this.getDb();
    const user = db.users.find((u) => u.email.toLowerCase() === cleanEmail && u.status === 'active');

    if (!user || !user.recoveryToken || user.recoveryToken !== code.trim()) {
      return { ok: false, message: 'Código de verificação inválido ou expirado.' };
    }

    if (new Date(user.recoveryExpiresAt).getTime() < Date.now()) {
      return { ok: false, message: 'O código de recuperação expirou. Solicite um novo.' };
    }

    user.passwordHash = hashPasswordSync(newPassword);
    delete user.recoveryToken;
    delete user.recoveryExpiresAt;
    user.updatedAt = new Date().toISOString();

    this.appendAudit(db, cleanEmail, 'PASSWORD_RESET_COMPLETED', 'Senha redefinida com sucesso via token seguro.');
    this.saveDb(db);

    return { ok: true, message: 'Senha atualizada com sucesso! Você já pode entrar.' };
  }

  async createSellerAccount({ name, email, password, createdBy = 'PUBLIC_REGISTER' }) {
    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();

    if (cleanName.length < 2) {
      return { ok: false, message: 'Informe o nome completo (mínimo 2 caracteres).' };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return { ok: false, message: 'Informe um e-mail válido.' };
    }
    if (!password || password.length < 8) {
      return { ok: false, message: 'A senha deve possuir pelo menos 8 caracteres.' };
    }

    const { data: existing } = await supabase.from('users').select('id').eq('email', cleanEmail).maybeSingle();
    if (existing) {
      return { ok: false, message: 'Já existe uma conta vinculada a este e-mail.' };
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
    });

    if (authError || !authData?.user) {
      return { ok: false, message: authError?.message || 'Erro ao criar conta.' };
    }

    const { error: profileError } = await supabase.from('users').insert({
      id: authData.user.id,
      name: cleanName,
      email: cleanEmail,
      password_hash: 'supabase_auth',
      role: 'seller',
      status: 'active',
      created_by: createdBy,
    });

    if (profileError) {
      return { ok: false, message: profileError.message };
    }

    try {
      await supabase.from('audit_logs').insert({
        actor_email: createdBy,
        action: 'USER_CREATED',
        details: `Nova conta criada para ${cleanEmail} com perfil obrigatório VENDEDOR.`,
      });
    } catch {}

    return { ok: true, user: { id: authData.user.id, name: cleanName, email: cleanEmail, role: 'seller', status: 'active' } };
  }

  setUserStatus(actorUser, targetUserId, newStatus) {
    if (!actorUser || actorUser.role !== 'admin') {
      return { ok: false, message: 'Acesso negado: apenas administradores podem alterar contas.' };
    }
    if (actorUser.id === targetUserId) {
      return { ok: false, message: 'A conta administrativa não pode desativar a si própria.' };
    }

    const db = this.getDb();
    const target = db.users.find((u) => u.id === targetUserId);
    if (!target) {
      return { ok: false, message: 'Usuário não encontrado.' };
    }
    if (target.status === 'deleted') {
      return { ok: false, message: 'Contas excluídas não podem ser reativadas.' };
    }

    target.status = newStatus;
    target.updatedAt = new Date().toISOString();

    this.appendAudit(
      db,
      actorUser.email,
      newStatus === 'inactive' ? 'ACCOUNT_DISABLED' : 'ACCOUNT_REACTIVATED',
      `Conta ${target.email} alterada para status: ${newStatus.toUpperCase()}.`
    );
    this.saveDb(db);
    this.broadcast('USER_STATUS_CHANGED', { targetUserId, newStatus });

    return { ok: true };
  }

  deleteUserAccount(actorUser, targetUserId, transferToSellerId = '') {
    if (!actorUser || actorUser.role !== 'admin') {
      return { ok: false, message: 'Acesso negado: apenas administradores podem excluir contas.' };
    }
    if (actorUser.id === targetUserId) {
      return { ok: false, message: 'A conta administrativa não pode excluir a si própria.' };
    }

    const db = this.getDb();
    const target = db.users.find((u) => u.id === targetUserId);
    if (!target) {
      return { ok: false, message: 'Usuário não encontrado.' };
    }
    if (target.status === 'deleted') {
      return { ok: false, message: 'Esta conta já se encontra excluída.' };
    }

    const now = new Date().toISOString();
    const activeClients = db.clients.filter((c) => c.assignedSellerId === targetUserId && !c.hasSale);
    let transferredCount = 0;

    if (transferToSellerId) {
      const destSeller = db.users.find(
        (u) => u.id === transferToSellerId && u.role === 'seller' && u.status === 'active'
      );
      if (!destSeller) {
        return { ok: false, message: 'Vendedor de destino para transferência inválido ou inativo.' };
      }

      activeClients.forEach((client) => {
        client.assignedSellerId = destSeller.id;
        client.assignedSellerName = destSeller.name;
        client.updatedAt = now;
        client.history.unshift({
          id: generateUUID(),
          type: 'REASSIGNED',
          title: 'Cliente transferido por exclusão de conta',
          description: `Transferido de ${target.name} (conta excluída) para ${destSeller.name} por ${actorUser.name}.`,
          actorName: actorUser.name,
          actorRole: 'admin',
          timestamp: now,
        });

        const pendingTask = db.tasks.find((t) => t.clientId === client.id && t.status === 'pending');
        if (pendingTask) pendingTask.assignedSellerId = destSeller.id;

        const meeting = db.meetings.find((m) => m.id === client.activeMeetingId);
        if (meeting && meeting.status === 'scheduled') {
          meeting.assignedSellerId = destSeller.id;
          meeting.assignedSellerName = destSeller.name;
        }
        transferredCount += 1;
      });

      if (transferredCount > 0) {
        this.pushNotification(
          db,
          destSeller.id,
          'Carteira transferida para você',
          `${transferredCount} cliente(s) em andamento foram transferidos para sua carteira.`,
          'assignment',
          null
        );
      }
    }

    target.status = 'deleted';
    target.deletedAt = now;
    target.deletedBy = actorUser.email;
    target.updatedAt = now;

    this.appendAudit(
      db,
      actorUser.email,
      'ACCOUNT_DELETED',
      `Conta ${target.name} (${target.email}) excluída logicamente. ${transferredCount} cliente(s) transferido(s). Histórico comercial preservado.`
    );
    this.saveDb(db);
    this.broadcast('USER_STATUS_CHANGED', { targetUserId, newStatus: 'deleted' });

    return { ok: true, transferredCount };
  }

  /**
   * TRANSAÇÃO ATÔMICA DE CADASTRO E DISTRIBUIÇÃO DE CLIENTE
   */
  createAndDistributeClient(actorUser, payload) {
    if (!actorUser || actorUser.role !== 'admin') {
      return { ok: false, message: 'Permissão negada: somente administradores podem cadastrar clientes.' };
    }

    const name = (payload.name || '').trim();
    const segment = (payload.segment || '').trim();
    const whatsappRaw = (payload.whatsapp || '').trim();
    const whatsappDigits = sanitizeWhatsAppNumber(whatsappRaw);
    const meetingDate = (payload.meetingDate || '').trim();
    const meetingTime = (payload.meetingTime || '').trim();
    const sellerId = (payload.sellerId || '').trim();
    const notes = (payload.notes || '').trim();

    if (name.length < 2) return { ok: false, message: 'Informe o nome completo do cliente.' };
    if (segment.length < 2) return { ok: false, message: 'Informe o segmento da empresa.' };
    if (whatsappDigits.length < 12) {
      return { ok: false, message: 'Informe o WhatsApp completo com código do país e DDD (ex: +55 11 99999-9999).' };
    }
    if (!meetingDate) return { ok: false, message: 'Selecione a data da reunião de vendas.' };
    if (!meetingTime) return { ok: false, message: 'Selecione o horário da reunião de vendas.' };
    if (!sellerId) return { ok: false, message: 'Selecione um vendedor responsável ativo.' };

    const db = this.getDb();
    const seller = db.users.find((u) => u.id === sellerId && u.role === 'seller' && u.status === 'active');
    if (!seller) {
      return { ok: false, message: 'O vendedor selecionado não está ativo ou não existe.' };
    }

    const duplicateMeeting = db.meetings.find(
      (m) =>
        m.assignedSellerId === seller.id &&
        m.scheduledDate === meetingDate &&
        m.scheduledTime === meetingTime &&
        m.status === 'scheduled'
    );
    if (duplicateMeeting) {
      return {
        ok: false,
        message: `Conflito de agenda: ${seller.name} já possui reunião agendada neste mesmo dia e horário.`,
      };
    }

    const now = new Date().toISOString();
    const clientId = generateUUID();
    const taskId = generateUUID();
    const meetingId = generateUUID();

    const newClient = {
      id: clientId,
      name,
      segment,
      whatsapp: `+${whatsappDigits}`,
      notes,
      assignedSellerId: seller.id,
      assignedSellerName: seller.name,
      firstContactStatus: 'pending',
      firstContactAt: null,
      firstContactBy: null,
      activeMeetingId: meetingId,
      meetingStatus: 'scheduled',
      meetingDate,
      meetingTime,
      hasSale: false,
      createdAt: now,
      updatedAt: now,
      createdBy: actorUser.email,
      history: [
        {
          id: generateUUID(),
          type: 'MEETING_SCHEDULED',
          title: 'Reunião de Vendas agendada',
          description: `Agendada para ${formatMeetingSchedule(meetingDate, meetingTime, true)} (fuso America/Sao_Paulo).`,
          actorName: actorUser.name,
          actorRole: 'admin',
          timestamp: now,
        },
        {
          id: generateUUID(),
          type: 'ASSIGNED',
          title: 'Cliente distribuído ao vendedor',
          description: `Atribuído para ${seller.name} (${seller.email}) com tarefa de primeiro contato criada.`,
          actorName: actorUser.name,
          actorRole: 'admin',
          timestamp: now,
        },
        {
          id: generateUUID(),
          type: 'CREATED',
          title: 'Cliente cadastrado no PontoWeb CRM',
          description: `Segmento: ${segment} | WhatsApp: +${whatsappDigits}`,
          actorName: actorUser.name,
          actorRole: 'admin',
          timestamp: now,
        },
      ],
    };

    const newTask = {
      id: taskId,
      type: 'FIRST_CONTACT',
      clientId,
      clientName: name,
      assignedSellerId: seller.id,
      status: 'pending',
      dueDate: meetingDate,
      createdAt: now,
      completedAt: null,
    };

    const newMeeting = {
      id: meetingId,
      type: 'SALES_MEETING',
      clientId,
      clientName: name,
      clientSegment: segment,
      assignedSellerId: seller.id,
      assignedSellerName: seller.name,
      scheduledDate: meetingDate,
      scheduledTime: meetingTime,
      timezone: 'America/Sao_Paulo',
      status: 'scheduled',
      rescheduleCount: 0,
      previousSchedules: [],
      reportId: null,
      createdAt: now,
      updatedAt: now,
    };

    db.clients.unshift(newClient);
    db.tasks.unshift(newTask);
    db.meetings.unshift(newMeeting);

    this.pushNotification(
      db,
      seller.id,
      'Novo cliente atribuído',
      `${name} (${segment}) — Reunião em ${formatMeetingSchedule(meetingDate, meetingTime, true)}.`,
      'assignment',
      clientId
    );

    this.appendAudit(
      db,
      actorUser.email,
      'CLIENT_DISTRIBUTED',
      `Cliente "${name}" cadastrado e distribuído para ${seller.email} com Reunião de Vendas em ${meetingDate} ${meetingTime}.`,
      { clientId, sellerId: seller.id }
    );

    this.saveDb(db);
    return { ok: true, client: newClient, task: newTask, meeting: newMeeting };
  }

  /**
   * CONFIRMAÇÃO DE PRIMEIRO CONTATO (EXCLUSIVA DO VENDEDOR)
   */
  confirmFirstContact(actorUser, clientId) {
    if (!actorUser || actorUser.role !== 'seller') {
      return {
        ok: false,
        message: 'Apenas o vendedor responsável pode confirmar a realização do primeiro contato.',
      };
    }

    const db = this.getDb();
    const client = db.clients.find((c) => c.id === clientId);

    if (!client) {
      return { ok: false, message: 'Cliente não encontrado.' };
    }

    if (client.assignedSellerId !== actorUser.id) {
      return { ok: false, message: 'Você não tem permissão para registrar contato deste cliente.' };
    }

    if (client.firstContactStatus === 'completed') {
      return {
        ok: true,
        alreadyCompleted: true,
        message: 'Este primeiro contato já foi confirmado anteriormente.',
      };
    }

    const now = new Date().toISOString();
    client.firstContactStatus = 'completed';
    client.firstContactAt = now;
    client.firstContactBy = actorUser.name;
    client.updatedAt = now;

    const task = db.tasks.find((t) => t.clientId === clientId && t.type === 'FIRST_CONTACT');
    if (task && task.status !== 'completed') {
      task.status = 'completed';
      task.completedAt = now;
      task.completedBy = actorUser.name;
    }

    client.history.unshift({
      id: generateUUID(),
      type: 'FIRST_CONTACT',
      title: 'Primeiro contato confirmado',
      description: `Declaração operacional registrada por ${actorUser.name} em ${formatSaoPauloDateTime(now)}.`,
      actorName: actorUser.name,
      actorRole: actorUser.role,
      timestamp: now,
    });

    this.appendAudit(
      db,
      actorUser.email,
      'FIRST_CONTACT_CONFIRMED',
      `Primeiro contato confirmado para o cliente "${client.name}" por ${actorUser.name}.`,
      { clientId }
    );

    this.saveDb(db);
    return { ok: true, alreadyCompleted: false, client };
  }

  /**
   * REATRIBUIÇÃO ADMINISTRATIVA ENTRE VENDEDORES ATIVOS
   */
  reassignClient(actorUser, clientId, newSellerId) {
    if (!actorUser || actorUser.role !== 'admin') {
      return { ok: false, message: 'Apenas administradores podem reatribuir clientes.' };
    }

    const db = this.getDb();
    const client = db.clients.find((c) => c.id === clientId);
    if (!client) return { ok: false, message: 'Cliente não encontrado.' };

    if (client.assignedSellerId === newSellerId) {
      return { ok: false, message: 'O cliente já está atribuído a este vendedor.' };
    }

    const newSeller = db.users.find((u) => u.id === newSellerId && u.role === 'seller' && u.status === 'active');
    if (!newSeller) {
      return { ok: false, message: 'Selecione um vendedor ativo válido para transferência.' };
    }

    const previousSellerName = this.resolveUserLabel(db, client.assignedSellerId, client.assignedSellerName);
    const now = new Date().toISOString();

    client.assignedSellerId = newSeller.id;
    client.assignedSellerName = newSeller.name;
    client.updatedAt = now;

    const pendingTask = db.tasks.find((t) => t.clientId === clientId && t.status === 'pending');
    if (pendingTask) {
      pendingTask.assignedSellerId = newSeller.id;
    }

    const meeting = db.meetings.find((m) => m.id === client.activeMeetingId);
    if (meeting) {
      meeting.assignedSellerId = newSeller.id;
      meeting.assignedSellerName = newSeller.name;
      meeting.updatedAt = now;
    }

    client.history.unshift({
      id: generateUUID(),
      type: 'REASSIGNED',
      title: 'Cliente reatribuído',
      description: `Transferido de ${previousSellerName} para ${newSeller.name} por ${actorUser.name} em ${formatSaoPauloDateTime(now)}.`,
      actorName: actorUser.name,
      actorRole: 'admin',
      timestamp: now,
    });

    this.pushNotification(
      db,
      newSeller.id,
      'Cliente transferido para você',
      `${client.name} (${client.segment}) foi transferido para sua carteira por ${actorUser.name}.`,
      'assignment',
      clientId
    );

    this.appendAudit(
      db,
      actorUser.email,
      'CLIENT_REASSIGNED',
      `Cliente "${client.name}" transferido de ${previousSellerName} para ${newSeller.name}.`,
      { clientId, newSellerId: newSeller.id }
    );

    this.saveDb(db);
    return { ok: true, client };
  }

  /**
   * REUNIÃO ÚNICA — REGISTRO DOS DADOS (QUALIFICAÇÃO + SOLUÇÃO/PROPOSTA + AUTOAVALIAÇÃO)
   */
  submitSalesMeetingReport(actorUser, clientId, payload) {
    if (!actorUser) return { ok: false, message: 'Sessão inválida.' };

    const db = this.getDb();
    const client = db.clients.find((c) => c.id === clientId);
    if (!client) return { ok: false, message: 'Cliente não encontrado.' };

    if (actorUser.role === 'seller' && client.assignedSellerId !== actorUser.id) {
      return { ok: false, message: 'Permissão negada para registrar reunião de outro vendedor.' };
    }

    const meeting = db.meetings.find((m) => m.id === client.activeMeetingId);
    if (!meeting) return { ok: false, message: 'Agendamento de reunião não localizado.' };

    if (meeting.status === 'completed' && meeting.reportId) {
      return {
        ok: false,
        message: 'Esta Reunião de Vendas já possui um relatório concluído e registrado.',
      };
    }

    const validSaleStatuses = ['completed', 'pending_payment', 'cancelled', 'refunded'];
    if (!validSaleStatuses.includes(payload.saleStatus)) {
      return { ok: false, message: 'Selecione o Status financeiro no Registro da Venda.' };
    }
    if (!['immediate', '50_50'].includes(payload.paymentStructure)) {
      return { ok: false, message: 'Selecione se o pagamento é Pagamento imediato ou 50/50.' };
    }

    const saleValueNum = parseFloat(String(payload.saleValue || '0').replace(',', '.'));
    if (isNaN(saleValueNum) || saleValueNum <= 0) {
      return { ok: false, message: 'Informe um Valor vendido válido maior que zero.' };
    }

    const sentValueNum = parseFloat(String(payload.sentValue || '0').replace(',', '.'));
    if (isNaN(sentValueNum) || sentValueNum < 0 || sentValueNum > saleValueNum) {
      return { ok: false, message: 'O Valor enviado deve estar entre R$ 0,00 e o Valor vendido.' };
    }

    if (!(payload.paymentMethod || '').trim()) {
      return { ok: false, message: 'Informe o Método de pagamento no Registro da Venda.' };
    }

    if (!['Wix', 'Vercel'].includes(payload.domainProvider)) {
      return { ok: false, message: 'Selecione a alternativa de domínio: Wix ou Vercel.' };
    }

    if (!(payload.nextSiteCallDate || '').trim()) {
      return { ok: false, message: 'Informe a data para a próxima call apresentando o site.' };
    }

    const existingSale = db.sales.find((s) => s.clientId === client.id && s.status !== 'cancelled');
    if (existingSale) {
      return {
        ok: false,
        message: 'Já existe uma venda válida registrada para este cliente. Duplicação bloqueada.',
      };
    }

    const orNotInformed = (val) => {
      const clean = (val || '').trim();
      return clean.length > 0 ? clean : 'Não informado';
    };

    const now = new Date().toISOString();
    const reportId = generateUUID();
    const isSaleWon = payload.saleStatus === 'completed' || payload.saleStatus === 'pending_payment';

    const reportRecord = {
      id: reportId,
      recordType: 'MEETING_REPORT',
      clientId: client.id,
      clientName: client.name,
      clientSegment: client.segment,
      meetingId: meeting.id,
      sellerId: client.assignedSellerId,
      sellerName: this.resolveUserLabel(db, client.assignedSellerId, client.assignedSellerName),
      submittedById: actorUser.id,
      submittedByName: actorUser.name,
      isReadByAdmin: actorUser.role === 'admin',
      readByAdminAt: actorUser.role === 'admin' ? now : null,
      readByAdminName: actorUser.role === 'admin' ? actorUser.name : null,
      createdAt: now,

      // Reunião de vendas: Infos
      sectionA: {
        scheduledDate: meeting.scheduledDate,
        scheduledTime: meeting.scheduledTime,
        status: 'Realizada',
        previousReschedulesCount: meeting.rescheduleCount || 0,
        previousSchedules: meeting.previousSchedules || [],
      },

      // Registro da Venda
      saleInfo: {
        service: 'Site',
        saleStatus: payload.saleStatus,
        paymentStructure: payload.paymentStructure,
        saleValue: saleValueNum,
        sentValue: sentValueNum,
        paymentMethod: payload.paymentMethod.trim(),
      },

      // Registro dos Dados — Negócio & Oferta + Dificuldades / Necessidades
      sectionB: {
        businessAndOffer: orNotInformed(payload.businessAndOffer),
        difficultiesAndNeeds: orNotInformed(payload.difficultiesAndNeeds),
      },

      // Solução & Proposta
      sectionC: {
        howSiteHelpsClient: orNotInformed(payload.howSiteHelpsClient),
        domainProvider: payload.domainProvider,
        nextSiteCallDate: payload.nextSiteCallDate.trim(),
      },

      // Autoavaliação e Depoimento Geral
      sectionF: {
        selfEvaluation: orNotInformed(payload.selfEvaluation),
        generalTestimonial: orNotInformed(payload.generalTestimonial),
      },
    };

    meeting.status = 'completed';
    meeting.completedAt = now;
    meeting.reportId = reportId;
    meeting.updatedAt = now;

    client.meetingStatus = 'completed';
    client.updatedAt = now;

    let createdSale = null;
    if (isSaleWon) {
      createdSale = {
        id: generateUUID(),
        clientId: client.id,
        clientName: client.name,
        clientSegment: client.segment,
        meetingId: meeting.id,
        reportId,
        sellerId: client.assignedSellerId,
        sellerName: this.resolveUserLabel(db, client.assignedSellerId, client.assignedSellerName),
        saleDate: getTodaySaoPauloISO(),
        value: saleValueNum,
        receivedValue: sentValueNum,
        productOrService: 'Site',
        paymentStructure: payload.paymentStructure,
        paymentMethod: payload.paymentMethod.trim(),
        status: payload.saleStatus,
        notes: `Domínio: ${payload.domainProvider} | Próx. call: ${formatMeetingSchedule(payload.nextSiteCallDate, '')}`,
        createdAt: now,
        updatedAt: now,
      };
      db.sales.unshift(createdSale);
      client.hasSale = true;
    }

    db.meetingReports.unshift(reportRecord);

    client.history.unshift({
      id: generateUUID(),
      type: 'REPORT_SUBMITTED',
      title: 'Registro dos Dados & Venda enviados',
      description: `Reunião realizada por ${actorUser.name} | Valor vendido: ${formatCurrencyBRL(saleValueNum)} | Enviado: ${formatCurrencyBRL(sentValueNum)} | Domínio: ${payload.domainProvider}.`,
      actorName: actorUser.name,
      actorRole: actorUser.role,
      timestamp: now,
    });

    if (createdSale) {
      client.history.unshift({
        id: generateUUID(),
        type: 'SALE_RECORDED',
        title: 'Venda registrada no PontoWeb CRM',
        description: `Site — Vendido: ${formatCurrencyBRL(createdSale.value)} | Recebido: ${formatCurrencyBRL(createdSale.receivedValue)} (${payload.paymentStructure === '50_50' ? '50/50' : 'Imediato'}) via ${createdSale.paymentMethod}.`,
        actorName: actorUser.name,
        actorRole: actorUser.role,
        timestamp: now,
      });
    }

    const admins = db.users.filter((u) => u.role === 'admin' && u.status === 'active');
    admins.forEach((admin) => {
      if (admin.id !== actorUser.id) {
        this.pushNotification(
          db,
          admin.id,
          'Novo Registro dos Dados recebido',
          `${actorUser.name} enviou o registro de ${client.name} — Vendido: ${formatCurrencyBRL(saleValueNum)} (Domínio: ${payload.domainProvider}).`,
          'report',
          reportId
        );
      }
    });

    this.appendAudit(
      db,
      actorUser.email,
      'MEETING_REPORT_SUBMITTED',
      `Registro dos Dados enviado para "${client.name}" (Reunião ${meeting.id}).`,
      { clientId: client.id, reportId, saleId: createdSale?.id || null }
    );

    this.saveDb(db);
    return { ok: true, report: reportRecord, sale: createdSale };
  }

  /**
   * VÁCUO (NÃO COMPARECIMENTO / NÃO RESPOSTA / CANCELAMENTO)
   */
  registerNoShowOccurrence(actorUser, clientId, payload) {
    if (!actorUser) return { ok: false, message: 'Sessão inválida.' };

    const validReasons = [
      'Cliente não respondeu',
      'Cliente não compareceu',
      'Cliente cancelou sem reagendar',
      'Outro motivo',
    ];
    if (!validReasons.includes(payload.reason)) {
      return { ok: false, message: 'Selecione um motivo válido para a ocorrência.' };
    }
    const description = (payload.description || '').trim();
    if (description.length < 5) {
      return { ok: false, message: 'Descreva o ocorrido (mínimo 5 caracteres).' };
    }

    const db = this.getDb();
    const client = db.clients.find((c) => c.id === clientId);
    if (!client) return { ok: false, message: 'Cliente não encontrado.' };

    if (actorUser.role === 'seller' && client.assignedSellerId !== actorUser.id) {
      return { ok: false, message: 'Permissão negada para alterar cliente de outro vendedor.' };
    }

    const meeting = db.meetings.find((m) => m.id === client.activeMeetingId);
    if (!meeting) return { ok: false, message: 'Reunião vigente não encontrada.' };

    if (meeting.status === 'completed') {
      return { ok: false, message: 'Esta reunião já foi concluída com relatório.' };
    }

    const now = new Date().toISOString();
    const occurrenceId = generateUUID();

    const occurrence = {
      id: occurrenceId,
      recordType: 'NO_SHOW',
      clientId: client.id,
      clientName: client.name,
      clientSegment: client.segment,
      meetingId: meeting.id,
      sellerId: client.assignedSellerId,
      sellerName: this.resolveUserLabel(db, client.assignedSellerId, client.assignedSellerName),
      registeredById: actorUser.id,
      registeredByName: actorUser.name,
      scheduledDate: meeting.scheduledDate,
      scheduledTime: meeting.scheduledTime,
      reason: payload.reason,
      description,
      contactAttempts: Number(payload.contactAttempts) || 1,
      evidenceNote: (payload.evidenceNote || '').trim() || 'Não informado',
      isReadByAdmin: actorUser.role === 'admin',
      readByAdminAt: actorUser.role === 'admin' ? now : null,
      readByAdminName: actorUser.role === 'admin' ? actorUser.name : null,
      createdAt: now,
    };

    meeting.status = 'no_show';
    meeting.updatedAt = now;
    client.meetingStatus = 'no_show';
    client.updatedAt = now;

    db.noShowOccurrences.unshift(occurrence);

    client.history.unshift({
      id: generateUUID(),
      type: 'NO_SHOW',
      title: `Ocorrência de Vácuo (${payload.reason})`,
      description: `${description} | Tentativas: ${occurrence.contactAttempts} | Evidência: ${occurrence.evidenceNote}.`,
      actorName: actorUser.name,
      actorRole: actorUser.role,
      timestamp: now,
    });

    const admins = db.users.filter((u) => u.role === 'admin' && u.status === 'active');
    admins.forEach((admin) => {
      if (admin.id !== actorUser.id) {
        this.pushNotification(
          db,
          admin.id,
          'Ocorrência de Vácuo registrada',
          `${actorUser.name} registrou vácuo para ${client.name}: ${payload.reason}.`,
          'warning',
          occurrenceId
        );
      }
    });

    this.appendAudit(
      db,
      actorUser.email,
      'MEETING_NO_SHOW',
      `Vácuo registrado para "${client.name}" — Motivo: ${payload.reason}.`,
      { clientId: client.id, occurrenceId }
    );

    this.saveDb(db);
    return { ok: true, occurrence };
  }

  /**
   * REAGENDAMENTO (PRESERVA AGENDAMENTO ORIGINAL)
   */
  rescheduleSalesMeeting(actorUser, clientId, payload) {
    if (!actorUser) return { ok: false, message: 'Sessão inválida.' };

    const newDate = (payload.newDate || '').trim();
    const newTime = (payload.newTime || '').trim();
    const reason = (payload.reason || '').trim() || 'Não informado';
    const notes = (payload.notes || '').trim() || 'Não informado';

    if (!newDate || !newTime) {
      return { ok: false, message: 'Informe a nova data e o novo horário para reagendar.' };
    }

    const db = this.getDb();
    const client = db.clients.find((c) => c.id === clientId);
    if (!client) return { ok: false, message: 'Cliente não encontrado.' };

    if (actorUser.role === 'seller' && client.assignedSellerId !== actorUser.id) {
      return { ok: false, message: 'Permissão negada para reagendar cliente de outro vendedor.' };
    }

    const meeting = db.meetings.find((m) => m.id === client.activeMeetingId);
    if (!meeting) return { ok: false, message: 'Agendamento vigente não localizado.' };

    if (meeting.status === 'completed') {
      return { ok: false, message: 'Não é possível reagendar uma reunião já realizada com relatório.' };
    }

    const conflict = db.meetings.find(
      (m) =>
        m.id !== meeting.id &&
        m.assignedSellerId === client.assignedSellerId &&
        m.scheduledDate === newDate &&
        m.scheduledTime === newTime &&
        m.status === 'scheduled'
    );
    if (conflict) {
      return { ok: false, message: 'Conflito de horário: já existe outra reunião agendada nesse momento.' };
    }

    const now = new Date().toISOString();
    const rescheduleId = generateUUID();
    const prevDate = meeting.scheduledDate;
    const prevTime = meeting.scheduledTime;

    const rescheduleRecord = {
      id: rescheduleId,
      recordType: 'RESCHEDULE',
      clientId: client.id,
      clientName: client.name,
      clientSegment: client.segment,
      meetingId: meeting.id,
      sellerId: client.assignedSellerId,
      sellerName: this.resolveUserLabel(db, client.assignedSellerId, client.assignedSellerName),
      changedById: actorUser.id,
      changedByName: actorUser.name,
      previousDate: prevDate,
      previousTime: prevTime,
      newDate,
      newTime,
      reason,
      notes,
      isReadByAdmin: actorUser.role === 'admin',
      readByAdminAt: actorUser.role === 'admin' ? now : null,
      readByAdminName: actorUser.role === 'admin' ? actorUser.name : null,
      createdAt: now,
    };

    meeting.previousSchedules = [
      ...(meeting.previousSchedules || []),
      {
        date: prevDate,
        time: prevTime,
        changedAt: now,
        changedBy: actorUser.name,
        reason,
      },
    ];
    meeting.scheduledDate = newDate;
    meeting.scheduledTime = newTime;
    meeting.status = 'scheduled';
    meeting.rescheduleCount = (meeting.rescheduleCount || 0) + 1;
    meeting.updatedAt = now;

    client.meetingDate = newDate;
    client.meetingTime = newTime;
    client.meetingStatus = 'scheduled';
    client.updatedAt = now;

    db.rescheduleRecords.unshift(rescheduleRecord);

    client.history.unshift({
      id: generateUUID(),
      type: 'RESCHEDULED',
      title: 'Reunião de Vendas reagendada',
      description: `Alterada de ${formatMeetingSchedule(prevDate, prevTime, true)} para ${formatMeetingSchedule(newDate, newTime, true)}. Motivo: ${reason}.`,
      actorName: actorUser.name,
      actorRole: actorUser.role,
      timestamp: now,
    });

    const admins = db.users.filter((u) => u.role === 'admin' && u.status === 'active');
    admins.forEach((admin) => {
      if (admin.id !== actorUser.id) {
        this.pushNotification(
          db,
          admin.id,
          'Reunião reagendada',
          `${actorUser.name} reagendou ${client.name} para ${formatMeetingSchedule(newDate, newTime, true)}.`,
          'info',
          rescheduleId
        );
      }
    });

    this.appendAudit(
      db,
      actorUser.email,
      'MEETING_RESCHEDULED',
      `Reunião de "${client.name}" reagendada de ${prevDate} ${prevTime} para ${newDate} ${newTime}.`,
      { clientId: client.id, rescheduleId }
    );

    this.saveDb(db);
    return { ok: true, rescheduleRecord, meeting };
  }

  /**
   * ATUALIZAÇÃO FINANCEIRA DE VENDA (VALOR VENDIDO vs VALOR RECEBIDO)
   */
  updateSaleFinancials(actorUser, saleId, payload) {
    if (!actorUser) return { ok: false, message: 'Sessão inválida.' };

    const db = this.getDb();
    const sale = db.sales.find((s) => s.id === saleId);
    if (!sale) return { ok: false, message: 'Venda não encontrada.' };

    if (actorUser.role === 'seller' && sale.sellerId !== actorUser.id) {
      return { ok: false, message: 'Permissão negada para alterar venda de outro vendedor.' };
    }

    const validStatuses = ['completed', 'pending_payment', 'cancelled', 'refunded'];
    if (!validStatuses.includes(payload.status)) {
      return { ok: false, message: 'Status financeiro inválido.' };
    }

    const receivedNum = parseFloat(String(payload.receivedValue ?? '0').replace(',', '.'));
    if (isNaN(receivedNum) || receivedNum < 0 || receivedNum > sale.value) {
      return {
        ok: false,
        message: `O valor recebido deve estar entre R$ 0,00 e ${formatCurrencyBRL(sale.value)}.`,
      };
    }

    const now = new Date().toISOString();
    const prevStatus = sale.status;
    const prevReceived = sale.receivedValue || 0;

    sale.status = payload.status;
    sale.receivedValue = payload.status === 'refunded' ? 0 : receivedNum;
    if (payload.paymentMethod !== undefined && payload.paymentMethod.trim()) {
      sale.paymentMethod = payload.paymentMethod.trim();
    }
    if (payload.notes !== undefined) {
      sale.notes = payload.notes.trim();
    }
    sale.updatedAt = now;

    const client = db.clients.find((c) => c.id === sale.clientId);
    if (client) {
      const hasValidSale = db.sales.some(
        (s) => s.clientId === client.id && s.status !== 'cancelled' && s.status !== 'refunded'
      );
      client.hasSale = hasValidSale;
      client.updatedAt = now;
      client.history.unshift({
        id: generateUUID(),
        type: 'SALE_RECORDED',
        title: 'Atualização financeira da venda',
        description: `Status: ${sale.status.toUpperCase()} | Recebido: ${formatCurrencyBRL(sale.receivedValue)} de ${formatCurrencyBRL(sale.value)} (por ${actorUser.name}).`,
        actorName: actorUser.name,
        actorRole: actorUser.role,
        timestamp: now,
      });
    }

    this.appendAudit(
      db,
      actorUser.email,
      'SALE_FINANCIAL_UPDATED',
      `Venda ${sale.id} (${sale.clientName}): status ${prevStatus} -> ${sale.status}, recebido ${formatCurrencyBRL(prevReceived)} -> ${formatCurrencyBRL(sale.receivedValue)}.`,
      { saleId: sale.id, clientId: sale.clientId }
    );

    this.saveDb(db);
    return { ok: true, sale };
  }

  markReportRecordAsRead(actorUser, recordType, recordId) {
    if (!actorUser || actorUser.role !== 'admin') return { ok: false };
    const db = this.getDb();
    let target = null;
    if (recordType === 'MEETING_REPORT') {
      target = db.meetingReports.find((r) => r.id === recordId);
    } else if (recordType === 'NO_SHOW') {
      target = db.noShowOccurrences.find((r) => r.id === recordId);
    } else if (recordType === 'RESCHEDULE') {
      target = db.rescheduleRecords.find((r) => r.id === recordId);
    }

    if (target && !target.isReadByAdmin) {
      const now = new Date().toISOString();
      target.isReadByAdmin = true;
      target.readByAdminAt = now;
      target.readByAdminName = actorUser.name;
      this.appendAudit(
        db,
        actorUser.email,
        'REPORT_READ_BY_ADMIN',
        `Registro (${recordType}) de "${target.clientName}" marcado como LIDO pelo administrador.`
      );
      this.saveDb(db);
    }
    return { ok: true };
  }

  markNotificationAsRead(userId, notificationId = null) {
    const db = this.getDb();
    let changed = false;
    db.notifications.forEach((n) => {
      if (n.userId === userId && !n.read && (!notificationId || n.id === notificationId)) {
        n.read = true;
        changed = true;
      }
    });
    if (changed) {
      this.saveDb(db);
    }
  }
}

const dataEngine = new PontoWebDataEngine();

/**
 * ============================================================================
 * COMPONENTES REUTILIZÁVEIS DO DESIGN SYSTEM
 * ============================================================================
 */
function PontoWebLogo({ size = 34, showSubtitle = false, tokens }) {
  return (
    <div className="flex items-center gap-3 select-none">
      <img
        src="/pontoweb-logo.jpg"
        alt="PontoWeb"
        style={{
          width: size,
          height: size,
          borderRadius: 11,
          objectFit: 'cover',
          boxShadow: tokens.glow,
          border: '1px solid rgba(237, 224, 255, 0.25)',
        }}
        className="shrink-0"
      />
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span
            style={{ color: tokens.textPrimary }}
            className="font-semibold tracking-tight text-base leading-none"
          >
            PontoWeb
          </span>
          <span
            style={{
              backgroundColor: 'rgba(128, 23, 255, 0.16)',
              color: tokens.primary,
              border: `1px solid rgba(128, 23, 255, 0.35)`,
            }}
            className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md"
          >
            CRM
          </span>
        </div>
        {showSubtitle && (
          <span style={{ color: tokens.textSecondary }} className="text-[11px] mt-1">
            Commercial Operating System
          </span>
        )}
      </div>
    </div>
  );
}

function PwButton({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon: Icon,
  tokens,
  className = '',
  title,
}) {
  const handleClick = (e) => {
    if (disabled || loading) return;
    soundEngine.playSfx('click');
    if (onClick) onClick(e);
  };

  const sizeStyles = {
    xs: 'px-2.5 py-1.5 text-xs',
    sm: 'px-3 py-2 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-5 py-3 text-sm',
  }[size];

  const getVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return {
          background: `linear-gradient(135deg, ${tokens.primary} 0%, ${tokens.primaryDark} 100%)`,
          color: '#FFFFFF',
          border: '1px solid rgba(237, 224, 255, 0.2)',
          boxShadow: disabled ? 'none' : tokens.glow,
        };
      case 'whatsapp':
        return {
          backgroundColor: '#16845B',
          color: '#FFFFFF',
          border: '1px solid rgba(255, 255, 255, 0.18)',
        };
      case 'secondary':
        return {
          backgroundColor: tokens.surfaceElevated,
          color: tokens.textPrimary,
          border: `1px solid ${tokens.border}`,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: tokens.textSecondary,
          border: '1px solid transparent',
        };
      case 'danger':
        return {
          backgroundColor: 'rgba(200, 62, 77, 0.14)',
          color: tokens.error,
          border: `1px solid rgba(200, 62, 77, 0.35)`,
        };
      default:
        return {};
    }
  };

  return (
    <button
      type={type}
      title={title}
      disabled={disabled || loading}
      onClick={handleClick}
      style={{
        ...getVariantStyle(),
        borderRadius: 11,
      }}
      className={`inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${sizeStyles} ${className}`}
    >
      {loading ? (
        <RefreshCw className="w-4 h-4 animate-spin" />
      ) : (
        Icon && <Icon className="w-4 h-4 shrink-0" />
      )}
      <span>{children}</span>
    </button>
  );
}

function PwInput({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error,
  hint,
  icon: Icon,
  rightElement,
  tokens,
  disabled = false,
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={id}
          style={{ color: tokens.textPrimary }}
          className="text-xs font-medium tracking-wide flex items-center justify-between"
        >
          <span>
            {label} {required && <span style={{ color: tokens.primary }}>*</span>}
          </span>
        </label>
      )}
      <div
        style={{
          backgroundColor: tokens.bg,
          borderColor: error ? tokens.error : focused ? tokens.primary : tokens.border,
          boxShadow: focused ? `0 0 0 3px rgba(128, 23, 255, 0.16)` : 'none',
          borderRadius: 11,
        }}
        className="flex items-center border px-3.5 py-2.5 transition-all duration-200"
      >
        {Icon && (
          <Icon
            style={{ color: focused ? tokens.primary : tokens.textSecondary }}
            className="w-4 h-4 mr-2.5 shrink-0 transition-colors"
          />
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ color: tokens.textPrimary }}
          className="w-full bg-transparent text-sm outline-none placeholder:opacity-45 disabled:opacity-50"
        />
        {rightElement}
      </div>
      {error ? (
        <span style={{ color: tokens.error }} className="text-xs flex items-center gap-1">
          <XCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </span>
      ) : (
        hint && (
          <span style={{ color: tokens.textSecondary }} className="text-[11px]">
            {hint}
          </span>
        )
      )}
    </div>
  );
}

function PwTextarea({
  label,
  id,
  value,
  onChange,
  placeholder,
  required = false,
  rows = 3,
  hint,
  tokens,
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} style={{ color: tokens.textPrimary }} className="text-xs font-medium">
          {label} {required && <span style={{ color: tokens.primary }}>*</span>}
        </label>
      )}
      <textarea
        id={id}
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          backgroundColor: tokens.bg,
          borderColor: focused ? tokens.primary : tokens.border,
          boxShadow: focused ? `0 0 0 3px rgba(128, 23, 255, 0.16)` : 'none',
          color: tokens.textPrimary,
          borderRadius: 11,
        }}
        className="w-full border px-3.5 py-2.5 text-sm outline-none transition-all duration-200 placeholder:opacity-45 resize-y"
      />
      {hint && (
        <span style={{ color: tokens.textSecondary }} className="text-[11px]">
          {hint}
        </span>
      )}
    </div>
  );
}

function PwSelect({ label, id, value, onChange, options, required = false, tokens, disabled = false }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} style={{ color: tokens.textPrimary }} className="text-xs font-medium">
          {label} {required && <span style={{ color: tokens.primary }}>*</span>}
        </label>
      )}
      <select
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        style={{
          backgroundColor: tokens.bg,
          borderColor: tokens.border,
          color: tokens.textPrimary,
          borderRadius: 11,
        }}
        className="w-full border px-3.5 py-2.5 text-sm outline-none focus:border-[#8017FF] transition-colors disabled:opacity-50"
      >
        {options.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            style={{ backgroundColor: tokens.surface, color: tokens.textPrimary }}
          >
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function PwCard({ children, tokens, glow = false, className = '', style = {}, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: tokens.surface,
        borderColor: glow ? 'rgba(128, 23, 255, 0.45)' : tokens.border,
        boxShadow: glow ? tokens.glow : 'none',
        borderRadius: 13,
        ...style,
      }}
      className={`border transition-all duration-200 ${onClick ? 'cursor-pointer hover:border-[#8017FF]' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

function PwBadge({ children, variant = 'neutral', tokens }) {
  const styles = {
    primary: {
      backgroundColor: 'rgba(128, 23, 255, 0.15)',
      color: tokens.primary,
      border: '1px solid rgba(128, 23, 255, 0.32)',
    },
    success: {
      backgroundColor: 'rgba(22, 132, 91, 0.16)',
      color: tokens.success,
      border: '1px solid rgba(22, 132, 91, 0.34)',
    },
    warning: {
      backgroundColor: 'rgba(183, 121, 31, 0.16)',
      color: tokens.warning,
      border: '1px solid rgba(183, 121, 31, 0.34)',
    },
    error: {
      backgroundColor: 'rgba(200, 62, 77, 0.16)',
      color: tokens.error,
      border: '1px solid rgba(200, 62, 77, 0.34)',
    },
    neutral: {
      backgroundColor: tokens.surfaceElevated,
      color: tokens.textSecondary,
      border: `1px solid ${tokens.border}`,
    },
  }[variant];

  return (
    <span
      style={styles}
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap"
    >
      {children}
    </span>
  );
}

function PwModal({ isOpen, onClose, title, subtitle, children, tokens, maxWidth = 'max-w-lg' }) {
  useEffect(() => {
    if (isOpen) {
      soundEngine.playSfx('modal');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div
        style={{
          backgroundColor: tokens.surface,
          borderColor: tokens.border,
          boxShadow: tokens.glowStrong,
          borderRadius: 14,
        }}
        className={`w-full ${maxWidth} border p-6 relative max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 style={{ color: tokens.textPrimary }} className="text-base font-semibold">
              {title}
            </h3>
            {subtitle && (
              <p style={{ color: tokens.textSecondary }} className="text-xs mt-1 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              soundEngine.playSfx('click');
              onClose();
            }}
            style={{
              backgroundColor: tokens.surfaceElevated,
              borderColor: tokens.border,
              color: tokens.textSecondary,
              borderRadius: 10,
            }}
            className="p-1.5 border hover:opacity-80 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function PwEmptyState({ icon: Icon, title, description, action, tokens }) {
  return (
    <div
      style={{
        backgroundColor: tokens.surface,
        borderColor: tokens.border,
        borderRadius: 13,
      }}
      className="border border-dashed p-8 text-center flex flex-col items-center justify-center"
    >
      <div
        style={{
          backgroundColor: 'rgba(128, 23, 255, 0.12)',
          color: tokens.primary,
          borderRadius: 12,
        }}
        className="w-11 h-11 flex items-center justify-center mb-3"
      >
        <Icon className="w-5 h-5" />
      </div>
      <h4 style={{ color: tokens.textPrimary }} className="text-sm font-semibold">
        {title}
      </h4>
      <p style={{ color: tokens.textSecondary }} className="text-xs mt-1 max-w-md leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function PwToast({ toast, onDismiss, tokens }) {
  if (!toast) return null;
  const palette = {
    success: { border: tokens.success, icon: CheckCircle2, color: tokens.success },
    error: { border: tokens.error, icon: XCircle, color: tokens.error },
    warning: { border: tokens.warning, icon: AlertTriangle, color: tokens.warning },
    info: { border: tokens.primary, icon: Info, color: tokens.primary },
  }[toast.type || 'info'];

  const Icon = palette.icon;

  return (
    <div
      style={{
        backgroundColor: tokens.surfaceElevated,
        borderColor: palette.border,
        boxShadow: tokens.glowStrong,
        borderRadius: 12,
      }}
      className="fixed bottom-5 right-5 z-50 max-w-sm w-full border p-3.5 flex items-start gap-3"
    >
      <Icon style={{ color: palette.color }} className="w-5 h-5 shrink-0 mt-0.5" />
      <div className="flex-1 text-xs">
        <p style={{ color: tokens.textPrimary }} className="font-semibold">
          {toast.title}
        </p>
        <p style={{ color: tokens.textSecondary }} className="mt-0.5 leading-relaxed">
          {toast.message}
        </p>
      </div>
      <button
        onClick={onDismiss}
        style={{ color: tokens.textSecondary }}
        className="text-xs hover:opacity-80"
      >
        Fechar
      </button>
    </div>
  );
}

/**
 * ============================================================================
 * PAINEL DE CONTAGEM DE VENDAS & METAS (SEM GRÁFICO E SEM EMOJI)
 * ============================================================================
 */
function SalesCountAndCommissionCard({ salesCount, totalSoldValue, tokens }) {
  const commissionPct = getCommissionPercentage(salesCount);
  const estimatedCommission = totalSoldValue * (commissionPct / 100);

  const MIN_GOAL = 4;
  const MAX_GOAL = 8; // "+7 vendas" => a partir de 8 vendas

  const reachedMin = salesCount >= MIN_GOAL;
  const reachedMax = salesCount >= MAX_GOAL;

  const missingToMin = Math.max(0, MIN_GOAL - salesCount);
  const missingToMax = Math.max(0, MAX_GOAL - salesCount);

  return (
    <PwCard tokens={tokens} glow className="p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 style={{ color: tokens.textPrimary }} className="text-sm font-semibold">
            Contagem de Vendas
          </h3>
          <p style={{ color: tokens.textSecondary }} className="text-xs mt-1">
            Acompanhamento de fechamentos válidos e faixa de comissão vigente.
          </p>
        </div>

        {/* Canto superior direito: porcentagem de comissão */}
        <div
          style={{
            backgroundColor: 'rgba(128, 23, 255, 0.14)',
            borderColor: 'rgba(128, 23, 255, 0.42)',
            boxShadow: tokens.glow,
            borderRadius: 12,
          }}
          className="border px-3.5 py-2 text-right shrink-0"
        >
          <span
            style={{ color: tokens.textSecondary }}
            className="text-[10px] uppercase tracking-wider font-semibold block"
          >
            Sua Comissão Atual
          </span>
          <div className="flex items-baseline justify-end gap-1.5 mt-0.5">
            <span style={{ color: tokens.primary }} className="text-2xl font-bold leading-none">
              {commissionPct}%
            </span>
            <span style={{ color: tokens.textSecondary }} className="text-[11px]">
              ({salesCount} {salesCount === 1 ? 'venda' : 'vendas'})
            </span>
          </div>
          <span style={{ color: tokens.success }} className="text-[11px] font-medium block mt-1">
            Ganho estimado: {formatCurrencyBRL(estimatedCommission)}
          </span>
        </div>
      </div>

      {/* Resumo de Contagem e Progresso de Metas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div
          style={{ backgroundColor: tokens.bg, borderColor: tokens.border, borderRadius: 11 }}
          className="border p-3.5 flex flex-col justify-between"
        >
          <span style={{ color: tokens.textSecondary }} className="text-[11px] uppercase tracking-wider font-semibold">
            Vendas Realizadas
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span style={{ color: tokens.textPrimary }} className="text-2xl font-bold">
              {salesCount}
            </span>
            <span style={{ color: tokens.textSecondary }} className="text-xs">
              {salesCount === 1 ? 'venda concluída' : 'vendas concluídas'}
            </span>
          </div>
          <div className="mt-2 pt-2 border-t text-[11px]" style={{ borderColor: tokens.border }}>
            {!reachedMin ? (
              <span style={{ color: tokens.warning }} className="font-medium">
                Faltam {missingToMin} {missingToMin === 1 ? 'venda' : 'vendas'} para atingir a Meta Mínima
              </span>
            ) : !reachedMax ? (
              <span style={{ color: tokens.primary }} className="font-medium">
                Meta Mínima concluída! Faltam {missingToMax} {missingToMax === 1 ? 'venda' : 'vendas'} para atingir a Meta Máxima
              </span>
            ) : (
              <span style={{ color: tokens.success }} className="font-semibold">
                Meta Máxima atingida! Você superou +7 vendas
              </span>
            )}
          </div>
        </div>

        <div
          style={{ backgroundColor: tokens.bg, borderColor: tokens.border, borderRadius: 11 }}
          className="border p-3.5 flex flex-col justify-between"
        >
          <span style={{ color: tokens.textSecondary }} className="text-[11px] uppercase tracking-wider font-semibold">
            Tabela Escalonada de Ganhos
          </span>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {[
              { label: 'Até 5: 30%', active: salesCount <= 5 },
              { label: '6–7: 35%', active: salesCount >= 6 && salesCount <= 7 },
              { label: '8: 40%', active: salesCount === 8 },
              { label: '9: 45%', active: salesCount === 9 },
              { label: '10+: 50%', active: salesCount >= 10 },
            ].map((tier) => (
              <span
                key={tier.label}
                style={{
                  backgroundColor: tier.active ? 'rgba(128, 23, 255, 0.18)' : tokens.surface,
                  borderColor: tier.active ? tokens.primary : tokens.border,
                  color: tier.active ? tokens.primary : tokens.textSecondary,
                }}
                className="text-[11px] font-medium px-2.5 py-1 rounded-md border"
              >
                {tier.label}
              </span>
            ))}
          </div>
          <span style={{ color: tokens.textSecondary }} className="text-[11px] mt-2">
            Meta Mínima: 4 vendas • Meta Máxima: +7 vendas
          </span>
        </div>
      </div>
    </PwCard>
  );
}

/**
 * ============================================================================
 * VISUALIZAÇÃO E MODAL DE DETALHES DE RELATÓRIOS & OCORRÊNCIAS
 * ============================================================================
 */
function ReportDetailModal({ record, onClose, tokens }) {
  if (!record) return null;

  const isReport = record.recordType === 'MEETING_REPORT';
  const isNoShow = record.recordType === 'NO_SHOW';
  const isReschedule = record.recordType === 'RESCHEDULE';

  const statusLabels = {
    completed: 'Concluída',
    pending_payment: 'Pagamento pendente',
    cancelled: 'Cancelada',
    refunded: 'Reembolsada',
  };

  return (
    <PwModal
      isOpen={Boolean(record)}
      onClose={onClose}
      title={
        isReport
          ? `Registro dos Dados & Venda — ${record.clientName}`
          : isNoShow
          ? `Ocorrência de Vácuo — ${record.clientName}`
          : `Reagendamento — ${record.clientName}`
      }
      subtitle={`Vendedor: ${record.sellerName} • Registrado em ${formatSaoPauloDateTime(record.createdAt)}`}
      tokens={tokens}
      maxWidth="max-w-3xl"
    >
      {isReport && (
        <div className="flex flex-col gap-4 text-xs">
          {/* Reunião de vendas: Infos */}
          <div
            style={{ backgroundColor: tokens.bg, borderColor: tokens.border, borderRadius: 11 }}
            className="border p-4"
          >
            <h4 style={{ color: tokens.primary }} className="font-semibold uppercase tracking-wider mb-2">
              Reunião de vendas: Infos
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <span style={{ color: tokens.textSecondary }}>Data/horário:</span>{' '}
                <strong style={{ color: tokens.textPrimary }}>
                  {formatMeetingSchedule(record.sectionA?.scheduledDate, record.sectionA?.scheduledTime, true)}
                </strong>
              </div>
              <div>
                <span style={{ color: tokens.textSecondary }}>Status:</span>{' '}
                <strong style={{ color: tokens.success }}>{record.sectionA?.status || 'Realizada'}</strong>
              </div>
              <div>
                <span style={{ color: tokens.textSecondary }}>Reagendamentos anteriores:</span>{' '}
                <strong style={{ color: tokens.textPrimary }}>
                  {record.sectionA?.previousReschedulesCount ?? 0}
                </strong>
              </div>
            </div>
          </div>

          {/* Registro da Venda */}
          {record.saleInfo && (
            <div
              style={{
                backgroundColor: 'rgba(22, 132, 91, 0.08)',
                borderColor: 'rgba(22, 132, 91, 0.35)',
                borderRadius: 11,
              }}
              className="border p-4"
            >
              <h4 style={{ color: tokens.success }} className="font-semibold uppercase tracking-wider mb-2">
                Registro da Venda (Serviço: Site)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <span style={{ color: tokens.textSecondary }}>Status financeiro:</span>{' '}
                  <strong style={{ color: tokens.textPrimary }}>
                    {statusLabels[record.saleInfo.saleStatus] || record.saleInfo.saleStatus}
                  </strong>
                </div>
                <div>
                  <span style={{ color: tokens.textSecondary }}>Modalidade:</span>{' '}
                  <strong style={{ color: tokens.textPrimary }}>
                    {record.saleInfo.paymentStructure === '50_50' ? '50/50' : 'Pagamento imediato'}
                  </strong>
                </div>
                <div>
                  <span style={{ color: tokens.textSecondary }}>Valor vendido:</span>{' '}
                  <strong style={{ color: tokens.textPrimary }}>
                    {formatCurrencyBRL(record.saleInfo.saleValue)}
                  </strong>
                </div>
                <div>
                  <span style={{ color: tokens.textSecondary }}>Valor enviado:</span>{' '}
                  <strong style={{ color: tokens.success }}>
                    {formatCurrencyBRL(record.saleInfo.sentValue)}
                  </strong>
                </div>
                <div className="sm:col-span-2">
                  <span style={{ color: tokens.textSecondary }}>Método de pagamento:</span>{' '}
                  <strong style={{ color: tokens.textPrimary }}>{record.saleInfo.paymentMethod}</strong>
                </div>
              </div>
            </div>
          )}

          {/* Registro dos Dados — Negócio & Oferta + Dificuldades / Necessidades */}
          <div
            style={{ backgroundColor: tokens.bg, borderColor: tokens.border, borderRadius: 11 }}
            className="border p-4 flex flex-col gap-2.5"
          >
            <h4 style={{ color: tokens.primary }} className="font-semibold uppercase tracking-wider">
              Registro dos Dados — Negócio, Oferta & Necessidades
            </h4>
            <div>
              <span style={{ color: tokens.textSecondary }}>Negócio & Oferta:</span>
              <p style={{ color: tokens.textPrimary }} className="mt-0.5 leading-relaxed">
                {record.sectionB?.businessAndOffer || 'Não informado'}
              </p>
            </div>
            <div>
              <span style={{ color: tokens.textSecondary }}>Dificuldades / Necessidades:</span>
              <p style={{ color: tokens.textPrimary }} className="mt-0.5 leading-relaxed">
                {record.sectionB?.difficultiesAndNeeds || 'Não informado'}
              </p>
            </div>
          </div>

          {/* Solução & Proposta */}
          <div
            style={{ backgroundColor: tokens.bg, borderColor: tokens.border, borderRadius: 11 }}
            className="border p-4 flex flex-col gap-2.5"
          >
            <h4 style={{ color: tokens.primary }} className="font-semibold uppercase tracking-wider">
              Solução & Proposta
            </h4>
            <div>
              <span style={{ color: tokens.textSecondary }}>Como um site pode ajudar este cliente:</span>
              <p style={{ color: tokens.textPrimary }} className="mt-0.5 leading-relaxed">
                {record.sectionC?.howSiteHelpsClient || 'Não informado'}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div>
                <span style={{ color: tokens.textSecondary }}>Hospedagem / Domínio:</span>{' '}
                <strong style={{ color: tokens.primary }}>{record.sectionC?.domainProvider || 'Não informado'}</strong>
              </div>
              <div>
                <span style={{ color: tokens.textSecondary }}>Próxima call apresentando o site:</span>{' '}
                <strong style={{ color: tokens.textPrimary }}>
                  {record.sectionC?.nextSiteCallDate
                    ? formatMeetingSchedule(record.sectionC.nextSiteCallDate, '', true)
                    : 'Não informado'}
                </strong>
              </div>
            </div>
          </div>

          {/* Autoavaliação e Depoimento Geral */}
          <div
            style={{ backgroundColor: tokens.bg, borderColor: tokens.border, borderRadius: 11 }}
            className="border p-4 flex flex-col gap-2.5"
          >
            <h4 style={{ color: tokens.primary }} className="font-semibold uppercase tracking-wider">
              Autoavaliação & Depoimento do Vendedor
            </h4>
            <div>
              <span style={{ color: tokens.textSecondary }}>Autoavaliação do atendimento:</span>
              <p style={{ color: tokens.textPrimary }} className="mt-0.5 leading-relaxed">
                {record.sectionF?.selfEvaluation || 'Não informado'}
              </p>
            </div>
            <div>
              <span style={{ color: tokens.textSecondary }}>Depoimento completo nas palavras do vendedor:</span>
              <p style={{ color: tokens.textPrimary }} className="mt-0.5 leading-relaxed whitespace-pre-line">
                {record.sectionF?.generalTestimonial || 'Não informado'}
              </p>
            </div>
          </div>
        </div>
      )}

      {isNoShow && (
        <div
          style={{ backgroundColor: tokens.bg, borderColor: tokens.border, borderRadius: 11 }}
          className="border p-4 flex flex-col gap-3 text-xs"
        >
          <div className="flex items-center justify-between">
            <span style={{ color: tokens.textSecondary }}>Motivo registrado:</span>
            <PwBadge variant="warning" tokens={tokens}>
              {record.reason}
            </PwBadge>
          </div>
          <div>
            <span style={{ color: tokens.textSecondary }}>Agendamento original:</span>{' '}
            <strong style={{ color: tokens.textPrimary }}>
              {formatMeetingSchedule(record.scheduledDate, record.scheduledTime, true)}
            </strong>
          </div>
          <div>
            <span style={{ color: tokens.textSecondary }}>Tentativas de contato:</span>{' '}
            <strong style={{ color: tokens.textPrimary }}>{record.contactAttempts}</strong>
          </div>
          <div>
            <span style={{ color: tokens.textSecondary }}>Descrição do ocorrido:</span>
            <p style={{ color: tokens.textPrimary }} className="mt-1 leading-relaxed">
              {record.description}
            </p>
          </div>
          <div>
            <span style={{ color: tokens.textSecondary }}>Evidências / Anexos:</span>
            <p style={{ color: tokens.textPrimary }} className="mt-1">
              {record.evidenceNote}
            </p>
          </div>
        </div>
      )}

      {isReschedule && (
        <div
          style={{ backgroundColor: tokens.bg, borderColor: tokens.border, borderRadius: 11 }}
          className="border p-4 flex flex-col gap-3 text-xs"
        >
          <div>
            <span style={{ color: tokens.textSecondary }}>Programação anterior preservada:</span>{' '}
            <strong style={{ color: tokens.textPrimary }}>
              {formatMeetingSchedule(record.previousDate, record.previousTime, true)}
            </strong>
          </div>
          <div>
            <span style={{ color: tokens.textSecondary }}>Nova programação vigente:</span>{' '}
            <strong style={{ color: tokens.primary }}>
              {formatMeetingSchedule(record.newDate, record.newTime, true)}
            </strong>
          </div>
          <div>
            <span style={{ color: tokens.textSecondary }}>Motivo:</span>{' '}
            <strong style={{ color: tokens.textPrimary }}>{record.reason}</strong>
          </div>
          <div>
            <span style={{ color: tokens.textSecondary }}>Observações:</span>
            <p style={{ color: tokens.textPrimary }} className="mt-1">
              {record.notes}
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-end mt-5">
        <PwButton variant="secondary" onClick={onClose} tokens={tokens}>
          Fechar Detalhes
        </PwButton>
      </div>
    </PwModal>
  );
}

/**
 * ============================================================================
 * MODAL DE DOSSIÊ COMPLETO DO CLIENTE
 * ============================================================================
 */
function ClientDossierModal({ client, db, onClose, onOpenRVendas, tokens }) {
  if (!client) return null;

  const meeting = db.meetings.find((m) => m.id === client.activeMeetingId);
  const reports = db.meetingReports.filter((r) => r.clientId === client.id);
  const occurrences = db.noShowOccurrences.filter((o) => o.clientId === client.id);
  const reschedules = db.rescheduleRecords.filter((r) => r.clientId === client.id);
  const clientSales = db.sales.filter((s) => s.clientId === client.id);
  const responsibleLabel = dataEngine.resolveUserLabel(db, client.assignedSellerId, client.assignedSellerName);

  const saleStatusLabel = {
    completed: 'Concluída',
    pending_payment: 'Pagamento pendente',
    cancelled: 'Cancelada',
    refunded: 'Reembolsada',
  };

  return (
    <PwModal
      isOpen={Boolean(client)}
      onClose={onClose}
      title={`Dossiê do Cliente — ${client.name}`}
      subtitle={`Segmento: ${client.segment} • Responsável: ${responsibleLabel}`}
      tokens={tokens}
      maxWidth="max-w-3xl"
    >
      <div className="flex flex-col gap-4 text-xs">
        <div
          style={{ backgroundColor: tokens.bg, borderColor: tokens.border, borderRadius: 11 }}
          className="border p-4 grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          <div>
            <span style={{ color: tokens.textSecondary }}>WhatsApp:</span>{' '}
            <strong style={{ color: tokens.textPrimary }}>{formatWhatsAppDisplay(client.whatsapp)}</strong>
          </div>
          <div>
            <span style={{ color: tokens.textSecondary }}>Primeiro contato:</span>{' '}
            <strong style={{ color: client.firstContactStatus === 'completed' ? tokens.success : tokens.warning }}>
              {client.firstContactStatus === 'completed'
                ? `Realizado em ${formatSaoPauloDateTime(client.firstContactAt)}`
                : 'Pendente'}
            </strong>
          </div>
          <div>
            <span style={{ color: tokens.textSecondary }}>Reunião de Vendas vigente:</span>{' '}
            <strong style={{ color: tokens.textPrimary }}>
              {formatMeetingSchedule(client.meetingDate, client.meetingTime, true)}
            </strong>
          </div>
          <div>
            <span style={{ color: tokens.textSecondary }}>Status da reunião:</span>{' '}
            <strong style={{ color: tokens.primary }}>
              {client.meetingStatus === 'completed'
                ? 'Realizada'
                : client.meetingStatus === 'no_show'
                ? 'Vácuo registrado'
                : 'Agendada'}
            </strong>
          </div>
          {client.notes && (
            <div className="sm:col-span-2">
              <span style={{ color: tokens.textSecondary }}>Observações iniciais:</span>{' '}
              <span style={{ color: tokens.textPrimary }}>{client.notes}</span>
            </div>
          )}
        </div>

        {clientSales.length > 0 && (
          <div
            style={{
              backgroundColor: 'rgba(22, 132, 91, 0.08)',
              borderColor: 'rgba(22, 132, 91, 0.35)',
              borderRadius: 11,
            }}
            className="border p-4 flex flex-col gap-2"
          >
            <h4 style={{ color: tokens.success }} className="font-semibold uppercase tracking-wider">
              Registro de Venda
            </h4>
            {clientSales.map((sale) => (
              <div key={sale.id} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <span style={{ color: tokens.textSecondary }}>Serviço:</span>{' '}
                  <strong style={{ color: tokens.textPrimary }}>Site</strong>
                </div>
                <div>
                  <span style={{ color: tokens.textSecondary }}>Status financeiro:</span>{' '}
                  <strong style={{ color: tokens.textPrimary }}>
                    {saleStatusLabel[sale.status] || sale.status}
                  </strong>
                </div>
                <div>
                  <span style={{ color: tokens.textSecondary }}>Valor vendido:</span>{' '}
                  <strong style={{ color: tokens.textPrimary }}>{formatCurrencyBRL(sale.value)}</strong>
                </div>
                <div>
                  <span style={{ color: tokens.textSecondary }}>Valor recebido:</span>{' '}
                  <strong style={{ color: tokens.success }}>
                    {formatCurrencyBRL(sale.receivedValue || 0)}
                  </strong>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-3 gap-2.5">
          <div
            style={{ backgroundColor: tokens.bg, borderColor: tokens.border, borderRadius: 10 }}
            className="border p-3 text-center"
          >
            <span style={{ color: tokens.textSecondary }} className="block text-[11px]">
              Registros Enviados
            </span>
            <strong style={{ color: tokens.textPrimary }} className="text-base">
              {reports.length}
            </strong>
          </div>
          <div
            style={{ backgroundColor: tokens.bg, borderColor: tokens.border, borderRadius: 10 }}
            className="border p-3 text-center"
          >
            <span style={{ color: tokens.textSecondary }} className="block text-[11px]">
              Reagendamentos
            </span>
            <strong style={{ color: tokens.textPrimary }} className="text-base">
              {reschedules.length || meeting?.rescheduleCount || 0}
            </strong>
          </div>
          <div
            style={{ backgroundColor: tokens.bg, borderColor: tokens.border, borderRadius: 10 }}
            className="border p-3 text-center"
          >
            <span style={{ color: tokens.textSecondary }} className="block text-[11px]">
              Ocorrências de Vácuo
            </span>
            <strong style={{ color: tokens.textPrimary }} className="text-base">
              {occurrences.length}
            </strong>
          </div>
        </div>

        <div>
          <h4 style={{ color: tokens.textPrimary }} className="font-semibold mb-2">
            Linha do Tempo Cronológica ({client.history?.length || 0} eventos)
          </h4>
          <div
            style={{ backgroundColor: tokens.bg, borderColor: tokens.border, borderRadius: 11 }}
            className="border p-3.5 max-h-60 overflow-y-auto flex flex-col gap-3"
          >
            {(client.history || []).map((ev) => (
              <div
                key={ev.id}
                style={{ borderColor: tokens.border }}
                className="border-l-2 pl-3 py-0.5 flex flex-col gap-0.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span style={{ color: tokens.textPrimary }} className="font-semibold">
                    {ev.title}
                  </span>
                  <span style={{ color: tokens.textSecondary }} className="text-[11px]">
                    {formatSaoPauloDateTime(ev.timestamp)}
                  </span>
                </div>
                <p style={{ color: tokens.textSecondary }}>{ev.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap justify-between gap-2 pt-2">
          <a
            href={buildWhatsAppLink(client.whatsapp, client.name)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => soundEngine.playSfx('click')}
            style={{
              backgroundColor: '#16845B',
              color: '#FFFFFF',
              borderRadius: 11,
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Abrir WhatsApp
          </a>
          <div className="flex items-center gap-2">
            {client.meetingStatus !== 'completed' && onOpenRVendas && (
              <PwButton
                size="sm"
                icon={Briefcase}
                onClick={() => {
                  onClose();
                  onOpenRVendas(client);
                }}
                tokens={tokens}
              >
                R. Vendas
              </PwButton>
            )}
            <PwButton variant="secondary" size="sm" onClick={onClose} tokens={tokens}>
              Fechar Dossiê
            </PwButton>
          </div>
        </div>
      </div>
    </PwModal>
  );
}

/**
 * ============================================================================
 * MODAL UNIFICADO: R. VENDAS (REALIZADA + REGISTRO DOS DADOS / VÁCUO / REAGENDAMENTO)
 * ============================================================================
 */
function RVendasModal({ client, meeting, currentUser, onClose, onSuccess, onError, tokens }) {
  const [step, setStep] = useState('SELECT_OUTCOME');

  // Reunião de vendas: Infos
  const [previousReschedulesInput, setPreviousReschedulesInput] = useState(
    String(meeting?.rescheduleCount ?? 0)
  );

  // Registro da Venda
  const [saleStatus, setSaleStatus] = useState('completed');
  const [paymentStructure, setPaymentStructure] = useState('immediate');
  const [saleValue, setSaleValue] = useState('');
  const [sentValue, setSentValue] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('PIX');

  // Registro dos Dados — Negócio & Oferta + Dificuldades / Necessidades
  const [businessAndOffer, setBusinessAndOffer] = useState('');
  const [difficultiesAndNeeds, setDifficultiesAndNeeds] = useState('');

  // Solução & Proposta
  const [howSiteHelpsClient, setHowSiteHelpsClient] = useState('');
  const [domainProvider, setDomainProvider] = useState('Vercel');
  const [nextSiteCallDate, setNextSiteCallDate] = useState('');

  // Autoavaliação e Depoimento Geral
  const [selfEvaluation, setSelfEvaluation] = useState('');
  const [generalTestimonial, setGeneralTestimonial] = useState('');

  // Estados Vácuo
  const [noShowReason, setNoShowReason] = useState('Cliente não compareceu');
  const [noShowDescription, setNoShowDescription] = useState('');
  const [contactAttempts, setContactAttempts] = useState('2');
  const [evidenceNote, setEvidenceNote] = useState('');

  // Estados Reagendamento
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduleNotes, setRescheduleNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);

  if (!client || !meeting) return null;

  const handleReportSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);

    const res = dataEngine.submitSalesMeetingReport(currentUser, client.id, {
      previousReschedulesInput,
      saleStatus,
      paymentStructure,
      saleValue,
      sentValue,
      paymentMethod,
      businessAndOffer,
      difficultiesAndNeeds,
      howSiteHelpsClient,
      domainProvider,
      nextSiteCallDate,
      selfEvaluation,
      generalTestimonial,
    });

    setSubmitting(false);
    if (!res.ok) {
      soundEngine.playSfx('error');
      onError(res.message);
      return;
    }

    soundEngine.playSfx('success');
    onSuccess(
      'Registro dos Dados & Venda salvos! O administrador foi notificado imediatamente.'
    );
    onClose();
  };

  const handleNoShowSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    const res = dataEngine.registerNoShowOccurrence(currentUser, client.id, {
      reason: noShowReason,
      description: noShowDescription,
      contactAttempts,
      evidenceNote,
    });
    setSubmitting(false);

    if (!res.ok) {
      soundEngine.playSfx('error');
      onError(res.message);
      return;
    }

    soundEngine.playSfx('warning');
    onSuccess('Ocorrência de vácuo registrada no histórico e na lista de relatórios.');
    onClose();
  };

  const handleRescheduleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    const res = dataEngine.rescheduleSalesMeeting(currentUser, client.id, {
      newDate,
      newTime,
      reason: rescheduleReason,
      notes: rescheduleNotes,
    });
    setSubmitting(false);

    if (!res.ok) {
      soundEngine.playSfx('error');
      onError(res.message);
      return;
    }

    soundEngine.playSfx('success');
    onSuccess('Reunião reagendada! A programação anterior foi preservada no histórico.');
    onClose();
  };

  return (
    <PwModal
      isOpen={Boolean(client)}
      onClose={onClose}
      title={
        step === 'SELECT_OUTCOME'
          ? 'Reunião de Vendas'
          : step === 'REPORT'
          ? 'Registro dos Dados'
          : step === 'NO_SHOW'
          ? 'Registrar Ocorrência de Vácuo'
          : 'Reagendar Reunião de Vendas'
      }
      subtitle={
        step === 'SELECT_OUTCOME'
          ? `Cliente: ${client.name} • Agendada para ${formatMeetingSchedule(meeting.scheduledDate, meeting.scheduledTime, true)}`
          : `Cliente: ${client.name} (${client.segment}) • Responsável: ${meeting.assignedSellerName}`
      }
      tokens={tokens}
      maxWidth={step === 'REPORT' ? 'max-w-3xl' : 'max-w-xl'}
    >
      {step === 'SELECT_OUTCOME' && (
        <div className="flex flex-col gap-4">
          <div
            style={{ backgroundColor: tokens.bg, borderColor: tokens.border, borderRadius: 11 }}
            className="border p-4 text-xs leading-relaxed flex flex-col gap-2"
          >
            <p style={{ color: tokens.textPrimary }}>
              Utilize esta opção após o horário previsto para a reunião ou quando precisar registrar o resultado do
              atendimento. Escolha a situação correspondente para manter o histórico atualizado.
            </p>
            <p style={{ color: tokens.textSecondary }}>
              Ao marcar a reunião como realizada, você deverá preencher o registro completo. Se o cliente não
              compareceu ou não respondeu, registre a ocorrência. Caso a reunião tenha sido reagendada, informe a nova
              data e o novo horário.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => {
                soundEngine.playSfx('click');
                setStep('REPORT');
              }}
              style={{
                backgroundColor: 'rgba(22, 132, 91, 0.12)',
                borderColor: 'rgba(22, 132, 91, 0.4)',
                borderRadius: 12,
              }}
              className="border p-4 text-left hover:scale-[1.01] transition-all flex flex-col gap-2"
            >
              <CheckCircle2 style={{ color: tokens.success }} className="w-6 h-6" />
              <span style={{ color: tokens.textPrimary }} className="text-sm font-semibold">
                Realizada
              </span>
              <span style={{ color: tokens.textSecondary }} className="text-[11px] leading-snug">
                Abrir Registro dos Dados e Registro da Venda.
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playSfx('click');
                setStep('NO_SHOW');
              }}
              style={{
                backgroundColor: 'rgba(200, 62, 77, 0.12)',
                borderColor: 'rgba(200, 62, 77, 0.4)',
                borderRadius: 12,
              }}
              className="border p-4 text-left hover:scale-[1.01] transition-all flex flex-col gap-2"
            >
              <XCircle style={{ color: tokens.error }} className="w-6 h-6" />
              <span style={{ color: tokens.textPrimary }} className="text-sm font-semibold">
                Vácuo
              </span>
              <span style={{ color: tokens.textSecondary }} className="text-[11px] leading-snug">
                Cliente não compareceu, não respondeu ou cancelou.
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playSfx('click');
                setStep('RESCHEDULE');
              }}
              style={{
                backgroundColor: 'rgba(128, 23, 255, 0.12)',
                borderColor: 'rgba(128, 23, 255, 0.4)',
                borderRadius: 12,
              }}
              className="border p-4 text-left hover:scale-[1.01] transition-all flex flex-col gap-2"
            >
              <CalendarClock style={{ color: tokens.primary }} className="w-6 h-6" />
              <span style={{ color: tokens.textPrimary }} className="text-sm font-semibold">
                Reagendamento
              </span>
              <span style={{ color: tokens.textSecondary }} className="text-[11px] leading-snug">
                Definir nova data e horário mantendo histórico anterior.
              </span>
            </button>
          </div>
        </div>
      )}

      {step === 'REPORT' && (
        <form onSubmit={handleReportSubmit} className="flex flex-col gap-5">
          {/* REUNIÃO DE VENDAS: INFOS */}
          <div
            style={{ backgroundColor: tokens.bg, borderColor: tokens.border, borderRadius: 12 }}
            className="border p-4 flex flex-col gap-3"
          >
            <h4 style={{ color: tokens.primary }} className="text-xs font-semibold uppercase tracking-wider">
              Reunião de vendas: Infos
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span style={{ color: tokens.textSecondary }}>Data/horário:</span>
                <p style={{ color: tokens.textPrimary }} className="font-medium mt-0.5">
                  {formatMeetingSchedule(meeting.scheduledDate, meeting.scheduledTime, true)}
                </p>
              </div>
              <div>
                <span style={{ color: tokens.textSecondary }}>Status:</span>
                <p style={{ color: tokens.success }} className="font-semibold mt-0.5">
                  Realizada
                </p>
              </div>
              <div>
                <span style={{ color: tokens.textSecondary }}>Reagendamentos anteriores:</span>
                <p style={{ color: tokens.textPrimary }} className="font-medium mt-0.5">
                  {meeting.rescheduleCount || 0} registro(s)
                </p>
              </div>
            </div>
          </div>

          {/* REGISTRO DA VENDA */}
          <div
            style={{
              backgroundColor: 'rgba(22, 132, 91, 0.08)',
              borderColor: 'rgba(22, 132, 91, 0.38)',
              borderRadius: 12,
            }}
            className="border p-4 flex flex-col gap-3"
          >
            <h4 style={{ color: tokens.success }} className="text-xs font-semibold uppercase tracking-wider">
              Registro da Venda (Serviço: Site)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <PwSelect
                label="Status financeiro"
                id="rep-sale-status"
                required
                value={saleStatus}
                onChange={(e) => setSaleStatus(e.target.value)}
                options={[
                  { value: 'completed', label: 'Concluída' },
                  { value: 'pending_payment', label: 'Pagamento pendente' },
                  { value: 'cancelled', label: 'Cancelada' },
                  { value: 'refunded', label: 'Reembolsada' },
                ]}
                tokens={tokens}
              />

              <div className="flex flex-col gap-1.5">
                <label style={{ color: tokens.textPrimary }} className="text-xs font-medium">
                  Pagamento imediato ou 50/50? <span style={{ color: tokens.primary }}>*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'immediate', label: 'Pagamento imediato' },
                    { value: '50_50', label: '50/50' },
                  ].map((opt) => {
                    const selected = paymentStructure === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          soundEngine.playSfx('click');
                          setPaymentStructure(opt.value);
                        }}
                        style={{
                          backgroundColor: selected ? 'rgba(128, 23, 255, 0.16)' : tokens.bg,
                          borderColor: selected ? tokens.primary : tokens.border,
                          color: selected ? tokens.primary : tokens.textSecondary,
                          borderRadius: 11,
                        }}
                        className="border py-2.5 px-2.5 text-xs font-medium transition-all"
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <PwInput
                label="Valor vendido (R$)"
                id="rep-sale-value"
                type="number"
                required
                value={saleValue}
                onChange={(e) => setSaleValue(e.target.value)}
                placeholder="Ex: 1500.00"
                tokens={tokens}
              />
              <PwInput
                label="Valor enviado (R$)"
                id="rep-sent-value"
                type="number"
                required
                value={sentValue}
                onChange={(e) => setSentValue(e.target.value)}
                placeholder="Ex: 750.00"
                tokens={tokens}
              />
              <PwSelect
                label="Método de pagamento"
                id="rep-pay-method"
                required
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                options={[
                  { value: 'PIX', label: 'PIX' },
                  { value: 'Cartão de Crédito', label: 'Cartão de Crédito' },
                  { value: 'Boleto Bancário', label: 'Boleto Bancário' },
                  { value: 'Transferência Bancária', label: 'Transferência Bancária' },
                ]}
                tokens={tokens}
              />
            </div>
          </div>

          {/* REGISTRO DOS DADOS — NEGÓCIO & OFERTA + DIFICULDADES / NECESSIDADES */}
          <div
            style={{ backgroundColor: tokens.bg, borderColor: tokens.border, borderRadius: 12 }}
            className="border p-4 flex flex-col gap-3"
          >
            <h4 style={{ color: tokens.primary }} className="text-xs font-semibold uppercase tracking-wider">
              Registro dos Dados — Negócio, Oferta & Necessidades
            </h4>

            <PwTextarea
              label="Negócio & Oferta"
              id="rep-business-offer"
              rows={3}
              value={businessAndOffer}
              onChange={(e) => setBusinessAndOffer(e.target.value)}
              placeholder="Descreva o negócio do cliente, o que ele vende, público-alvo e a oferta apresentada..."
              tokens={tokens}
            />

            <PwTextarea
              label="Dificuldades / Necessidades"
              id="rep-difficulties-needs"
              rows={3}
              value={difficultiesAndNeeds}
              onChange={(e) => setDifficultiesAndNeeds(e.target.value)}
              placeholder="Quais problemas e necessidades foram identificados durante a reunião?"
              tokens={tokens}
            />
          </div>

          {/* SOLUÇÃO & PROPOSTA */}
          <div
            style={{ backgroundColor: tokens.bg, borderColor: tokens.border, borderRadius: 12 }}
            className="border p-4 flex flex-col gap-3"
          >
            <h4 style={{ color: tokens.primary }} className="text-xs font-semibold uppercase tracking-wider">
              Solução & Proposta
            </h4>

            <PwTextarea
              label="Como um site pode ajudar esse cliente em específico?"
              id="rep-how-site-helps"
              required
              rows={3}
              value={howSiteHelpsClient}
              onChange={(e) => setHowSiteHelpsClient(e.target.value)}
              placeholder="O que precisa ter no site? Ex: um site que apresente os produtos tipo um cardápio digital, um site estilo portfólio, um site de vendas padrão para negócio local..."
              tokens={tokens}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
              <div className="flex flex-col gap-1.5">
                <label style={{ color: tokens.textPrimary }} className="text-xs font-medium">
                  O domínio é pela assinatura da Wix, ou vai ser gratuito por Vercel?{' '}
                  <span style={{ color: tokens.primary }}>*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['Wix', 'Vercel'].map((provider) => {
                    const active = domainProvider === provider;
                    return (
                      <button
                        key={provider}
                        type="button"
                        onClick={() => {
                          soundEngine.playSfx('click');
                          setDomainProvider(provider);
                        }}
                        style={{
                          backgroundColor: active ? 'rgba(128, 23, 255, 0.16)' : tokens.surface,
                          borderColor: active ? tokens.primary : tokens.border,
                          color: active ? tokens.primary : tokens.textSecondary,
                          borderRadius: 11,
                        }}
                        className="border py-2.5 px-3 text-xs font-medium flex items-center justify-center gap-2 transition-all"
                      >
                        <span
                          style={{
                            borderColor: active ? tokens.primary : tokens.textSecondary,
                            backgroundColor: active ? tokens.primary : 'transparent',
                          }}
                          className="w-3 h-3 rounded-full border inline-block"
                        />
                        {provider}
                      </button>
                    );
                  })}
                </div>
              </div>

              <PwInput
                label="Qual a data para a próxima call apresentando o site?"
                id="rep-next-site-call"
                type="date"
                required
                value={nextSiteCallDate}
                onChange={(e) => setNextSiteCallDate(e.target.value)}
                tokens={tokens}
              />
            </div>
          </div>

          {/* AUTOAVALIAÇÃO E DEPOIMENTO GERAL */}
          <div
            style={{ backgroundColor: tokens.bg, borderColor: tokens.border, borderRadius: 12 }}
            className="border p-4 flex flex-col gap-3"
          >
            <h4 style={{ color: tokens.primary }} className="text-xs font-semibold uppercase tracking-wider">
              Autoavaliação & Depoimento do Vendedor
            </h4>

            <PwTextarea
              label="Autoavaliação do atendimento"
              id="rep-self-eval"
              rows={2}
              value={selfEvaluation}
              onChange={(e) => setSelfEvaluation(e.target.value)}
              placeholder="Pontos fortes, objeções enfrentadas e o que pode ser aprimorado..."
              tokens={tokens}
            />

            <PwTextarea
              label="Depoimento completo nas suas palavras"
              id="rep-general-testimonial"
              required
              rows={5}
              value={generalTestimonial}
              onChange={(e) => setGeneralTestimonial(e.target.value)}
              placeholder="Explique com suas próprias palavras tudo o que aconteceu na call, detalhes importantes do projeto, combinados com o cliente e observações gerais..."
              tokens={tokens}
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <PwButton type="button" variant="ghost" onClick={() => setStep('SELECT_OUTCOME')} tokens={tokens}>
              Voltar
            </PwButton>
            <PwButton type="submit" loading={submitting} icon={CheckCircle2} tokens={tokens}>
              Salvar Registro
            </PwButton>
          </div>
        </form>
      )}

      {step === 'NO_SHOW' && (
        <form onSubmit={handleNoShowSubmit} className="flex flex-col gap-4">
          <PwSelect
            label="Motivo da ocorrência"
            id="ns-reason"
            required
            value={noShowReason}
            onChange={(e) => setNoShowReason(e.target.value)}
            options={[
              { value: 'Cliente não compareceu', label: 'Cliente não compareceu' },
              { value: 'Cliente não respondeu', label: 'Cliente não respondeu' },
              { value: 'Cliente cancelou sem reagendar', label: 'Cliente cancelou sem reagendar' },
              { value: 'Outro motivo', label: 'Outro motivo' },
            ]}
            tokens={tokens}
          />
          <PwTextarea
            label="Descrição do ocorrido"
            id="ns-desc"
            required
            rows={3}
            value={noShowDescription}
            onChange={(e) => setNoShowDescription(e.target.value)}
            placeholder="Detalhe o que aconteceu no horário agendado..."
            tokens={tokens}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <PwInput
              label="Tentativas de contato"
              id="ns-attempts"
              type="number"
              value={contactAttempts}
              onChange={(e) => setContactAttempts(e.target.value)}
              tokens={tokens}
            />
            <PwInput
              label="Evidências ou anexos (opcional)"
              id="ns-evidence"
              value={evidenceNote}
              onChange={(e) => setEvidenceNote(e.target.value)}
              placeholder="Ex: Print enviado no grupo / ligação sem resposta"
              tokens={tokens}
            />
          </div>
          <div className="flex items-center justify-between gap-3 pt-2">
            <PwButton type="button" variant="ghost" onClick={() => setStep('SELECT_OUTCOME')} tokens={tokens}>
              Voltar
            </PwButton>
            <PwButton type="submit" variant="danger" loading={submitting} icon={XCircle} tokens={tokens}>
              Confirmar Ocorrência de Vácuo
            </PwButton>
          </div>
        </form>
      )}

      {step === 'RESCHEDULE' && (
        <form onSubmit={handleRescheduleSubmit} className="flex flex-col gap-4">
          <div
            style={{ backgroundColor: tokens.bg, borderColor: tokens.border, borderRadius: 11 }}
            className="border p-3 text-xs"
          >
            <span style={{ color: tokens.textSecondary }}>Agendamento atual (será preservado no histórico): </span>
            <strong style={{ color: tokens.textPrimary }}>
              {formatMeetingSchedule(meeting.scheduledDate, meeting.scheduledTime, true)}
            </strong>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <PwInput
              label="Nova data"
              id="rs-date"
              type="date"
              required
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              tokens={tokens}
            />
            <PwInput
              label="Novo horário (America/Sao_Paulo)"
              id="rs-time"
              type="time"
              required
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              tokens={tokens}
            />
          </div>
          <PwInput
            label="Motivo (opcional)"
            id="rs-reason"
            value={rescheduleReason}
            onChange={(e) => setRescheduleReason(e.target.value)}
            placeholder="Ex: Cliente solicitou mudança de horário"
            tokens={tokens}
          />
          <PwTextarea
            label="Observações (opcional)"
            id="rs-notes"
            rows={2}
            value={rescheduleNotes}
            onChange={(e) => setRescheduleNotes(e.target.value)}
            placeholder="Informações complementares sobre o reagendamento..."
            tokens={tokens}
          />
          <div className="flex items-center justify-between gap-3 pt-2">
            <PwButton type="button" variant="ghost" onClick={() => setStep('SELECT_OUTCOME')} tokens={tokens}>
              Voltar
            </PwButton>
            <PwButton type="submit" loading={submitting} icon={CalendarClock} tokens={tokens}>
              Confirmar Reagendamento
            </PwButton>
          </div>
        </form>
      )}
    </PwModal>
  );
}

/**
 * ============================================================================
 * TELA DE AUTENTICAÇÃO
 * ============================================================================
 */
function AuthScreen({ theme, onToggleTheme, onAuthenticated, showToast, tokens }) {
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [recEmail, setRecEmail] = useState('');
  const [recCode, setRecCode] = useState('');
  const [recNewPass, setRecNewPass] = useState('');
  const [issuedDemoCode, setIssuedDemoCode] = useState('');

  const [formError, setFormError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setFormError('');
    setLoading(true);

    setTimeout(async () => {
      const result = await dataEngine.authenticate(email, password);
      setLoading(false);

      if (!result.ok) {
        soundEngine.playSfx('error');
        setFormError(result.message);
        return;
      }

      soundEngine.playSfx('success');
      showToast('success', 'Acesso autorizado', `Bem-vindo(a), ${result.user.name}.`);
      onAuthenticated(result.user);
    }, 240);
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setFormError('');
    setLoading(true);

    setTimeout(async () => {
      const result = await dataEngine.createSellerAccount({
        name: regName,
        email: regEmail,
        password: regPassword,
        createdBy: 'SELF_SIGNUP',
      });
      setLoading(false);

      if (!result.ok) {
        soundEngine.playSfx('error');
        setFormError(result.message);
        return;
      }

      soundEngine.playSfx('success');
      showToast(
        'success',
        'Conta de vendedor criada',
        'Seu acesso foi provisionado automaticamente com perfil de Vendedor.'
      );
      setEmail(regEmail);
      setPassword('');
      setMode('login');
    }, 240);
  };

  const handleRequestRecovery = (e) => {
    e.preventDefault();
    setFormError('');
    setLoading(true);

    setTimeout(() => {
      const result = dataEngine.requestPasswordRecovery(recEmail);
      setLoading(false);

      if (!result.ok) {
        soundEngine.playSfx('error');
        setFormError(result.message);
        return;
      }

      soundEngine.playSfx('notification');
      if (result.demoCode) setIssuedDemoCode(result.demoCode);
      showToast('info', 'Recuperação processada', result.message);
      setMode('reset_confirm');
    }, 240);
  };

  const handleConfirmReset = (e) => {
    e.preventDefault();
    setFormError('');
    setLoading(true);

    setTimeout(() => {
      const result = dataEngine.resetPasswordWithCode(recEmail, recCode, recNewPass);
      setLoading(false);

      if (!result.ok) {
        soundEngine.playSfx('error');
        setFormError(result.message);
        return;
      }

      soundEngine.playSfx('success');
      showToast('success', 'Senha redefinida', result.message);
      setEmail(recEmail);
      setIssuedDemoCode('');
      setMode('login');
    }, 240);
  };

  return (
    <div
      style={{ backgroundColor: tokens.bg, color: tokens.textPrimary }}
      className="min-h-screen flex flex-col justify-between relative overflow-hidden"
    >
      <div
        style={{
          background: 'radial-gradient(circle, rgba(128,23,255,0.22) 0%, rgba(8,8,8,0) 70%)',
        }}
        className="pointer-events-none absolute -top-48 left-1/2 -translate-x-1/2 w-[780px] h-[520px] blur-3xl"
      />

      <header className="relative z-10 w-full max-w-6xl mx-auto px-5 py-5 flex items-center justify-between">
        <PontoWebLogo size={36} showSubtitle tokens={tokens} />
        <button
          onClick={() => {
            soundEngine.playSfx('click');
            onToggleTheme();
          }}
          style={{
            backgroundColor: tokens.surface,
            borderColor: tokens.border,
            color: tokens.textPrimary,
            borderRadius: 11,
          }}
          className="border p-2.5 flex items-center gap-2 text-xs font-medium hover:opacity-90 transition-opacity"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-[#EDE0FF]" /> : <Moon className="w-4 h-4 text-[#8017FF]" />}
          <span className="hidden sm:inline">{theme === 'dark' ? 'Tema Claro' : 'Tema Escuro'}</span>
        </button>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <PwCard tokens={tokens} glow className="p-7 sm:p-8">
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 mb-3">
                <PwBadge variant="primary" tokens={tokens}>
                  <Lock className="w-3 h-3" /> Ambiente Corporativo Privado
                </PwBadge>
              </div>
              <h1 style={{ color: tokens.textPrimary }} className="text-xl font-semibold tracking-tight">
                {mode === 'login' && 'Acessar o PontoWeb CRM'}
                {mode === 'register' && 'Criar Conta de Vendedor'}
                {mode === 'recover' && 'Recuperação de Senha'}
                {mode === 'reset_confirm' && 'Definir Nova Senha'}
              </h1>
              <p style={{ color: tokens.textSecondary }} className="text-xs mt-1.5 leading-relaxed">
                {mode === 'login' && 'Entre com suas credenciais corporativas para gerenciar sua operação comercial.'}
                {mode === 'register' && 'Novas contas recebem automaticamente o perfil de Vendedor.'}
                {mode === 'recover' && 'Informe seu e-mail cadastrado para gerar um token seguro de redefinição.'}
                {mode === 'reset_confirm' && 'Insira o código de verificação e escolha sua nova senha.'}
              </p>
            </div>

            {formError && (
              <div
                style={{
                  backgroundColor: 'rgba(200, 62, 77, 0.12)',
                  borderColor: 'rgba(200, 62, 77, 0.35)',
                  color: tokens.error,
                  borderRadius: 11,
                }}
                className="mb-5 border p-3 text-xs flex items-start gap-2.5"
              >
                <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {mode === 'login' && (
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <PwInput
                  label="E-mail corporativo"
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@pontoweb.com"
                  icon={Mail}
                  tokens={tokens}
                />
                <PwInput
                  label="Senha"
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  icon={KeyRound}
                  tokens={tokens}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      style={{ color: tokens.textSecondary }}
                      className="ml-2 hover:opacity-80"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />

                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playSfx('click');
                      setFormError('');
                      setMode('recover');
                    }}
                    style={{ color: tokens.primary }}
                    className="text-xs font-medium hover:underline"
                  >
                    Esqueci minha senha
                  </button>
                </div>

                <PwButton type="submit" loading={loading} icon={ArrowRight} tokens={tokens} className="w-full mt-1">
                  Entrar no Sistema
                </PwButton>

                <div style={{ borderColor: tokens.border }} className="pt-4 mt-2 border-t flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color: tokens.textSecondary }}>Novo consultor comercial?</span>
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playSfx('click');
                        setFormError('');
                        setMode('register');
                      }}
                      style={{ color: tokens.primary }}
                      className="font-medium hover:underline"
                    >
                      Cadastrar conta de vendedor
                    </button>
                  </div>
                  </div>

              </form>
            )}

            {mode === 'register' && (
              <form onSubmit={handleRegister} className="flex flex-col gap-4">
                <PwInput
                  label="Nome completo"
                  id="reg-name"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Ex: Lucas Mendes"
                  icon={User}
                  tokens={tokens}
                />
                <PwInput
                  label="E-mail"
                  id="reg-email"
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="consultor@pontoweb.com"
                  icon={Mail}
                  tokens={tokens}
                />
                <PwInput
                  label="Senha (mínimo 8 caracteres)"
                  id="reg-pass"
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Crie uma senha forte"
                  icon={KeyRound}
                  tokens={tokens}
                />
                <PwButton type="submit" loading={loading} tokens={tokens} className="w-full mt-1">
                  Criar Conta de Vendedor
                </PwButton>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playSfx('click');
                    setFormError('');
                    setMode('login');
                  }}
                  style={{ color: tokens.textSecondary }}
                  className="text-xs text-center hover:underline mt-1"
                >
                  Voltar para o login
                </button>
              </form>
            )}

            {mode === 'recover' && (
              <form onSubmit={handleRequestRecovery} className="flex flex-col gap-4">
                <PwInput
                  label="E-mail cadastrado"
                  id="rec-email"
                  type="email"
                  required
                  value={recEmail}
                  onChange={(e) => setRecEmail(e.target.value)}
                  placeholder="seuemail@pontoweb.com"
                  icon={Mail}
                  tokens={tokens}
                />
                <PwButton type="submit" loading={loading} tokens={tokens} className="w-full">
                  Solicitar Código de Recuperação
                </PwButton>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playSfx('click');
                    setFormError('');
                    setMode('login');
                  }}
                  style={{ color: tokens.textSecondary }}
                  className="text-xs text-center hover:underline"
                >
                  Voltar para o login
                </button>
              </form>
            )}

            {mode === 'reset_confirm' && (
              <form onSubmit={handleConfirmReset} className="flex flex-col gap-4">
                {issuedDemoCode && (
                  <div
                    style={{
                      backgroundColor: 'rgba(22, 132, 91, 0.14)',
                      borderColor: 'rgba(22, 132, 91, 0.35)',
                      color: tokens.success,
                      borderRadius: 11,
                    }}
                    className="border p-3 text-xs"
                  >
                    Token seguro emitido para validação: <strong>{issuedDemoCode}</strong>
                  </div>
                )}
                <PwInput
                  label="Código de 6 dígitos"
                  id="rec-code"
                  required
                  value={recCode}
                  onChange={(e) => setRecCode(e.target.value)}
                  placeholder="000000"
                  icon={Shield}
                  tokens={tokens}
                />
                <PwInput
                  label="Nova senha (mínimo 8 caracteres)"
                  id="rec-new-pass"
                  type="password"
                  required
                  value={recNewPass}
                  onChange={(e) => setRecNewPass(e.target.value)}
                  placeholder="••••••••"
                  icon={KeyRound}
                  tokens={tokens}
                />
                <PwButton type="submit" loading={loading} tokens={tokens} className="w-full">
                  Redefinir Senha
                </PwButton>
              </form>
            )}
          </PwCard>
        </div>
      </main>
    </div>
  );
}

/**
 * ============================================================================
 * CARD DE CLIENTE (FLUXO SEQUENCIAL DE PENDÊNCIAS + DIA DA SEMANA + WHATSAPP)
 * ============================================================================
 */
function ClientOperationalCard({
  client,
  db,
  currentUser,
  onConfirmFirstContact,
  onOpenReassign,
  onOpenRVendas,
  onOpenDossier,
  showToast,
  tokens,
}) {
  const [confirming, setConfirming] = useState(false);

  const isContactDone = client.firstContactStatus === 'completed';
  const isMeetingDone = client.meetingStatus === 'completed';
  const isNoShow = client.meetingStatus === 'no_show';
  const responsibleLabel = dataEngine.resolveUserLabel(db, client.assignedSellerId, client.assignedSellerName);

  const handleCopyPhone = () => {
    soundEngine.playSfx('click');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(client.whatsapp).catch(() => {});
    }
    showToast('info', 'Número copiado', `${formatWhatsAppDisplay(client.whatsapp)} copiado para a área de transferência.`);
  };

  const handleConfirmContact = () => {
    if (confirming || isContactDone) return;
    setConfirming(true);
    onConfirmFirstContact(client.id);
    setTimeout(() => setConfirming(false), 300);
  };

  return (
    <PwCard
      tokens={tokens}
      glow={!isContactDone && currentUser.role === 'seller'}
      className="p-5 flex flex-col justify-between gap-4"
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <button
              type="button"
              onClick={() => {
                soundEngine.playSfx('click');
                onOpenDossier(client);
              }}
              style={{ color: tokens.textPrimary }}
              className="text-base font-semibold tracking-tight text-left hover:text-[#8017FF] transition-colors flex items-center gap-1.5"
            >
              <span>{client.name}</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-65" />
            </button>
            <div className="flex items-center gap-1.5 mt-1">
              <Building2 style={{ color: tokens.textSecondary }} className="w-3.5 h-3.5" />
              <span style={{ color: tokens.textSecondary }} className="text-xs">
                {client.segment}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            {client.hasSale && (
              <PwBadge variant="success" tokens={tokens}>
                <DollarSign className="w-3 h-3" /> Venda Concluída
              </PwBadge>
            )}
            <PwBadge
              variant={isMeetingDone ? 'success' : isNoShow ? 'warning' : 'primary'}
              tokens={tokens}
            >
              {isMeetingDone ? 'Reunião Realizada' : isNoShow ? 'Vácuo Registrado' : 'Reunião Agendada'}
            </PwBadge>
          </div>
        </div>

        {/* Informações de Reunião (com dia da semana) e Responsável */}
        <div
          style={{ backgroundColor: tokens.bg, borderColor: tokens.border, borderRadius: 11 }}
          className="border p-3 flex flex-col gap-2 text-xs"
        >
          <div className="flex items-center justify-between gap-2">
            <span style={{ color: tokens.textSecondary }} className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#8017FF]" />
              Reunião de Vendas:
            </span>
            <strong style={{ color: tokens.textPrimary }} className="text-right">
              {formatMeetingSchedule(client.meetingDate, client.meetingTime, true)}
            </strong>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span style={{ color: tokens.textSecondary }} className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#16845B]" />
              WhatsApp:
            </span>
            <div className="flex items-center gap-1.5">
              <a
                href={buildWhatsAppLink(client.whatsapp, client.name)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => soundEngine.playSfx('click')}
                style={{ color: tokens.primary }}
                className="font-medium hover:underline"
              >
                {formatWhatsAppDisplay(client.whatsapp)}
              </a>
              <button
                type="button"
                onClick={handleCopyPhone}
                title="Copiar número"
                style={{ color: tokens.textSecondary }}
                className="p-1 rounded hover:opacity-80"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {currentUser.role === 'admin' && (
            <div className="flex items-center justify-between gap-2">
              <span style={{ color: tokens.textSecondary }} className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#8017FF]" />
                Responsável:
              </span>
              <strong style={{ color: tokens.textPrimary }}>{responsibleLabel}</strong>
            </div>
          )}

          {client.notes && (
            <div style={{ borderColor: tokens.border }} className="pt-2 border-t text-[11px]">
              <span style={{ color: tokens.textSecondary }}>Observações: </span>
              <span style={{ color: tokens.textPrimary }}>{client.notes}</span>
            </div>
          )}
        </div>

        {/* FLUXO SEQUENCIAL DE PENDÊNCIAS */}
        {currentUser.role === 'seller' ? (
          !isContactDone ? (
            /* 1ª PENDÊNCIA ÚNICA INICIAL: Confirmar envio de mensagem no WhatsApp */
            <div
              style={{
                backgroundColor: 'rgba(183, 121, 31, 0.12)',
                borderColor: 'rgba(183, 121, 31, 0.38)',
                borderRadius: 11,
              }}
              className="border p-3.5 flex flex-col gap-2.5"
            >
              <div className="flex items-start gap-2">
                <AlertCircle style={{ color: tokens.warning }} className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p style={{ color: tokens.textPrimary }} className="font-semibold">
                    1ª Pendência: Confirmar mensagem no WhatsApp
                  </p>
                  <p style={{ color: tokens.textSecondary }} className="text-[11px] mt-0.5 leading-relaxed">
                    Envie uma mensagem para lembrar o cliente da call marcada para{' '}
                    <strong style={{ color: tokens.textPrimary }}>
                      {formatMeetingSchedule(client.meetingDate, client.meetingTime, true)}
                    </strong>
                    .
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={buildWhatsAppLink(client.whatsapp, client.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => soundEngine.playSfx('click')}
                  style={{
                    backgroundColor: '#16845B',
                    color: '#FFFFFF',
                    borderRadius: 10,
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium hover:opacity-95 transition-opacity"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Abrir WhatsApp
                </a>

                <PwButton
                  size="xs"
                  variant="primary"
                  icon={Check}
                  disabled={confirming}
                  onClick={handleConfirmContact}
                  tokens={tokens}
                >
                  Já mandei mensagem
                </PwButton>
              </div>
            </div>
          ) : !isMeetingDone ? (
            /* 2ª PENDÊNCIA: Liberada após confirmar WhatsApp — Data/Hora + Botão "Já fiz" + Botão "WhatsApp" */
            <div
              style={{
                backgroundColor: 'rgba(128, 23, 255, 0.12)',
                borderColor: 'rgba(128, 23, 255, 0.42)',
                borderRadius: 11,
              }}
              className="border p-3.5 flex flex-col gap-2.5"
            >
              <div className="flex items-start gap-2">
                <CalendarClock style={{ color: tokens.primary }} className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p style={{ color: tokens.textPrimary }} className="font-semibold">
                    2ª Pendência: Realizar Reunião de Vendas
                  </p>
                  <p style={{ color: tokens.textSecondary }} className="text-[11px] mt-0.5">
                    Agendada para:{' '}
                    <strong style={{ color: tokens.textPrimary }}>
                      {formatMeetingSchedule(client.meetingDate, client.meetingTime, true)}
                    </strong>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <PwButton
                  size="xs"
                  variant="primary"
                  icon={CheckCircle2}
                  onClick={() => onOpenRVendas(client, 'REPORT')}
                  tokens={tokens}
                >
                  Já fiz
                </PwButton>

                <a
                  href={buildWhatsAppLink(client.whatsapp, client.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => soundEngine.playSfx('click')}
                  style={{
                    backgroundColor: '#16845B',
                    color: '#FFFFFF',
                    borderRadius: 10,
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium hover:opacity-95 transition-opacity"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  WhatsApp
                </a>
              </div>
            </div>
          ) : (
            <div
              style={{
                backgroundColor: 'rgba(22, 132, 91, 0.12)',
                borderColor: 'rgba(22, 132, 91, 0.34)',
                borderRadius: 11,
              }}
              className="border p-3 flex items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 style={{ color: tokens.success }} className="w-4 h-4 shrink-0" />
                <span style={{ color: tokens.textPrimary }} className="font-medium">
                  Reunião realizada e Registro dos Dados salvo
                </span>
              </div>
            </div>
          )
        ) : (
          /* Visão do Administrador: apenas status informativo do contato */
          <div
            style={{
              backgroundColor: isContactDone ? 'rgba(22, 132, 91, 0.12)' : 'rgba(183, 121, 31, 0.12)',
              borderColor: isContactDone ? 'rgba(22, 132, 91, 0.34)' : 'rgba(183, 121, 31, 0.34)',
              borderRadius: 11,
            }}
            className="border p-3 flex items-center gap-2 text-xs"
          >
            {isContactDone ? (
              <>
                <CheckCircle2 style={{ color: tokens.success }} className="w-4 h-4 shrink-0" />
                <span style={{ color: tokens.textPrimary }}>
                  Primeiro contato feito por <strong>{client.firstContactBy}</strong> em{' '}
                  {formatSaoPauloDateTime(client.firstContactAt)}
                </span>
              </>
            ) : (
              <>
                <Clock style={{ color: tokens.warning }} className="w-4 h-4 shrink-0" />
                <span style={{ color: tokens.textPrimary }}>
                  Primeiro contato: <strong>Ainda não realizado pelo vendedor</strong>
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Rodapé do Card */}
      <div style={{ borderColor: tokens.border }} className="pt-3 border-t flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <PwButton
            size="xs"
            variant="secondary"
            icon={FileText}
            onClick={() => onOpenDossier(client)}
            tokens={tokens}
          >
            Dossiê
          </PwButton>

          {!isMeetingDone && (
            <PwButton
              size="xs"
              variant="secondary"
              icon={Briefcase}
              onClick={() => onOpenRVendas(client, 'SELECT_OUTCOME')}
              tokens={tokens}
            >
              R. Vendas
            </PwButton>
          )}
        </div>

        {currentUser.role === 'admin' && (
          <PwButton
            size="xs"
            variant="secondary"
            icon={ArrowLeftRight}
            onClick={() => onOpenReassign(client)}
            tokens={tokens}
          >
            Reatribuir
          </PwButton>
        )}
      </div>
    </PwCard>
  );
}

/**
 * ============================================================================
 * PÁGINA 1: DASHBOARD (VENDEDOR E ADMINISTRADOR)
 * ============================================================================
 */
function DashboardPage({
  db,
  currentUser,
  onNavigate,
  onConfirmFirstContact,
  onOpenReassign,
  onOpenRVendas,
  onOpenDossier,
  onInspectReport,
  showToast,
  tokens,
}) {
  const [periodFilter, setPeriodFilter] = useState('all');
  const [sellerFilter, setSellerFilter] = useState('all');

  const todayISO = getTodaySaoPauloISO();
  const isAdmin = currentUser.role === 'admin';

  const matchesPeriod = useCallback(
    (isoOrDate) => {
      if (periodFilter === 'all' || !isoOrDate) return true;
      const dateStr = isoOrDate.slice(0, 10);
      if (periodFilter === 'today') return dateStr === todayISO;
      const target = new Date(`${dateStr}T00:00:00Z`).getTime();
      const now = new Date(`${todayISO}T00:00:00Z`).getTime();
      const diffDays = Math.floor((now - target) / 86400000);
      if (periodFilter === '7d') return diffDays >= 0 && diffDays <= 7;
      if (periodFilter === '30d') return diffDays >= 0 && diffDays <= 30;
      return true;
    },
    [periodFilter, todayISO]
  );

  const sellersList = useMemo(() => db.users.filter((u) => u.role === 'seller'), [db.users]);
  const activeSellers = useMemo(() => sellersList.filter((u) => u.status === 'active'), [sellersList]);

  const scopedClients = useMemo(() => {
    return db.clients.filter((c) => {
      if (!isAdmin && c.assignedSellerId !== currentUser.id) return false;
      if (isAdmin && sellerFilter !== 'all' && c.assignedSellerId !== sellerFilter) return false;
      return matchesPeriod(c.createdAt);
    });
  }, [db.clients, isAdmin, currentUser.id, sellerFilter, matchesPeriod]);

  const scopedMeetings = useMemo(() => {
    return db.meetings.filter((m) => {
      if (!isAdmin && m.assignedSellerId !== currentUser.id) return false;
      if (isAdmin && sellerFilter !== 'all' && m.assignedSellerId !== sellerFilter) return false;
      return matchesPeriod(m.scheduledDate);
    });
  }, [db.meetings, isAdmin, currentUser.id, sellerFilter, matchesPeriod]);

  const scopedNoShows = useMemo(() => {
    return db.noShowOccurrences.filter((o) => {
      if (!isAdmin && o.sellerId !== currentUser.id) return false;
      if (isAdmin && sellerFilter !== 'all' && o.sellerId !== sellerFilter) return false;
      return matchesPeriod(o.createdAt);
    });
  }, [db.noShowOccurrences, isAdmin, currentUser.id, sellerFilter, matchesPeriod]);

  const scopedValidSales = useMemo(() => {
    return db.sales.filter((s) => {
      if (s.status === 'cancelled' || s.status === 'refunded') return false;
      if (!isAdmin && s.sellerId !== currentUser.id) return false;
      if (isAdmin && sellerFilter !== 'all' && s.sellerId !== sellerFilter) return false;
      return matchesPeriod(s.saleDate || s.createdAt);
    });
  }, [db.sales, isAdmin, currentUser.id, sellerFilter, matchesPeriod]);

  const contactsDoneCount = scopedClients.filter((c) => c.firstContactStatus === 'completed').length;
  const contactsPendingCount = scopedClients.filter((c) => c.firstContactStatus === 'pending').length;
  const meetingsCompletedCount = scopedMeetings.filter((m) => m.status === 'completed').length;
  const futureMeetingsCount = scopedMeetings.filter(
    (m) => m.status === 'scheduled' && m.scheduledDate >= todayISO
  ).length;
  const overdueOrPendingReportCount = scopedMeetings.filter(
    (m) => m.status === 'scheduled' && m.scheduledDate < todayISO
  ).length;

  const salesCount = scopedValidSales.length;
  const totalSoldValue = scopedValidSales.reduce((acc, s) => acc + (Number(s.value) || 0), 0);
  const totalReceivedValue = scopedValidSales.reduce((acc, s) => acc + (Number(s.receivedValue) || 0), 0);

  // Vendas totais do vendedor (base histórica para comissão e metas)
  const sellerAllValidSales = useMemo(() => {
    const targetId = isAdmin && sellerFilter !== 'all' ? sellerFilter : currentUser.id;
    return db.sales.filter(
      (s) => s.sellerId === targetId && s.status !== 'cancelled' && s.status !== 'refunded'
    );
  }, [db.sales, isAdmin, sellerFilter, currentUser.id]);

  const sellerAllSoldTotal = sellerAllValidSales.reduce((acc, s) => acc + (Number(s.value) || 0), 0);

  const unreadReportsCount = useMemo(() => {
    return [
      ...db.meetingReports.filter((r) => !r.isReadByAdmin),
      ...db.noShowOccurrences.filter((o) => !o.isReadByAdmin),
      ...db.rescheduleRecords.filter((r) => !r.isReadByAdmin),
    ].length;
  }, [db.meetingReports, db.noShowOccurrences, db.rescheduleRecords]);

  // Funil Comercial
  const funnelSteps = [
    {
      label: 'Clientes Atribuídos',
      value: scopedClients.length,
      pct: 100,
      color: '#8017FF',
    },
    {
      label: 'Contatos Realizados',
      value: contactsDoneCount,
      pct: scopedClients.length ? Math.round((contactsDoneCount / scopedClients.length) * 100) : 0,
      color: '#6B21A8',
    },
    {
      label: 'Reuniões de Vendas Realizadas',
      value: meetingsCompletedCount,
      pct: scopedClients.length ? Math.round((meetingsCompletedCount / scopedClients.length) * 100) : 0,
      color: '#B7791F',
    },
    {
      label: 'Vendas Concluídas',
      value: salesCount,
      pct: scopedClients.length ? Math.round((salesCount / scopedClients.length) * 100) : 0,
      color: '#16845B',
    },
  ];

  // Desempenho por Vendedor (Visão Admin)
  const sellerPerformanceRows = useMemo(() => {
    return sellersList.map((seller) => {
      const sClients = db.clients.filter((c) => c.assignedSellerId === seller.id && matchesPeriod(c.createdAt));
      const sContacts = sClients.filter((c) => c.firstContactStatus === 'completed').length;
      const sMeetingsDone = db.meetings.filter(
        (m) => m.assignedSellerId === seller.id && m.status === 'completed' && matchesPeriod(m.scheduledDate)
      ).length;
      const sTrueNoShows = db.noShowOccurrences.filter(
        (o) =>
          o.sellerId === seller.id &&
          o.reason === 'Cliente não compareceu' &&
          matchesPeriod(o.createdAt)
      ).length;
      const attendanceDenom = sMeetingsDone + sTrueNoShows;
      const attendanceRate = attendanceDenom > 0 ? Math.round((sMeetingsDone / attendanceDenom) * 100) : null;

      const sSales = db.sales.filter(
        (s) =>
          s.sellerId === seller.id &&
          s.status !== 'cancelled' &&
          s.status !== 'refunded' &&
          matchesPeriod(s.saleDate || s.createdAt)
      );
      const sSoldTotal = sSales.reduce((acc, s) => acc + (Number(s.value) || 0), 0);

      return {
        seller,
        clientsCount: sClients.length,
        contactsCount: sContacts,
        meetingsDoneCount: sMeetingsDone,
        attendanceRate,
        salesCount: sSales.length,
        soldTotal: sSoldTotal,
      };
    });
  }, [sellersList, db.clients, db.meetings, db.noShowOccurrences, db.sales, matchesPeriod]);

  // Fila "Minhas Próximas Ações" (Vendedor — sequencial)
  const sellerNextActions = useMemo(() => {
    if (isAdmin) return [];
    const actions = [];
    const myClients = db.clients.filter((c) => c.assignedSellerId === currentUser.id);

    myClients
      .filter((c) => c.firstContactStatus === 'pending')
      .forEach((c) => {
        actions.push({
          id: `contact-${c.id}`,
          priority: 1,
          badge: '1ª Pendência',
          variant: 'warning',
          title: `Confirmar WhatsApp: ${c.name} (${c.segment})`,
          subtitle: `Lembrar call marcada para ${formatMeetingSchedule(c.meetingDate, c.meetingTime, true)}.`,
          client: c,
        });
      });

    myClients
      .filter((c) => c.firstContactStatus === 'completed' && c.meetingStatus === 'scheduled')
      .sort((a, b) => `${a.meetingDate} ${a.meetingTime}`.localeCompare(`${b.meetingDate} ${b.meetingTime}`))
      .forEach((c) => {
        const isOverdue = c.meetingDate < todayISO;
        actions.push({
          id: `meeting-${c.id}`,
          priority: isOverdue ? 2 : 3,
          badge: isOverdue ? '2ª Pendência (Atrasada)' : '2ª Pendência',
          variant: isOverdue ? 'error' : 'primary',
          title: `Reunião de Vendas: ${c.name}`,
          subtitle: `${formatMeetingSchedule(c.meetingDate, c.meetingTime, true)}`,
          client: c,
        });
      });

    return actions.sort((a, b) => a.priority - b.priority).slice(0, 6);
  }, [isAdmin, db.clients, currentUser.id, todayISO]);

  // Atividades Recentes (Admin)
  const recentActivities = useMemo(() => {
    const events = [];
    db.clients.forEach((c) => {
      if (sellerFilter !== 'all' && c.assignedSellerId !== sellerFilter) return;
      (c.history || []).forEach((h) => {
        if (!matchesPeriod(h.timestamp)) return;
        events.push({
          id: h.id,
          actor: h.actorName,
          clientName: c.name,
          clientObj: c,
          title: h.title,
          description: h.description,
          timestamp: h.timestamp,
        });
      });
    });
    return events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 12);
  }, [db.clients, sellerFilter, matchesPeriod]);

  const sellerKpis = [
    {
      label: 'Clientes Atribuídos',
      value: scopedClients.length,
      icon: Users,
      accent: tokens.primary,
      onClick: () => onNavigate('clients', { status: 'all' }),
    },
    {
      label: 'Contatos Pendentes',
      value: contactsPendingCount,
      icon: Clock,
      accent: tokens.warning,
      onClick: () => onNavigate('clients', { status: 'pending_contact' }),
    },
    {
      label: 'Contatos Realizados',
      value: contactsDoneCount,
      icon: CheckCircle2,
      accent: tokens.success,
      onClick: () => onNavigate('clients', { status: 'contact_done' }),
    },
    {
      label: 'Reuniões Realizadas',
      value: meetingsCompletedCount,
      icon: Briefcase,
      accent: tokens.primary,
      onClick: () => onNavigate('clients', { status: 'meeting_done' }),
    },
    {
      label: 'Vendas Concluídas',
      value: salesCount,
      icon: Award,
      accent: tokens.success,
      onClick: () => onNavigate('sales'),
    },
    {
      label: 'Valor Vendido',
      value: formatCurrencyBRL(totalSoldValue),
      icon: DollarSign,
      accent: tokens.success,
      onClick: () => onNavigate('sales'),
    },
    {
      label: 'Reuniões Futuras',
      value: futureMeetingsCount,
      icon: Calendar,
      accent: tokens.primary,
      onClick: () => onNavigate('clients', { status: 'future_meeting' }),
    },
    {
      label: 'Reuniões sem Relatório',
      value: overdueOrPendingReportCount,
      icon: AlertTriangle,
      accent: tokens.error,
      onClick: () => onNavigate('clients', { status: 'overdue_meeting' }),
    },
  ];

  const adminKpis = [
    {
      label: 'Vendedores Ativos',
      value: activeSellers.length,
      icon: Users,
      accent: tokens.primary,
      onClick: () => onNavigate('users'),
    },
    {
      label: 'Clientes Cadastrados',
      value: scopedClients.length,
      icon: Building2,
      accent: tokens.primary,
      onClick: () => onNavigate('clients', { status: 'all' }),
    },
    {
      label: 'Contatos Realizados',
      value: contactsDoneCount,
      icon: CheckCircle2,
      accent: tokens.success,
      onClick: () => onNavigate('clients', { status: 'contact_done' }),
    },
    {
      label: 'Reuniões Realizadas',
      value: meetingsCompletedCount,
      icon: Briefcase,
      accent: tokens.primary,
      onClick: () => onNavigate('clients', { status: 'meeting_done' }),
    },
    {
      label: 'Vendas Concluídas',
      value: salesCount,
      icon: Award,
      accent: tokens.success,
      onClick: () => onNavigate('sales'),
    },
    {
      label: 'Valor Vendido',
      value: formatCurrencyBRL(totalSoldValue),
      icon: DollarSign,
      accent: tokens.success,
      onClick: () => onNavigate('sales'),
    },
    {
      label: 'Valor Recebido',
      value: formatCurrencyBRL(totalReceivedValue),
      icon: Wallet,
      accent: tokens.success,
      onClick: () => onNavigate('sales'),
    },
    {
      label: 'Contatos Pendentes',
      value: contactsPendingCount,
      icon: Clock,
      accent: tokens.warning,
      onClick: () => onNavigate('clients', { status: 'pending_contact' }),
    },
    {
      label: 'Reuniões Próximas',
      value: futureMeetingsCount,
      icon: Calendar,
      accent: tokens.primary,
      onClick: () => onNavigate('clients', { status: 'future_meeting' }),
    },
    {
      label: 'Atrasadas / Sem Relatório',
      value: overdueOrPendingReportCount,
      icon: AlertTriangle,
      accent: tokens.error,
      onClick: () => onNavigate('clients', { status: 'overdue_meeting' }),
    },
    {
      label: 'Relatórios Não Lidos',
      value: unreadReportsCount,
      icon: FileSpreadsheet,
      accent: tokens.warning,
      onClick: () => onNavigate('reports'),
    },
  ];

  const kpisToRender = isAdmin ? adminKpis : sellerKpis;

  return (
    <div className="flex flex-col gap-6">
      {/* Barra de Contexto e Filtros */}
      <PwCard tokens={tokens} className="p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs">
          <Filter style={{ color: tokens.primary }} className="w-4 h-4" />
          <span style={{ color: tokens.textPrimary }} className="font-semibold">
            Escopo dos Indicadores:
          </span>
          <PwBadge variant="primary" tokens={tokens}>
            {periodFilter === 'all'
              ? 'Histórico Completo'
              : periodFilter === 'today'
              ? 'Hoje (America/Sao_Paulo)'
              : periodFilter === '7d'
              ? 'Últimos 7 dias'
              : 'Últimos 30 dias'}
          </PwBadge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <select
              value={sellerFilter}
              onChange={(e) => {
                soundEngine.playSfx('click');
                setSellerFilter(e.target.value);
              }}
              style={{
                backgroundColor: tokens.bg,
                borderColor: tokens.border,
                color: tokens.textPrimary,
                borderRadius: 10,
              }}
              className="border px-3 py-1.5 text-xs outline-none"
            >
              <option value="all">Todos os vendedores</option>
              {sellersList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.status !== 'active' ? `(${s.status})` : ''}
                </option>
              ))}
            </select>
          )}

          <div
            style={{ backgroundColor: tokens.bg, borderColor: tokens.border, borderRadius: 10 }}
            className="border p-1 flex items-center gap-1"
          >
            {[
              { id: 'all', label: 'Todo Período' },
              { id: 'today', label: 'Hoje' },
              { id: '7d', label: '7 dias' },
              { id: '30d', label: '30 dias' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  soundEngine.playSfx('click');
                  setPeriodFilter(p.id);
                }}
                style={{
                  backgroundColor: periodFilter === p.id ? 'rgba(128, 23, 255, 0.18)' : 'transparent',
                  color: periodFilter === p.id ? tokens.primary : tokens.textSecondary,
                  borderRadius: 8,
                }}
                className="px-2.5 py-1 text-xs font-medium transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </PwCard>

      {/* Grid de KPIs Clicáveis */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {kpisToRender.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <PwCard
              key={kpi.label}
              tokens={tokens}
              onClick={() => {
                soundEngine.playSfx('click');
                kpi.onClick();
              }}
              className="p-4 flex items-center justify-between group"
            >
              <div>
                <span style={{ color: tokens.textSecondary }} className="text-xs font-medium block">
                  {kpi.label}
                </span>
                <span style={{ color: tokens.textPrimary }} className="text-xl font-semibold mt-1 block">
                  {kpi.value}
                </span>
              </div>
              <div
                style={{
                  backgroundColor: 'rgba(128, 23, 255, 0.12)',
                  color: kpi.accent,
                  borderRadius: 11,
                }}
                className="w-10 h-10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform"
              >
                <Icon className="w-5 h-5" />
              </div>
            </PwCard>
          );
        })}
      </div>

      {/* Painel Contagem de Vendas & Comissão + Funil Comercial */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7">
          <SalesCountAndCommissionCard
            salesCount={sellerAllValidSales.length}
            totalSoldValue={sellerAllSoldTotal}
            tokens={tokens}
          />
        </div>

        {/* Funil Comercial */}
        <PwCard tokens={tokens} className="lg:col-span-5 p-5 flex flex-col justify-between gap-4">
          <div>
            <h3 style={{ color: tokens.textPrimary }} className="text-sm font-semibold">
              {isAdmin ? 'Funil Comercial Geral' : 'Meu Funil Comercial'}
            </h3>
            <p style={{ color: tokens.textSecondary }} className="text-xs mt-0.5">
              Conversão real entre etapas da operação PontoWeb.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {funnelSteps.map((step) => (
              <div key={step.label} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: tokens.textPrimary }} className="font-medium">
                    {step.label}
                  </span>
                  <span style={{ color: tokens.textSecondary }}>
                    <strong style={{ color: tokens.textPrimary }}>{step.value}</strong> ({step.pct}%)
                  </span>
                </div>
                <div
                  style={{ backgroundColor: tokens.bg, borderColor: tokens.border }}
                  className="w-full h-2.5 rounded-full border overflow-hidden"
                >
                  <div
                    style={{
                      width: `${Math.max(step.value > 0 ? 6 : 0, step.pct)}%`,
                      backgroundColor: step.color,
                    }}
                    className="h-full rounded-full transition-all duration-300"
                  />
                </div>
              </div>
            ))}
          </div>
        </PwCard>
      </div>

      {/* Seção Específica por Perfil */}
      {!isAdmin ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Minhas Próximas Ações */}
          <PwCard tokens={tokens} className="lg:col-span-5 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 style={{ color: tokens.textPrimary }} className="text-sm font-semibold">
                  Minhas Próximas Ações
                </h3>
                <p style={{ color: tokens.textSecondary }} className="text-xs mt-0.5">
                  Fila sequencial: 1º WhatsApp, depois Reunião de Vendas.
                </p>
              </div>
              <PwBadge variant="primary" tokens={tokens}>
                {sellerNextActions.length} pendência(s)
              </PwBadge>
            </div>

            {sellerNextActions.length === 0 ? (
              <PwEmptyState
                icon={CheckCircle2}
                title="Tudo em dia!"
                description="Você não possui contatos pendentes nem reuniões aguardando registro."
                tokens={tokens}
              />
            ) : (
              <div className="flex flex-col gap-2.5">
                {sellerNextActions.map((act) => (
                  <div
                    key={act.id}
                    style={{ backgroundColor: tokens.bg, borderColor: tokens.border, borderRadius: 11 }}
                    className="border p-3 flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <PwBadge variant={act.variant} tokens={tokens}>
                          {act.badge}
                        </PwBadge>
                        <p style={{ color: tokens.textPrimary }} className="text-xs font-semibold mt-1.5">
                          {act.title}
                        </p>
                        <p style={{ color: tokens.textSecondary }} className="text-[11px] mt-0.5">
                          {act.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {act.client.firstContactStatus === 'pending' ? (
                        <>
                          <a
                            href={buildWhatsAppLink(act.client.whatsapp, act.client.name)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => soundEngine.playSfx('click')}
                            style={{
                              backgroundColor: '#16845B',
                              color: '#FFFFFF',
                              borderRadius: 9,
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Abrir WhatsApp
                          </a>
                          <PwButton
                            size="xs"
                            icon={Check}
                            onClick={() => onConfirmFirstContact(act.client.id)}
                            tokens={tokens}
                          >
                            Já mandei mensagem
                          </PwButton>
                        </>
                      ) : (
                        <>
                          <PwButton
                            size="xs"
                            icon={CheckCircle2}
                            onClick={() => onOpenRVendas(act.client, 'REPORT')}
                            tokens={tokens}
                          >
                            Já fiz
                          </PwButton>
                          <a
                            href={buildWhatsAppLink(act.client.whatsapp, act.client.name)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => soundEngine.playSfx('click')}
                            style={{
                              backgroundColor: '#16845B',
                              color: '#FFFFFF',
                              borderRadius: 9,
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium"
                          >
                            <ExternalLink className="w-3 h-3" />
                            WhatsApp
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </PwCard>

          {/* Carteira Ativa do Vendedor */}
          <div className="lg:col-span-7 flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <h3 style={{ color: tokens.textPrimary }} className="text-sm font-semibold">
                Meus Clientes Recentes
              </h3>
              <PwButton size="xs" variant="secondary" onClick={() => onNavigate('clients')} tokens={tokens}>
                Ver Todos
              </PwButton>
            </div>

            {scopedClients.length === 0 ? (
              <PwEmptyState
                icon={Users}
                title="Nenhum cliente atribuído neste período"
                description="Assim que o administrador distribuir clientes para sua conta, eles aparecerão aqui em tempo real."
                tokens={tokens}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scopedClients.slice(0, 4).map((client) => (
                  <ClientOperationalCard
                    key={client.id}
                    client={client}
                    db={db}
                    currentUser={currentUser}
                    onConfirmFirstContact={onConfirmFirstContact}
                    onOpenReassign={onOpenReassign}
                    onOpenRVendas={onOpenRVendas}
                    onOpenDossier={onOpenDossier}
                    showToast={showToast}
                    tokens={tokens}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Visão Administrativa: Desempenho por Vendedor + Atividades Recentes */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <PwCard tokens={tokens} className="lg:col-span-7 p-5 flex flex-col gap-4">
            <div>
              <h3 style={{ color: tokens.textPrimary }} className="text-sm font-semibold">
                Desempenho por Vendedor
              </h3>
              <p style={{ color: tokens.textSecondary }} className="text-xs mt-0.5">
                Taxa de comparecimento considera exclusivamente reuniões realizadas vs. faltas presenciais.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr style={{ borderColor: tokens.border, color: tokens.textSecondary }} className="border-b">
                    <th className="py-2.5 pr-3 font-medium">Vendedor</th>
                    <th className="py-2.5 px-2 font-medium text-center">Contatos</th>
                    <th className="py-2.5 px-2 font-medium text-center">Reuniões</th>
                    <th className="py-2.5 px-2 font-medium text-center">Comparecimento</th>
                    <th className="py-2.5 px-2 font-medium text-center">Vendas</th>
                    <th className="py-2.5 pl-2 font-medium text-right">Valor Vendido</th>
                  </tr>
                </thead>
                <tbody>
                  {sellerPerformanceRows.map((row) => (
                    <tr
                      key={row.seller.id}
                      style={{ borderColor: tokens.border }}
                      className="border-b last:border-b-0"
                    >
                      <td className="py-3 pr-3">
                        <span style={{ color: tokens.textPrimary }} className="font-semibold block">
                          {dataEngine.resolveUserLabel(db, row.seller.id, row.seller.name)}
                        </span>
                        <span style={{ color: tokens.textSecondary }} className="text-[11px]">
                          {row.clientsCount} cliente(s) na carteira
                        </span>
                      </td>
                      <td style={{ color: tokens.textPrimary }} className="py-3 px-2 text-center font-medium">
                        {row.contactsCount}
                      </td>
                      <td style={{ color: tokens.textPrimary }} className="py-3 px-2 text-center font-medium">
                        {row.meetingsDoneCount}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {row.attendanceRate === null ? (
                          <span style={{ color: tokens.textSecondary }}>—</span>
                        ) : (
                          <PwBadge
                            variant={row.attendanceRate >= 70 ? 'success' : 'warning'}
                            tokens={tokens}
                          >
                            {row.attendanceRate}%
                          </PwBadge>
                        )}
                      </td>
                      <td style={{ color: tokens.textPrimary }} className="py-3 px-2 text-center font-semibold">
                        {row.salesCount}
                      </td>
                      <td style={{ color: tokens.success }} className="py-3 pl-2 text-right font-semibold">
                        {formatCurrencyBRL(row.soldTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </PwCard>

          <PwCard tokens={tokens} className="lg:col-span-5 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 style={{ color: tokens.textPrimary }} className="text-sm font-semibold">
                  Atividades Recentes
                </h3>
                <p style={{ color: tokens.textSecondary }} className="text-xs mt-0.5">
                  Linha cronológica consolidada da operação.
                </p>
              </div>
              <PwBadge variant="neutral" tokens={tokens}>
                {recentActivities.length}
              </PwBadge>
            </div>

            {recentActivities.length === 0 ? (
              <PwEmptyState
                icon={Activity}
                title="Sem atividades no período"
                description="Cadastre clientes ou altere o filtro de período para visualizar eventos."
                tokens={tokens}
              />
            ) : (
              <div className="flex flex-col gap-2.5 max-h-96 overflow-y-auto pr-1">
                {recentActivities.map((act) => (
                  <div
                    key={act.id}
                    onClick={() => {
                      soundEngine.playSfx('click');
                      onOpenDossier(act.clientObj);
                    }}
                    style={{ backgroundColor: tokens.bg, borderColor: tokens.border, borderRadius: 10 }}
                    className="border p-3 text-xs cursor-pointer hover:border-[#8017FF] transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span style={{ color: tokens.primary }} className="font-semibold">
                        {act.title}
                      </span>
                      <span style={{ color: tokens.textSecondary }} className="text-[10px]">
                        {formatSaoPauloDateTime(act.timestamp)}
                      </span>
                    </div>
                    <p style={{ color: tokens.textPrimary }} className="font-medium mt-0.5">
                      Cliente: {act.clientName}
                    </p>
                    <p style={{ color: tokens.textSecondary }} className="text-[11px] mt-0.5 line-clamp-2">
                      {act.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </PwCard>
        </div>
      )}
    </div>
  );
}

/**
 * ============================================================================
 * PÁGINA 2: CLIENTES E CONTATOS (CADASTRO ADMIN + FILTROS + CARTEIRA)
 * ============================================================================
 */
function ClientsAndContactsPage({
  db,
  currentUser,
  initialStatusFilter = 'all',
  onConfirmFirstContact,
  onOpenReassign,
  onOpenRVendas,
  onOpenDossier,
  showToast,
  tokens,
}) {
  const isAdmin = currentUser.role === 'admin';
  const todayISO = getTodaySaoPauloISO();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState('');
  const [segment, setSegment] = useState('');
  const [whatsapp, setWhatsapp] = useState('+55 ');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [sellerId, setSellerId] = useState('');
  const [notes, setNotes] = useState('');
  const [creating, setCreating] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('all');
  const [sellerFilter, setSellerFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [periodFilter, setPeriodFilter] = useState('all');

  useEffect(() => {
    setStatusFilter(initialStatusFilter || 'all');
  }, [initialStatusFilter]);

  const activeSellers = useMemo(
    () => db.users.filter((u) => u.role === 'seller' && u.status === 'active'),
    [db.users]
  );

  useEffect(() => {
    if (!sellerId && activeSellers.length > 0) {
      setSellerId(activeSellers[0].id);
    }
  }, [activeSellers, sellerId]);

  const handleCreateClient = (e) => {
    e.preventDefault();
    setCreating(true);
    const res = dataEngine.createAndDistributeClient(currentUser, {
      name,
      segment,
      whatsapp,
      meetingDate,
      meetingTime,
      sellerId,
      notes,
    });
    setCreating(false);

    if (!res.ok) {
      soundEngine.playSfx('error');
      showToast('error', 'Validação de cadastro', res.message);
      return;
    }

    soundEngine.playSfx('success');
    showToast(
      'success',
      'Cliente cadastrado e distribuído',
      `${res.client.name} atribuído a ${res.client.assignedSellerName} com reunião em ${formatMeetingSchedule(
        res.client.meetingDate,
        res.client.meetingTime,
        true
      )}.`
    );
    setName('');
    setSegment('');
    setWhatsapp('+55 ');
    setMeetingDate('');
    setMeetingTime('');
    setNotes('');
    setShowCreateForm(false);
  };

  const uniqueSegments = useMemo(() => {
    const set = new Set();
    db.clients.forEach((c) => {
      if (isAdmin || c.assignedSellerId === currentUser.id) {
        if (c.segment) set.add(c.segment);
      }
    });
    return Array.from(set).sort();
  }, [db.clients, isAdmin, currentUser.id]);

  const filteredClients = useMemo(() => {
    return db.clients.filter((c) => {
      if (!isAdmin && c.assignedSellerId !== currentUser.id) return false;
      if (isAdmin && sellerFilter !== 'all' && c.assignedSellerId !== sellerFilter) return false;
      if (segmentFilter !== 'all' && c.segment !== segmentFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = c.name.toLowerCase().includes(q);
        const matchPhone = c.whatsapp.includes(q.replace(/\D/g, '') || q);
        if (!matchName && !matchPhone) return false;
      }

      if (statusFilter === 'pending_contact' && c.firstContactStatus !== 'pending') return false;
      if (statusFilter === 'contact_done' && c.firstContactStatus !== 'completed') return false;
      if (
        statusFilter === 'future_meeting' &&
        !(c.meetingStatus === 'scheduled' && c.meetingDate >= todayISO)
      )
        return false;
      if (
        statusFilter === 'overdue_meeting' &&
        !(c.meetingStatus === 'scheduled' && c.meetingDate < todayISO)
      )
        return false;
      if (statusFilter === 'meeting_done' && c.meetingStatus !== 'completed') return false;
      if (statusFilter === 'sale_won' && !c.hasSale) return false;

      if (periodFilter !== 'all') {
        const dStr = c.createdAt.slice(0, 10);
        if (periodFilter === 'today' && dStr !== todayISO) return false;
        const diff = Math.floor(
          (new Date(`${todayISO}T00:00:00Z`).getTime() - new Date(`${dStr}T00:00:00Z`).getTime()) /
            86400000
        );
        if (periodFilter === '7d' && (diff < 0 || diff > 7)) return false;
        if (periodFilter === '30d' && (diff < 0 || diff > 30)) return false;
      }

      return true;
    });
  }, [
    db.clients,
    isAdmin,
    currentUser.id,
    sellerFilter,
    segmentFilter,
    searchQuery,
    statusFilter,
    periodFilter,
    todayISO,
  ]);

  return (
    <div className="flex flex-col gap-5">
      {/* Cabeçalho de Ações */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 style={{ color: tokens.textPrimary }} className="text-base font-semibold">
            {isAdmin ? 'Carteira Geral & Distribuição de Clientes' : 'Meus Clientes & Contatos'}
          </h2>
          <p style={{ color: tokens.textSecondary }} className="text-xs mt-0.5">
            {filteredClients.length} cliente(s) exibido(s) conforme os filtros ativos.
          </p>
        </div>

        {isAdmin && (
          <PwButton
            icon={showCreateForm ? X : UserPlus}
            variant={showCreateForm ? 'secondary' : 'primary'}
            onClick={() => setShowCreateForm((v) => !v)}
            tokens={tokens}
          >
            {showCreateForm ? 'Fechar Formulário' : 'Cadastrar & Distribuir Cliente'}
          </PwButton>
        )}
      </div>

      {/* Formulário Administrativo de Cadastro e Distribuição */}
      {isAdmin && showCreateForm && (
        <PwCard tokens={tokens} glow className="p-5">
          <div className="mb-4">
            <h3 style={{ color: tokens.textPrimary }} className="text-sm font-semibold">
              Novo Cliente — Distribuição Atômica (America/Sao_Paulo)
            </h3>
            <p style={{ color: tokens.textSecondary }} className="text-xs mt-0.5">
              Cria simultaneamente o cadastro, a tarefa de primeiro contato e o agendamento único da Reunião de Vendas.
            </p>
          </div>

          <form onSubmit={handleCreateClient} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PwInput
              label="Nome do cliente"
              id="cli-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Maria, Gabriel..."
              icon={User}
              tokens={tokens}
            />
            <PwInput
              label="Segmento da empresa"
              id="cli-segment"
              required
              value={segment}
              onChange={(e) => setSegment(e.target.value)}
              placeholder="Ex: Clínica Odontológica / Advocacia"
              icon={Building2}
              tokens={tokens}
            />
            <PwInput
              label="WhatsApp com código do país"
              id="cli-whatsapp"
              required
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="+55 11 99999-9999"
              icon={Phone}
              tokens={tokens}
            />
            <PwInput
              label="Data da reunião de vendas"
              id="cli-date"
              type="date"
              required
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              tokens={tokens}
            />
            <PwInput
              label="Horário da reunião (America/Sao_Paulo)"
              id="cli-time"
              type="time"
              required
              value={meetingTime}
              onChange={(e) => setMeetingTime(e.target.value)}
              tokens={tokens}
            />
            <PwSelect
              label="Vendedor responsável (ativos)"
              id="cli-seller"
              required
              value={sellerId}
              onChange={(e) => setSellerId(e.target.value)}
              options={
                activeSellers.length === 0
                  ? [{ value: '', label: 'Nenhum vendedor ativo disponível' }]
                  : activeSellers.map((s) => ({
                      value: s.id,
                      label: `${s.name} (${s.email})`,
                    }))
              }
              tokens={tokens}
            />
            <div className="md:col-span-3">
              <PwTextarea
                label="Observações (opcionais)"
                id="cli-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contexto inicial do lead, origem ou observações para o vendedor..."
                tokens={tokens}
              />
            </div>
            <div className="md:col-span-3 flex justify-end gap-2">
              <PwButton type="button" variant="ghost" onClick={() => setShowCreateForm(false)} tokens={tokens}>
                Cancelar
              </PwButton>
              <PwButton type="submit" loading={creating} icon={Send} tokens={tokens}>
                Enviar e Distribuir
              </PwButton>
            </div>
          </form>
        </PwCard>
      )}

      {/* Barra de Filtros */}
      <PwCard tokens={tokens} className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <PwInput
          id="filter-search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por nome ou WhatsApp..."
          icon={Search}
          tokens={tokens}
        />

        <PwSelect
          id="filter-segment"
          value={segmentFilter}
          onChange={(e) => setSegmentFilter(e.target.value)}
          options={[
            { value: 'all', label: 'Todos os segmentos' },
            ...uniqueSegments.map((seg) => ({ value: seg, label: seg })),
          ]}
          tokens={tokens}
        />

        {isAdmin && (
          <PwSelect
            id="filter-seller"
            value={sellerFilter}
            onChange={(e) => setSellerFilter(e.target.value)}
            options={[
              { value: 'all', label: 'Todos os vendedores' },
              ...db.users
                .filter((u) => u.role === 'seller')
                .map((u) => ({
                  value: u.id,
                  label: dataEngine.resolveUserLabel(db, u.id, u.name),
                })),
            ]}
            tokens={tokens}
          />
        )}

        <PwSelect
          id="filter-status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: 'all', label: 'Todos os status' },
            { value: 'pending_contact', label: '1ª Pendência: Confirmar WhatsApp' },
            { value: 'contact_done', label: 'WhatsApp confirmado' },
            { value: 'future_meeting', label: 'Reunião futura' },
            { value: 'overdue_meeting', label: 'Reunião atrasada / sem relatório' },
            { value: 'meeting_done', label: 'Reunião realizada' },
            { value: 'sale_won', label: 'Venda concluída' },
          ]}
          tokens={tokens}
        />

        <PwSelect
          id="filter-period"
          value={periodFilter}
          onChange={(e) => setPeriodFilter(e.target.value)}
          options={[
            { value: 'all', label: 'Qualquer data' },
            { value: 'today', label: 'Cadastrados hoje' },
            { value: '7d', label: 'Últimos 7 dias' },
            { value: '30d', label: 'Últimos 30 dias' },
          ]}
          tokens={tokens}
        />
      </PwCard>

      {/* Grid de Clientes */}
      {filteredClients.length === 0 ? (
        <PwEmptyState
          icon={Users}
          title="Nenhum cliente encontrado"
          description="Ajuste os filtros acima ou cadastre um novo cliente para iniciar o fluxo comercial."
          tokens={tokens}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <ClientOperationalCard
              key={client.id}
              client={client}
              db={db}
              currentUser={currentUser}
              onConfirmFirstContact={onConfirmFirstContact}
              onOpenReassign={onOpenReassign}
              onOpenRVendas={onOpenRVendas}
              onOpenDossier={onOpenDossier}
              showToast={showToast}
              tokens={tokens}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * ============================================================================
 * PÁGINA 3: REUNIÕES DE VENDAS (MÓDULO ÚNICO)
 * ============================================================================
 */
function SalesMeetingsPage({ db, currentUser, onOpenRVendas, onOpenDossier, tokens }) {
  const isAdmin = currentUser.role === 'admin';
  const [statusTab, setStatusTab] = useState('scheduled');

  const meetings = useMemo(() => {
    return db.meetings
      .filter((m) => (isAdmin ? true : m.assignedSellerId === currentUser.id))
      .filter((m) => (statusTab === 'all' ? true : m.status === statusTab))
      .sort((a, b) => `${a.scheduledDate} ${a.scheduledTime}`.localeCompare(`${b.scheduledDate} ${b.scheduledTime}`));
  }, [db.meetings, isAdmin, currentUser.id, statusTab]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 style={{ color: tokens.textPrimary }} className="text-base font-semibold">
            Reuniões de Vendas (Módulo Único)
          </h2>
          <p style={{ color: tokens.textSecondary }} className="text-xs mt-0.5">
            Qualificação, apresentação, negociação e fechamento consolidados em uma única call por ciclo comercial.
          </p>
        </div>

        <div
          style={{ backgroundColor: tokens.surface, borderColor: tokens.border, borderRadius: 11 }}
          className="border p-1 flex items-center gap-1"
        >
          {[
            { id: 'scheduled', label: 'Agendadas' },
            { id: 'completed', label: 'Realizadas' },
            { id: 'no_show', label: 'Vácuos' },
            { id: 'all', label: 'Todas' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                soundEngine.playSfx('click');
                setStatusTab(tab.id);
              }}
              style={{
                backgroundColor: statusTab === tab.id ? 'rgba(128, 23, 255, 0.16)' : 'transparent',
                color: statusTab === tab.id ? tokens.primary : tokens.textSecondary,
                borderRadius: 8,
              }}
              className="px-3 py-1.5 text-xs font-medium transition-colors"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {meetings.length === 0 ? (
        <PwEmptyState
          icon={Calendar}
          title="Nenhuma reunião nesta categoria"
          description="As reuniões de vendas criadas na distribuição de clientes aparecem aqui automaticamente."
          tokens={tokens}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {meetings.map((m) => {
            const client = db.clients.find((c) => c.id === m.clientId);
            const sellerLabel = dataEngine.resolveUserLabel(db, m.assignedSellerId, m.assignedSellerName);

            return (
              <PwCard key={m.id} tokens={tokens} className="p-5 flex flex-col justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 style={{ color: tokens.textPrimary }} className="text-sm font-semibold">
                        {m.clientName}
                      </h4>
                      <span style={{ color: tokens.textSecondary }} className="text-xs">
                        {m.clientSegment}
                      </span>
                    </div>
                    <PwBadge
                      variant={
                        m.status === 'completed' ? 'success' : m.status === 'no_show' ? 'warning' : 'primary'
                      }
                      tokens={tokens}
                    >
                      {m.status === 'completed'
                        ? 'Realizada'
                        : m.status === 'no_show'
                        ? 'Vácuo'
                        : 'Agendada'}
                    </PwBadge>
                  </div>

                  <div
                    style={{ backgroundColor: tokens.bg, borderColor: tokens.border, borderRadius: 10 }}
                    className="border p-3 text-xs flex flex-col gap-1.5"
                  >
                    <div className="flex justify-between">
                      <span style={{ color: tokens.textSecondary }}>Data e horário:</span>
                      <strong style={{ color: tokens.textPrimary }}>
                        {formatMeetingSchedule(m.scheduledDate, m.scheduledTime, true)}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: tokens.textSecondary }}>Vendedor:</span>
                      <strong style={{ color: tokens.textPrimary }}>{sellerLabel}</strong>
                    </div>
                    {m.rescheduleCount > 0 && (
                      <div className="flex justify-between">
                        <span style={{ color: tokens.textSecondary }}>Reagendamentos:</span>
                        <strong style={{ color: tokens.warning }}>{m.rescheduleCount}x</strong>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  {client && (
                    <PwButton
                      size="xs"
                      variant="secondary"
                      icon={FileText}
                      onClick={() => onOpenDossier(client)}
                      tokens={tokens}
                    >
                      Dossiê
                    </PwButton>
                  )}

                  {m.status !== 'completed' && client && (
                    <PwButton
                      size="xs"
                      icon={Briefcase}
                      onClick={() => onOpenRVendas(client, 'SELECT_OUTCOME')}
                      tokens={tokens}
                    >
                      R. Vendas
                    </PwButton>
                  )}
                </div>
              </PwCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * ============================================================================
 * PÁGINA 4: VENDAS (CONTROLE FINANCEIRO: VALOR VENDIDO vs VALOR RECEBIDO)
 * ============================================================================
 */
function SalesPage({ db, currentUser, onRefresh, showToast, tokens }) {
  const isAdmin = currentUser.role === 'admin';
  const [editingSale, setEditingSale] = useState(null);
  const [editStatus, setEditStatus] = useState('completed');
  const [editReceived, setEditReceived] = useState('0');
  const [editMethod, setEditMethod] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const visibleSales = useMemo(() => {
    return db.sales.filter((s) => (isAdmin ? true : s.sellerId === currentUser.id));
  }, [db.sales, isAdmin, currentUser.id]);

  const validSales = visibleSales.filter((s) => s.status !== 'cancelled' && s.status !== 'refunded');
  const totalSold = validSales.reduce((acc, s) => acc + (Number(s.value) || 0), 0);
  const totalReceived = validSales.reduce((acc, s) => acc + (Number(s.receivedValue) || 0), 0);
  const pendingToReceive = Math.max(0, totalSold - totalReceived);

  const openEditModal = (sale) => {
    setEditingSale(sale);
    setEditStatus(sale.status);
    setEditReceived(String(sale.receivedValue || 0));
    setEditMethod(sale.paymentMethod || 'PIX');
    setEditNotes(sale.notes || '');
  };

  const handleSaveFinancials = (e) => {
    e.preventDefault();
    if (!editingSale) return;
    setSaving(true);
    const res = dataEngine.updateSaleFinancials(currentUser, editingSale.id, {
      status: editStatus,
      receivedValue: editReceived,
      paymentMethod: editMethod,
      notes: editNotes,
    });
    setSaving(false);

    if (!res.ok) {
      soundEngine.playSfx('error');
      showToast('error', 'Erro ao atualizar venda', res.message);
      return;
    }

    soundEngine.playSfx('success');
    showToast('success', 'Controle financeiro atualizado', 'Valores e status registrados com sucesso.');
    setEditingSale(null);
    onRefresh();
  };

  const statusBadgeMap = {
    completed: { label: 'Concluída', variant: 'success' },
    pending_payment: { label: 'Pagamento pendente', variant: 'warning' },
    cancelled: { label: 'Cancelada', variant: 'error' },
    refunded: { label: 'Reembolsada', variant: 'error' },
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <PwCard tokens={tokens} className="p-4">
          <span style={{ color: tokens.textSecondary }} className="text-xs font-medium">
            Valor Vendido (Negociações Válidas)
          </span>
          <strong style={{ color: tokens.textPrimary }} className="text-xl font-semibold mt-1 block">
            {formatCurrencyBRL(totalSold)}
          </strong>
          <span style={{ color: tokens.textSecondary }} className="text-[11px] mt-1 block">
            {validSales.length} venda(s) ativa(s)
          </span>
        </PwCard>

        <PwCard tokens={tokens} className="p-4">
          <span style={{ color: tokens.textSecondary }} className="text-xs font-medium">
            Valor Recebido (Efetivamente Pago)
          </span>
          <strong style={{ color: tokens.success }} className="text-xl font-semibold mt-1 block">
            {formatCurrencyBRL(totalReceived)}
          </strong>
          <span style={{ color: tokens.textSecondary }} className="text-[11px] mt-1 block">
            Separado do valor contratado
          </span>
        </PwCard>

        <PwCard tokens={tokens} className="p-4">
          <span style={{ color: tokens.textSecondary }} className="text-xs font-medium">
            Saldo a Receber
          </span>
          <strong style={{ color: tokens.warning }} className="text-xl font-semibold mt-1 block">
            {formatCurrencyBRL(pendingToReceive)}
          </strong>
          <span style={{ color: tokens.textSecondary }} className="text-[11px] mt-1 block">
            Aguardando liquidação financeira
          </span>
        </PwCard>
      </div>

      {visibleSales.length === 0 ? (
        <PwEmptyState
          icon={DollarSign}
          title="Nenhuma venda registrada ainda"
          description="As vendas concluídas durante a Reunião de Vendas aparecem automaticamente aqui."
          tokens={tokens}
        />
      ) : (
        <PwCard tokens={tokens} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr style={{ borderColor: tokens.border, color: tokens.textSecondary }} className="border-b">
                  <th className="p-3.5 font-medium">Cliente</th>
                  {isAdmin && <th className="p-3.5 font-medium">Vendedor</th>}
                  <th className="p-3.5 font-medium">Data</th>
                  <th className="p-3.5 font-medium">Serviço / Modalidade</th>
                  <th className="p-3.5 font-medium text-right">Valor Vendido</th>
                  <th className="p-3.5 font-medium text-right">Valor Recebido</th>
                  <th className="p-3.5 font-medium">Status</th>
                  <th className="p-3.5 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {visibleSales.map((sale) => {
                  const badge = statusBadgeMap[sale.status] || { label: sale.status, variant: 'neutral' };
                  const sellerLabel = dataEngine.resolveUserLabel(db, sale.sellerId, sale.sellerName);

                  return (
                    <tr
                      key={sale.id}
                      style={{ borderColor: tokens.border }}
                      className="border-b last:border-b-0"
                    >
                      <td className="p-3.5">
                        <strong style={{ color: tokens.textPrimary }} className="block">
                          {sale.clientName}
                        </strong>
                        <span style={{ color: tokens.textSecondary }} className="text-[11px]">
                          {sale.paymentMethod}
                        </span>
                      </td>
                      {isAdmin && (
                        <td style={{ color: tokens.textPrimary }} className="p-3.5">
                          {sellerLabel}
                        </td>
                      )}
                      <td style={{ color: tokens.textSecondary }} className="p-3.5">
                        {formatMeetingSchedule(sale.saleDate, '')}
                      </td>
                      <td style={{ color: tokens.textPrimary }} className="p-3.5">
                        Site • {sale.paymentStructure === '50_50' ? '50/50' : 'Imediato'}
                      </td>
                      <td style={{ color: tokens.textPrimary }} className="p-3.5 text-right font-semibold">
                        {formatCurrencyBRL(sale.value)}
                      </td>
                      <td style={{ color: tokens.success }} className="p-3.5 text-right font-semibold">
                        {formatCurrencyBRL(sale.receivedValue || 0)}
                      </td>
                      <td className="p-3.5">
                        <PwBadge variant={badge.variant} tokens={tokens}>
                          {badge.label}
                        </PwBadge>
                      </td>
                      <td className="p-3.5 text-right">
                        <PwButton
                          size="xs"
                          variant="secondary"
                          icon={CreditCard}
                          onClick={() => openEditModal(sale)}
                          tokens={tokens}
                        >
                          Gerenciar
                        </PwButton>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </PwCard>
      )}

      <PwModal
        isOpen={Boolean(editingSale)}
        onClose={() => setEditingSale(null)}
        title={`Controle Financeiro — ${editingSale?.clientName || ''}`}
        subtitle={`Valor vendido contratado: ${formatCurrencyBRL(editingSale?.value || 0)}`}
        tokens={tokens}
      >
        {editingSale && (
          <form onSubmit={handleSaveFinancials} className="flex flex-col gap-4">
            <PwSelect
              label="Status financeiro"
              id="edit-sale-status"
              required
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              options={[
                { value: 'completed', label: 'Concluída' },
                { value: 'pending_payment', label: 'Pagamento pendente' },
                { value: 'cancelled', label: 'Cancelada' },
                { value: 'refunded', label: 'Reembolsada' },
              ]}
              tokens={tokens}
            />
            <PwInput
              label="Valor efetivamente recebido (R$)"
              id="edit-sale-received"
              type="number"
              required
              value={editReceived}
              onChange={(e) => setEditReceived(e.target.value)}
              hint={`Máximo permitido: ${formatCurrencyBRL(editingSale.value)}`}
              tokens={tokens}
            />
            <PwInput
              label="Forma de pagamento"
              id="edit-sale-method"
              value={editMethod}
              onChange={(e) => setEditMethod(e.target.value)}
              tokens={tokens}
            />
            <PwTextarea
              label="Observações financeiras"
              id="edit-sale-notes"
              rows={2}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              tokens={tokens}
            />
            <div className="flex justify-end gap-2 pt-2">
              <PwButton type="button" variant="ghost" onClick={() => setEditingSale(null)} tokens={tokens}>
                Cancelar
              </PwButton>
              <PwButton type="submit" loading={saving} icon={CheckCircle2} tokens={tokens}>
                Salvar Alterações
              </PwButton>
            </div>
          </form>
        )}
      </PwModal>
    </div>
  );
}

/**
 * ============================================================================
 * PÁGINA 5: RELATÓRIOS & OCORRÊNCIAS
 * ============================================================================
 */
function ReportsPage({ db, currentUser, onInspectRecord, onOpenDossier, tokens }) {
  const isAdmin = currentUser.role === 'admin';
  const [typeFilter, setTypeFilter] = useState('all');

  const unifiedFeed = useMemo(() => {
    const list = [
      ...db.meetingReports.map((r) => ({ ...r, recordType: 'MEETING_REPORT' })),
      ...db.noShowOccurrences.map((o) => ({ ...o, recordType: 'NO_SHOW' })),
      ...db.rescheduleRecords.map((rs) => ({ ...rs, recordType: 'RESCHEDULE' })),
    ];

    return list
      .filter((item) => (isAdmin ? true : item.sellerId === currentUser.id))
      .filter((item) => (typeFilter === 'all' ? true : item.recordType === typeFilter))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [db.meetingReports, db.noShowOccurrences, db.rescheduleRecords, isAdmin, currentUser.id, typeFilter]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 style={{ color: tokens.textPrimary }} className="text-base font-semibold">
            {isAdmin ? 'Central de Relatórios & Ocorrências' : 'Meus Relatórios & Ocorrências'}
          </h2>
          <p style={{ color: tokens.textSecondary }} className="text-xs mt-0.5">
            Ordenados do mais recente para o mais antigo.
          </p>
        </div>

        <div
          style={{ backgroundColor: tokens.surface, borderColor: tokens.border, borderRadius: 11 }}
          className="border p-1 flex flex-wrap items-center gap-1"
        >
          {[
            { id: 'all', label: 'Todos' },
            { id: 'MEETING_REPORT', label: 'Registros de Dados' },
            { id: 'NO_SHOW', label: 'Vácuos' },
            { id: 'RESCHEDULE', label: 'Reagendamentos' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                soundEngine.playSfx('click');
                setTypeFilter(tab.id);
              }}
              style={{
                backgroundColor: typeFilter === tab.id ? 'rgba(128, 23, 255, 0.16)' : 'transparent',
                color: typeFilter === tab.id ? tokens.primary : tokens.textSecondary,
                borderRadius: 8,
              }}
              className="px-3 py-1.5 text-xs font-medium transition-colors"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {unifiedFeed.length === 0 ? (
        <PwEmptyState
          icon={FileSpreadsheet}
          title="Nenhum registro encontrado"
          description="Quando uma reunião for concluída, reagendada ou marcada como vácuo, o registro aparecerá aqui."
          tokens={tokens}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {unifiedFeed.map((item) => {
            const client = db.clients.find((c) => c.id === item.clientId);
            const sellerLabel = dataEngine.resolveUserLabel(db, item.sellerId, item.sellerName);
            const isReport = item.recordType === 'MEETING_REPORT';
            const isNoShow = item.recordType === 'NO_SHOW';

            return (
              <PwCard
                key={item.id}
                tokens={tokens}
                glow={isAdmin && !item.isReadByAdmin}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <PwBadge
                      variant={isReport ? 'success' : isNoShow ? 'warning' : 'primary'}
                      tokens={tokens}
                    >
                      {isReport
                        ? 'Registro dos Dados & Venda'
                        : isNoShow
                        ? `Vácuo (${item.reason})`
                        : 'Reagendamento'}
                    </PwBadge>

                    {isAdmin && (
                      <PwBadge variant={item.isReadByAdmin ? 'neutral' : 'error'} tokens={tokens}>
                        {item.isReadByAdmin ? 'Lido' : 'Não lido'}
                      </PwBadge>
                    )}

                    <span style={{ color: tokens.textSecondary }} className="text-[11px]">
                      {formatSaoPauloDateTime(item.createdAt)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <strong style={{ color: tokens.textPrimary }} className="text-sm">
                      {item.clientName}
                    </strong>
                    <span style={{ color: tokens.textSecondary }} className="text-xs">
                      • Vendedor: {sellerLabel}
                    </span>
                  </div>

                  {isReport && item.saleInfo && (
                    <p style={{ color: tokens.textSecondary }} className="text-xs">
                      Vendido: <strong style={{ color: tokens.textPrimary }}>{formatCurrencyBRL(item.saleInfo.saleValue)}</strong> • Domínio: <strong style={{ color: tokens.primary }}>{item.sectionC?.domainProvider}</strong>
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {client && (
                    <PwButton
                      size="xs"
                      variant="secondary"
                      icon={User}
                      onClick={() => onOpenDossier(client)}
                      tokens={tokens}
                    >
                      Cliente
                    </PwButton>
                  )}
                  <PwButton
                    size="xs"
                    icon={Eye}
                    onClick={() => onInspectRecord(item)}
                    tokens={tokens}
                  >
                    Abrir Conteúdo
                  </PwButton>
                </div>
              </PwCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * ============================================================================
 * PÁGINA 6: GESTÃO DE USUÁRIOS (EXCLUSIVO ADMINISTRADOR)
 * ============================================================================
 */
function UsersManagementPage({ db, currentUser, onRefresh, showToast, tokens }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [creating, setCreating] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [transferToSellerId, setTransferToSellerId] = useState('');
  const [deleting, setDeleting] = useState(false);

  if (currentUser.role !== 'admin') {
    return (
      <PwEmptyState
        icon={Shield}
        title="Acesso Restrito ao Administrador"
        description="Seu perfil de vendedor não possui autorização para gerenciar contas."
        tokens={tokens}
      />
    );
  }

  const handleAddSeller = async (e) => {
    e.preventDefault();
    setCreating(true);
    const res = await dataEngine.createSellerAccount({
      name,
      email,
      password,
      createdBy: currentUser.email,
    });
    setCreating(false);

    if (!res.ok) {
      soundEngine.playSfx('error');
      showToast('error', 'Erro ao adicionar vendedor', res.message);
      return;
    }

    soundEngine.playSfx('success');
    showToast('success', 'Vendedor adicionado', `${res.user.name} criado com perfil de Vendedor.`);
    setName('');
    setEmail('');
    setPassword('');
    onRefresh();
  };

  const handleToggleStatus = (user) => {
    const nextStatus = user.status === 'active' ? 'inactive' : 'active';
    const res = dataEngine.setUserStatus(currentUser, user.id, nextStatus);
    if (!res.ok) {
      soundEngine.playSfx('error');
      showToast('error', 'Operação bloqueada', res.message);
      return;
    }
    soundEngine.playSfx('warning');
    showToast(
      'info',
      nextStatus === 'inactive' ? 'Conta desativada' : 'Conta reativada',
      `O status de ${user.email} foi atualizado e sincronizado imediatamente.`
    );
    onRefresh();
  };

  const handleConfirmDelete = (e) => {
    e.preventDefault();
    if (!deleteTarget) return;
    setDeleting(true);
    const res = dataEngine.deleteUserAccount(currentUser, deleteTarget.id, transferToSellerId);
    setDeleting(false);

    if (!res.ok) {
      soundEngine.playSfx('error');
      showToast('error', 'Erro ao excluir conta', res.message);
      return;
    }

    soundEngine.playSfx('warning');
    showToast(
      'success',
      'Conta excluída com preservação histórica',
      `A conta foi encerrada e ${res.transferredCount} cliente(s) em andamento foram transferidos.`
    );
    setDeleteTarget(null);
    setTransferToSellerId('');
    onRefresh();
  };

  const otherActiveSellers = db.users.filter(
    (u) => u.role === 'seller' && u.status === 'active' && u.id !== deleteTarget?.id
  );

  return (
    <div className="flex flex-col gap-6">
      <PwCard tokens={tokens} className="p-5">
        <h3 style={{ color: tokens.textPrimary }} className="text-sm font-semibold mb-1">
          Adicionar Nova Conta de Vendedor
        </h3>
        <p style={{ color: tokens.textSecondary }} className="text-xs mb-4">
          Todas as novas contas recebem automaticamente o perfil de Vendedor, com isolamento de carteira.
        </p>

        <form onSubmit={handleAddSeller} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <PwInput
            label="Nome completo"
            id="usr-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome do vendedor"
            tokens={tokens}
          />
          <PwInput
            label="E-mail corporativo"
            id="usr-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vendedor@pontoweb.com"
            tokens={tokens}
          />
          <PwInput
            label="Senha inicial (mín. 8 caracteres)"
            id="usr-pass"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            tokens={tokens}
          />
          <PwButton type="submit" loading={creating} icon={UserPlus} tokens={tokens}>
            Adicionar Vendedor
          </PwButton>
        </form>
      </PwCard>

      <PwCard tokens={tokens} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr style={{ borderColor: tokens.border, color: tokens.textSecondary }} className="border-b">
                <th className="p-3.5 font-medium">Usuário</th>
                <th className="p-3.5 font-medium">Perfil</th>
                <th className="p-3.5 font-medium">Status</th>
                <th className="p-3.5 font-medium">Criado em</th>
                <th className="p-3.5 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {db.users.map((u) => {
                const isSelf = u.id === currentUser.id;
                const isDeleted = u.status === 'deleted';

                return (
                  <tr
                    key={u.id}
                    style={{ borderColor: tokens.border }}
                    className="border-b last:border-b-0"
                  >
                    <td className="p-3.5">
                      <strong style={{ color: tokens.textPrimary }} className="block">
                        {u.status === 'deleted' ? `${u.name} (conta excluída)` : u.name}
                      </strong>
                      <span style={{ color: tokens.textSecondary }} className="text-[11px]">
                        {u.email}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <PwBadge variant={u.role === 'admin' ? 'primary' : 'neutral'} tokens={tokens}>
                        {u.role === 'admin' ? 'Administrador' : 'Vendedor'}
                      </PwBadge>
                    </td>
                    <td className="p-3.5">
                      <PwBadge
                        variant={
                          u.status === 'active'
                            ? 'success'
                            : u.status === 'inactive'
                            ? 'warning'
                            : 'error'
                        }
                        tokens={tokens}
                      >
                        {u.status === 'active'
                          ? 'Ativa'
                          : u.status === 'inactive'
                          ? 'Desativada'
                          : 'Excluída'}
                      </PwBadge>
                    </td>
                    <td style={{ color: tokens.textSecondary }} className="p-3.5">
                      {formatSaoPauloDateTime(u.createdAt)}
                    </td>
                    <td className="p-3.5 text-right">
                      {isSelf ? (
                        <span style={{ color: tokens.textSecondary }} className="text-[11px]">
                          Conta atual protegida
                        </span>
                      ) : isDeleted ? (
                        <span style={{ color: tokens.textSecondary }} className="text-[11px]">
                          Histórico preservado
                        </span>
                      ) : (
                        <div className="inline-flex items-center gap-2">
                          <PwButton
                            size="xs"
                            variant="secondary"
                            icon={u.status === 'active' ? UserMinus : UserCheck}
                            onClick={() => handleToggleStatus(u)}
                            tokens={tokens}
                          >
                            {u.status === 'active' ? 'Desativar' : 'Reativar'}
                          </PwButton>

                          <PwButton
                            size="xs"
                            variant="danger"
                            icon={Trash2}
                            onClick={() => {
                              setDeleteTarget(u);
                              setTransferToSellerId('');
                            }}
                            tokens={tokens}
                          >
                            Excluir
                          </PwButton>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </PwCard>

      <PwModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title={`Confirmar Exclusão de Conta — ${deleteTarget?.name || ''}`}
        subtitle="O acesso será encerrado permanentemente e todos os relatórios, reuniões e vendas anteriores permanecerão íntegros com a identificação '(conta excluída)'."
        tokens={tokens}
      >
        {deleteTarget && (
          <form onSubmit={handleConfirmDelete} className="flex flex-col gap-4">
            <PwSelect
              label="Transferir clientes em andamento para outro vendedor ativo (opcional)"
              id="del-transfer"
              value={transferToSellerId}
              onChange={(e) => setTransferToSellerId(e.target.value)}
              options={[
                { value: '', label: 'Não transferir agora (manter vínculo histórico)' },
                ...otherActiveSellers.map((s) => ({
                  value: s.id,
                  label: `${s.name} (${s.email})`,
                })),
              ]}
              tokens={tokens}
            />

            <div className="flex justify-end gap-2 pt-2">
              <PwButton type="button" variant="ghost" onClick={() => setDeleteTarget(null)} tokens={tokens}>
                Cancelar
              </PwButton>
              <PwButton type="submit" variant="danger" loading={deleting} icon={Trash2} tokens={tokens}>
                Confirmar Exclusão Permanente
              </PwButton>
            </div>
          </form>
        )}
      </PwModal>
    </div>
  );
}

/**
 * ============================================================================
 * PÁGINA 7: CONFIGURAÇÕES (TEMA + ÁUDIO YOUTUBE LOOP + TIMBRES OLD MONEY)
 * ============================================================================
 */
function SettingsPage({
  theme,
  onToggleTheme,
  musicPlaying,
  onToggleMusic,
  musicVolume,
  onMusicVolumeChange,
  sfxEnabled,
  onToggleSfx,
  sfxVolume,
  onSfxVolumeChange,
  tokens,
}) {
  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      <PwCard tokens={tokens} className="p-5 flex items-center justify-between gap-4">
        <div>
          <h3 style={{ color: tokens.textPrimary }} className="text-sm font-semibold">
            Aparência & Tema Institucional
          </h3>
          <p style={{ color: tokens.textSecondary }} className="text-xs mt-1">
            Modo Escuro (#080808 + Neon Roxo #8017FF) como padrão executivo ou Modo Claro.
          </p>
        </div>
        <PwButton
          variant="secondary"
          icon={theme === 'dark' ? Sun : Moon}
          onClick={onToggleTheme}
          tokens={tokens}
        >
          {theme === 'dark' ? 'Alternar para Claro' : 'Alternar para Escuro'}
        </PwButton>
      </PwCard>

      <PwCard tokens={tokens} className="p-5 flex flex-col gap-5">
        <div>
          <h3 style={{ color: tokens.textPrimary }} className="text-sm font-semibold">
            Identidade Sonora — Trilha Ambiente (Loop) & Efeitos Old Money
          </h3>
          <p style={{ color: tokens.textSecondary }} className="text-xs mt-1">
            Reprodução contínua em loop (22:45 min) e efeitos sonoros executivos de precisão sem sobreposição.
          </p>
        </div>

        <div
          style={{ backgroundColor: tokens.bg, borderColor: tokens.border, borderRadius: 11 }}
          className="border p-4 flex flex-col gap-3"
        >
          <div className="flex items-center justify-between">
            <span style={{ color: tokens.textPrimary }} className="text-xs font-semibold">
              Música de Fundo em Loop
            </span>
            <PwButton
              size="xs"
              variant={musicPlaying ? 'primary' : 'secondary'}
              icon={musicPlaying ? Pause : Play}
              onClick={onToggleMusic}
              tokens={tokens}
            >
              {musicPlaying ? 'Pausar Música' : 'Iniciar Música'}
            </PwButton>
          </div>
          <div className="flex items-center gap-3">
            <span style={{ color: tokens.textSecondary }} className="text-xs w-28">
              Volume ({Math.round(musicVolume * 100)}%)
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={musicVolume}
              onChange={(e) => onMusicVolumeChange(parseFloat(e.target.value))}
              className="flex-1 accent-[#8017FF]"
            />
          </div>
        </div>

        <div
          style={{ backgroundColor: tokens.bg, borderColor: tokens.border, borderRadius: 11 }}
          className="border p-4 flex flex-col gap-3"
        >
          <div className="flex items-center justify-between">
            <span style={{ color: tokens.textPrimary }} className="text-xs font-semibold">
              Efeitos Sonoros de Interação (Executive / Old Money)
            </span>
            <PwButton
              size="xs"
              variant={sfxEnabled ? 'primary' : 'secondary'}
              icon={sfxEnabled ? Volume2 : VolumeX}
              onClick={onToggleSfx}
              tokens={tokens}
            >
              {sfxEnabled ? 'Efeitos Ativos' : 'Efeitos Silenciados'}
            </PwButton>
          </div>
          <div className="flex items-center gap-3">
            <span style={{ color: tokens.textSecondary }} className="text-xs w-28">
              Volume ({Math.round(sfxVolume * 100)}%)
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={sfxVolume}
              onChange={(e) => onSfxVolumeChange(parseFloat(e.target.value))}
              className="flex-1 accent-[#8017FF]"
            />
          </div>

          <div className="pt-2 flex flex-wrap gap-2">
            {[
              { id: 'click', label: '1. Clique Preciso' },
              { id: 'success', label: '2. Ação Concluída' },
              { id: 'notification', label: '3. Notificação Cristal' },
              { id: 'modal', label: '4. Abertura de Modal' },
              { id: 'error', label: '5. Erro Institucional' },
              { id: 'warning', label: '6. Aviso Discreto' },
            ].map((sfx) => (
              <button
                key={sfx.id}
                type="button"
                onClick={() => soundEngine.playSfx(sfx.id)}
                style={{
                  backgroundColor: tokens.surface,
                  borderColor: tokens.border,
                  color: tokens.textPrimary,
                  borderRadius: 9,
                }}
                className="border px-3 py-1.5 text-xs hover:border-[#8017FF] transition-colors"
              >
                {sfx.label}
              </button>
            ))}
          </div>
        </div>
      </PwCard>
    </div>
  );
}

/**
 * ============================================================================
 * SHELL AUTENTICADO PRINCIPAL
 * ============================================================================
 */
function AuthenticatedShell({
  currentUser,
  theme,
  onToggleTheme,
  onLogout,
  showToast,
  tokens,
}) {
  const [db, setDb] = useState(() => dataEngine.getDb());
  const [activePage, setActivePage] = useState('dashboard');
  const [clientsFilterPreset, setClientsFilterPreset] = useState('all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const [musicPlaying, setMusicPlaying] = useState(soundEngine.isMusicPlaying);
  const [musicVolume, setMusicVolume] = useState(soundEngine.musicVolume);
  const [sfxEnabled, setSfxEnabled] = useState(soundEngine.sfxEnabled);
  const [sfxVolume, setSfxVolume] = useState(soundEngine.sfxVolume);

  // Modais globais
  const [reassignClientObj, setReassignClientObj] = useState(null);
  const [reassignTargetSellerId, setReassignTargetSellerId] = useState('');
  const [rVentasClient, setRVendasClient] = useState(null);
  const [dossierClientId, setDossierClientId] = useState(null);
  const [inspectedRecord, setInspectedRecord] = useState(null);

  const refreshDb = useCallback(() => {
    setDb(dataEngine.getDb());
  }, []);

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === DB_KEY || e.key === 'pontoweb_crm_last_sync') {
        refreshDb();
        dataEngine.validateSession().then((check) => {
          if (!check.valid) {
            soundEngine.playSfx('error');
            showToast('error', 'Sessão encerrada', check.message || 'Sua sessão não é mais válida.');
            onLogout(false);
          }
        });
      }
    };
    window.addEventListener('storage', handleStorage);

    let channel = null;
    if (typeof BroadcastChannel !== 'undefined') {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = () => {
        refreshDb();
        dataEngine.validateSession().then((check) => {
          if (!check.valid) {
            soundEngine.playSfx('error');
            showToast('error', 'Sessão encerrada', check.message || 'Sua sessão não é mais válida.');
            onLogout(false);
          }
        });
      };
    }

    return () => {
      window.removeEventListener('storage', handleStorage);
      if (channel) channel.close();
    };
  }, [refreshDb, onLogout, showToast]);

  const handleNavigate = (pageId, opts = {}) => {
    soundEngine.playSfx('click');
    if (pageId === 'clients') {
      setClientsFilterPreset(opts.status || 'all');
    }
    setActivePage(pageId);
    setMobileMenuOpen(false);
  };

  const handleToggleMusic = async () => {
    soundEngine.playSfx('click');
    if (musicPlaying) {
      soundEngine.stopMusic();
      setMusicPlaying(false);
    } else {
      await soundEngine.startMusic();
      setMusicPlaying(true);
    }
  };

  const handleConfirmFirstContact = (clientId) => {
    const res = dataEngine.confirmFirstContact(currentUser, clientId);
    if (!res.ok) {
      soundEngine.playSfx('error');
      showToast('error', 'Erro no registro', res.message);
      return;
    }
    if (!res.alreadyCompleted) {
      soundEngine.playSfx('success');
      showToast(
        'success',
        'WhatsApp confirmado!',
        '2ª pendência liberada: realize a Reunião de Vendas e clique em "Já fiz".'
      );
    }
    refreshDb();
  };

  const handleOpenReassign = (client) => {
    setReassignClientObj(client);
    const otherSeller = db.users.find(
      (u) => u.role === 'seller' && u.status === 'active' && u.id !== client.assignedSellerId
    );
    setReassignTargetSellerId(otherSeller?.id || '');
  };

  const handleConfirmReassign = (e) => {
    e.preventDefault();
    if (!reassignClientObj) return;
    const res = dataEngine.reassignClient(currentUser, reassignClientObj.id, reassignTargetSellerId);
    if (!res.ok) {
      soundEngine.playSfx('error');
      showToast('error', 'Erro na reatribuição', res.message);
      return;
    }
    soundEngine.playSfx('success');
    showToast('success', 'Cliente reatribuído', 'Carteira atualizada e novo responsável notificado.');
    setReassignClientObj(null);
    refreshDb();
  };

  const handleInspectRecord = (record) => {
    if (currentUser.role === 'admin' && !record.isReadByAdmin) {
      dataEngine.markReportRecordAsRead(currentUser, record.recordType, record.id);
      refreshDb();
    }
    setInspectedRecord(record);
  };

  const myNotifications = useMemo(
    () => db.notifications.filter((n) => n.userId === currentUser.id),
    [db.notifications, currentUser.id]
  );
  const unreadNotifCount = myNotifications.filter((n) => !n.read).length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clients', label: 'Clientes e contatos', icon: Users },
    { id: 'meetings', label: 'Reuniões de vendas', icon: Calendar },
    { id: 'sales', label: 'Vendas', icon: DollarSign },
    { id: 'reports', label: 'Relatórios', icon: FileSpreadsheet },
    ...(currentUser.role === 'admin' ? [{ id: 'users', label: 'Usuários', icon: Shield }] : []),
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  const pageTitles = {
    dashboard: 'Dashboard Operacional',
    clients: 'Clientes e Contatos',
    meetings: 'Reuniões de Vendas',
    sales: 'Vendas & Controle Financeiro',
    reports: 'Relatórios & Ocorrências',
    users: 'Gestão de Usuários',
    settings: 'Configurações do Sistema',
  };

  const activeDossierClient = dossierClientId
    ? db.clients.find((c) => c.id === dossierClientId) || null
    : null;

  const rVentasMeeting = rVentasClient
    ? db.meetings.find((m) => m.id === rVentasClient.activeMeetingId) || null
    : null;

  return (
    <div
      style={{ backgroundColor: tokens.bg, color: tokens.textPrimary }}
      className="min-h-screen flex flex-col lg:flex-row"
    >
      {/* Sidebar Desktop & Mobile */}
      <aside
        style={{
          backgroundColor: tokens.surface,
          borderColor: tokens.border,
        }}
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r flex flex-col justify-between p-4 transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between px-1 pt-1">
            <PontoWebLogo size={34} showSubtitle tokens={tokens} />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              style={{ color: tokens.textSecondary }}
              className="lg:hidden p-1.5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavigate(item.id)}
                  style={{
                    backgroundColor: isActive ? 'rgba(128, 23, 255, 0.16)' : 'transparent',
                    color: isActive ? tokens.primary : tokens.textSecondary,
                    borderColor: isActive ? 'rgba(128, 23, 255, 0.35)' : 'transparent',
                    borderRadius: 11,
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-medium border transition-all text-left hover:opacity-90"
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div style={{ borderColor: tokens.border }} className="pt-4 border-t flex flex-col gap-3">
          <div
            style={{ backgroundColor: tokens.bg, borderColor: tokens.border, borderRadius: 11 }}
            className="border p-3 flex items-center gap-2.5"
          >
            <div
              style={{
                backgroundColor: 'rgba(128, 23, 255, 0.16)',
                color: tokens.primary,
                borderRadius: 9,
              }}
              className="w-8 h-8 flex items-center justify-center font-semibold text-xs shrink-0"
            >
              {currentUser.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p style={{ color: tokens.textPrimary }} className="text-xs font-semibold truncate">
                {currentUser.name}
              </p>
              <span style={{ color: tokens.textSecondary }} className="text-[10px] uppercase tracking-wider">
                {currentUser.role === 'admin' ? 'Administrador' : 'Vendedor'}
              </span>
            </div>
          </div>

          <PwButton
            variant="secondary"
            size="sm"
            icon={LogOut}
            onClick={() => onLogout(true)}
            tokens={tokens}
            className="w-full"
          >
            Sair do Sistema
          </PwButton>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Executivo */}
        <header
          style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
          className="sticky top-0 z-30 border-b px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                soundEngine.playSfx('click');
                setMobileMenuOpen(true);
              }}
              style={{
                backgroundColor: tokens.bg,
                borderColor: tokens.border,
                color: tokens.textPrimary,
                borderRadius: 10,
              }}
              className="lg:hidden border p-2"
            >
              <Layers className="w-4 h-4" />
            </button>

            <div>
              <h1 style={{ color: tokens.textPrimary, letterSpacing: '0.08em' }} className="text-base sm:text-lg font-semibold">
                {pageTitles[activePage]}
              </h1>
              <div className="flex items-center gap-2 text-[11px]" style={{ color: tokens.textSecondary }}>
                <span className="inline-flex items-center gap-1 text-[#16845B]">
                  <Wifi className="w-3 h-3" /> Tempo real ativo
                </span>
                <span>•</span>
                <span>America/Sao_Paulo</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Controle Rápido Música Ambiente */}
            <button
              type="button"
              onClick={handleToggleMusic}
              title={musicPlaying ? 'Pausar música ambiente' : 'Tocar música ambiente em loop'}
              style={{
                backgroundColor: musicPlaying ? 'rgba(128, 23, 255, 0.16)' : tokens.bg,
                borderColor: musicPlaying ? tokens.primary : tokens.border,
                color: musicPlaying ? tokens.primary : tokens.textSecondary,
                borderRadius: 10,
              }}
              className="border p-2 flex items-center gap-1.5 text-xs font-medium"
            >
              {musicPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span className="hidden md:inline">{musicPlaying ? 'Som Ativo' : 'Música'}</span>
            </button>

            {/* Alternar Tema */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playSfx('click');
                onToggleTheme();
              }}
              title="Alternar tema"
              style={{
                backgroundColor: tokens.bg,
                borderColor: tokens.border,
                color: tokens.textPrimary,
                borderRadius: 10,
              }}
              className="border p-2"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-[#EDE0FF]" /> : <Moon className="w-4 h-4 text-[#8017FF]" />}
            </button>

            {/* Central de Notificações */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playSfx('click');
                  setNotifOpen((v) => !v);
                }}
                style={{
                  backgroundColor: tokens.bg,
                  borderColor: tokens.border,
                  color: tokens.textPrimary,
                  borderRadius: 10,
                }}
                className="border p-2 relative"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifCount > 0 && (
                  <span
                    style={{ backgroundColor: tokens.primary }}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                  >
                    {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div
                  style={{
                    backgroundColor: tokens.surfaceElevated,
                    borderColor: tokens.border,
                    boxShadow: tokens.glowStrong,
                    borderRadius: 13,
                  }}
                  className="absolute right-0 mt-2 w-80 sm:w-96 border p-4 z-50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span style={{ color: tokens.textPrimary }} className="text-xs font-semibold">
                      Notificações ({unreadNotifCount} não lidas)
                    </span>
                    {unreadNotifCount > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          dataEngine.markNotificationAsRead(currentUser.id);
                          refreshDb();
                        }}
                        style={{ color: tokens.primary }}
                        className="text-[11px] font-medium hover:underline"
                      >
                        Marcar todas como lidas
                      </button>
                    )}
                  </div>

                  {myNotifications.length === 0 ? (
                    <p style={{ color: tokens.textSecondary }} className="text-xs py-4 text-center">
                      Nenhuma notificação no momento.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
                      {myNotifications.slice(0, 15).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            dataEngine.markNotificationAsRead(currentUser.id, n.id);
                            refreshDb();
                          }}
                          style={{
                            backgroundColor: n.read ? tokens.bg : 'rgba(128, 23, 255, 0.1)',
                            borderColor: n.read ? tokens.border : 'rgba(128, 23, 255, 0.35)',
                            borderRadius: 10,
                          }}
                          className="border p-2.5 text-xs cursor-pointer"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <strong style={{ color: tokens.textPrimary }}>{n.title}</strong>
                            <span style={{ color: tokens.textSecondary }} className="text-[10px]">
                              {formatSaoPauloDateTime(n.createdAt)}
                            </span>
                          </div>
                          <p style={{ color: tokens.textSecondary }} className="text-[11px] mt-0.5">
                            {n.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Área de Visualização da Página */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {activePage === 'dashboard' && (
            <DashboardPage
              db={db}
              currentUser={currentUser}
              onNavigate={handleNavigate}
              onConfirmFirstContact={handleConfirmFirstContact}
              onOpenReassign={handleOpenReassign}
              onOpenRVendas={(client) => setRVendasClient(client)}
              onOpenDossier={(client) => setDossierClientId(client.id)}
              onInspectReport={handleInspectRecord}
              showToast={showToast}
              tokens={tokens}
            />
          )}

          {activePage === 'clients' && (
            <ClientsAndContactsPage
              db={db}
              currentUser={currentUser}
              initialStatusFilter={clientsFilterPreset}
              onConfirmFirstContact={handleConfirmFirstContact}
              onOpenReassign={handleOpenReassign}
              onOpenRVendas={(client) => setRVendasClient(client)}
              onOpenDossier={(client) => setDossierClientId(client.id)}
              showToast={showToast}
              tokens={tokens}
            />
          )}

          {activePage === 'meetings' && (
            <SalesMeetingsPage
              db={db}
              currentUser={currentUser}
              onOpenRVendas={(client) => setRVendasClient(client)}
              onOpenDossier={(client) => setDossierClientId(client.id)}
              tokens={tokens}
            />
          )}

          {activePage === 'sales' && (
            <SalesPage
              db={db}
              currentUser={currentUser}
              onRefresh={refreshDb}
              showToast={showToast}
              tokens={tokens}
            />
          )}

          {activePage === 'reports' && (
            <ReportsPage
              db={db}
              currentUser={currentUser}
              onInspectRecord={handleInspectRecord}
              onOpenDossier={(client) => setDossierClientId(client.id)}
              tokens={tokens}
            />
          )}

          {activePage === 'users' && (
            <UsersManagementPage
              db={db}
              currentUser={currentUser}
              onRefresh={refreshDb}
              showToast={showToast}
              tokens={tokens}
            />
          )}

          {activePage === 'settings' && (
            <SettingsPage
              theme={theme}
              onToggleTheme={onToggleTheme}
              musicPlaying={musicPlaying}
              onToggleMusic={handleToggleMusic}
              musicVolume={musicVolume}
              onMusicVolumeChange={(v) => {
                soundEngine.setMusicVolume(v);
                setMusicVolume(v);
              }}
              sfxEnabled={sfxEnabled}
              onToggleSfx={() => {
                const next = !sfxEnabled;
                soundEngine.setSfxEnabled(next);
                setSfxEnabled(next);
              }}
              sfxVolume={sfxVolume}
              onSfxVolumeChange={(v) => {
                soundEngine.setSfxVolume(v);
                setSfxVolume(v);
              }}
              tokens={tokens}
            />
          )}
        </main>
      </div>

      {/* Modal de Reatribuição */}
      <PwModal
        isOpen={Boolean(reassignClientObj)}
        onClose={() => setReassignClientObj(null)}
        title={`Reatribuir Cliente — ${reassignClientObj?.name || ''}`}
        subtitle="O histórico completo será preservado e o novo vendedor será notificado imediatamente."
        tokens={tokens}
      >
        {reassignClientObj && (
          <form onSubmit={handleConfirmReassign} className="flex flex-col gap-4">
            <PwSelect
              label="Novo vendedor responsável (ativos)"
              id="reassign-seller"
              required
              value={reassignTargetSellerId}
              onChange={(e) => setReassignTargetSellerId(e.target.value)}
              options={db.users
                .filter(
                  (u) =>
                    u.role === 'seller' &&
                    u.status === 'active' &&
                    u.id !== reassignClientObj.assignedSellerId
                )
                .map((s) => ({
                  value: s.id,
                  label: `${s.name} (${s.email})`,
                }))}
              tokens={tokens}
            />
            <div className="flex justify-end gap-2 pt-2">
              <PwButton type="button" variant="ghost" onClick={() => setReassignClientObj(null)} tokens={tokens}>
                Cancelar
              </PwButton>
              <PwButton type="submit" icon={ArrowLeftRight} tokens={tokens}>
                Confirmar Transferência
              </PwButton>
            </div>
          </form>
        )}
      </PwModal>

      {/* Modal R. Vendas */}
      <RVendasModal
        client={rVentasClient}
        meeting={rVentasMeeting}
        currentUser={currentUser}
        onClose={() => setRVendasClient(null)}
        onSuccess={(msg) => {
          showToast('success', 'Atendimento registrado', msg);
          refreshDb();
        }}
        onError={(msg) => showToast('error', 'Atenção', msg)}
        tokens={tokens}
      />

      {/* Modal Dossiê do Cliente */}
      <ClientDossierModal
        client={activeDossierClient}
        db={db}
        onClose={() => setDossierClientId(null)}
        onOpenRVendas={(client) => setRVendasClient(client)}
        tokens={tokens}
      />

      {/* Modal Detalhes de Relatório / Ocorrência */}
      <ReportDetailModal
        record={inspectedRecord}
        onClose={() => setInspectedRecord(null)}
        tokens={tokens}
      />
    </div>
  );
}

/**
 * ============================================================================
 * COMPONENTE RAIZ — APP
 * ============================================================================
 */
export default function App() {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
      return saved.theme === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  const [currentUser, setCurrentUser] = useState(null);
  useEffect(() => {
    soundEngine.loadPreferences();
    dataEngine.validateSession().then((check) => {
      if (check.valid) {
        dataEngine.syncFromSupabase().then(() => setCurrentUser(check.user));
      }
    });
  }, []);

  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  const showToast = useCallback((type, title, message) => {
    setToast({ type, title, message });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 4800);
  }, []);

  const handleToggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        const current = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
        localStorage.setItem(PREFS_KEY, JSON.stringify({ ...current, theme: next }));
      } catch {}
      return next;
    });
  };

  const handleLogout = useCallback(
    (recordAudit = true) => {
      soundEngine.stopMusic();
      const p = recordAudit && currentUser?.email
        ? dataEngine.clearSession(currentUser.email)
        : dataEngine.clearSession();
      p.then(() => setCurrentUser(null));
    },
    [currentUser]
  );

  const tokens = DESIGN_TOKENS[theme];

  return (
    <>
      {currentUser ? (
        <AuthenticatedShell
          currentUser={currentUser}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onLogout={handleLogout}
          showToast={showToast}
          tokens={tokens}
        />
      ) : (
        <AuthScreen
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onAuthenticated={(user) => setCurrentUser(user)}
          showToast={showToast}
          tokens={tokens}
        />
      )}

      <PwToast toast={toast} onDismiss={() => setToast(null)} tokens={tokens} />
    </>
  );
}
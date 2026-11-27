import React, { useState, useEffect, useRef, useMemo, createContext, useContext } from 'react';
import {
  Shield, Users, UserPlus, LogOut, Lock, Mail, Eye, EyeOff, Sun, Moon,
  Volume2, VolumeX, Play, Pause, CheckCircle2, AlertTriangle, XCircle,
  Bell, Search, Plus, ArrowRight, RefreshCw, Calendar, Clock, Phone,
  Copy, Check, ExternalLink, FileText, DollarSign, TrendingUp, BarChart3,
  Filter, ChevronRight, ChevronDown, X, Sparkles, Sliders, Activity,
  UserCheck, UserX, Trash2, Edit3, Send, Layers, Award, Target, Briefcase
} from 'lucide-react';

// ============================================================================
// 1. TOKENS INSTITUCIONAIS & ESTILOS GLOBAIS (DARK MODE PADRÃO + LIGHT MODE)
// ============================================================================
const THEME_TOKENS = {
  dark: {
    primary: '#8017FF',
    primaryDark: '#5010A8',
    primaryLight: '#EDE0FF',
    bg: '#080808',
    surface: '#121214',
    surfaceElevated: '#18171C',
    text: '#F4F1F8',
    textSecondary: '#A89FB3',
    border: '#2A2531',
    success: '#16845B',
    warning: '#B7791F',
    error: '#C83E4D',
  },
  light: {
    primary: '#8017FF',
    primaryDark: '#5010A8',
    primaryLight: '#EDE0FF',
    bg: '#F7F5FA',
    surface: '#FFFFFF',
    surfaceElevated: '#F1EDF7',
    text: '#241A2D',
    textSecondary: '#746B7D',
    border: '#E8E2ED',
    success: '#16845B',
    warning: '#B7791F',
    error: '#C83E4D',
  },
};

// ============================================================================
// 2. UTILITÁRIOS DE DATA / HORA (AMERICA/SAO_PAULO) E FORMATAÇÃO
// ============================================================================
const TIMEZONE = 'America/Sao_Paulo';

function nowIso() {
  return new Date().toISOString();
}

function formatDateTimeBR(isoString) {
  if (!isoString) return 'Não informado';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return isoString;
  }
}

function formatDateWithWeekdayBR(dateStr, timeStr) {
  if (!dateStr) return 'Data não informada';
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const localDate = new Date(Date.UTC(y, m - 1, d, 15, 0, 0));
    const weekday = new Intl.DateTimeFormat('pt-BR', {
      timeZone: TIMEZONE,
      weekday: 'long',
    }).format(localDate);
    const formattedDate = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
    const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    return timeStr
      ? `${capitalizedWeekday}, ${formattedDate} às ${timeStr}`
      : `${capitalizedWeekday}, ${formattedDate}`;
  } catch {
    return `${dateStr} ${timeStr || ''}`.trim();
  }
}

function formatCurrencyBRL(value) {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(num);
}

function sanitizePhoneForWhatsApp(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.startsWith('55') ? digits : `55${digits}`;
}

function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

// ============================================================================
// 3. IDENTIDADE SONORA LUXURY TECH / OLD MONEY + ÁUDIO AMBIENTE EM LOOP
// ============================================================================
class PontoWebSoundEngine {
  constructor() {
    this.ctx = null;
    this.lastSfxTime = 0;
    this.ytPlayer = null;
    this.ytReady = false;
    this.fallbackInterval = null;
    this.isMusicPlaying = false;
    this.prefs = this.loadPrefs();
  }

  loadPrefs() {
    try {
      const saved = localStorage.getItem('pontoweb_audio_prefs_v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      sfxEnabled: true,
      sfxVolume: 0.45,
      musicEnabled: false,
      musicVolume: 0.35,
    };
  }

  savePrefs() {
    try {
      localStorage.setItem('pontoweb_audio_prefs_v2', JSON.stringify(this.prefs));
    } catch {}
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

  // Efeitos sonoros Old Money / Executive Tech (zero timbres fofos)
  playSfx(type = 'click') {
    if (!this.prefs.sfxEnabled) return;
    const now = performance.now();
    if (now - this.lastSfxTime < 65) return; // Evita sobreposição
    this.lastSfxTime = now;

    const ctx = this.ensureContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const vol = Math.max(0.02, Math.min(1, this.prefs.sfxVolume));

    try {
      if (type === 'click') {
        // Relojoaria mecânica / micro-switch de tungstênio
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1450, t);
        osc.frequency.exponentialRampToValueAtTime(220, t + 0.028);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1200, t);
        filter.Q.setValueAtTime(2.5, t);

        gain.gain.setValueAtTime(vol * 0.28, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.032);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.035);
      } else if (type === 'success') {
        // Acorde institucional grave-médio de confirmação (quinta justa encorpada)
        [220, 329.63].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          const start = t + idx * 0.075;
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.0001, start);
          gain.gain.linearRampToValueAtTime(vol * 0.24, start + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.34);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.36);
        });
      } else if (type === 'notification') {
        // Cristal de quartzo sobressalente e discreto
        const osc = ctx.createOscillator();
        const sub = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        sub.type = 'triangle';
        osc.frequency.setValueAtTime(880, t);
        sub.frequency.setValueAtTime(440, t);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(vol * 0.22, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
        osc.connect(gain);
        sub.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        sub.start(t);
        osc.stop(t + 0.44);
        sub.stop(t + 0.44);
      } else if (type === 'whoosh') {
        // Fechamento magnético suave de cofre executivo
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(95, t);
        osc.frequency.exponentialRampToValueAtTime(190, t + 0.14);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320, t);
        filter.frequency.exponentialRampToValueAtTime(680, t + 0.14);

        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(vol * 0.18, t + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.18);
      } else if (type === 'error') {
        // Sub-grave firme e contido
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, t);
        osc.frequency.linearRampToValueAtTime(82, t + 0.22);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(260, t);

        gain.gain.setValueAtTime(vol * 0.26, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.25);
      } else if (type === 'warning') {
        // Pulso eletrônico grave-médio
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(261.63, t);
        gain.gain.setValueAtTime(vol * 0.22, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.2);
      }
    } catch {}
  }

  initYouTubePlayer(onStateChange) {
    if (typeof window === 'undefined') return;
    if (window.YT && window.YT.Player) {
      this.createYtInstance(onStateChange);
      return;
    }
    const existing = document.getElementById('pontoweb-yt-api');
    if (!existing) {
      const tag = document.createElement('script');
      tag.id = 'pontoweb-yt-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
    }
    window.onYouTubeIframeAPIReady = () => {
      this.createYtInstance(onStateChange);
    };
  }

  createYtInstance(onStateChange) {
    const holder = document.getElementById('pontoweb-yt-player');
    if (!holder || this.ytPlayer) return;
    try {
      this.ytPlayer = new window.YT.Player('pontoweb-yt-player', {
        height: '120',
        width: '200',
        videoId: '77Y3r6hQbKE',
        playerVars: {
          autoplay: 0,
          controls: 0,
          loop: 1,
          playlist: '77Y3r6hQbKE',
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: (e) => {
            this.ytReady = true;
            e.target.setVolume(Math.round(this.prefs.musicVolume * 100));
            if (this.prefs.musicEnabled) {
              this.startMusic(onStateChange);
            }
          },
          onStateChange: (e) => {
            if (e.data === 0) {
              e.target.seekTo(0);
              e.target.playVideo();
            }
            if (e.data === 1) {
              this.stopFallbackAmbient();
              this.isMusicPlaying = true;
              onStateChange?.(true);
            }
          },
          onError: () => {
            if (this.prefs.musicEnabled) {
              this.startFallbackAmbient(onStateChange);
            }
          },
        },
      });
    } catch {
      if (this.prefs.musicEnabled) {
        this.startFallbackAmbient(onStateChange);
      }
    }
  }

  startMusic(onStateChange) {
    this.prefs.musicEnabled = true;
    this.savePrefs();
    if (this.ytReady && this.ytPlayer && typeof this.ytPlayer.playVideo === 'function') {
      try {
        this.ytPlayer.setVolume(Math.round(this.prefs.musicVolume * 100));
        this.ytPlayer.playVideo();
        this.isMusicPlaying = true;
        onStateChange?.(true);
        // Caso o sandbox bloqueie o iframe do YouTube após 1.5s, ativa fallback sonoro 98 BPM
        setTimeout(() => {
          if (this.prefs.musicEnabled && this.ytPlayer?.getPlayerState?.() !== 1) {
            this.startFallbackAmbient(onStateChange);
          }
        }, 1500);
        return;
      } catch {}
    }
    this.startFallbackAmbient(onStateChange);
  }

  stopMusic(onStateChange) {
    this.prefs.musicEnabled = false;
    this.savePrefs();
    this.isMusicPlaying = false;
    if (this.ytReady && this.ytPlayer && typeof this.ytPlayer.pauseVideo === 'function') {
      try {
        this.ytPlayer.pauseVideo();
      } catch {}
    }
    this.stopFallbackAmbient();
    onStateChange?.(false);
  }

  setMusicVolume(v) {
    this.prefs.musicVolume = Math.max(0, Math.min(1, v));
    this.savePrefs();
    if (this.ytReady && this.ytPlayer && typeof this.ytPlayer.setVolume === 'function') {
      try {
        this.ytPlayer.setVolume(Math.round(this.prefs.musicVolume * 100));
      } catch {}
    }
  }

  setSfxVolume(v) {
    this.prefs.sfxVolume = Math.max(0, Math.min(1, v));
    this.savePrefs();
  }

  toggleSfx(enabled) {
    this.prefs.sfxEnabled = enabled;
    this.savePrefs();
  }

  startFallbackAmbient(onStateChange) {
    if (this.fallbackInterval) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    this.isMusicPlaying = true;
    onStateChange?.(true);

    const notes = [110, 130.81, 146.83, 164.81, 196];
    let step = 0;
    const playPulse = () => {
      if (!this.prefs.musicEnabled) return;
      const t = ctx.currentTime;
      const vol = this.prefs.musicVolume * 0.14;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(notes[step % notes.length], t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 2.3);
      step++;
    };
    playPulse();
    this.fallbackInterval = setInterval(playPulse, 2450); // ~98 BPM pulso executivo
  }

  stopFallbackAmbient() {
    if (this.fallbackInterval) {
      clearInterval(this.fallbackInterval);
      this.fallbackInterval = null;
    }
  }
}

const soundEngine = new PontoWebSoundEngine();

// ============================================================================
// 4. CAMADA DE DADOS PERSISTENTE, TRANSAÇÕES, RBAC E REALTIME
// ============================================================================
const DB_KEY = 'pontoweb_crm_db_v4';
const SESSION_KEY = 'pontoweb_crm_session_v4';
const CHANNEL_NAME = 'pontoweb_crm_sync_channel';

class PontoWebDataEngine {
  constructor() {
    this.listeners = new Set();
    this.channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL_NAME) : null;
    if (this.channel) {
      this.channel.onmessage = () => this.notifyListeners();
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === DB_KEY || e.key === SESSION_KEY) {
          this.notifyListeners();
        }
      });
    }
    this.bootstrap();
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notifyListeners() {
    this.listeners.forEach((fn) => fn(this.getState()));
  }

  broadcast() {
    this.notifyListeners();
    try {
      this.channel?.postMessage({ type: 'DB_UPDATED', ts: Date.now() });
    } catch {}
  }

  bootstrap() {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) {
      const initialDb = {
        users: [
          {
            id: 'usr_pablo_master',
            name: 'Pablo',
            email: 'tpablo488@gmail.com',
            passwordHash: 'PontoWeb@2026',
            role: 'admin',
            active: true,
            deleted: false,
            createdAt: nowIso(),
          },
          {
            id: 'usr_rayven_seller',
            name: 'Rayven',
            email: 'rayvenart3@gmail.com',
            passwordHash: 'Vendas@2026',
            role: 'seller',
            active: true,
            deleted: false,
            createdAt: nowIso(),
          },
          {
            id: 'usr_sdr_default',
            name: 'Equipe SDR',
            email: 'sdr@pontoweb.com',
            passwordHash: 'Sdr@2026',
            role: 'sdr',
            active: true,
            deleted: false,
            createdAt: nowIso(),
          },
          {
            id: 'usr_jay_seller',
            name: 'Vendedor Jay',
            email: 'jtoxx7@gmail.com',
            passwordHash: '1234vendedorpntw',
            role: 'seller',
            active: true,
            deleted: false,
            createdAt: nowIso(),
          },
          {
            id: 'usr_oliver_sdr',
            name: 'Oliver SDR',
            email: 'oliverf487@gmail.com',
            passwordHash: '1234SDRpntw',
            role: 'sdr',
            active: true,
            deleted: false,
            createdAt: nowIso(),
          },
        ],
        clients: [],
        sdrSubmissions: [],
        tasks: [],
        meetings: [],
        meetingReports: [],
        noShowOccurrences: [],
        rescheduleRecords: [],
        sales: [],
        notifications: [],
        timeline: [],
        auditLogs: [],
      };
      this.saveState(initialDb);
    } else {
      // Garante que o usuário mestre Pablo exista e tenha nome Pablo
      const db = JSON.parse(raw);
      let changed = false;
      const pablo = db.users?.find((u) => u.email.toLowerCase() === 'tpablo488@gmail.com');
      if (pablo && pablo.name !== 'Pablo') {
        pablo.name = 'Pablo';
        changed = true;
      }
      if (!db.sdrSubmissions) {
        db.sdrSubmissions = [];
        changed = true;
      }
      const ensureUser = (u) => {
        if (!db.users.find((x) => x.email.toLowerCase() === u.email.toLowerCase())) {
          db.users.push(u);
          changed = true;
        }
      };
      ensureUser({ id: 'usr_jay_seller', name: 'Vendedor Jay', email: 'jtoxx7@gmail.com', passwordHash: '1234vendedorpntw', role: 'seller', active: true, deleted: false, createdAt: nowIso() });
      ensureUser({ id: 'usr_oliver_sdr', name: 'Oliver SDR', email: 'oliverf487@gmail.com', passwordHash: '1234SDRpntw', role: 'sdr', active: true, deleted: false, createdAt: nowIso() });
      if (changed) this.saveState(db);
    }
  }

  getState() {
    try {
      const raw = localStorage.getItem(DB_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  saveState(state) {
    localStorage.setItem(DB_KEY, JSON.stringify(state));
    this.broadcast();
  }

  getCurrentUser() {
    try {
      const sessionRaw = localStorage.getItem(SESSION_KEY);
      if (!sessionRaw) return null;
      const { userId } = JSON.parse(sessionRaw);
      const db = this.getState();
      const user = db?.users?.find((u) => u.id === userId);
      if (!user || !user.active || user.deleted) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      return user;
    } catch {
      return null;
    }
  }

  login(email, password) {
    const cleanEmail = String(email || '').trim().toLowerCase();
    const db = this.getState();
    const user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user) throw new Error('E-mail ou senha inválidos.');
    if (user.deleted) throw new Error('Esta conta foi excluída e não possui mais acesso.');
    if (!user.active) throw new Error('Esta conta está desativada. Contate o Pablo.');
    if (user.passwordHash !== password) throw new Error('E-mail ou senha inválidos.');

    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id, loginAt: nowIso() }));
    this.logAudit(db, user.id, 'LOGIN', `Acesso realizado por ${user.name}`);
    this.saveState(db);
    return user;
  }

  logout() {
    const user = this.getCurrentUser();
    if (user) {
      const db = this.getState();
      this.logAudit(db, user.id, 'LOGOUT', `Sessão encerrada por ${user.name}`);
      this.saveState(db);
    }
    localStorage.removeItem(SESSION_KEY);
    this.broadcast();
  }

  resetPassword(email, newPassword) {
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!newPassword || newPassword.length < 6) {
      throw new Error('A nova senha deve ter pelo menos 6 caracteres.');
    }
    const db = this.getState();
    const user = db.users.find((u) => u.email.toLowerCase() === cleanEmail && !u.deleted);
    if (!user) throw new Error('Nenhuma conta ativa encontrada com este e-mail.');
    if (!user.active) throw new Error('Conta desativada. Solicite reativação ao Pablo.');
    user.passwordHash = newPassword;
    this.logAudit(db, user.id, 'PASSWORD_RESET', `Senha redefinida para ${user.email}`);
    this.saveState(db);
    return true;
  }

  logAudit(db, actorId, action, details) {
    db.auditLogs.unshift({
      id: generateId('aud'),
      actorId,
      action,
      details,
      createdAt: nowIso(),
    });
  }

  pushNotification(db, recipientId, title, message, meta = {}) {
    db.notifications.unshift({
      id: generateId('ntf'),
      recipientId,
      title,
      message,
      meta,
      read: false,
      createdAt: nowIso(),
    });
  }

  pushTimeline(db, clientId, actorId, type, title, description, meta = {}) {
    db.timeline.unshift({
      id: generateId('tml'),
      clientId,
      actorId,
      type,
      title,
      description,
      meta,
      createdAt: nowIso(),
    });
  }

  // SDR cria lead para revisão do Pablo (sem selecionar vendedor)
  submitLeadFromSdr(actor, payload) {
    if (!actor || actor.role !== 'sdr' || !actor.active) {
      throw new Error('Permissão negada: apenas contas SDR ativas podem enviar leads nesta fila.');
    }
    const { name, segment, whatsapp, meetingDate, meetingTime, notes } = payload;
    if (!name?.trim() || !segment?.trim() || !whatsapp?.trim() || !meetingDate || !meetingTime) {
      throw new Error('Preencha todos os campos obrigatórios antes de enviar ao Pablo.');
    }

    const db = this.getState();
    const submission = {
      id: generateId('sdr_lead'),
      name: name.trim(),
      segment: segment.trim(),
      whatsapp: whatsapp.trim(),
      meetingDate,
      meetingTime,
      notes: (notes || '').trim(),
      submittedById: actor.id,
      status: 'pending_pablo', // pending_pablo | approved
      createdAt: nowIso(),
    };

    db.sdrSubmissions.unshift(submission);

    // Notifica Pablo
    const pabloUsers = db.users.filter((u) => u.role === 'admin' && u.active && !u.deleted);
    pabloUsers.forEach((p) => {
      this.pushNotification(
        db,
        p.id,
        'Novo lead enviado pelo SDR',
        `${actor.name} enviou o cliente "${submission.name}" (${submission.segment}) para sua revisão e distribuição.`,
        { submissionId: submission.id }
      );
    });

    this.logAudit(db, actor.id, 'SDR_LEAD_SUBMITTED', `SDR enviou lead ${submission.name} ao Pablo`);
    this.saveState(db);
    return submission;
  }

  // Pablo aprova, edita e distribui um lead vindo do SDR
  approveSdrSubmission(actor, submissionId, editedPayload) {
    if (!actor || actor.role !== 'admin' || !actor.active) {
      throw new Error('Apenas o Pablo pode revisar e distribuir leads do SDR.');
    }
    const db = this.getState();
    const sub = db.sdrSubmissions.find((s) => s.id === submissionId);
    if (!sub || sub.status !== 'pending_pablo') {
      throw new Error('Este lead já foi processado ou não foi encontrado.');
    }

    const created = this.createAndAssignClientInternal(db, actor, {
      ...editedPayload,
      originSdrId: sub.submittedById,
    });

    sub.status = 'approved';
    sub.approvedAt = nowIso();
    sub.approvedClientId = created.client.id;

    this.logAudit(
      db,
      actor.id,
      'SDR_LEAD_APPROVED',
      `Pablo revisou e distribuiu "${created.client.name}" para o vendedor.`
    );
    this.saveState(db);
    return created;
  }

  // Cadastro direto pelo Pablo (transação atômica)
  createAndAssignClient(actor, payload) {
    if (!actor || actor.role !== 'admin' || !actor.active) {
      throw new Error('Apenas o Pablo pode cadastrar e distribuir clientes.');
    }
    const db = this.getState();
    const result = this.createAndAssignClientInternal(db, actor, payload);
    this.saveState(db);
    return result;
  }

  createAndAssignClientInternal(db, actor, payload) {
    const { name, segment, whatsapp, meetingDate, meetingTime, sellerId, notes, originSdrId } = payload;
    if (!name?.trim() || !segment?.trim() || !whatsapp?.trim() || !meetingDate || !meetingTime || !sellerId) {
      throw new Error('Todos os campos obrigatórios devem ser preenchidos.');
    }

    const seller = db.users.find((u) => u.id === sellerId && u.role === 'seller' && u.active && !u.deleted);
    if (!seller) {
      throw new Error('Selecione um vendedor ativo válido.');
    }

    const clientId = generateId('cli');
    const meetingId = generateId('mtg');
    const taskId = generateId('tsk');
    const ts = nowIso();

    const client = {
      id: clientId,
      name: name.trim(),
      segment: segment.trim(),
      whatsapp: whatsapp.trim(),
      notes: (notes || '').trim(),
      assignedSellerId: seller.id,
      createdById: actor.id,
      originSdrId: originSdrId || null,
      firstContactStatus: 'pending',
      firstContactAt: null,
      firstContactById: null,
      currentMeetingId: meetingId,
      createdAt: ts,
    };

    const task = {
      id: taskId,
      clientId,
      sellerId: seller.id,
      type: 'FIRST_CONTACT',
      status: 'pending',
      createdAt: ts,
      completedAt: null,
    };

    const meeting = {
      id: meetingId,
      clientId,
      sellerId: seller.id,
      scheduledDate: meetingDate,
      scheduledTime: meetingTime,
      status: 'scheduled', // scheduled | completed | no_show
      rescheduleCount: 0,
      createdAt: ts,
      completedAt: null,
    };

    db.clients.unshift(client);
    db.tasks.unshift(task);
    db.meetings.unshift(meeting);

    this.pushTimeline(
      db,
      clientId,
      actor.id,
      'CREATED_AND_ASSIGNED',
      'Cliente cadastrado e distribuído',
      `Atribuído por ${actor.name} para ${seller.name}. Reunião de vendas agendada para ${formatDateWithWeekdayBR(meetingDate, meetingTime)}.`
    );

    this.pushNotification(
      db,
      seller.id,
      'Novo cliente atribuído',
      `Você recebeu ${client.name} (${client.segment}). Primeiro contato pendente — call marcada para ${formatDateWithWeekdayBR(meetingDate, meetingTime)}.`,
      { clientId }
    );

    this.logAudit(db, actor.id, 'CLIENT_ASSIGNED', `Cliente ${client.name} atribuído a ${seller.name}`);
    return { client, task, meeting };
  }

  // Confirmação de 1º contato (exclusivo do vendedor, idempotente)
  confirmFirstContact(actor, clientId) {
    if (!actor || actor.role !== 'seller' || !actor.active) {
      throw new Error('Apenas o vendedor responsável pode confirmar o primeiro contato.');
    }
    const db = this.getState();
    const client = db.clients.find((c) => c.id === clientId);
    if (!client) throw new Error('Cliente não encontrado.');
    if (client.assignedSellerId !== actor.id) {
      throw new Error('Você não tem permissão para alterar este cliente.');
    }
    if (client.firstContactStatus === 'done') {
      return client; // Idempotente: impede duplicidade
    }

    const ts = nowIso();
    client.firstContactStatus = 'done';
    client.firstContactAt = ts;
    client.firstContactById = actor.id;

    const task = db.tasks.find((t) => t.clientId === clientId && t.type === 'FIRST_CONTACT');
    if (task) {
      task.status = 'done';
      task.completedAt = ts;
    }

    this.pushTimeline(
      db,
      clientId,
      actor.id,
      'FIRST_CONTACT_DONE',
      'Primeiro contato confirmado',
      `${actor.name} declarou ter realizado a apresentação inicial no WhatsApp do cliente.`
    );

    this.logAudit(db, actor.id, 'FIRST_CONTACT', `Primeiro contato confirmado para ${client.name}`);
    this.saveState(db);
    return client;
  }

  // Reatribuição de cliente pelo Pablo
  reassignClient(actor, clientId, newSellerId) {
    if (!actor || actor.role !== 'admin' || !actor.active) {
      throw new Error('Apenas o Pablo pode reatribuir clientes.');
    }
    const db = this.getState();
    const client = db.clients.find((c) => c.id === clientId);
    if (!client) throw new Error('Cliente não encontrado.');
    const newSeller = db.users.find((u) => u.id === newSellerId && u.role === 'seller' && u.active && !u.deleted);
    if (!newSeller) throw new Error('Vendedor de destino inválido ou inativo.');
    if (client.assignedSellerId === newSeller.id) {
      throw new Error('O cliente já está atribuído a este vendedor.');
    }

    const oldSeller = db.users.find((u) => u.id === client.assignedSellerId);
    client.assignedSellerId = newSeller.id;

    db.tasks.forEach((t) => {
      if (t.clientId === clientId && t.status === 'pending') t.sellerId = newSeller.id;
    });
    db.meetings.forEach((m) => {
      if (m.clientId === clientId && m.status === 'scheduled') m.sellerId = newSeller.id;
    });

    this.pushTimeline(
      db,
      clientId,
      actor.id,
      'REASSIGNED',
      'Cliente reatribuído',
      `Transferido por ${actor.name} de ${oldSeller?.name || 'vendedor anterior'} para ${newSeller.name}.`
    );

    this.pushNotification(
      db,
      newSeller.id,
      'Cliente transferido para sua carteira',
      `${actor.name} transferiu o cliente ${client.name} (${client.segment}) para você.`,
      { clientId }
    );

    this.logAudit(db, actor.id, 'CLIENT_REASSIGNED', `${client.name} transferido para ${newSeller.name}`);
    this.saveState(db);
    return client;
  }

  // Reagendamento da Reunião Única preservando o agendamento anterior
  rescheduleMeeting(actor, clientId, { newDate, newTime, reason, notes }) {
    if (!actor || !actor.active) throw new Error('Usuário não autenticado.');
    if (!newDate || !newTime) throw new Error('Informe a nova data e o novo horário.');

    const db = this.getState();
    const client = db.clients.find((c) => c.id === clientId);
    if (!client) throw new Error('Cliente não encontrado.');
    if (actor.role === 'seller' && client.assignedSellerId !== actor.id) {
      throw new Error('Sem permissão para reagendar este cliente.');
    }

    const meeting = db.meetings.find((m) => m.id === client.currentMeetingId);
    if (!meeting) throw new Error('Agendamento vigente não encontrado.');

    const prevDate = meeting.scheduledDate;
    const prevTime = meeting.scheduledTime;

    const record = {
      id: generateId('rsc'),
      clientId,
      meetingId: meeting.id,
      sellerId: client.assignedSellerId,
      actorId: actor.id,
      previousDate: prevDate,
      previousTime: prevTime,
      newDate,
      newTime,
      reason: (reason || 'Não informado').trim(),
      notes: (notes || '').trim(),
      readByAdmin: actor.role === 'admin',
      createdAt: nowIso(),
    };

    meeting.scheduledDate = newDate;
    meeting.scheduledTime = newTime;
    meeting.status = 'scheduled';
    meeting.rescheduleCount = (meeting.rescheduleCount || 0) + 1;

    db.rescheduleRecords.unshift(record);

    this.pushTimeline(
      db,
      clientId,
      actor.id,
      'RESCHEDULED',
      'Reunião de vendas reagendada',
      `De ${formatDateWithWeekdayBR(prevDate, prevTime)} para ${formatDateWithWeekdayBR(newDate, newTime)}. Motivo: ${record.reason}.`
    );

    if (actor.role !== 'admin') {
      db.users
        .filter((u) => u.role === 'admin' && u.active && !u.deleted)
        .forEach((p) => {
          this.pushNotification(
            db,
            p.id,
            'Reunião reagendada',
            `${actor.name} reagendou a call com ${client.name} para ${formatDateWithWeekdayBR(newDate, newTime)}.`,
            { clientId, recordId: record.id }
          );
        });
    }

    this.logAudit(db, actor.id, 'MEETING_RESCHEDULED', `Reunião de ${client.name} reagendada`);
    this.saveState(db);
    return record;
  }

  // Registro de Vácuo (não contabiliza como reunião realizada)
  registerNoShow(actor, clientId, { reason, description, contactAttempts }) {
    if (!actor || !actor.active) throw new Error('Usuário não autenticado.');
    if (!reason || !description?.trim()) {
      throw new Error('Selecione o motivo e descreva o ocorrido.');
    }

    const db = this.getState();
    const client = db.clients.find((c) => c.id === clientId);
    if (!client) throw new Error('Cliente não encontrado.');
    if (actor.role === 'seller' && client.assignedSellerId !== actor.id) {
      throw new Error('Sem permissão para registrar ocorrência neste cliente.');
    }

    const meeting = db.meetings.find((m) => m.id === client.currentMeetingId);
    const ts = nowIso();

    const occurrence = {
      id: generateId('vac'),
      clientId,
      meetingId: meeting?.id || null,
      sellerId: client.assignedSellerId,
      actorId: actor.id,
      reason,
      description: description.trim(),
      contactAttempts: Number(contactAttempts) || 1,
      readByAdmin: actor.role === 'admin',
      createdAt: ts,
    };

    if (meeting) {
      meeting.status = 'no_show';
    }

    db.noShowOccurrences.unshift(occurrence);

    this.pushTimeline(
      db,
      clientId,
      actor.id,
      'NO_SHOW',
      `Ocorrência de vácuo: ${reason}`,
      occurrence.description
    );

    if (actor.role !== 'admin') {
      db.users
        .filter((u) => u.role === 'admin' && u.active && !u.deleted)
        .forEach((p) => {
          this.pushNotification(
            db,
            p.id,
            'Ocorrência de Vácuo registrada',
            `${actor.name} registrou vácuo (${reason}) para ${client.name}.`,
            { clientId, occurrenceId: occurrence.id }
          );
        });
    }

    this.logAudit(db, actor.id, 'MEETING_NO_SHOW', `Vácuo registrado para ${client.name}: ${reason}`);
    this.saveState(db);
    return occurrence;
  }

  // Envio do Relatório Único (Registro dos Dados + Registro da Venda opcional)
  submitUnifiedMeetingReport(actor, clientId, form) {
    if (!actor || !actor.active) throw new Error('Usuário não autenticado.');
    const db = this.getState();
    const client = db.clients.find((c) => c.id === clientId);
    if (!client) throw new Error('Cliente não encontrado.');
    if (actor.role === 'seller' && client.assignedSellerId !== actor.id) {
      throw new Error('Você não tem permissão para registrar este atendimento.');
    }

    const meeting = db.meetings.find((m) => m.id === client.currentMeetingId);
    if (!meeting) throw new Error('Agendamento da reunião não encontrado.');

    const existingReport = db.meetingReports.find((r) => r.meetingId === meeting.id);
    if (existingReport) {
      throw new Error('O relatório desta reunião já foi enviado anteriormente.');
    }

    if (!form.saleClosedChoice) {
      throw new Error('Informe se houve venda concluída neste atendimento.');
    }

    const isSaleClosed = form.saleClosedChoice === 'Venda concluída';
    if (isSaleClosed) {
      if (!form.saleValue || Number(form.saleValue) <= 0) {
        throw new Error('Informe um Valor Vendido válido maior que zero.');
      }
      if (!form.paymentStructure) {
        throw new Error('Selecione se o pagamento é imediato ou 50/50.');
      }
      if (!form.paymentMethod?.trim()) {
        throw new Error('Informe o método de pagamento.');
      }
    }

    const fillOrDefault = (val) => (val && String(val).trim() ? String(val).trim() : 'Não informado');
    const ts = nowIso();
    const reportId = generateId('rep');
    const prevReschedules = db.rescheduleRecords.filter((r) => r.clientId === clientId);

    let createdSaleId = null;

    if (isSaleClosed) {
      const existingSale = db.sales.find((s) => s.clientId === clientId && s.meetingId === meeting.id);
      if (!existingSale) {
        createdSaleId = generateId('sal');
        const soldVal = Number(form.saleValue);
        const sentVal = Number(form.amountSent) || 0;
        if (sentVal < 0 || sentVal > soldVal) {
          throw new Error('O valor enviado não pode ser negativo nem superior ao valor vendido.');
        }

        const sale = {
          id: createdSaleId,
          clientId,
          sellerId: client.assignedSellerId,
          meetingId: meeting.id,
          reportId,
          saleDate: ts,
          amountSold: soldVal,
          amountReceived: sentVal,
          paymentStructure: form.paymentStructure, // 'Pagamento imediato' | '50/50'
          paymentMethod: form.paymentMethod.trim(),
          financialStatus: form.financialStatus || 'Pagamento pendente',
          // Status de validação do Pablo: pending_pablo | confirmed_sdr | confirmed_vercel | not_sold
          pabloValidationStatus: 'pending_pablo',
          pabloValidatedAt: null,
          pabloValidatedById: null,
          notes: fillOrDefault(form.saleNotes),
          createdAt: ts,
        };
        db.sales.unshift(sale);
      }
    }

    const report = {
      id: reportId,
      clientId,
      sellerId: client.assignedSellerId,
      meetingId: meeting.id,
      saleId: createdSaleId,
      scheduledDate: meeting.scheduledDate,
      scheduledTime: meeting.scheduledTime,
      effectiveDateTime: form.effectiveDateTime || ts,
      durationMinutes: fillOrDefault(form.durationMinutes),
      previousReschedulesCount: prevReschedules.length,
      // Negócio & Oferta + Dificuldades / Necessidades
      businessDescription: fillOrDefault(form.businessDescription),
      productsOrServices: fillOrDefault(form.productsOrServices),
      targetAudienceAndRegion: fillOrDefault(form.targetAudienceAndRegion),
      currentDigitalPresence: fillOrDefault(form.currentDigitalPresence),
      mainDifficulties: fillOrDefault(form.mainDifficulties),
      clientNeedsAndGoals: fillOrDefault(form.clientNeedsAndGoals),
      // Solução & Proposta
      howSiteHelpsClient: fillOrDefault(form.howSiteHelpsClient),
      domainPlatform: form.domainPlatform || 'Não informado', // 'Wix' | 'Vercel'
      nextCallSitePresentationDate: fillOrDefault(form.nextCallSitePresentationDate),
      proposedValue: fillOrDefault(form.proposedValue),
      // Autoavaliação e Depoimento livre
      selfEvaluation: fillOrDefault(form.selfEvaluation),
      sellerTestimony: fillOrDefault(form.sellerTestimony),
      saleClosedChoice: form.saleClosedChoice,
      readByAdmin: actor.role === 'admin',
      createdAt: ts,
    };

    meeting.status = 'completed';
    meeting.completedAt = ts;
    db.meetingReports.unshift(report);

    this.pushTimeline(
      db,
      clientId,
      actor.id,
      'REPORT_SUBMITTED',
      'Relatório da Reunião de Vendas enviado',
      `Reunião concluída por ${actor.name}. Situação comercial: ${form.saleClosedChoice}.`
    );

    if (actor.role !== 'admin') {
      db.users
        .filter((u) => u.role === 'admin' && u.active && !u.deleted)
        .forEach((p) => {
          this.pushNotification(
            db,
            p.id,
            isSaleClosed ? 'Novo relatório com Venda para confirmar!' : 'Novo relatório de reunião recebido',
            `${actor.name} enviou o relatório do cliente ${client.name} (${form.saleClosedChoice}).`,
            { clientId, reportId, saleId: createdSaleId }
          );
        });
    }

    this.logAudit(db, actor.id, 'REPORT_SUBMITTED', `Relatório único enviado para ${client.name}`);
    this.saveState(db);
    return report;
  }

  // Decisão exclusiva do Pablo sobre a venda relatada:
  // 'confirmed_sdr' | 'confirmed_vercel' | 'not_sold'
  validateReportedSaleByPablo(actor, saleId, decision) {
    if (!actor || actor.role !== 'admin' || !actor.active) {
      throw new Error('Apenas o Pablo pode validar vendas relatadas.');
    }
    const db = this.getState();
    const sale = db.sales.find((s) => s.id === saleId);
    if (!sale) throw new Error('Registro de venda não encontrado.');

    const client = db.clients.find((c) => c.id === sale.clientId);
    const ts = nowIso();
    sale.pabloValidationStatus = decision;
    sale.pabloValidatedAt = ts;
    sale.pabloValidatedById = actor.id;

    if (decision === 'confirmed_sdr') {
      if (sale.financialStatus === 'Cancelada') {
        sale.financialStatus = 'Concluída';
      }
      this.pushTimeline(
        db,
        sale.clientId,
        actor.id,
        'SALE_CONFIRMED_SDR',
        'Venda confirmada pelo Pablo (Wix / SDR)',
        `Venda de ${formatCurrencyBRL(sale.amountSold)} confirmada para ${client?.name || 'cliente'} com repasse de visibilidade ao SDR (US$ 50 Wix).`
      );
      // Notifica SDRs ativos
      db.users
        .filter((u) => u.role === 'sdr' && u.active && !u.deleted)
        .forEach((sdr) => {
          this.pushNotification(
            db,
            sdr.id,
            'Nova venda confirmada!',
            `Uma venda foi concluída para o cliente ${client?.name || 'cadastrado'} (Comissão Wix: US$ 50,00).`,
            { saleId: sale.id }
          );
        });
      // Notifica vendedor
      this.pushNotification(
        db,
        sale.sellerId,
        'Venda confirmada pelo Pablo',
        `Sua venda para ${client?.name || 'cliente'} (${formatCurrencyBRL(sale.amountSold)}) foi confirmada.`,
        { saleId: sale.id }
      );
    } else if (decision === 'confirmed_vercel') {
      if (sale.financialStatus === 'Cancelada') {
        sale.financialStatus = 'Concluída';
      }
      this.pushTimeline(
        db,
        sale.clientId,
        actor.id,
        'SALE_CONFIRMED_VERCEL',
        'Venda confirmada pelo Pablo (Vercel)',
        `Venda de ${formatCurrencyBRL(sale.amountSold)} confirmada via Vercel para ${client?.name || 'cliente'} (restrita ao Pablo e vendedor).`
      );
      this.pushNotification(
        db,
        sale.sellerId,
        'Venda Vercel confirmada pelo Pablo',
        `Sua venda via Vercel para ${client?.name || 'cliente'} (${formatCurrencyBRL(sale.amountSold)}) foi confirmada.`,
        { saleId: sale.id }
      );
    } else if (decision === 'not_sold') {
      sale.financialStatus = 'Cancelada';
      this.pushTimeline(
        db,
        sale.clientId,
        actor.id,
        'SALE_NOT_SOLD',
        'Marcado como Não Vendido pelo Pablo',
        `O Pablo registrou que a negociação com ${client?.name || 'cliente'} não foi concluída como venda.`
      );
      this.pushNotification(
        db,
        sale.sellerId,
        'Atualização de venda pelo Pablo',
        `O fechamento de ${client?.name || 'cliente'} foi registrado como Não Vendido pelo Pablo.`,
        { saleId: sale.id }
      );
    }

    this.logAudit(db, actor.id, 'PABLO_SALE_VALIDATION', `Venda ${sale.id} marcada como ${decision}`);
    this.saveState(db);
    return sale;
  }

  updateSaleFinancials(actor, saleId, { financialStatus, amountReceived, notes }) {
    if (!actor || !actor.active) throw new Error('Usuário não autenticado.');
    const db = this.getState();
    const sale = db.sales.find((s) => s.id === saleId);
    if (!sale) throw new Error('Venda não encontrada.');
    if (actor.role === 'seller' && sale.sellerId !== actor.id) {
      throw new Error('Você só pode editar suas próprias vendas.');
    }

    const received = Number(amountReceived);
    if (isNaN(received) || received < 0 || received > sale.amountSold) {
      throw new Error(`O valor recebido deve estar entre R$ 0,00 e ${formatCurrencyBRL(sale.amountSold)}.`);
    }

    sale.financialStatus = financialStatus;
    sale.amountReceived = received;
    if (notes !== undefined) sale.notes = notes;

    this.pushTimeline(
      db,
      sale.clientId,
      actor.id,
      'SALE_UPDATED',
      'Status financeiro da venda atualizado',
      `Status: ${financialStatus}. Valor recebido: ${formatCurrencyBRL(received)} de ${formatCurrencyBRL(sale.amountSold)}.`
    );

    this.logAudit(db, actor.id, 'SALE_UPDATED', `Venda ${sale.id} atualizada (${financialStatus})`);
    this.saveState(db);
    return sale;
  }

  markReportItemRead(actor, kind, itemId) {
    if (!actor || actor.role !== 'admin') return;
    const db = this.getState();
    const list =
      kind === 'report'
        ? db.meetingReports
        : kind === 'no_show'
        ? db.noShowOccurrences
        : db.rescheduleRecords;
    const item = list.find((x) => x.id === itemId);
    if (item && !item.readByAdmin) {
      item.readByAdmin = true;
      this.saveState(db);
    }
  }

  markAllNotificationsRead(userId) {
    const db = this.getState();
    db.notifications.forEach((n) => {
      if (n.recipientId === userId) n.read = true;
    });
    this.saveState(db);
  }

  // Gestão de Usuários pelo Pablo
  createUserAccount(actor, { name, email, password, role }) {
    if (!actor || actor.role !== 'admin' || !actor.active) {
      throw new Error('Apenas o Pablo pode criar contas de equipe.');
    }
    if (!name?.trim() || !email?.trim() || !password || password.length < 6) {
      throw new Error('Preencha nome, e-mail e senha com no mínimo 6 caracteres.');
    }
    const targetRole = role === 'sdr' ? 'sdr' : 'seller';
    const db = this.getState();
    const cleanEmail = email.trim().toLowerCase();
    if (db.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      throw new Error('Já existe uma conta cadastrada com este e-mail.');
    }

    const newUser = {
      id: generateId('usr'),
      name: name.trim(),
      email: cleanEmail,
      passwordHash: password,
      role: targetRole,
      active: true,
      deleted: false,
      createdAt: nowIso(),
    };

    db.users.push(newUser);
    this.logAudit(db, actor.id, 'USER_CREATED', `Conta ${targetRole.toUpperCase()} criada: ${newUser.name}`);
    this.saveState(db);
    return newUser;
  }

  toggleUserActive(actor, targetUserId) {
    if (!actor || actor.role !== 'admin' || !actor.active) {
      throw new Error('Permissão negada.');
    }
    if (actor.id === targetUserId) {
      throw new Error('O Pablo não pode desativar a própria conta.');
    }
    const db = this.getState();
    const user = db.users.find((u) => u.id === targetUserId && !u.deleted);
    if (!user) throw new Error('Usuário não encontrado.');

    user.active = !user.active;
    this.logAudit(
      db,
      actor.id,
      user.active ? 'USER_REACTIVATED' : 'USER_DEACTIVATED',
      `Conta de ${user.name} ${user.active ? 'reativada' : 'desativada'} pelo Pablo.`
    );
    this.saveState(db);
    return user;
  }

  deleteUserAccount(actor, targetUserId, transferToSellerId = '') {
    if (!actor || actor.role !== 'admin' || !actor.active) {
      throw new Error('Permissão negada.');
    }
    if (actor.id === targetUserId) {
      throw new Error('O Pablo não pode excluir a própria conta.');
    }
    const db = this.getState();
    const user = db.users.find((u) => u.id === targetUserId && !u.deleted);
    if (!user) throw new Error('Usuário não encontrado.');

    if (user.role === 'seller' && transferToSellerId) {
      const targetSeller = db.users.find(
        (u) => u.id === transferToSellerId && u.role === 'seller' && u.active && !u.deleted && u.id !== targetUserId
      );
      if (targetSeller) {
        db.clients.forEach((c) => {
          if (c.assignedSellerId === targetUserId) {
            c.assignedSellerId = targetSeller.id;
            this.pushTimeline(
              db,
              c.id,
              actor.id,
              'REASSIGNED',
              'Transferência por exclusão de conta',
              `Carteira transferida pelo Pablo para ${targetSeller.name} após encerramento de ${user.name}.`
            );
          }
        });
      }
    }

    user.active = false;
    user.deleted = true;
    user.deletedAt = nowIso();
    this.logAudit(db, actor.id, 'USER_DELETED', `Conta de ${user.name} (${user.email}) excluída com preservação histórica.`);
    this.saveState(db);
    return user;
  }
}

const dataEngine = new PontoWebDataEngine();

// ============================================================================
// 5. CONTEXTO GLOBAL DA APLICAÇÃO
// ============================================================================
const AppContext = createContext(null);

function useApp() {
  return useContext(AppContext);
}

// ============================================================================
// 6. COMPONENTES REUTILIZÁVEIS DO DESIGN SYSTEM
// ============================================================================
function PontoWebLogo({ size = 'md' }) {
  const dim = size === 'lg' ? 'w-11 h-11 text-lg' : 'w-9 h-9 text-sm';
  return (
    <div className="flex items-center gap-3 select-none">
      <img
        src="/pontoweb-logomarca.png"
        alt="PontoWeb"
        className={`${dim} rounded-xl object-contain shrink-0`}
        style={{ boxShadow: '0 0 22px rgba(128, 23, 255, 0.45)' }}
      />
      <div>
        <div className="font-semibold tracking-tight leading-none flex items-center gap-1.5">
          <span>PontoWeb</span>
          <span
            className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded-md font-semibold"
            style={{ backgroundColor: 'rgba(128, 23, 255, 0.16)', color: '#B87CFF' }}
          >
            CRM
          </span>
        </div>
        <p className="text-[11px] opacity-60 mt-0.5">CRM Executivo</p>
      </div>
    </div>
  );
}

function Card({ children, className = '', onClick, glow = false }) {
  const { tokens } = useApp();
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border transition-all duration-200 ${onClick ? 'cursor-pointer hover:translate-y-[-1px]' : ''} ${className}`}
      style={{
        backgroundColor: tokens.surface,
        borderColor: glow ? tokens.primary : tokens.border,
        boxShadow: glow ? '0 0 24px rgba(128, 23, 255, 0.16)' : 'none',
      }}
    >
      {children}
    </div>
  );
}

function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  type = 'button',
  disabled = false,
  className = '',
  sfx = 'click',
}) {
  const { tokens } = useApp();
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-5 py-3 text-sm',
  };

  let style = {};
  if (variant === 'primary') {
    style = {
      background: 'linear-gradient(135deg, #8017FF 0%, #6310CC 100%)',
      color: '#FFFFFF',
      boxShadow: disabled ? 'none' : '0 4px 18px rgba(128, 23, 255, 0.32)',
    };
  } else if (variant === 'secondary') {
    style = {
      backgroundColor: tokens.surfaceElevated,
      color: tokens.text,
      border: `1px solid ${tokens.border}`,
    };
  } else if (variant === 'success') {
    style = {
      backgroundColor: tokens.success,
      color: '#FFFFFF',
    };
  } else if (variant === 'danger') {
    style = {
      backgroundColor: tokens.error,
      color: '#FFFFFF',
    };
  } else if (variant === 'warning') {
    style = {
      backgroundColor: tokens.warning,
      color: '#FFFFFF',
    };
  } else if (variant === 'ghost') {
    style = {
      backgroundColor: 'transparent',
      color: tokens.textSecondary,
    };
  }

  const handleClick = (e) => {
    if (disabled) return;
    if (sfx) soundEngine.playSfx(sfx);
    onClick?.(e);
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={handleClick}
      style={style}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-150 disabled:opacity-45 disabled:cursor-not-allowed active:scale-[0.98] ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}

function Badge({ children, tone = 'neutral' }) {
  const { tokens } = useApp();
  const map = {
    primary: { bg: 'rgba(128, 23, 255, 0.16)', color: '#B97EFF', border: 'rgba(128, 23, 255, 0.35)' },
    success: { bg: 'rgba(22, 132, 91, 0.16)', color: '#2AC78E', border: 'rgba(22, 132, 91, 0.35)' },
    warning: { bg: 'rgba(183, 121, 31, 0.16)', color: '#F2B450', border: 'rgba(183, 121, 31, 0.35)' },
    error: { bg: 'rgba(200, 62, 77, 0.16)', color: '#F27986', border: 'rgba(200, 62, 77, 0.35)' },
    neutral: { bg: tokens.surfaceElevated, color: tokens.textSecondary, border: tokens.border },
  };
  const cfg = map[tone] || map.neutral;
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-medium border"
      style={{ backgroundColor: cfg.bg, color: cfg.color, borderColor: cfg.border }}
    >
      {children}
    </span>
  );
}

function InputField({ label, required, error, className = '', ...props }) {
  const { tokens } = useApp();
  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-medium mb-1.5" style={{ color: tokens.textSecondary }}>
          {label} {required && <span style={{ color: tokens.primary }}>*</span>}
        </label>
      )}
      <input
        {...props}
        className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none transition-all focus:ring-2"
        style={{
          backgroundColor: tokens.surfaceElevated,
          borderColor: error ? tokens.error : tokens.border,
          color: tokens.text,
          '--tw-ring-color': 'rgba(128, 23, 255, 0.45)',
        }}
      />
      {error && (
        <p className="text-xs mt-1" style={{ color: tokens.error }}>
          {error}
        </p>
      )}
    </div>
  );
}

function TextAreaField({ label, required, rows = 3, className = '', ...props }) {
  const { tokens } = useApp();
  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-medium mb-1.5" style={{ color: tokens.textSecondary }}>
          {label} {required && <span style={{ color: tokens.primary }}>*</span>}
        </label>
      )}
      <textarea
        rows={rows}
        {...props}
        className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none transition-all focus:ring-2 resize-y"
        style={{
          backgroundColor: tokens.surfaceElevated,
          borderColor: tokens.border,
          color: tokens.text,
          '--tw-ring-color': 'rgba(128, 23, 255, 0.45)',
        }}
      />
    </div>
  );
}

function SelectField({ label, required, children, className = '', ...props }) {
  const { tokens } = useApp();
  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-medium mb-1.5" style={{ color: tokens.textSecondary }}>
          {label} {required && <span style={{ color: tokens.primary }}>*</span>}
        </label>
      )}
      <select
        {...props}
        className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none transition-all focus:ring-2"
        style={{
          backgroundColor: tokens.surfaceElevated,
          borderColor: tokens.border,
          color: tokens.text,
          '--tw-ring-color': 'rgba(128, 23, 255, 0.45)',
        }}
      >
        {children}
      </select>
    </div>
  );
}

function Modal({ open, onClose, title, subtitle, children, maxWidth = 'max-w-2xl' }) {
  const { tokens } = useApp();
  useEffect(() => {
    if (open) soundEngine.playSfx('whoosh');
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div
        className={`w-full ${maxWidth} rounded-2xl border shadow-2xl max-h-[90vh] flex flex-col overflow-hidden`}
        style={{
          backgroundColor: tokens.surface,
          borderColor: tokens.border,
          color: tokens.text,
          boxShadow: '0 24px 64px rgba(0,0,0,0.65), 0 0 32px rgba(128,23,255,0.18)',
        }}
      >
        <div
          className="px-6 py-4 border-b flex items-center justify-between gap-4 shrink-0"
          style={{ borderColor: tokens.border, color: tokens.text }}
        >
          <h3 className="text-base font-semibold" style={{ color: tokens.text }}>
            {title}
          </h3>
          <button
            onClick={() => {
              soundEngine.playSfx('click');
              onClose();
            }}
            className="p-1.5 rounded-lg hover:opacity-80 transition-opacity"
            style={{ backgroundColor: tokens.surfaceElevated, color: tokens.textSecondary }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div
          className="p-6 overflow-y-auto space-y-5"
          style={{ color: tokens.text }}
        >
          {subtitle && (
            <p className="text-xs leading-relaxed" style={{ color: tokens.textSecondary }}>
              {subtitle}
            </p>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description, action }) {
  const { tokens } = useApp();
  return (
    <Card className="p-8 text-center flex flex-col items-center justify-center space-y-3">
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center"
        style={{ backgroundColor: 'rgba(128, 23, 255, 0.14)', color: '#B87CFF' }}
      >
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-semibold" style={{ color: tokens.text }}>{title}</h4>
      <p className="text-xs max-w-md" style={{ color: tokens.textSecondary }}>
        {description}
      </p>
      {action && <div className="pt-2">{action}</div>}
    </Card>
  );
}

function getUserDisplayName(users, userId) {
  if (!userId) return 'Não atribuído';
  const u = users.find((x) => x.id === userId);
  if (!u) return 'Usuário desconhecido';
  return u.deleted ? `${u.name} (conta excluída)` : u.name;
}

// ============================================================================
// 7. TELA DE AUTENTICAÇÃO & ACESSO RÁPIDO
// ============================================================================
function AuthScreen({ onAuthenticated }) {
  const { tokens, theme, toggleTheme, notify } = useApp();
  const [mode, setMode] = useState('login'); // login | reset
  const [email, setEmail] = useState('tpablo488@gmail.com');
  const [password, setPassword] = useState('PontoWeb@2026');
  const [newPassword, setNewPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = dataEngine.login(email, password);
      soundEngine.playSfx('success');
      notify(`Bem-vindo(a), ${user.name}!`, 'success');
      onAuthenticated(user);
    } catch (err) {
      soundEngine.playSfx('error');
      notify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = (e) => {
    e.preventDefault();
    try {
      dataEngine.resetPassword(email, newPassword);
      soundEngine.playSfx('success');
      notify('Senha redefinida com sucesso! Faça login com a nova senha.', 'success');
      setPassword(newPassword);
      setNewPassword('');
      setMode('login');
    } catch (err) {
      soundEngine.playSfx('error');
      notify(err.message, 'error');
    }
  };

  const fillQuickAccount = (accEmail, accPwd) => {
    soundEngine.playSfx('click');
    setEmail(accEmail);
    setPassword(accPwd);
    setMode('login');
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-between p-4 sm:p-8 relative overflow-hidden"
      style={{ backgroundColor: tokens.bg, color: tokens.text }}
    >
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[620px] h-[340px] rounded-full blur-[130px] opacity-25"
        style={{ background: 'radial-gradient(circle, #8017FF 0%, transparent 70%)' }}
      />

      <header className="max-w-5xl w-full mx-auto flex items-center justify-between z-10">
        <PontoWebLogo size="lg" />
        <Button variant="secondary" size="sm" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          <span>{theme === 'dark' ? 'Tema Claro' : 'Tema Escuro'}</span>
        </Button>
      </header>

      <main className="max-w-md w-full mx-auto my-8 z-10">
        <Card glow className="p-6 sm:p-8 space-y-6">
          <div>
            <Badge tone="primary">Acesso Restrito • PontoWeb</Badge>
            <h1 className="text-xl font-bold mt-2.5" style={{ color: tokens.text }}>
              <span style={{ letterSpacing: '0.08em' }}>{mode === 'login' ? 'Entrar no PontoWeb CRM' : 'Recuperar Senha'}</span>
            </h1>
            <p className="text-xs mt-1" style={{ color: tokens.textSecondary }}>
              {mode === 'login'
                ? 'Ambiente comercial privado para Pablo, Vendedores e SDR.'
                : 'Informe seu e-mail cadastrado e defina uma nova senha de acesso.'}
            </p>
          </div>

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <InputField
                label="E-mail corporativo"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@pontoweb.com"
              />

              <div className="relative">
                <InputField
                  label="Senha"
                  type={showPwd ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-8 opacity-60 hover:opacity-100"
                  style={{ color: tokens.textSecondary }}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playSfx('click');
                    setMode('reset');
                  }}
                  className="hover:underline"
                  style={{ color: '#B87CFF' }}
                >
                  Esqueci minha senha
                </button>
              </div>

              <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
                <Lock className="w-4 h-4" />
                <span>{loading ? 'Autenticando...' : 'Acessar Sistema'}</span>
              </Button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <InputField
                label="E-mail da conta"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <InputField
                label="Nova senha (mínimo 6 caracteres)"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={() => setMode('login')}>
                  Voltar
                </Button>
                <Button type="submit" variant="primary" className="flex-1">
                  Redefinir Senha
                </Button>
              </div>
            </form>
          )}

          {/* Acesso rápido provisório entre perfis */}
          <div className="pt-4 border-t space-y-2" style={{ borderColor: tokens.border }}>
            <p className="text-[11px] uppercase tracking-wider opacity-60 font-semibold">
              Contas Provisionadas (Acesso Rápido):
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillQuickAccount('tpablo488@gmail.com', 'PROVISORIIOhav787682#$')}
                className="p-2.5 rounded-xl border text-left text-xs transition-all hover:border-[#8017FF]"
                style={{ backgroundColor: tokens.surfaceElevated, borderColor: tokens.border, color: tokens.text }}
              >
                <div className="font-semibold text-[#B87CFF]">Pablo (Admin)</div>
                <div className="opacity-65 text-[10px] truncate">tpablo488@gmail.com</div>
              </button>
              <button
                type="button"
                onClick={() => fillQuickAccount('jtoxx7@gmail.com', '1234vendedorpntw')}
                className="p-2.5 rounded-xl border text-left text-xs transition-all hover:border-[#8017FF]"
                style={{ backgroundColor: tokens.surfaceElevated, borderColor: tokens.border, color: tokens.text }}
              >
                <div className="font-semibold text-[#2AC78E]">Vendedor Jay</div>
                <div className="opacity-65 text-[10px] truncate">jtoxx7@gmail.com</div>
              </button>
              <button
                type="button"
                onClick={() => fillQuickAccount('oliverf487@gmail.com', '1234SDRpntw')}
                className="p-2.5 rounded-xl border text-left text-xs transition-all hover:border-[#8017FF]"
                style={{ backgroundColor: tokens.surfaceElevated, borderColor: tokens.border, color: tokens.text }}
              >
                <div className="font-semibold text-[#F2B450]">Oliver (SDR)</div>
                <div className="opacity-65 text-[10px] truncate">oliverf487@gmail.com</div>
              </button>
            </div>
          </div>
        </Card>
      </main>

      <footer className="text-center text-[11px] opacity-50 z-10">
        PontoWeb CRM • Segurança RBAC, Auditoria & Persistência em Tempo Real
      </footer>
    </div>
  );
}

// ============================================================================
// 8. MODAL DE REUNIÃO DE VENDAS (CALL ÚNICA: REALIZADA / VÁCUO / REAGENDAMENTO)
// ============================================================================
function MeetingActionModal({ open, onClose, client }) {
  const { user, db, tokens, notify } = useApp();
  const [step, setStep] = useState('choose'); // choose | completed | no_show | reschedule

  const [noShowForm, setNoShowForm] = useState({
    reason: 'Cliente não respondeu',
    description: '',
    contactAttempts: 2,
  });

  const [rescheduleForm, setRescheduleForm] = useState({
    newDate: '',
    newTime: '',
    reason: '',
    notes: '',
  });

  const [reportForm, setReportForm] = useState({
    durationMinutes: '',
    businessDescription: '',
    productsOrServices: '',
    targetAudienceAndRegion: '',
    currentDigitalPresence: '',
    mainDifficulties: '',
    clientNeedsAndGoals: '',
    howSiteHelpsClient: '',
    domainPlatform: 'Wix',
    nextCallSitePresentationDate: '',
    selfEvaluation: '',
    sellerTestimony: '',
    saleClosedChoice: '',
    financialStatus: 'Pagamento pendente',
    paymentStructure: 'Pagamento imediato',
    saleValue: '',
    amountSent: '',
    paymentMethod: 'PIX',
    saleNotes: '',
  });

  useEffect(() => {
    if (open) {
      setStep('choose');
    }
  }, [open, client?.id]);

  if (!open || !client) return null;

  const meeting = db.meetings.find((m) => m.id === client.currentMeetingId);
  const prevReschedules = db.rescheduleRecords.filter((r) => r.clientId === client.id);

  const handleSaveNoShow = (e) => {
    e.preventDefault();
    try {
      dataEngine.registerNoShow(user, client.id, noShowForm);
      soundEngine.playSfx('warning');
      notify('Ocorrência de vácuo registrada no histórico.', 'warning');
      onClose();
    } catch (err) {
      soundEngine.playSfx('error');
      notify(err.message, 'error');
    }
  };

  const handleSaveReschedule = (e) => {
    e.preventDefault();
    try {
      dataEngine.rescheduleMeeting(user, client.id, rescheduleForm);
      soundEngine.playSfx('success');
      notify('Reunião reagendada com preservação do histórico original!', 'success');
      onClose();
    } catch (err) {
      soundEngine.playSfx('error');
      notify(err.message, 'error');
    }
  };

  const handleSaveReport = (e) => {
    e.preventDefault();
    try {
      dataEngine.submitUnifiedMeetingReport(user, client.id, reportForm);
      soundEngine.playSfx('success');
      notify('Registro dos Dados enviado com sucesso ao Pablo!', 'success');
      onClose();
    } catch (err) {
      soundEngine.playSfx('error');
      notify(err.message, 'error');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidth="max-w-3xl"
      title={`Reunião de Vendas • ${client.name}`}
      subtitle="Utilize esta opção após o horário previsto para a reunião ou quando precisar registrar o resultado do atendimento. Escolha a situação correspondente para manter o histórico atualizado. Ao marcar a reunião como realizada, você deverá preencher o relatório completo. Se o cliente não compareceu ou não respondeu, registre a ocorrência. Caso a reunião tenha sido reagendada, informe a nova data e o novo horário."
    >
      {/* Bloco nativo Reunião de vendas: Infos */}
      <div
        className="p-4 rounded-xl border grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs"
        style={{ backgroundColor: tokens.surfaceElevated, borderColor: tokens.border, color: tokens.text }}
      >
        <div>
          <span className="opacity-65 block">Data / Horário</span>
          <strong className="mt-0.5 block">
            {meeting ? formatDateWithWeekdayBR(meeting.scheduledDate, meeting.scheduledTime) : 'N/A'}
          </strong>
        </div>
        <div>
          <span className="opacity-65 block">Status</span>
          <div className="mt-0.5">
            {meeting?.status === 'completed' ? (
              <Badge tone="success">Realizada</Badge>
            ) : meeting?.status === 'no_show' ? (
              <Badge tone="error">Vácuo registrado</Badge>
            ) : (
              <Badge tone="primary">Agendada</Badge>
            )}
          </div>
        </div>
        <div>
          <span className="opacity-65 block">Reagendamentos anteriores</span>
          <strong className="mt-0.5 block">
            {prevReschedules.length === 0
              ? 'Nenhum reagendamento'
              : `${prevReschedules.length} reagendamento(s)`}
          </strong>
        </div>
      </div>

      {step === 'choose' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              soundEngine.playSfx('click');
              setStep('completed');
            }}
            className="p-4 rounded-xl border text-left transition-all hover:border-[#8017FF]"
            style={{ backgroundColor: tokens.surfaceElevated, borderColor: tokens.border, color: tokens.text }}
          >
            <CheckCircle2 className="w-5 h-5 mb-2" style={{ color: '#2AC78E' }} />
            <div className="font-semibold text-sm" style={{ color: tokens.text }}>Realizada</div>
            <p className="text-xs mt-1" style={{ color: tokens.textSecondary }}>
              Preencher o Registro dos Dados e Registro da Venda.
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playSfx('click');
              setStep('no_show');
            }}
            className="p-4 rounded-xl border text-left transition-all hover:border-[#C83E4D]"
            style={{ backgroundColor: tokens.surfaceElevated, borderColor: tokens.border, color: tokens.text }}
          >
            <XCircle className="w-5 h-5 mb-2" style={{ color: '#F27986' }} />
            <div className="font-semibold text-sm" style={{ color: tokens.text }}>Vácuo</div>
            <p className="text-xs mt-1" style={{ color: tokens.textSecondary }}>
              Cliente não compareceu, não respondeu ou cancelou.
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playSfx('click');
              setStep('reschedule');
            }}
            className="p-4 rounded-xl border text-left transition-all hover:border-[#B7791F]"
            style={{ backgroundColor: tokens.surfaceElevated, borderColor: tokens.border, color: tokens.text }}
          >
            <Calendar className="w-5 h-5 mb-2" style={{ color: '#F2B450' }} />
            <div className="font-semibold text-sm" style={{ color: tokens.text }}>Reagendamento</div>
            <p className="text-xs mt-1" style={{ color: tokens.textSecondary }}>
              Definir nova data e horário mantendo histórico.
            </p>
          </button>
        </div>
      )}

      {step === 'no_show' && (
        <form onSubmit={handleSaveNoShow} className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold" style={{ color: tokens.text }}>Registrar Ocorrência de Vácuo</h4>
            <Button size="sm" variant="ghost" onClick={() => setStep('choose')}>
              Voltar às opções
            </Button>
          </div>
          <SelectField
            label="Motivo"
            required
            value={noShowForm.reason}
            onChange={(e) => setNoShowForm({ ...noShowForm, reason: e.target.value })}
          >
            <option value="Cliente não respondeu">Cliente não respondeu</option>
            <option value="Cliente não compareceu">Cliente não compareceu</option>
            <option value="Cliente cancelou sem reagendar">Cliente cancelou sem reagendar</option>
            <option value="Outro motivo">Outro motivo</option>
          </SelectField>
          <InputField
            label="Tentativas de contato realizadas"
            type="number"
            min="1"
            value={noShowForm.contactAttempts}
            onChange={(e) => setNoShowForm({ ...noShowForm, contactAttempts: e.target.value })}
          />
          <TextAreaField
            label="Descrição do ocorrido"
            required
            rows={3}
            placeholder="Descreva o que houve no horário da reunião..."
            value={noShowForm.description}
            onChange={(e) => setNoShowForm({ ...noShowForm, description: e.target.value })}
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="danger">
              Registrar Vácuo
            </Button>
          </div>
        </form>
      )}

      {step === 'reschedule' && (
        <form onSubmit={handleSaveReschedule} className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold" style={{ color: tokens.text }}>Reagendar Reunião de Vendas</h4>
            <Button size="sm" variant="ghost" onClick={() => setStep('choose')}>
              Voltar às opções
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Nova data"
              type="date"
              required
              value={rescheduleForm.newDate}
              onChange={(e) => setRescheduleForm({ ...rescheduleForm, newDate: e.target.value })}
            />
            <InputField
              label="Novo horário"
              type="time"
              required
              value={rescheduleForm.newTime}
              onChange={(e) => setRescheduleForm({ ...rescheduleForm, newTime: e.target.value })}
            />
          </div>
          <InputField
            label="Motivo (opcional)"
            placeholder="Ex: Imprevisto do cliente, pediu para remarcar..."
            value={rescheduleForm.reason}
            onChange={(e) => setRescheduleForm({ ...rescheduleForm, reason: e.target.value })}
          />
          <TextAreaField
            label="Observações (opcional)"
            rows={2}
            value={rescheduleForm.notes}
            onChange={(e) => setRescheduleForm({ ...rescheduleForm, notes: e.target.value })}
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Confirmar Reagendamento
            </Button>
          </div>
        </form>
      )}

      {step === 'completed' && (
        <form onSubmit={handleSaveReport} className="space-y-5">
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: tokens.border }}>
            <div>
              <Badge tone="primary">Relatório Único • Qualificação + Oferta</Badge>
              <h4 className="text-sm font-semibold mt-1" style={{ color: tokens.text }}>Registro dos Dados</h4>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setStep('choose')}>
              Voltar às opções
            </Button>
          </div>

          {/* Negócio & Oferta */}
          <div className="space-y-3">
            <h5 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#B87CFF' }}>
              Negócio & Oferta
            </h5>
            <TextAreaField
              label="Descrição do negócio e produtos/serviços comercializados"
              rows={2}
              placeholder="O que a empresa vende e como opera..."
              value={reportForm.businessDescription}
              onChange={(e) => setReportForm({ ...reportForm, businessDescription: e.target.value })}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InputField
                label="Público-alvo e região de atuação"
                placeholder="Ex: Público local em São Paulo..."
                value={reportForm.targetAudienceAndRegion}
                onChange={(e) => setReportForm({ ...reportForm, targetAudienceAndRegion: e.target.value })}
              />
              <InputField
                label="Presença digital atual (Site / Instagram)"
                placeholder="Ex: Só Instagram, sem site..."
                value={reportForm.currentDigitalPresence}
                onChange={(e) => setReportForm({ ...reportForm, currentDigitalPresence: e.target.value })}
              />
            </div>
          </div>

          {/* Dificuldades / Necessidades */}
          <div className="space-y-3">
            <h5 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#B87CFF' }}>
              Dificuldades / Necessidades
            </h5>
            <TextAreaField
              label="Principais dificuldades identificadas"
              rows={2}
              placeholder="Problemas na presença digital, perda de clientes, falta de autoridade..."
              value={reportForm.mainDifficulties}
              onChange={(e) => setReportForm({ ...reportForm, mainDifficulties: e.target.value })}
            />
            <TextAreaField
              label="Necessidades, objetivos e expectativas com o site"
              rows={2}
              placeholder="O que o cliente espera alcançar com o novo site..."
              value={reportForm.clientNeedsAndGoals}
              onChange={(e) => setReportForm({ ...reportForm, clientNeedsAndGoals: e.target.value })}
            />
          </div>

          {/* Solução & Proposta */}
          <div className="space-y-3">
            <h5 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#B87CFF' }}>
              Solução & Proposta
            </h5>
            <TextAreaField
              label="Como um site pode ajudar esse cliente em específico (o que precisa ter no site)"
              rows={3}
              placeholder="Ex: Um site que apresente os produtos tipo um cardápio digital, um site estilo portfólio, um site de vendas padrão p/ negócio local..."
              value={reportForm.howSiteHelpsClient}
              onChange={(e) => setReportForm({ ...reportForm, howSiteHelpsClient: e.target.value })}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: tokens.textSecondary }}>
                  O domínio é pela assinatura da Wix, ou vai ser gratuito por Vercel?
                </label>
                <div className="flex gap-3">
                  {['Wix', 'Vercel'].map((opt) => (
                    <label
                      key={opt}
                      className="flex-1 flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-medium cursor-pointer"
                      style={{
                        backgroundColor:
                          reportForm.domainPlatform === opt ? 'rgba(128, 23, 255, 0.18)' : tokens.surfaceElevated,
                        borderColor: reportForm.domainPlatform === opt ? tokens.primary : tokens.border,
                        color: tokens.text,
                      }}
                    >
                      <input
                        type="radio"
                        name="domainPlatform"
                        value={opt}
                        checked={reportForm.domainPlatform === opt}
                        onChange={() => setReportForm({ ...reportForm, domainPlatform: opt })}
                        className="accent-[#8017FF]"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <InputField
                label="Qual a data para a próxima call apresentando o site?"
                type="date"
                value={reportForm.nextCallSitePresentationDate}
                onChange={(e) =>
                  setReportForm({ ...reportForm, nextCallSitePresentationDate: e.target.value })
                }
              />
            </div>
          </div>

          {/* Autoavaliação e Depoimento */}
          <div className="space-y-3">
            <h5 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#B87CFF' }}>
              Autoavaliação & Depoimento
            </h5>
            <TextAreaField
              label="Autoavaliação do atendimento (pontos positivos, objeções e melhorias)"
              rows={2}
              value={reportForm.selfEvaluation}
              onChange={(e) => setReportForm({ ...reportForm, selfEvaluation: e.target.value })}
            />
            <TextAreaField
              label="Depoimento completo nas suas palavras sobre todos os pontos da call"
              rows={4}
              placeholder="Explique livremente tudo o que aconteceu na reunião..."
              value={reportForm.sellerTestimony}
              onChange={(e) => setReportForm({ ...reportForm, sellerTestimony: e.target.value })}
            />
          </div>

          {/* Registro da Venda */}
          <div
            className="p-4 rounded-xl border space-y-4"
            style={{ backgroundColor: tokens.surfaceElevated, borderColor: tokens.border, color: tokens.text }}
          >
            <SelectField
              label="Houve fechamento de venda nesta reunião?"
              required
              value={reportForm.saleClosedChoice}
              onChange={(e) => setReportForm({ ...reportForm, saleClosedChoice: e.target.value })}
            >
              <option value="">Selecione...</option>
              <option value="Venda concluída">Venda concluída</option>
              <option value="Proposta em análise">Proposta em análise</option>
              <option value="Cliente solicitou retorno">Cliente solicitou retorno</option>
              <option value="Venda não concluída">Venda não concluída</option>
            </SelectField>

            {reportForm.saleClosedChoice === 'Venda concluída' && (
              <div className="space-y-4 pt-2 border-t" style={{ borderColor: tokens.border }}>
                <h5 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#2AC78E' }}>
                  Registro da Venda
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SelectField
                    label="Status financeiro"
                    value={reportForm.financialStatus}
                    onChange={(e) => setReportForm({ ...reportForm, financialStatus: e.target.value })}
                  >
                    <option value="Concluída">Concluída</option>
                    <option value="Pagamento pendente">Pagamento pendente</option>
                  </SelectField>

                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: tokens.textSecondary }}>
                      Pagamento imediato ou 50/50?
                    </label>
                    <div className="flex gap-2">
                      {['Pagamento imediato', '50/50'].map((struct) => (
                        <label
                          key={struct}
                          className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium cursor-pointer"
                          style={{
                            backgroundColor:
                              reportForm.paymentStructure === struct
                                ? 'rgba(128, 23, 255, 0.18)'
                                : tokens.surface,
                            borderColor:
                              reportForm.paymentStructure === struct ? tokens.primary : tokens.border,
                            color: tokens.text,
                          }}
                        >
                          <input
                            type="radio"
                            name="paymentStructure"
                            value={struct}
                            checked={reportForm.paymentStructure === struct}
                            onChange={() => setReportForm({ ...reportForm, paymentStructure: struct })}
                            className="accent-[#8017FF]"
                          />
                          <span>{struct}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <InputField
                    label="Valor vendido (R$)"
                    type="number"
                    step="0.01"
                    required
                    placeholder="Ex: 1500.00"
                    value={reportForm.saleValue}
                    onChange={(e) => setReportForm({ ...reportForm, saleValue: e.target.value })}
                  />

                  <InputField
                    label="Valor enviado / pago agora (R$)"
                    type="number"
                    step="0.01"
                    placeholder="Ex: 750.00"
                    value={reportForm.amountSent}
                    onChange={(e) => setReportForm({ ...reportForm, amountSent: e.target.value })}
                  />

                  <InputField
                    label="Método de pagamento"
                    required
                    placeholder="PIX, Cartão de Crédito, Boleto..."
                    value={reportForm.paymentMethod}
                    onChange={(e) => setReportForm({ ...reportForm, paymentMethod: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              <Send className="w-4 h-4" />
              <span>Salvar Relatório</span>
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

// ============================================================================
// 9. MODAL DE DOSSIÊ COMPLETO DO CLIENTE
// ============================================================================
function ClientDossierModal({ open, onClose, clientId, onOpenMeetingModal }) {
  const { db, tokens } = useApp();
  if (!open || !clientId) return null;

  const client = db.clients.find((c) => c.id === clientId);
  if (!client) return null;

  const meeting = db.meetings.find((m) => m.id === client.currentMeetingId);
  const reports = db.meetingReports.filter((r) => r.clientId === client.id);
  const timeline = db.timeline.filter((t) => t.clientId === client.id);
  const sale = db.sales.find((s) => s.clientId === client.id);

  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidth="max-w-3xl"
      title={`Dossiê do Cliente • ${client.name}`}
      subtitle={`Segmento: ${client.segment} • WhatsApp: ${client.whatsapp}`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-3.5 rounded-xl border" style={{ backgroundColor: tokens.surfaceElevated, borderColor: tokens.border }}>
          <span className="opacity-65 block">Responsável</span>
          <strong>{getUserDisplayName(db.users, client.assignedSellerId)}</strong>
        </div>
        <div className="p-3.5 rounded-xl border" style={{ backgroundColor: tokens.surfaceElevated, borderColor: tokens.border }}>
          <span className="opacity-65 block">1º Contato</span>
          <strong>{client.firstContactStatus === 'done' ? 'Realizado' : 'Pendente'}</strong>
        </div>
        <div className="p-3.5 rounded-xl border" style={{ backgroundColor: tokens.surfaceElevated, borderColor: tokens.border }}>
          <span className="opacity-65 block">Reunião Vigente</span>
          <strong>
            {meeting ? formatDateWithWeekdayBR(meeting.scheduledDate, meeting.scheduledTime) : 'N/A'}
          </strong>
        </div>
      </div>

      {sale && (
        <div className="p-4 rounded-xl border text-xs space-y-1" style={{ backgroundColor: tokens.surfaceElevated, borderColor: tokens.border }}>
          <div className="flex items-center justify-between">
            <strong>Registro da Venda</strong>
            <Badge tone="primary">{sale.financialStatus}</Badge>
          </div>
          <p>
            Vendido: <strong>{formatCurrencyBRL(sale.amountSold)}</strong> • Recebido:{' '}
            <strong>{formatCurrencyBRL(sale.amountReceived)}</strong> • Modalidade: {sale.paymentStructure} ({sale.paymentMethod})
          </p>
        </div>
      )}

      {reports.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#B87CFF' }}>
            Registro dos Dados Enviado
          </h4>
          {reports.map((rep) => (
            <div
              key={rep.id}
              className="p-4 rounded-xl border text-xs space-y-2"
              style={{ backgroundColor: tokens.surfaceElevated, borderColor: tokens.border }}
            >
              <p><strong>Negócio:</strong> {rep.businessDescription}</p>
              <p><strong>Dificuldades:</strong> {rep.mainDifficulties}</p>
              <p><strong>Como o site vai ajudar:</strong> {rep.howSiteHelpsClient}</p>
              <p>
                <strong>Domínio:</strong> {rep.domainPlatform} •{' '}
                <strong>Próxima call apresentando o site:</strong> {rep.nextCallSitePresentationDate}
              </p>
              <p><strong>Autoavaliação:</strong> {rep.selfEvaluation}</p>
              <p><strong>Depoimento do vendedor:</strong> {rep.sellerTestimony}</p>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#B87CFF' }}>
          Linha do Tempo Cronológica
        </h4>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {timeline.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-xl border text-xs"
              style={{ backgroundColor: tokens.surfaceElevated, borderColor: tokens.border }}
            >
              <div className="flex justify-between font-medium">
                <span>{item.title}</span>
                <span className="opacity-60">{formatDateTimeBR(item.createdAt)}</span>
              </div>
              <p className="opacity-75 mt-1">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            onClose();
            onOpenMeetingModal(client);
          }}
        >
          Abrir R. Vendas
        </Button>
      </div>
    </Modal>
  );
}

// ============================================================================
// 10. DASHBOARD DO SDR (CADASTRO SEM VENDEDOR + VENDAS WIX US$ 50)
// ============================================================================
function SdrDashboardPage() {
  const { user, db, tokens, notify } = useApp();
  const [form, setForm] = useState({
    name: '',
    segment: '',
    whatsapp: '',
    meetingDate: '',
    meetingTime: '',
    notes: '',
  });

  const mySubmissions = db.sdrSubmissions.filter((s) => s.submittedById === user.id);

  // Vendas confirmadas pelo Pablo via botão verde ("Confirmar venda" / confirmed_sdr)
  const confirmedSdrSales = db.sales.filter((s) => s.pabloValidationStatus === 'confirmed_sdr');

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      dataEngine.submitLeadFromSdr(user, form);
      soundEngine.playSfx('success');
      notify('Dados enviados ao Pablo com sucesso!', 'success');
      setForm({ name: '', segment: '', whatsapp: '', meetingDate: '', meetingTime: '', notes: '' });
    } catch (err) {
      soundEngine.playSfx('error');
      notify(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <span className="text-xs opacity-65">Leads Enviados ao Pablo</span>
          <div className="text-2xl font-bold mt-1">{mySubmissions.length}</div>
        </Card>
        <Card className="p-5">
          <span className="text-xs opacity-65">Aguardando Revisão do Pablo</span>
          <div className="text-2xl font-bold mt-1" style={{ color: '#F2B450' }}>
            {mySubmissions.filter((s) => s.status === 'pending_pablo').length}
          </div>
        </Card>
        <Card className="p-5" glow>
          <span className="text-xs opacity-65">Vendas Realizadas (Wix)</span>
          <div className="text-2xl font-bold mt-1" style={{ color: '#2AC78E' }}>
            {confirmedSdrSales.length}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário de envio ao Pablo (sem seleção de vendedor) */}
        <Card className="p-6">
          <h2 className="text-base font-semibold mb-1">Cadastrar Novo Cliente para o Pablo</h2>
          <p className="text-xs opacity-70 mb-4">
            Preencha os dados do cliente. O Pablo revisará as informações e fará a distribuição ao vendedor.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label="Nome do cliente"
                required
                placeholder="Ex: Maria, Gabriel..."
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <InputField
                label="Segmento da empresa"
                required
                placeholder="Ex: Clínica, Advocacia, Imobiliária..."
                value={form.segment}
                onChange={(e) => setForm({ ...form, segment: e.target.value })}
              />
              <InputField
                label="WhatsApp com código do país"
                required
                placeholder="+55 11 99999-9999"
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              />
              <InputField
                label="Data da reunião de vendas"
                type="date"
                required
                value={form.meetingDate}
                onChange={(e) => setForm({ ...form, meetingDate: e.target.value })}
              />
              <InputField
                label="Horário da reunião"
                type="time"
                required
                value={form.meetingTime}
                onChange={(e) => setForm({ ...form, meetingTime: e.target.value })}
              />
            </div>

            <TextAreaField
              label="Observações (opcional)"
              rows={3}
              placeholder="Informações relevantes levantadas na prospecção..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />

            <Button type="submit" variant="primary" size="lg" className="w-full">
              <Send className="w-4 h-4" />
              <span>Enviar ao Pablo</span>
            </Button>
          </form>
        </Card>

        {/* Mural de Vendas Realizadas (sem valor real, exibindo US$ 50 Wix) */}
        <Card className="p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold">Vendas Realizadas</h2>
            <p className="text-xs opacity-70">
              Registro de fechamentos confirmados pelo Pablo com comissão Wix.
            </p>
          </div>

          {confirmedSdrSales.length === 0 ? (
            <EmptyState
              icon={Award}
              title="Nenhuma venda confirmada ainda"
              description="Assim que uma venda for concluída e confirmada pelo Pablo, ela aparecerá aqui."
            />
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-y-auto">
              {confirmedSdrSales.map((sale) => {
                const client = db.clients.find((c) => c.id === sale.clientId);
                return (
                  <div
                    key={sale.id}
                    className="p-4 rounded-xl border flex items-center justify-between gap-3"
                    style={{ backgroundColor: tokens.surfaceElevated, borderColor: tokens.border }}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge tone="success">Venda Realizada</Badge>
                        <span className="text-xs opacity-65">{formatDateTimeBR(sale.pabloValidatedAt || sale.saleDate)}</span>
                      </div>
                      <div className="font-semibold text-sm mt-1">{client?.name || 'Cliente PontoWeb'}</div>
                      <div className="text-xs opacity-70">{client?.segment || 'Website Institucional'}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] opacity-65 block">Valor da Venda (Wix)</span>
                      <strong className="text-base font-bold" style={{ color: '#2AC78E' }}>
                        US$ 50,00
                      </strong>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ============================================================================
// 11. DASHBOARD DO VENDEDOR (CONTAGEM DE VENDAS + PENDÊNCIAS SEQUENCIAIS)
// ============================================================================
function SellerDashboardPage({ onOpenMeetingModal, onOpenDossier }) {
  const { user, db, tokens, notify } = useApp();
  const [copiedId, setCopiedId] = useState(null);

  const myClients = db.clients.filter((c) => c.assignedSellerId === user.id);
  const myMeetings = db.meetings.filter((m) => m.sellerId === user.id);

  // Apenas vendas válidas confirmadas pelo Pablo contabilizam para o vendedor
  const myValidSales = db.sales.filter(
    (s) =>
      s.sellerId === user.id &&
      (s.pabloValidationStatus === 'confirmed_sdr' || s.pabloValidationStatus === 'confirmed_vercel') &&
      s.financialStatus !== 'Cancelada' &&
      s.financialStatus !== 'Reembolsada'
  );

  const salesCount = myValidSales.length;
  const totalSold = myValidSales.reduce((acc, s) => acc + (Number(s.amountSold) || 0), 0);

  // Cálculo da faixa de comissão (até 5 = 30%, 6-7 = 35%, 8 = 40%, 9 = 45%, >=10 = 50%)
  let commissionPct = 30;
  if (salesCount >= 10) commissionPct = 50;
  else if (salesCount === 9) commissionPct = 45;
  else if (salesCount === 8) commissionPct = 40;
  else if (salesCount >= 6) commissionPct = 35;

  // Meta Mínima = 4 vendas | Meta Máxima = +7 vendas (a partir de 8 vendas)
  const MIN_GOAL = 4;
  const MAX_GOAL = 8;
  let goalText = '';
  if (salesCount < MIN_GOAL) {
    const missing = MIN_GOAL - salesCount;
    goalText = `Faltam ${missing} ${missing === 1 ? 'venda' : 'vendas'} para atingir a Meta Mínima`;
  } else if (salesCount < MAX_GOAL) {
    const missing = MAX_GOAL - salesCount;
    goalText = `Faltam ${missing} ${missing === 1 ? 'venda' : 'vendas'} para atingir a Meta Máxima`;
  } else {
    goalText = 'Meta Máxima atingida! Comissão escalonada ativa.';
  }

  const contactsPending = myClients.filter((c) => c.firstContactStatus === 'pending').length;
  const contactsDone = myClients.filter((c) => c.firstContactStatus === 'done').length;
  const upcomingMeetings = myMeetings.filter((m) => m.status === 'scheduled').length;
  const completedMeetings = myMeetings.filter((m) => m.status === 'completed').length;

  const handleConfirmFirstContact = (clientId) => {
    try {
      dataEngine.confirmFirstContact(user, clientId);
      soundEngine.playSfx('success');
      notify('Primeiro contato confirmado! A pendência da reunião foi liberada.', 'success');
    } catch (err) {
      soundEngine.playSfx('error');
      notify(err.message, 'error');
    }
  };

  const handleCopyPhone = (clientId, phone) => {
    navigator.clipboard?.writeText(phone).catch(() => {});
    soundEngine.playSfx('click');
    setCopiedId(clientId);
    notify('Número copiado para a área de transferência.', 'neutral');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* KPIs do Vendedor */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <span className="text-xs opacity-65">Clientes Atribuídos</span>
          <div className="text-2xl font-bold mt-1">{myClients.length}</div>
        </Card>
        <Card className="p-4">
          <span className="text-xs opacity-65">Contatos Pendentes / Feitos</span>
          <div className="text-xl font-bold mt-1">
            <span style={{ color: '#F2B450' }}>{contactsPending}</span> /{' '}
            <span style={{ color: '#2AC78E' }}>{contactsDone}</span>
          </div>
        </Card>
        <Card className="p-4">
          <span className="text-xs opacity-65">Próximas Calls / Realizadas</span>
          <div className="text-xl font-bold mt-1">
            {upcomingMeetings} / {completedMeetings}
          </div>
        </Card>
        <Card className="p-4">
          <span className="text-xs opacity-65">Volume Vendido Confirmado</span>
          <div className="text-xl font-bold mt-1" style={{ color: '#B87CFF' }}>
            {formatCurrencyBRL(totalSold)}
          </div>
        </Card>
      </div>

      {/* Card Contagem de Vendas & Faixa de Comissão (sem gráfico de linhas e sem emoji) */}
      <Card glow className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold">Contagem de Vendas</h2>
            <p className="text-xs opacity-70 mt-0.5">{goalText}</p>
          </div>
          <div
            className="px-3.5 py-2 rounded-xl border text-right"
            style={{ backgroundColor: 'rgba(128, 23, 255, 0.16)', borderColor: 'rgba(128, 23, 255, 0.4)' }}
          >
            <span className="text-[10px] uppercase tracking-wider opacity-75 block">Sua Comissão Atual</span>
            <strong className="text-xl font-bold" style={{ color: '#D7B8FF' }}>
              {commissionPct}%
            </strong>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t text-xs" style={{ borderColor: tokens.border }}>
          <div className="p-3 rounded-xl border" style={{ backgroundColor: tokens.surfaceElevated, borderColor: tokens.border }}>
            <span className="opacity-65 block">Vendas Confirmadas</span>
            <strong className="text-lg font-bold mt-0.5 block">{salesCount}</strong>
          </div>
          <div className="p-3 rounded-xl border" style={{ backgroundColor: tokens.surfaceElevated, borderColor: tokens.border }}>
            <span className="opacity-65 block">Meta Mínima</span>
            <strong className="text-sm font-semibold mt-1 block">4 vendas</strong>
          </div>
          <div className="p-3 rounded-xl border" style={{ backgroundColor: tokens.surfaceElevated, borderColor: tokens.border }}>
            <span className="opacity-65 block">Meta Máxima</span>
            <strong className="text-sm font-semibold mt-1 block">+7 vendas (8+)</strong>
          </div>
          <div className="p-3 rounded-xl border" style={{ backgroundColor: tokens.surfaceElevated, borderColor: tokens.border }}>
            <span className="opacity-65 block">Ganho Estimado ({commissionPct}%)</span>
            <strong className="text-sm font-bold mt-1 block" style={{ color: '#2AC78E' }}>
              {formatCurrencyBRL((totalSold * commissionPct) / 100)}
            </strong>
          </div>
        </div>
      </Card>

      {/* Carteira de Clientes e Fluxo Sequencial de Pendências */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Meus Clientes & Próximas Ações</h2>
          <p className="text-xs opacity-70">
            Confirme primeiro a mensagem no WhatsApp para liberar o registro da reunião de vendas.
          </p>
        </div>

        {myClients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nenhum cliente atribuído ainda"
            description="Assim que o Pablo distribuir um cliente para você, ele aparecerá aqui em tempo real."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myClients.map((client) => {
              const mtg = db.meetings.find((m) => m.id === client.currentMeetingId);
              const cleanWa = sanitizePhoneForWhatsApp(client.whatsapp);
              const waUrl = `https://wa.me/${cleanWa}`;
              const isContactPending = client.firstContactStatus === 'pending';

              return (
                <Card key={client.id} className="p-5 flex flex-col justify-between space-y-4" glow={isContactPending}>
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <button
                          type="button"
                          onClick={() => onOpenDossier(client.id)}
                          className="text-base font-semibold hover:underline text-left"
                        >
                          {client.name}
                        </button>
                        <p className="text-xs opacity-70">{client.segment}</p>
                      </div>
                      {mtg?.status === 'completed' ? (
                        <Badge tone="success">Reunião Realizada</Badge>
                      ) : mtg?.status === 'no_show' ? (
                        <Badge tone="error">Vácuo</Badge>
                      ) : (
                        <Badge tone="primary">Call Agendada</Badge>
                      )}
                    </div>

                    <div className="text-xs space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="opacity-70">WhatsApp:</span>
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium underline"
                          style={{ color: '#2AC78E' }}
                        >
                          {client.whatsapp}
                        </a>
                        <button
                          type="button"
                          onClick={() => handleCopyPhone(client.id, client.whatsapp)}
                          className="p-1 rounded-md border opacity-75 hover:opacity-100"
                          style={{ borderColor: tokens.border }}
                          title="Copiar número"
                        >
                          {copiedId === client.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>

                      <div>
                        <span className="opacity-70">Call marcada para: </span>
                        <strong>
                          {mtg ? formatDateWithWeekdayBR(mtg.scheduledDate, mtg.scheduledTime) : 'Não agendada'}
                        </strong>
                      </div>

                      {client.notes && (
                        <p className="opacity-70 italic text-[11px]">Obs.: "{client.notes}"</p>
                      )}
                    </div>
                  </div>

                  {/* Pendência 1: Confirmar 1º Contato no WhatsApp */}
                  {isContactPending ? (
                    <div
                      className="p-3.5 rounded-xl border space-y-3"
                      style={{ backgroundColor: 'rgba(183, 121, 31, 0.12)', borderColor: 'rgba(183, 121, 31, 0.38)' }}
                    >
                      <p className="text-xs font-medium" style={{ color: '#F2B450' }}>
                        Pendente: entre em contato com este cliente no WhatsApp, apresente-se e lembre-o da call ({mtg ? formatDateWithWeekdayBR(mtg.scheduledDate, mtg.scheduledTime) : ''}).
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => soundEngine.playSfx('click')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border"
                          style={{
                            backgroundColor: 'rgba(22, 132, 91, 0.18)',
                            borderColor: 'rgba(22, 132, 91, 0.45)',
                            color: '#2AC78E',
                          }}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Abrir WhatsApp</span>
                        </a>
                        <Button size="sm" variant="primary" onClick={() => handleConfirmFirstContact(client.id)}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Já entrei em contato</span>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Pendência 2: Reunião de Vendas liberada após confirmação do contato */
                    <div
                      className="p-3.5 rounded-xl border space-y-3"
                      style={{ backgroundColor: tokens.surfaceElevated, borderColor: tokens.border }}
                    >
                      <div className="text-xs">
                        <span className="opacity-70 block">2ª Pendência • Reunião de Vendas:</span>
                        <strong>
                          {mtg ? formatDateWithWeekdayBR(mtg.scheduledDate, mtg.scheduledTime) : 'Sem data'}
                        </strong>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button size="sm" variant="primary" onClick={() => onOpenMeetingModal(client)}>
                          Já fiz
                        </Button>
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => soundEngine.playSfx('click')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border"
                          style={{
                            backgroundColor: 'rgba(22, 132, 91, 0.18)',
                            borderColor: 'rgba(22, 132, 91, 0.45)',
                            color: '#2AC78E',
                          }}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                        <Button size="sm" variant="secondary" onClick={() => onOpenDossier(client.id)}>
                          Dossiê
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 12. DASHBOARD DO PABLO (GESTÃO GERAL, REVISÃO SDR & VALIDAÇÃO DE VENDAS)
// ============================================================================
function PabloDashboardPage({ onNavigate, onOpenDossier }) {
  const { user, db, tokens, notify } = useApp();
  const [reviewSubmission, setReviewSubmission] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    segment: '',
    whatsapp: '',
    meetingDate: '',
    meetingTime: '',
    sellerId: '',
    notes: '',
  });

  const activeSellers = db.users.filter((u) => u.role === 'seller' && u.active && !u.deleted);
  const pendingSdrLeads = db.sdrSubmissions.filter((s) => s.status === 'pending_pablo');

  // Vendas relatadas pelos vendedores aguardando os 3 botões de decisão do Pablo
  const pendingSalesValidation = db.sales.filter((s) => s.pabloValidationStatus === 'pending_pablo');

  // Vendas válidas no dashboard do Pablo (somente após confirmação do Pablo: confirmed_sdr ou confirmed_vercel)
  const validSales = db.sales.filter(
    (s) =>
      (s.pabloValidationStatus === 'confirmed_sdr' || s.pabloValidationStatus === 'confirmed_vercel') &&
      s.financialStatus !== 'Cancelada' &&
      s.financialStatus !== 'Reembolsada'
  );

  const totalSold = validSales.reduce((acc, s) => acc + (Number(s.amountSold) || 0), 0);
  const totalReceived = validSales.reduce((acc, s) => acc + (Number(s.amountReceived) || 0), 0);

  const contactsDone = db.clients.filter((c) => c.firstContactStatus === 'done').length;
  const contactsPending = db.clients.filter((c) => c.firstContactStatus === 'pending').length;
  const completedMeetings = db.meetings.filter((m) => m.status === 'completed').length;
  const upcomingMeetings = db.meetings.filter((m) => m.status === 'scheduled').length;

  const unreadReports =
    db.meetingReports.filter((r) => !r.readByAdmin).length +
    db.noShowOccurrences.filter((o) => !o.readByAdmin).length +
    db.rescheduleRecords.filter((r) => !r.readByAdmin).length;

  const openReviewModal = (sub) => {
    setReviewSubmission(sub);
    setEditForm({
      name: sub.name,
      segment: sub.segment,
      whatsapp: sub.whatsapp,
      meetingDate: sub.meetingDate,
      meetingTime: sub.meetingTime,
      sellerId: activeSellers[0]?.id || '',
      notes: sub.notes || '',
    });
  };

  const handleApproveAndDistribute = (e) => {
    e.preventDefault();
    try {
      dataEngine.approveSdrSubmission(user, reviewSubmission.id, editForm);
      soundEngine.playSfx('success');
      notify(`Lead "${editForm.name}" revisado pelo Pablo e enviado ao vendedor!`, 'success');
      setReviewSubmission(null);
    } catch (err) {
      soundEngine.playSfx('error');
      notify(err.message, 'error');
    }
  };

  const handlePabloSaleDecision = (saleId, decision) => {
    try {
      dataEngine.validateReportedSaleByPablo(user, saleId, decision);
      if (decision === 'not_sold') {
        soundEngine.playSfx('warning');
        notify('Registro atualizado como Não Vendido (oculto para o SDR).', 'warning');
      } else if (decision === 'confirmed_sdr') {
        soundEngine.playSfx('success');
        notify('Venda SDR confirmada! Notificada no painel do SDR (US$ 50 Wix).', 'success');
      } else {
        soundEngine.playSfx('success');
        notify('Venda Vercel confirmada para Pablo e vendedor (oculta para o SDR).', 'success');
      }
    } catch (err) {
      soundEngine.playSfx('error');
      notify(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* FILA 1: Relatórios com Venda Aguardando Leitura e Decisão do Pablo */}
      {pendingSalesValidation.length > 0 && (
        <Card glow className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <Badge tone="primary">Leitura Obrigatória do Pablo</Badge>
              <h2 className="text-base font-semibold mt-1.5">
                Relatórios com Venda Aguardando Validação ({pendingSalesValidation.length})
              </h2>
              <p className="text-xs opacity-70">
                Nenhuma venda é contabilizada nos dashboards antes de você abrir o relatório do vendedor e confirmar abaixo.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {pendingSalesValidation.map((sale) => {
              const client = db.clients.find((c) => c.id === sale.clientId);
              const report = db.meetingReports.find((r) => r.id === sale.reportId);
              return (
                <div
                  key={sale.id}
                  className="p-4 rounded-xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  style={{ backgroundColor: tokens.surfaceElevated, borderColor: tokens.border }}
                >
                  <div className="space-y-1 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-sm">{client?.name || 'Cliente'}</strong>
                      <Badge tone="neutral">{client?.segment}</Badge>
                      <Badge tone="primary">
                        Vendedor: {getUserDisplayName(db.users, sale.sellerId)}
                      </Badge>
                      {report?.domainPlatform && (
                        <Badge tone="warning">Domínio relatado: {report.domainPlatform}</Badge>
                      )}
                    </div>
                    <p className="opacity-80">
                      Valor relatado: <strong>{formatCurrencyBRL(sale.amountSold)}</strong> • Valor enviado:{' '}
                      <strong>{formatCurrencyBRL(sale.amountReceived)}</strong> • Modalidade:{' '}
                      <strong>{sale.paymentStructure}</strong> ({sale.paymentMethod})
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => onNavigate('reports')}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Abrir Relatório para Validar</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* FILA 2: Leads Enviados pelo SDR Aguardando Revisão do Pablo */}
      {pendingSdrLeads.length > 0 && (
        <Card className="p-6" glow>
          <div className="flex items-center justify-between mb-4">
            <div>
              <Badge tone="warning">Fila SDR</Badge>
              <h2 className="text-base font-semibold mt-1.5">
                Leads Enviados pelo SDR para Revisão do Pablo ({pendingSdrLeads.length})
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingSdrLeads.map((sub) => (
              <div
                key={sub.id}
                className="p-4 rounded-xl border flex flex-col justify-between gap-3"
                style={{ backgroundColor: tokens.surfaceElevated, borderColor: tokens.border }}
              >
                <div className="text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-sm">{sub.name}</strong>
                    <Badge tone="neutral">{sub.segment}</Badge>
                  </div>
                  <p className="opacity-75">WhatsApp: {sub.whatsapp}</p>
                  <p className="opacity-75">
                    Call sugerida: <strong>{formatDateWithWeekdayBR(sub.meetingDate, sub.meetingTime)}</strong>
                  </p>
                  {sub.notes && <p className="opacity-65 italic">"{sub.notes}"</p>}
                </div>
                <Button size="sm" variant="primary" onClick={() => openReviewModal(sub)}>
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Revisar, Editar & Enviar ao Vendedor</span>
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* KPIs Executivos do Pablo */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="p-4" onClick={() => onNavigate('users')}>
          <span className="text-xs opacity-65">Vendedores Ativos</span>
          <div className="text-2xl font-bold mt-1">{activeSellers.length}</div>
        </Card>
        <Card className="p-4" onClick={() => onNavigate('clients')}>
          <span className="text-xs opacity-65">Clientes Cadastrados</span>
          <div className="text-2xl font-bold mt-1">{db.clients.length}</div>
        </Card>
        <Card className="p-4" onClick={() => onNavigate('clients')}>
          <span className="text-xs opacity-65">Contatos Realizados / Pend.</span>
          <div className="text-xl font-bold mt-1">
            <span style={{ color: '#2AC78E' }}>{contactsDone}</span> /{' '}
            <span style={{ color: '#F2B450' }}>{contactsPending}</span>
          </div>
        </Card>
        <Card className="p-4" onClick={() => onNavigate('meetings')}>
          <span className="text-xs opacity-65">Reuniões Realiz. / Próx.</span>
          <div className="text-xl font-bold mt-1">
            {completedMeetings} / {upcomingMeetings}
          </div>
        </Card>
        <Card className="p-4" onClick={() => onNavigate('reports')}>
          <span className="text-xs opacity-65">Relatórios Não Lidos</span>
          <div className="text-2xl font-bold mt-1" style={{ color: '#B87CFF' }}>
            {unreadReports}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5" onClick={() => onNavigate('sales')}>
          <span className="text-xs opacity-65">Vendas Válidas</span>
          <div className="text-2xl font-bold mt-1">{validSales.length}</div>
        </Card>
        <Card className="p-5" onClick={() => onNavigate('sales')}>
          <span className="text-xs opacity-65">Valor Vendido Total</span>
          <div className="text-2xl font-bold mt-1" style={{ color: '#B87CFF' }}>
            {formatCurrencyBRL(totalSold)}
          </div>
        </Card>
        <Card className="p-5" onClick={() => onNavigate('sales')}>
          <span className="text-xs opacity-65">Valor Recebido Efetivo</span>
          <div className="text-2xl font-bold mt-1" style={{ color: '#2AC78E' }}>
            {formatCurrencyBRL(totalReceived)}
          </div>
        </Card>
      </div>

      {/* Funil Comercial Geral & Desempenho por Vendedor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-sm font-semibold mb-4">Funil Comercial Geral</h3>
          <div className="space-y-3 text-xs">
            {[
              { label: 'Cliente Atribuído', count: db.clients.length, color: '#8017FF' },
              { label: 'Contato Realizado', count: contactsDone, color: '#9D4EDD' },
              { label: 'Reunião de Vendas Realizada', count: completedMeetings, color: '#3B82F6' },
              { label: 'Venda Concluída', count: validSales.length, color: '#16845B' },
            ].map((stage, i) => {
              const base = Math.max(1, db.clients.length);
              const pct = Math.round((stage.count / base) * 100);
              return (
                <div key={i}>
                  <div className="flex justify-between mb-1">
                    <span>{stage.label}</span>
                    <strong>
                      {stage.count} ({db.clients.length === 0 ? 0 : pct}%)
                    </strong>
                  </div>
                  <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: tokens.surfaceElevated }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${db.clients.length === 0 ? 0 : pct}%`, backgroundColor: stage.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-semibold mb-4">Desempenho por Vendedor</h3>
          {activeSellers.length === 0 ? (
            <p className="text-xs opacity-60">Nenhum vendedor ativo cadastrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b opacity-65" style={{ borderColor: tokens.border }}>
                    <th className="py-2">Vendedor</th>
                    <th className="py-2">Contatos</th>
                    <th className="py-2">Reuniões</th>
                    <th className="py-2">Vendas</th>
                    <th className="py-2 text-right">Vendido</th>
                  </tr>
                </thead>
                <tbody>
                  {activeSellers.map((s) => {
                    const sContacts = db.clients.filter(
                      (c) => c.assignedSellerId === s.id && c.firstContactStatus === 'done'
                    ).length;
                    const sMeetings = db.meetings.filter(
                      (m) => m.sellerId === s.id && m.status === 'completed'
                    ).length;
                    const sSales = validSales.filter((sal) => sal.sellerId === s.id);
                    const sTotal = sSales.reduce((a, b) => a + (Number(b.amountSold) || 0), 0);
                    return (
                      <tr key={s.id} className="border-b" style={{ borderColor: tokens.border }}>
                        <td className="py-2.5 font-medium">{s.name}</td>
                        <td className="py-2.5">{sContacts}</td>
                        <td className="py-2.5">{sMeetings}</td>
                        <td className="py-2.5">{sSales.length}</td>
                        <td className="py-2.5 text-right font-semibold">{formatCurrencyBRL(sTotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Atividades Recentes */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold mb-3">Atividades Recentes da Operação</h3>
        {db.timeline.length === 0 ? (
          <p className="text-xs opacity-60">Nenhuma atividade registrada ainda.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {db.timeline.slice(0, 15).map((ev) => {
              const cli = db.clients.find((c) => c.id === ev.clientId);
              return (
                <div
                  key={ev.id}
                  className="p-3 rounded-xl border text-xs flex items-center justify-between gap-3"
                  style={{ backgroundColor: tokens.surfaceElevated, borderColor: tokens.border }}
                >
                  <div>
                    <strong>{ev.title}</strong> •{' '}
                    <span style={{ color: '#B87CFF' }}>{cli?.name || 'Cliente'}</span> —{' '}
                    <span className="opacity-75">{ev.description}</span>
                  </div>
                  <span className="opacity-50 whitespace-nowrap">{formatDateTimeBR(ev.createdAt)}</span>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Modal de Revisão do Lead SDR pelo Pablo */}
      <Modal
        open={!!reviewSubmission}
        onClose={() => setReviewSubmission(null)}
        title="Revisar Lead Enviado pelo SDR"
        subtitle="Confira e edite qualquer informação antes de distribuir oficialmente ao vendedor."
      >
        <form onSubmit={handleApproveAndDistribute} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Nome do cliente"
              required
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            />
            <InputField
              label="Segmento da empresa"
              required
              value={editForm.segment}
              onChange={(e) => setEditForm({ ...editForm, segment: e.target.value })}
            />
            <InputField
              label="WhatsApp com código do país"
              required
              value={editForm.whatsapp}
              onChange={(e) => setEditForm({ ...editForm, whatsapp: e.target.value })}
            />
            <SelectField
              label="Vendedor responsável"
              required
              value={editForm.sellerId}
              onChange={(e) => setEditForm({ ...editForm, sellerId: e.target.value })}
            >
              {activeSellers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.email})
                </option>
              ))}
            </SelectField>
            <InputField
              label="Data da reunião de vendas"
              type="date"
              required
              value={editForm.meetingDate}
              onChange={(e) => setEditForm({ ...editForm, meetingDate: e.target.value })}
            />
            <InputField
              label="Horário da reunião"
              type="time"
              required
              value={editForm.meetingTime}
              onChange={(e) => setEditForm({ ...editForm, meetingTime: e.target.value })}
            />
          </div>
          <TextAreaField
            label="Observações"
            rows={3}
            value={editForm.notes}
            onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setReviewSubmission(null)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              <Send className="w-4 h-4" />
              <span>Aprovar & Enviar ao Vendedor</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ============================================================================
// 13. PÁGINA: CLIENTES E CONTATOS (CADASTRO DO PABLO + CARTEIRA + REATRIBUIÇÃO)
// ============================================================================
function ClientsAndContactsPage({ onOpenMeetingModal, onOpenDossier }) {
  const { user, db, tokens, notify } = useApp();
  const [search, setSearch] = useState('');
  const [sellerFilter, setSellerFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Cadastro direto pelo Pablo
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    segment: '',
    whatsapp: '',
    meetingDate: '',
    meetingTime: '',
    sellerId: '',
    notes: '',
  });

  // Reatribuição pelo Pablo
  const [reassignClientObj, setReassignClientObj] = useState(null);
  const [targetSellerId, setTargetSellerId] = useState('');

  const activeSellers = db.users.filter((u) => u.role === 'seller' && u.active && !u.deleted);

  const visibleClients = useMemo(() => {
    return db.clients.filter((c) => {
      if (user.role === 'seller' && c.assignedSellerId !== user.id) return false;
      if (user.role === 'admin' && sellerFilter !== 'all' && c.assignedSellerId !== sellerFilter) return false;
      if (
        search &&
        !c.name.toLowerCase().includes(search.toLowerCase()) &&
        !c.segment.toLowerCase().includes(search.toLowerCase()) &&
        !c.whatsapp.includes(search)
      ) {
        return false;
      }
      const mtg = db.meetings.find((m) => m.id === c.currentMeetingId);
      if (statusFilter === 'contact_pending' && c.firstContactStatus !== 'pending') return false;
      if (statusFilter === 'meeting_scheduled' && mtg?.status !== 'scheduled') return false;
      if (statusFilter === 'meeting_completed' && mtg?.status !== 'completed') return false;
      return true;
    });
  }, [db, user, search, sellerFilter, statusFilter]);

  const handleCreateClient = (e) => {
    e.preventDefault();
    try {
      dataEngine.createAndAssignClient(user, form);
      soundEngine.playSfx('success');
      notify('Cliente cadastrado e distribuído imediatamente ao vendedor!', 'success');
      setShowCreateModal(false);
      setForm({ name: '', segment: '', whatsapp: '', meetingDate: '', meetingTime: '', sellerId: '', notes: '' });
    } catch (err) {
      soundEngine.playSfx('error');
      notify(err.message, 'error');
    }
  };

  const handleReassign = (e) => {
    e.preventDefault();
    try {
      dataEngine.reassignClient(user, reassignClientObj.id, targetSellerId);
      soundEngine.playSfx('success');
      notify('Cliente transferido com histórico preservado!', 'success');
      setReassignClientObj(null);
    } catch (err) {
      soundEngine.playSfx('error');
      notify(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra de filtros e ação do Pablo */}
      <Card className="p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3.5 top-3 opacity-50" />
            <input
              type="text"
              placeholder="Buscar por nome, segmento ou WhatsApp..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2 rounded-xl text-sm border outline-none"
              style={{
                backgroundColor: tokens.surfaceElevated,
                borderColor: tokens.border,
                color: tokens.text,
              }}
            />
          </div>

          {user.role === 'admin' && (
            <select
              value={sellerFilter}
              onChange={(e) => setSellerFilter(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs border outline-none"
              style={{ backgroundColor: tokens.surfaceElevated, borderColor: tokens.border, color: tokens.text }}
            >
              <option value="all">Todos os vendedores</option>
              {activeSellers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs border outline-none"
            style={{ backgroundColor: tokens.surfaceElevated, borderColor: tokens.border, color: tokens.text }}
          >
            <option value="all">Todos os status</option>
            <option value="contact_pending">Contato pendente</option>
            <option value="meeting_scheduled">Reunião agendada</option>
            <option value="meeting_completed">Reunião realizada</option>
          </select>
        </div>

        {user.role === 'admin' && (
          <Button
            variant="primary"
            onClick={() => {
              setForm({
                name: '',
                segment: '',
                whatsapp: '',
                meetingDate: '',
                meetingTime: '',
                sellerId: activeSellers[0]?.id || '',
                notes: '',
              });
              setShowCreateModal(true);
            }}
          >
            <Plus className="w-4 h-4" />
            <span>Novo Cliente</span>
          </Button>
        )}
      </Card>

      {/* Lista de Clientes */}
      {visibleClients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum cliente encontrado"
          description="Ajuste os filtros ou cadastre um novo cliente para iniciar a operação."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleClients.map((client) => {
            const mtg = db.meetings.find((m) => m.id === client.currentMeetingId);
            const cleanWa = sanitizePhoneForWhatsApp(client.whatsapp);

            return (
              <Card key={client.id} className="p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <button
                        type="button"
                        onClick={() => onOpenDossier(client.id)}
                        className="text-base font-semibold hover:underline text-left"
                      >
                        {client.name}
                      </button>
                      <p className="text-xs opacity-70">{client.segment}</p>
                    </div>
                    {user.role === 'admin' && (
                      <Badge tone="primary">{getUserDisplayName(db.users, client.assignedSellerId)}</Badge>
                    )}
                  </div>

                  <div className="text-xs space-y-1 opacity-85">
                    <div>
                      WhatsApp:{' '}
                      <a
                        href={`https://wa.me/${cleanWa}`}
                        target="_blank"
                        rel="noreferrer"
                        className="underline font-medium"
                        style={{ color: '#2AC78E' }}
                      >
                        {client.whatsapp}
                      </a>
                    </div>
                    <div>
                      Call:{' '}
                      <strong>
                        {mtg ? formatDateWithWeekdayBR(mtg.scheduledDate, mtg.scheduledTime) : 'Não agendada'}
                      </strong>
                    </div>
                    <div>
                      Status 1º Contato:{' '}
                      {client.firstContactStatus === 'done' ? (
                        <span style={{ color: '#2AC78E' }}>
                          Realizado por {getUserDisplayName(db.users, client.firstContactById)} em{' '}
                          {formatDateTimeBR(client.firstContactAt)}
                        </span>
                      ) : (
                        <span style={{ color: '#F2B450' }}>Pendente pelo vendedor</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t" style={{ borderColor: tokens.border }}>
                  <Button size="sm" variant="primary" onClick={() => onOpenMeetingModal(client)}>
                    R. Vendas
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => onOpenDossier(client.id)}>
                    Dossiê
                  </Button>
                  {user.role === 'admin' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setReassignClientObj(client);
                        setTargetSellerId('');
                      }}
                    >
                      Transferir
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Cadastro de Cliente pelo Pablo */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Cadastrar e Distribuir Cliente"
        subtitle="A distribuição cria automaticamente a tarefa de primeiro contato e a Reunião de Vendas única no fuso America/Sao_Paulo."
      >
        <form onSubmit={handleCreateClient} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Nome do cliente"
              required
              placeholder="Ex: Maria, Gabriel..."
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <InputField
              label="Segmento da empresa"
              required
              placeholder="Ex: Advocacia, Estética..."
              value={form.segment}
              onChange={(e) => setForm({ ...form, segment: e.target.value })}
            />
            <InputField
              label="WhatsApp com código do país"
              required
              placeholder="+55 11 99999-9999"
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
            />
            <SelectField
              label="Vendedor responsável"
              required
              value={form.sellerId}
              onChange={(e) => setForm({ ...form, sellerId: e.target.value })}
            >
              <option value="">Selecione um vendedor ativo</option>
              {activeSellers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.email})
                </option>
              ))}
            </SelectField>
            <InputField
              label="Data da reunião de vendas"
              type="date"
              required
              value={form.meetingDate}
              onChange={(e) => setForm({ ...form, meetingDate: e.target.value })}
            />
            <InputField
              label="Horário da reunião"
              type="time"
              required
              value={form.meetingTime}
              onChange={(e) => setForm({ ...form, meetingTime: e.target.value })}
            />
          </div>
          <TextAreaField
            label="Observações (opcional)"
            rows={3}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              <Send className="w-4 h-4" />
              <span>Enviar</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Reatribuição pelo Pablo */}
      <Modal
        open={!!reassignClientObj}
        onClose={() => setReassignClientObj(null)}
        title="Transferir Cliente para Outro Vendedor"
        subtitle="Todo o histórico anterior será preservado."
      >
        <form onSubmit={handleReassign} className="space-y-4">
          <SelectField
            label="Novo vendedor responsável"
            required
            value={targetSellerId}
            onChange={(e) => setTargetSellerId(e.target.value)}
          >
            <option value="">Selecione o vendedor de destino</option>
            {activeSellers
              .filter((s) => s.id !== reassignClientObj?.assignedSellerId)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.email})
                </option>
              ))}
          </SelectField>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setReassignClientObj(null)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Confirmar Transferência
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ============================================================================
// 14. PÁGINA: REUNIÕES DE VENDAS (MÓDULO ÚNICO)
// ============================================================================
function MeetingsPage({ onOpenMeetingModal, onOpenDossier }) {
  const { user, db, tokens } = useApp();
  const visibleMeetings = db.meetings.filter((m) =>
    user.role === 'admin' ? true : m.sellerId === user.id
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Reuniões de Vendas (Call Única: Qualificação + Oferta)</h2>
          <p className="text-xs opacity-70">
            Cada cliente possui um único agendamento vigente que reúne diagnóstico e negociação.
          </p>
        </div>
      </div>

      {visibleMeetings.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Nenhuma reunião agendada"
          description="As reuniões são criadas automaticamente na distribuição dos clientes."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleMeetings.map((mtg) => {
            const client = db.clients.find((c) => c.id === mtg.clientId);
            if (!client) return null;
            return (
              <Card key={mtg.id} className="p-5 flex items-center justify-between gap-4">
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenDossier(client.id)}
                      className="text-sm font-semibold hover:underline"
                    >
                      {client.name}
                    </button>
                    {mtg.status === 'completed' ? (
                      <Badge tone="success">Realizada</Badge>
                    ) : mtg.status === 'no_show' ? (
                      <Badge tone="error">Vácuo</Badge>
                    ) : (
                      <Badge tone="primary">Agendada</Badge>
                    )}
                  </div>
                  <p className="opacity-75">
                    {formatDateWithWeekdayBR(mtg.scheduledDate, mtg.scheduledTime)}
                  </p>
                  {user.role === 'admin' && (
                    <p className="opacity-65">
                      Responsável: <strong>{getUserDisplayName(db.users, mtg.sellerId)}</strong>
                    </p>
                  )}
                </div>

                <Button size="sm" variant="primary" onClick={() => onOpenMeetingModal(client)}>
                  R. Vendas
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 15. PÁGINA: RELATÓRIOS & OCORRÊNCIAS (COM OS 3 BOTÕES DO PABLO NAS VENDAS)
// ============================================================================
function ReportsPage({ onOpenDossier }) {
  const { user, db, tokens, notify } = useApp();
  const [selectedItem, setSelectedItem] = useState(null);

  const items = useMemo(() => {
    const list = [];
    db.meetingReports.forEach((r) => {
      if (user.role === 'seller' && r.sellerId !== user.id) return;
      list.push({ kind: 'report', data: r, createdAt: r.createdAt });
    });
    db.noShowOccurrences.forEach((o) => {
      if (user.role === 'seller' && o.sellerId !== user.id) return;
      list.push({ kind: 'no_show', data: o, createdAt: o.createdAt });
    });
    db.rescheduleRecords.forEach((r) => {
      if (user.role === 'seller' && r.sellerId !== user.id) return;
      list.push({ kind: 'reschedule', data: r, createdAt: r.createdAt });
    });
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [db, user]);

  const handleOpenItem = (item) => {
    setSelectedItem(item);
    if (user.role === 'admin' && !item.data.readByAdmin) {
      dataEngine.markReportItemRead(user, item.kind, item.data.id);
    }
  };

  const handlePabloDecision = (saleId, decision) => {
    try {
      dataEngine.validateReportedSaleByPablo(user, saleId, decision);
      if (decision === 'not_sold') {
        soundEngine.playSfx('warning');
        notify('Marcado como Não Vendido (oculto para o SDR).', 'warning');
      } else if (decision === 'confirmed_sdr') {
        soundEngine.playSfx('success');
        notify('Venda SDR confirmada! Notificada ao SDR (US$ 50 Wix).', 'success');
      } else {
        soundEngine.playSfx('success');
        notify('Venda Vercel confirmada para Pablo e vendedor.', 'success');
      }
    } catch (err) {
      soundEngine.playSfx('error');
      notify(err.message, 'error');
    }
  };

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nenhum relatório ou ocorrência registrada"
          description="Os relatórios das reuniões de vendas, vácuos e reagendamentos aparecerão aqui em tempo real."
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const client = db.clients.find((c) => c.id === item.data.clientId);
            const linkedSale =
              item.kind === 'report' && item.data.saleId
                ? db.sales.find((s) => s.id === item.data.saleId)
                : null;

            return (
              <Card
                key={`${item.kind}_${item.data.id}`}
                className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                glow={user.role === 'admin' && !item.data.readByAdmin}
              >
                <div className="space-y-1 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-sm">{client?.name || 'Cliente'}</strong>
                    {item.kind === 'report' && <Badge tone="success">Relatório de Reunião</Badge>}
                    {item.kind === 'no_show' && <Badge tone="error">Vácuo ({item.data.reason})</Badge>}
                    {item.kind === 'reschedule' && <Badge tone="warning">Reagendamento</Badge>}
                    {user.role === 'admin' && (
                      <Badge tone={item.data.readByAdmin ? 'neutral' : 'primary'}>
                        {item.data.readByAdmin ? 'Lido' : 'Não lido'}
                      </Badge>
                    )}
                    {linkedSale && (
                      <>
                        {linkedSale.pabloValidationStatus === 'pending_pablo' && (
                          <Badge tone="warning">Venda aguardando confirmação do Pablo</Badge>
                        )}
                        {linkedSale.pabloValidationStatus === 'confirmed_sdr' && (
                          <Badge tone="success">Venda SDR Confirmada</Badge>
                        )}
                        {linkedSale.pabloValidationStatus === 'confirmed_vercel' && (
                          <Badge tone="primary">Venda Vercel Confirmada</Badge>
                        )}
                        {linkedSale.pabloValidationStatus === 'not_sold' && (
                          <Badge tone="error">Não Vendido</Badge>
                        )}
                      </>
                    )}
                  </div>
                  <p className="opacity-70">
                    Vendedor: <strong>{getUserDisplayName(db.users, item.data.sellerId)}</strong> • Enviado em{' '}
                    {formatDateTimeBR(item.createdAt)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="secondary" onClick={() => handleOpenItem(item)}>
                    {user.role === 'admin' && linkedSale && linkedSale.pabloValidationStatus === 'pending_pablo'
                      ? 'Ler Relatório & Validar Venda'
                      : 'Ver Conteúdo'}
                  </Button>
                  {client && (
                    <Button size="sm" variant="ghost" onClick={() => onOpenDossier(client.id)}>
                      Dossiê
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de Leitura Completa */}
      <Modal
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        maxWidth="max-w-2xl"
        title="Detalhes do Registro Comercial"
      >
        {selectedItem?.kind === 'report' && (() => {
          const modalSale = selectedItem.data.saleId
            ? db.sales.find((s) => s.id === selectedItem.data.saleId)
            : null;
          return (
            <div className="space-y-3 text-xs">
              <p><strong>Situação Comercial:</strong> {selectedItem.data.saleClosedChoice}</p>
              <p><strong>Negócio & Oferta:</strong> {selectedItem.data.businessDescription}</p>
              <p><strong>Público / Região / Presença Digital:</strong> {selectedItem.data.targetAudienceAndRegion}</p>
              <p><strong>Dificuldades:</strong> {selectedItem.data.mainDifficulties}</p>
              <p><strong>Necessidades / Objetivos:</strong> {selectedItem.data.clientNeedsAndGoals}</p>
              <p><strong>Como o site vai ajudar:</strong> {selectedItem.data.howSiteHelpsClient}</p>
              <p>
                <strong>Domínio:</strong> {selectedItem.data.domainPlatform} •{' '}
                <strong>Próxima call apresentando o site:</strong> {selectedItem.data.nextCallSitePresentationDate}
              </p>
              <p><strong>Autoavaliação:</strong> {selectedItem.data.selfEvaluation}</p>
              <div className="p-3.5 rounded-xl border" style={{ backgroundColor: tokens.surfaceElevated, borderColor: tokens.border }}>
                <strong className="block mb-1">Depoimento Geral do Vendedor:</strong>
                <p className="whitespace-pre-wrap">{selectedItem.data.sellerTestimony}</p>
              </div>

              {modalSale && (
                <div className="p-3.5 rounded-xl border space-y-2" style={{ backgroundColor: tokens.surfaceElevated, borderColor: tokens.border }}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong>Registro da Venda: {formatCurrencyBRL(modalSale.amountSold)}</strong>
                    <span>
                      Enviado: <strong>{formatCurrencyBRL(modalSale.amountReceived)}</strong> • {modalSale.paymentStructure} ({modalSale.paymentMethod})
                    </span>
                  </div>

                  {user.role === 'admin' && (
                    <div className="pt-2 border-t flex flex-wrap items-center gap-2.5" style={{ borderColor: tokens.border }}>
                      <button
                        type="button"
                        onClick={() => handlePabloDecision(modalSale.id, 'confirmed_sdr')}
                        className="px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all hover:opacity-85 active:scale-[0.98]"
                        style={{
                          backgroundColor: 'transparent',
                          borderColor: '#16845B',
                          color: '#2AC78E',
                        }}
                      >
                        Confirmar venda
                      </button>

                      <button
                        type="button"
                        onClick={() => handlePabloDecision(modalSale.id, 'confirmed_vercel')}
                        className="px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all hover:opacity-85 active:scale-[0.98]"
                        style={{
                          backgroundColor: 'transparent',
                          borderColor: '#EAB308',
                          color: '#FACC15',
                        }}
                      >
                        Confirmar venda Vercel
                      </button>

                      <button
                        type="button"
                        onClick={() => handlePabloDecision(modalSale.id, 'not_sold')}
                        className="px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all hover:opacity-85 active:scale-[0.98]"
                        style={{
                          backgroundColor: 'transparent',
                          borderColor: '#C83E4D',
                          color: '#F27986',
                        }}
                      >
                        Venda não realizada
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}
        {selectedItem?.kind === 'no_show' && (
          <div className="space-y-2 text-xs">
            <p><strong>Motivo:</strong> {selectedItem.data.reason}</p>
            <p><strong>Tentativas de contato:</strong> {selectedItem.data.contactAttempts}</p>
            <p><strong>Descrição:</strong> {selectedItem.data.description}</p>
          </div>
        )}
        {selectedItem?.kind === 'reschedule' && (
          <div className="space-y-2 text-xs">
            <p>
              <strong>Horário anterior:</strong>{' '}
              {formatDateWithWeekdayBR(selectedItem.data.previousDate, selectedItem.data.previousTime)}
            </p>
            <p>
              <strong>Novo horário:</strong>{' '}
              {formatDateWithWeekdayBR(selectedItem.data.newDate, selectedItem.data.newTime)}
            </p>
            <p><strong>Motivo:</strong> {selectedItem.data.reason}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ============================================================================
// 16. PÁGINA: VENDAS (CONTROLE FINANCEIRO + VALIDAÇÃO DO PABLO)
// ============================================================================
function SalesPage({ onOpenDossier }) {
  const { user, db, tokens, notify } = useApp();
  const [editingSale, setEditingSale] = useState(null);
  const [finStatus, setFinStatus] = useState('Concluída');
  const [receivedVal, setReceivedVal] = useState('');

  const visibleSales = db.sales.filter((s) => (user.role === 'admin' ? true : s.sellerId === user.id));

  const validSales = visibleSales.filter(
    (s) =>
      s.financialStatus !== 'Cancelada' &&
      s.financialStatus !== 'Reembolsada' &&
      s.pabloValidationStatus !== 'not_sold'
  );

  const totalSold = validSales.reduce((a, b) => a + (Number(b.amountSold) || 0), 0);
  const totalReceived = validSales.reduce((a, b) => a + (Number(b.amountReceived) || 0), 0);

  const handleSaveFinancial = (e) => {
    e.preventDefault();
    try {
      dataEngine.updateSaleFinancials(user, editingSale.id, {
        financialStatus: finStatus,
        amountReceived: receivedVal,
      });
      soundEngine.playSfx('success');
      notify('Valores financeiros atualizados com sucesso!', 'success');
      setEditingSale(null);
    } catch (err) {
      soundEngine.playSfx('error');
      notify(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <span className="text-xs opacity-65">Vendas Válidas</span>
          <div className="text-2xl font-bold mt-1">{validSales.length}</div>
        </Card>
        <Card className="p-5">
          <span className="text-xs opacity-65">Valor Vendido</span>
          <div className="text-2xl font-bold mt-1" style={{ color: '#B87CFF' }}>
            {formatCurrencyBRL(totalSold)}
          </div>
        </Card>
        <Card className="p-5">
          <span className="text-xs opacity-65">Valor Recebido</span>
          <div className="text-2xl font-bold mt-1" style={{ color: '#2AC78E' }}>
            {formatCurrencyBRL(totalReceived)}
          </div>
        </Card>
      </div>

      {visibleSales.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="Nenhuma venda registrada"
          description="As vendas são geradas automaticamente ao enviar o Relatório da Reunião de Vendas com fechamento concluído."
        />
      ) : (
        <div className="space-y-3">
          {visibleSales.map((sale) => {
            const client = db.clients.find((c) => c.id === sale.clientId);
            return (
              <Card key={sale.id} className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenDossier(sale.clientId)}
                      className="text-sm font-semibold hover:underline"
                    >
                      {client?.name || 'Cliente'}
                    </button>
                    <Badge tone="neutral">{sale.paymentStructure}</Badge>
                    <Badge tone="neutral">{sale.paymentMethod}</Badge>
                    <Badge
                      tone={
                        sale.financialStatus === 'Concluída'
                          ? 'success'
                          : sale.financialStatus === 'Pagamento pendente'
                          ? 'warning'
                          : 'error'
                      }
                    >
                      {sale.financialStatus}
                    </Badge>
                    {sale.pabloValidationStatus === 'pending_pablo' && (
                      <Badge tone="warning">Aguardando validação Pablo</Badge>
                    )}
                    {sale.pabloValidationStatus === 'confirmed_sdr' && (
                      <Badge tone="success">Confirmada SDR (Wix)</Badge>
                    )}
                    {sale.pabloValidationStatus === 'confirmed_vercel' && (
                      <Badge tone="primary">Confirmada Vercel</Badge>
                    )}
                    {sale.pabloValidationStatus === 'not_sold' && (
                      <Badge tone="error">Não Vendido</Badge>
                    )}
                  </div>
                  <p className="opacity-75">
                    Vendido: <strong>{formatCurrencyBRL(sale.amountSold)}</strong> • Recebido:{' '}
                    <strong style={{ color: '#2AC78E' }}>{formatCurrencyBRL(sale.amountReceived)}</strong> •
                    Responsável: <strong>{getUserDisplayName(db.users, sale.sellerId)}</strong>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {user.role === 'admin' && sale.pabloValidationStatus === 'pending_pablo' && (
                    <>
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => {
                          dataEngine.validateReportedSaleByPablo(user, sale.id, 'confirmed_sdr');
                          soundEngine.playSfx('success');
                          notify('Venda SDR confirmada!', 'success');
                        }}
                      >
                        Confirmar Venda SDR
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => {
                          dataEngine.validateReportedSaleByPablo(user, sale.id, 'confirmed_vercel');
                          soundEngine.playSfx('success');
                          notify('Venda Vercel confirmada!', 'success');
                        }}
                      >
                        Confirmar Venda Vercel
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => {
                          dataEngine.validateReportedSaleByPablo(user, sale.id, 'not_sold');
                          soundEngine.playSfx('warning');
                          notify('Marcado como Não Vendido.', 'warning');
                        }}
                      >
                        Não Vendido
                      </Button>
                    </>
                  )}

                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setEditingSale(sale);
                      setFinStatus(sale.financialStatus);
                      setReceivedVal(String(sale.amountReceived));
                    }}
                  >
                    Atualizar Recebimento
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={!!editingSale}
        onClose={() => setEditingSale(null)}
        title="Atualizar Status Financeiro da Venda"
      >
        <form onSubmit={handleSaveFinancial} className="space-y-4">
          <SelectField label="Status financeiro" value={finStatus} onChange={(e) => setFinStatus(e.target.value)}>
            <option value="Concluída">Concluída</option>
            <option value="Pagamento pendente">Pagamento pendente</option>
            <option value="Cancelada">Cancelada</option>
            <option value="Reembolsada">Reembolsada</option>
          </SelectField>
          <InputField
            label={`Valor efetivamente recebido (Máx: ${formatCurrencyBRL(editingSale?.amountSold || 0)})`}
            type="number"
            step="0.01"
            min="0"
            max={editingSale?.amountSold || 0}
            value={receivedVal}
            onChange={(e) => setReceivedVal(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setEditingSale(null)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Salvar Alterações
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ============================================================================
// 17. PÁGINA: GESTÃO DE USUÁRIOS (EXCLUSIVA DO PABLO)
// ============================================================================
function UsersManagementPage() {
  const { user, db, tokens, notify } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('seller');

  const [deletingUser, setDeletingUser] = useState(null);
  const [transferSellerId, setTransferSellerId] = useState('');

  if (user.role !== 'admin') {
    return (
      <EmptyState
        icon={Shield}
        title="Acesso restrito ao Pablo"
        description="Apenas o Pablo possui permissão para gerenciar contas da equipe."
      />
    );
  }

  const activeSellers = db.users.filter((u) => u.role === 'seller' && u.active && !u.deleted);

  const handleCreate = (e) => {
    e.preventDefault();
    try {
      dataEngine.createUserAccount(user, { name, email, password, role });
      soundEngine.playSfx('success');
      notify(`Conta ${role === 'sdr' ? 'SDR' : 'de Vendedor'} criada com sucesso!`, 'success');
      setName('');
      setEmail('');
      setPassword('');
    } catch (err) {
      soundEngine.playSfx('error');
      notify(err.message, 'error');
    }
  };

  const handleConfirmDelete = () => {
    try {
      dataEngine.deleteUserAccount(user, deletingUser.id, transferSellerId);
      soundEngine.playSfx('warning');
      notify('Conta excluída com preservação integral do histórico.', 'warning');
      setDeletingUser(null);
    } catch (err) {
      soundEngine.playSfx('error');
      notify(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-base font-semibold mb-1">Adicionar Conta da Equipe</h2>
        <p className="text-xs opacity-70 mb-4">
          Crie acessos de Vendedor ou SDR. O perfil administrativo é exclusivo do Pablo.
        </p>
        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <InputField label="Nome" required placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} />
          <InputField
            label="E-mail"
            type="email"
            required
            placeholder="email@pontoweb.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <InputField
            label="Senha inicial"
            type="password"
            required
            placeholder="Mín. 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <SelectField label="Perfil" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="seller">Vendedor</option>
            <option value="sdr">SDR</option>
          </SelectField>
          <Button type="submit" variant="primary">
            <UserPlus className="w-4 h-4" />
            <span>Criar Conta</span>
          </Button>
        </form>
      </Card>

      <div className="space-y-3">
        {db.users.map((u) => (
          <Card key={u.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <strong className="text-sm">
                  {u.deleted ? `${u.name} (conta excluída)` : u.name}
                </strong>
                <Badge tone={u.role === 'admin' ? 'primary' : u.role === 'sdr' ? 'warning' : 'neutral'}>
                  {u.role === 'admin' ? 'Pablo' : u.role === 'sdr' ? 'SDR' : 'Vendedor'}
                </Badge>
                {!u.deleted && (
                  <Badge tone={u.active ? 'success' : 'error'}>
                    {u.active ? 'Ativa' : 'Desativada'}
                  </Badge>
                )}
              </div>
              <p className="text-xs opacity-70 mt-0.5">{u.email}</p>
            </div>

            {u.role !== 'admin' && !u.deleted && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    const newPass = window.prompt(`Nova senha para ${u.name}:`);
                    if (!newPass) return;
                    try {
                      dataEngine.resetPassword(u.email, newPass);
                      soundEngine.playSfx('success');
                      notify(`Senha de ${u.name} alterada com sucesso.`, 'success');
                    } catch (err) {
                      soundEngine.playSfx('error');
                      notify(err.message, 'error');
                    }
                  }}
                >
                  Alterar Senha
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    try {
                      dataEngine.toggleUserActive(user, u.id);
                      soundEngine.playSfx('click');
                      notify(`Status de ${u.name} alterado.`, 'success');
                    } catch (err) {
                      soundEngine.playSfx('error');
                      notify(err.message, 'error');
                    }
                  }}
                >
                  {u.active ? 'Desativar' : 'Reativar'}
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    setDeletingUser(u);
                    const alt = activeSellers.find((s) => s.id !== u.id);
                    setTransferSellerId(alt?.id || '');
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir</span>
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>

      <Modal
        open={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        title={`Excluir Conta • ${deletingUser?.name}`}
        subtitle="O acesso será encerrado imediatamente, preservando todos os relatórios, reuniões e vendas no histórico."
      >
        <div className="space-y-4">
          {deletingUser?.role === 'seller' && (
            <SelectField
              label="Transferir clientes em andamento para (opcional)"
              value={transferSellerId}
              onChange={(e) => setTransferSellerId(e.target.value)}
            >
              <option value="">Não transferir agora</option>
              {activeSellers
                .filter((s) => s.id !== deletingUser.id)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </SelectField>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeletingUser(null)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete}>
              Confirmar Exclusão
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ============================================================================
// 18. PÁGINA: CONFIGURAÇÕES (ÁUDIO EXECUTIVE TECH, TEMA & TESTES)
// ============================================================================
function SettingsPage() {
  const { tokens, theme, toggleTheme, musicPlaying, toggleMusic, notify } = useApp();
  const [sfxEnabled, setSfxEnabled] = useState(soundEngine.prefs.sfxEnabled);
  const [sfxVol, setSfxVol] = useState(soundEngine.prefs.sfxVolume);
  const [musicVol, setMusicVol] = useState(soundEngine.prefs.musicVolume);

  return (
    <div className="space-y-6 max-w-3xl">
      <Card className="p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold">Identidade Sonora & Áudio Ambiente</h2>
          <p className="text-xs opacity-70 mt-0.5">
            Trilha contínua em loop (YouTube) e efeitos sonoros Old Money / Executive Tech.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border space-y-3" style={{ backgroundColor: tokens.surfaceElevated, borderColor: tokens.border }}>
            <div className="flex items-center justify-between">
              <strong className="text-sm">Música Ambiente (Loop)</strong>
              <Button size="sm" variant={musicPlaying ? 'primary' : 'secondary'} onClick={toggleMusic}>
                {musicPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{musicPlaying ? 'Pausar' : 'Tocar'}</span>
              </Button>
            </div>
            <div>
              <label className="text-xs opacity-70 block mb-1">Volume da Música ({Math.round(musicVol * 100)}%)</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={musicVol}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setMusicVol(v);
                  soundEngine.setMusicVolume(v);
                }}
                className="w-full accent-[#8017FF]"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl border space-y-3" style={{ backgroundColor: tokens.surfaceElevated, borderColor: tokens.border }}>
            <div className="flex items-center justify-between">
              <strong className="text-sm">Efeitos Sonoros (SFX)</strong>
              <Button
                size="sm"
                variant={sfxEnabled ? 'primary' : 'secondary'}
                onClick={() => {
                  const next = !sfxEnabled;
                  setSfxEnabled(next);
                  soundEngine.toggleSfx(next);
                  if (next) soundEngine.playSfx('success');
                }}
              >
                {sfxEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span>{sfxEnabled ? 'Ativados' : 'Desativados'}</span>
              </Button>
            </div>
            <div>
              <label className="text-xs opacity-70 block mb-1">Volume dos Efeitos ({Math.round(sfxVol * 100)}%)</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={sfxVol}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setSfxVol(v);
                  soundEngine.setSfxVolume(v);
                }}
                className="w-full accent-[#8017FF]"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {[
            { id: 'click', label: 'Soft Click' },
            { id: 'success', label: 'Confirmação' },
            { id: 'notification', label: 'Notificação' },
            { id: 'whoosh', label: 'Modal Whoosh' },
            { id: 'warning', label: 'Aviso' },
            { id: 'error', label: 'Erro' },
          ].map((sfx) => (
            <Button
              key={sfx.id}
              size="sm"
              variant="secondary"
              sfx={null}
              onClick={() => {
                soundEngine.playSfx(sfx.id);
                notify(`Testando timbre: ${sfx.label}`, 'neutral');
              }}
            >
              {sfx.label}
            </Button>
          ))}
        </div>
      </Card>

      <Card className="p-6 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Aparência do Sistema</h3>
          <p className="text-xs opacity-70">Tema escuro padrão institucional ou tema claro.</p>
        </div>
        <Button variant="secondary" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          <span>{theme === 'dark' ? 'Alternar para Tema Claro' : 'Alternar para Tema Escuro'}</span>
        </Button>
      </Card>
    </div>
  );
}

// ============================================================================
// 19. APLICAÇÃO PRINCIPAL & SHELL AUTENTICADO
// ============================================================================
export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('pontoweb_theme') || 'dark');
  const [db, setDb] = useState(() => dataEngine.getState());
  const [user, setUser] = useState(() => dataEngine.getCurrentUser());
  const [activePage, setActivePage] = useState('dashboard');
  const [toasts, setToasts] = useState([]);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Modais globais
  const [meetingModalClient, setMeetingModalClient] = useState(null);
  const [dossierClientId, setDossierClientId] = useState(null);

  const tokens = THEME_TOKENS[theme] || THEME_TOKENS.dark;

  const notify = (message, tone = 'neutral') => {
    const id = generateId('tst');
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  };

  useEffect(() => {
    localStorage.setItem('pontoweb_theme', theme);
  }, [theme]);

  useEffect(() => {
    soundEngine.initYouTubePlayer((playing) => setMusicPlaying(playing));
    const unsub = dataEngine.subscribe((nextDb) => {
      setDb({ ...nextDb });
      const current = dataEngine.getCurrentUser();
      setUser(current);
    });
    return unsub;
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const toggleMusic = () => {
    if (musicPlaying) {
      soundEngine.stopMusic((st) => setMusicPlaying(st));
    } else {
      soundEngine.startMusic((st) => setMusicPlaying(st));
    }
  };

  const contextValue = {
    theme,
    tokens,
    toggleTheme,
    user,
    db,
    notify,
    musicPlaying,
    toggleMusic,
  };

  // Menu lateral dinâmico conforme o perfil (Pablo, Vendedor ou SDR)
  const navItems = useMemo(() => {
    if (!user) return [];
    if (user.role === 'sdr') {
      return [
        { id: 'dashboard', label: 'Dashboard SDR', icon: Layers },
        { id: 'settings', label: 'Configurações', icon: Sliders },
      ];
    }
    const base = [
      { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
      { id: 'clients', label: 'Clientes e contatos', icon: Users },
      { id: 'meetings', label: 'Reuniões de vendas', icon: Calendar },
      { id: 'sales', label: 'Vendas', icon: DollarSign },
      { id: 'reports', label: 'Relatórios', icon: FileText },
    ];
    if (user.role === 'admin') {
      base.push({ id: 'users', label: 'Usuários', icon: Shield });
    }
    base.push({ id: 'settings', label: 'Configurações', icon: Sliders });
    return base;
  }, [user]);

  const myNotifications = useMemo(() => {
    if (!user || !db) return [];
    return db.notifications.filter((n) => n.recipientId === user.id);
  }, [db, user]);

  const unreadNotifCount = myNotifications.filter((n) => !n.read).length;

  return (
    <AppContext.Provider value={contextValue}>
      {/* Player oculto do YouTube em loop */}
      <div className="fixed -left-[9999px] -top-[9999px] pointer-events-none opacity-0" aria-hidden="true">
        <div id="pontoweb-yt-player" />
      </div>

      {/* Toasts flutuantes */}
      <div className="fixed bottom-4 right-4 z-[60] space-y-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="p-3.5 rounded-xl border text-xs shadow-xl backdrop-blur-md pointer-events-auto flex items-center gap-2.5"
            style={{
              backgroundColor: tokens.surface,
              borderColor:
                t.tone === 'success'
                  ? tokens.success
                  : t.tone === 'error'
                  ? tokens.error
                  : t.tone === 'warning'
                  ? tokens.warning
                  : tokens.primary,
              color: tokens.text,
            }}
          >
            <Sparkles className="w-4 h-4 shrink-0" style={{ color: '#B87CFF' }} />
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {!user ? (
        <AuthScreen
          onAuthenticated={(u) => {
            setUser(u);
            setActivePage('dashboard');
          }}
        />
      ) : (
        <div className="min-h-screen flex flex-col lg:flex-row" style={{ backgroundColor: tokens.bg, color: tokens.text }}>
          {/* Sidebar responsiva */}
          <aside
            className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r p-4 flex flex-col justify-between shrink-0"
            style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <PontoWebLogo />
              </div>

              <nav className="flex lg:flex-col gap-1.5 overflow-x-auto pb-1 lg:pb-0">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        soundEngine.playSfx('click');
                        setActivePage(item.id);
                      }}
                      className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all"
                      style={{
                        backgroundColor: active ? 'rgba(128, 23, 255, 0.18)' : 'transparent',
                        color: active ? '#D7B8FF' : tokens.textSecondary,
                        border: active ? `1px solid rgba(128, 23, 255, 0.4)` : '1px solid transparent',
                      }}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t space-y-3" style={{ borderColor: tokens.border }}>
              <div className="px-2">
                <div className="text-xs font-semibold">{user.name}</div>
                <div className="text-[11px] opacity-60 truncate">{user.email}</div>
                <div className="mt-1.5">
                  <Badge tone={user.role === 'admin' ? 'primary' : user.role === 'sdr' ? 'warning' : 'neutral'}>
                    {user.role === 'admin' ? 'Pablo' : user.role === 'sdr' ? 'SDR' : 'Vendedor'}
                  </Badge>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => {
                  dataEngine.logout();
                  setUser(null);
                }}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair</span>
              </Button>
            </div>
          </aside>

          {/* Área Principal */}
          <div className="flex-1 flex flex-col min-w-0">
            <header
              className="px-6 py-4 border-b flex items-center justify-between gap-4 sticky top-0 z-30 backdrop-blur-md"
              style={{ backgroundColor: `${tokens.surface}E6`, borderColor: tokens.border }}
            >
              <div>
                <h1 className="text-base font-semibold" style={{ letterSpacing: '0.08em' }}>
                  {navItems.find((n) => n.id === activePage)?.label || 'Dashboard'}
                </h1>
                <p className="text-xs" style={{ color: '#8017FF', letterSpacing: '0.04em' }}>Curta a vibe da PontoWeb clicando no Play</p>
              </div>

              <div className="flex items-center gap-2.5">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={toggleMusic}
                  className={!musicPlaying ? 'pw-neon-pulse' : ''}
                >
                  {musicPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{musicPlaying ? 'Música Ativa' : 'Tocar Música'}</span>
                </Button>

                <Button size="sm" variant="secondary" onClick={toggleTheme}>
                  {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                </Button>

                {/* Central de Notificações */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playSfx('notification');
                      setShowNotifications(!showNotifications);
                      if (!showNotifications && unreadNotifCount > 0) {
                        dataEngine.markAllNotificationsRead(user.id);
                      }
                    }}
                    className="p-2.5 rounded-xl border relative"
                    style={{ backgroundColor: tokens.surfaceElevated, borderColor: tokens.border }}
                  >
                    <Bell className="w-4 h-4" />
                    {unreadNotifCount > 0 && (
                      <span
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                        style={{ backgroundColor: tokens.primary }}
                      >
                        {unreadNotifCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div
                      className="absolute right-0 mt-2 w-80 rounded-2xl border shadow-2xl p-4 z-50 space-y-2 max-h-96 overflow-y-auto"
                      style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
                    >
                      <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: tokens.border }}>
                        <strong className="text-xs">Notificações</strong>
                        <button
                          type="button"
                          onClick={() => setShowNotifications(false)}
                          className="text-xs opacity-60 hover:opacity-100"
                        >
                          Fechar
                        </button>
                      </div>
                      {myNotifications.length === 0 ? (
                        <p className="text-xs opacity-60 py-4 text-center">Nenhuma notificação.</p>
                      ) : (
                        myNotifications.slice(0, 12).map((n) => (
                          <div
                            key={n.id}
                            className="p-2.5 rounded-xl border text-xs"
                            style={{ backgroundColor: tokens.surfaceElevated, borderColor: tokens.border }}
                          >
                            <strong>{n.title}</strong>
                            <p className="opacity-75 mt-0.5">{n.message}</p>
                            <span className="text-[10px] opacity-50 block mt-1">
                              {formatDateTimeBR(n.createdAt)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </header>

            <main className="p-4 sm:p-6 max-w-7xl w-full mx-auto flex-1">
              {activePage === 'dashboard' &&
                (user.role === 'admin' ? (
                  <PabloDashboardPage
                    onNavigate={setActivePage}
                    onOpenDossier={(cid) => setDossierClientId(cid)}
                  />
                ) : user.role === 'sdr' ? (
                  <SdrDashboardPage />
                ) : (
                  <SellerDashboardPage
                    onOpenMeetingModal={(cli) => setMeetingModalClient(cli)}
                    onOpenDossier={(cid) => setDossierClientId(cid)}
                  />
                ))}

              {activePage === 'clients' && user.role !== 'sdr' && (
                <ClientsAndContactsPage
                  onOpenMeetingModal={(cli) => setMeetingModalClient(cli)}
                  onOpenDossier={(cid) => setDossierClientId(cid)}
                />
              )}

              {activePage === 'meetings' && user.role !== 'sdr' && (
                <MeetingsPage
                  onOpenMeetingModal={(cli) => setMeetingModalClient(cli)}
                  onOpenDossier={(cid) => setDossierClientId(cid)}
                />
              )}

              {activePage === 'sales' && user.role !== 'sdr' && (
                <SalesPage onOpenDossier={(cid) => setDossierClientId(cid)} />
              )}

              {activePage === 'reports' && user.role !== 'sdr' && (
                <ReportsPage onOpenDossier={(cid) => setDossierClientId(cid)} />
              )}

              {activePage === 'users' && user.role === 'admin' && <UsersManagementPage />}

              {activePage === 'settings' && <SettingsPage />}
            </main>
          </div>
        </div>
      )}

      {/* Modais Globais */}
      <MeetingActionModal
        open={!!meetingModalClient}
        onClose={() => setMeetingModalClient(null)}
        client={meetingModalClient}
      />
      <ClientDossierModal
        open={!!dossierClientId}
        onClose={() => setDossierClientId(null)}
        clientId={dossierClientId}
        onOpenMeetingModal={(cli) => setMeetingModalClient(cli)}
      />
    </AppContext.Provider>
  );
}
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { useUnreadMessages } from '../hooks/useUnreadMessages';
import type { Conversation, ConversationJobContext, ConversationStatus, Message, MessageSearchResult } from '../types';
import { MessageSquare, Send, Loader2, ArrowLeft, Briefcase, ImagePlus, Search, Flag, Check } from 'lucide-react';
import { gold } from '../styles/design-tokens';
import { socketService } from '../services/socket';
import { formatPrice, formatDate } from '../utils';

const QUICK_REPLIES: Record<ConversationStatus, string[]> = {
  inquiry: [
    'Bonjour! J\'ai une question sur cette tâche.',
    'Pouvez-vous préciser les détails?',
    'Quand souhaitez-vous que ce soit fait?',
  ],
  application: [
    'Bonjour! Pouvez-vous préciser votre expérience?',
    'Quand seriez-vous disponible?',
    'Merci pour votre intérêt!',
  ],
  active: [
    'Parfait, merci!',
    'Je suis en route.',
    'À quelle heure demain?',
  ],
  archived: [],
};

const REPORT_REASONS: { id: string; label: string }[] = [
  { id: 'harassment', label: 'Harcèlement' },
  { id: 'spam', label: 'Spam' },
  { id: 'contact_info', label: 'Coordonnées non autorisées' },
  { id: 'inappropriate', label: 'Contenu inapproprié' },
  { id: 'other', label: 'Autre' },
];

function messagePreview(m?: Message) {
  if (!m) return 'Nouvelle conversation';
  if (m.type === 'system') return `ℹ ${m.content}`;
  if (m.type === 'image') return '📷 Photo';
  return m.content;
}

function JobChatHeader({ job }: { job: ConversationJobContext }) {
  return (
    <Link
      to={`/jobs/${job.id}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        margin: '0 18px 8px',
        borderRadius: 8,
        background: 'rgba(15,25,36,0.55)',
        border: '1px solid rgba(217,179,140,0.15)',
        textDecoration: 'none',
      }}
    >
      <Briefcase className="w-4 h-4" style={{ color: gold, flexShrink: 0 }} />
      <div style={{ minWidth: 0 }}>
        <p className="body-f cream-hi" style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {job.title}
        </p>
        <p className="body-f muted2" style={{ fontSize: 11 }}>
          {formatPrice(job.estimatedPrice)}
          {job.scheduledDate ? ` · ${formatDate(job.scheduledDate)}` : ''}
          {` · ${job.status}`}
        </p>
      </div>
    </Link>
  );
}

export function Messages() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const { refreshUnread } = useUnreadMessages();
  const [searchParams] = useSearchParams();
  const jobIdParam = searchParams.get('jobId');
  const taskerIdParam = searchParams.get('taskerId');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [jobContext, setJobContext] = useState<ConversationJobContext | null>(null);
  const [conversationStatus, setConversationStatus] = useState<ConversationStatus | null>(null);
  const [canSend, setCanSend] = useState(true);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sendFeedback, setSendFeedback] = useState<'idle' | 'sent'>('idle');
  const sendFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MessageSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [mobileShowThread, setMobileShowThread] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMessageAtRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingEmitRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lastOwnMessageId = useMemo(() => {
    const own = messages.filter((m) => m.senderId === user?.id && m.type !== 'system');
    return own[own.length - 1]?.id;
  }, [messages, user?.id]);

  const quickReplies = conversationStatus ? QUICK_REPLIES[conversationStatus] : [];

  const flashSent = useCallback(() => {
    if (sendFeedbackTimerRef.current) clearTimeout(sendFeedbackTimerRef.current);
    setSendFeedback('sent');
    sendFeedbackTimerRef.current = setTimeout(() => setSendFeedback('idle'), 2000);
  }, []);

  useEffect(() => () => {
    if (sendFeedbackTimerRef.current) clearTimeout(sendFeedbackTimerRef.current);
  }, []);

  useEffect(() => {
    setSendFeedback('idle');
  }, [activeId]);

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = await api.searchMessages(trimmed);
      setSearchResults(results);
    } catch {
      addToast('Erreur de recherche', 'error');
    } finally {
      setSearching(false);
    }
  }, [addToast]);

  useEffect(() => {
    const timer = setTimeout(() => runSearch(searchQuery), 350);
    return () => clearTimeout(timer);
  }, [searchQuery, runSearch]);

  const handleReport = async (messageId: string, reason: string) => {
    if (!activeId) return;
    setReportingId(messageId);
    try {
      await api.reportMessage(activeId, messageId, reason);
      addToast('Message signalé — notre équipe va examiner.', 'success');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      addToast(msg ?? 'Impossible de signaler', 'error');
    } finally {
      setReportingId(null);
    }
  };

  const loadConversations = useCallback(async () => {
    const data = await api.getConversations();
    setConversations(data);
    return data;
  }, []);

  const pickConversation = useCallback((data: Conversation[]) => {
    if (jobIdParam) {
      const match = data.find(
        (c) => c.jobId === jobIdParam && (!taskerIdParam || c.providerId === taskerIdParam),
      );
      if (match) {
        setActiveId(match.id);
        setMobileShowThread(true);
        return;
      }
    }
    if (data.length > 0) setActiveId(data[0].id);
  }, [jobIdParam, taskerIdParam]);

  useEffect(() => {
    const load = async () => {
      try {
        let data = await loadConversations();
        if (jobIdParam && !data.some(
          (c) => c.jobId === jobIdParam && (!taskerIdParam || c.providerId === taskerIdParam),
        )) {
          try {
            const jobConvs = await api.getJobConversations(jobIdParam);
            const merged = [...data];
            for (const jc of jobConvs) {
              if (!merged.some((m) => m.id === jc.id)) merged.push(jc);
            }
            data = merged.sort(
              (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
            );
            setConversations(data);
          } catch {
            if (!taskerIdParam) {
              try {
                await api.startJobInquiry(jobIdParam);
                data = await loadConversations();
                setConversations(data);
              } catch {
                // inquiry not available for this job/user
              }
            }
          }
        }
        pickConversation(data);
      } catch {
        addToast('Erreur de chargement des conversations', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [addToast, jobIdParam, taskerIdParam, loadConversations, pickConversation]);

  const loadMessages = useCallback(async (conversationId: string, after?: string) => {
    const data = await api.getMessages(conversationId, after);
    setJobContext(data.job);
    setConversationStatus(data.conversationStatus ?? null);
    setCanSend(data.canSend !== false);
    if (after) {
      setMessages((prev) => {
        const merged = [...prev];
        for (const m of data.messages) {
          if (!merged.some((x) => x.id === m.id)) merged.push(m);
        }
        return merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      });
    } else {
      setMessages(data.messages);
    }
    const last = data.messages[data.messages.length - 1];
    if (last) lastMessageAtRef.current = last.createdAt;
    await api.markAsRead(conversationId);
    refreshUnread();
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)),
    );
  }, [refreshUnread]);

  useEffect(() => {
    if (!activeId) return;
    loadMessages(activeId).catch(() => addToast('Erreur de chargement des messages', 'error'));
  }, [activeId, addToast, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const socket = socketService.reconnectIfNeeded();
    if (!socket) return;

    const handleNewMessage = (msg: Message) => {
      if (msg.conversationId === activeId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          const withoutTemp = prev.filter((m) => !m.id.startsWith('temp-') || m.content !== msg.content);
          return [...withoutTemp, msg];
        });
        lastMessageAtRef.current = msg.createdAt;
        api.markAsRead(activeId!).catch(() => undefined);
        refreshUnread();
      }

      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === msg.conversationId);
        if (idx === -1) {
          loadConversations().catch(() => undefined);
          return prev;
        }
        const updated = [...prev];
        const conv = {
          ...updated[idx],
          lastMessage: msg,
          updatedAt: new Date().toISOString(),
          unreadCount:
            msg.conversationId === activeId || msg.senderId === user?.id || msg.type === 'system'
              ? updated[idx].unreadCount
              : updated[idx].unreadCount + 1,
        };
        updated.splice(idx, 1);
        updated.unshift(conv);
        return updated;
      });

      if (
        msg.conversationId !== activeId
        && (msg.type === 'text' || msg.type === 'image')
        && msg.senderId !== user?.id
      ) {
        refreshUnread();
      }
    };

    const handleTyping = ({ conversationId, userId: typerId }: { conversationId: string; userId: string }) => {
      if (conversationId !== activeId || typerId === user?.id) return;
      setTypingUserId(typerId);
      if (typingClearRef.current) clearTimeout(typingClearRef.current);
      typingClearRef.current = setTimeout(() => setTypingUserId(null), 3000);
    };

    const handleMessagesRead = ({ conversationId }: { conversationId: string }) => {
      if (conversationId !== activeId) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.senderId === user?.id && m.type !== 'system' ? { ...m, isRead: true } : m,
        ),
      );
    };

    const handleReconnect = () => {
      if (activeId && lastMessageAtRef.current) {
        loadMessages(activeId, lastMessageAtRef.current).catch(() => undefined);
      }
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('typing', handleTyping);
    socket.on('messagesRead', handleMessagesRead);
    socket.on('connect', handleReconnect);
    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('typing', handleTyping);
      socket.off('messagesRead', handleMessagesRead);
      socket.off('connect', handleReconnect);
    };
  }, [activeId, loadConversations, loadMessages, refreshUnread, user?.id]);

  useEffect(() => {
    setTypingUserId(null);
  }, [activeId]);

  const handleDraftChange = (value: string) => {
    setDraft(value);
    if (!activeId || !canSend) return;
    if (typingEmitRef.current) clearTimeout(typingEmitRef.current);
    typingEmitRef.current = setTimeout(() => {
      socketService.emitTyping(activeId);
    }, 400);
  };

  const handleQuickReply = (text: string) => {
    handleDraftChange(text);
  };

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeId || uploading) return;

    if (!file.type.startsWith('image/')) {
      addToast('Seules les images sont acceptées.', 'error');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const data = reader.result as string;
      const tempId = `temp-${Date.now()}`;
      const optimistic: Message = {
        id: tempId,
        conversationId: activeId,
        senderId: user?.id ?? null,
        senderName: '',
        type: 'image',
        content: '📷 Photo',
        attachmentUrl: data,
        createdAt: new Date().toISOString(),
        isRead: false,
      };

      setMessages((prev) => [...prev, optimistic]);
      setUploading(true);

      try {
        const { url } = await api.uploadImage({
          purpose: 'message',
          data,
          filename: file.name,
          contentType: file.type,
        });
        const msg = await api.sendMessage(activeId, { attachmentUrl: url, type: 'image' });
        setMessages((prev) => prev.map((m) => (m.id === tempId ? msg : m)));
        lastMessageAtRef.current = msg.createdAt;
        setConversations((prev) => {
          const idx = prev.findIndex((c) => c.id === activeId);
          if (idx === -1) return prev;
          const updated = [...prev];
          const conv = { ...updated[idx], lastMessage: msg, updatedAt: msg.createdAt };
          updated.splice(idx, 1);
          updated.unshift(conv);
          return updated;
        });
        flashSent();
      } catch (err: unknown) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message
          ?? (err as Error)?.message;
        addToast(msg ?? "Impossible d'envoyer la photo", 'error');
      } finally {
        setUploading(false);
        e.target.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeId || !draft.trim() || sending) return;

    const content = draft.trim();
    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      conversationId: activeId,
      senderId: user?.id ?? null,
      senderName: '',
      type: 'text',
      content,
      createdAt: new Date().toISOString(),
      isRead: true,
    };

    setMessages((prev) => [...prev, optimistic]);
    setDraft('');
    setSending(true);

    try {
      const msg = await api.sendMessage(activeId, content);
      setMessages((prev) => prev.map((m) => (m.id === tempId ? msg : m)));
      lastMessageAtRef.current = msg.createdAt;
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === activeId);
        if (idx === -1) return prev;
        const updated = [...prev];
        const conv = { ...updated[idx], lastMessage: msg, updatedAt: msg.createdAt };
        updated.splice(idx, 1);
        updated.unshift(conv);
        return updated;
      });
      flashSent();
    } catch (err: unknown) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setDraft(content);
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      addToast(msg ?? "Impossible d'envoyer le message", 'error');
    } finally {
      setSending(false);
    }
  };

  const sendButtonLabel = sending
    ? 'Envoi…'
    : sendFeedback === 'sent'
      ? 'Envoyé'
      : 'Envoyer';

  const selectConversation = (id: string) => {
    setActiveId(id);
    setMobileShowThread(true);
  };

  const activeConv = conversations.find((c) => c.id === activeId);
  const jobLinkedConv = jobIdParam && !conversations.some(
    (c) => c.jobId === jobIdParam && (!taskerIdParam || c.providerId === taskerIdParam),
  );

  return (
    <div className="leather" style={{ minHeight: '100vh' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        <h1 className="serif cream-hi" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 900, marginBottom: 24 }}>
          Messages
        </h1>

        {jobLinkedConv && (
          <div className="body-f muted" style={{ padding: '12px 16px', marginBottom: 16, borderRadius: 8, background: 'rgba(184,123,68,0.12)', fontSize: 14 }}>
            Aucun fil pour cette tâche. Postulez ou attendez une candidature pour démarrer la conversation.
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <Loader2 className="w-8 h-8" style={{ color: gold, animation: 'spin 0.9s linear infinite' }} />
          </div>
        ) : (
          <div
            className={`stitch-box messages-layout${mobileShowThread ? ' thread-open' : ''}`}
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(240px, 320px) 1fr',
              minHeight: 480,
              background: 'rgba(21,35,50,0.7)',
              overflow: 'hidden',
            }}
          >
            <div
              className="messages-list-pane"
              style={{
                borderRight: '1px solid rgba(217,179,140,0.12)',
                overflowY: 'auto',
              }}
            >
              <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(217,179,140,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Search className="w-4 h-4" style={{ color: gold, flexShrink: 0 }} />
                  <input
                    className="q-field"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher dans les messages…"
                    style={{ flex: 1, fontSize: 13 }}
                  />
                  {searching && <Loader2 className="w-4 h-4" style={{ color: gold, animation: 'spin 0.9s linear infinite' }} />}
                </div>
              </div>

              {searchQuery.trim().length >= 2 && (
                <div style={{ padding: '8px 14px 12px', borderBottom: '1px solid rgba(217,179,140,0.08)' }}>
                  {searchResults.length === 0 && !searching ? (
                    <p className="body-f muted2" style={{ fontSize: 12 }}>Aucun résultat.</p>
                  ) : (
                    searchResults.map((r) => (
                      <button
                        key={`${r.conversationId}-${r.message.id}`}
                        type="button"
                        onClick={() => selectConversation(r.conversationId)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '8px 0',
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          borderBottom: '1px solid rgba(217,179,140,0.06)',
                        }}
                      >
                        <p className="body-f cream-hi" style={{ fontSize: 13, fontWeight: 600 }}>{r.otherPartyName}</p>
                        {r.jobTitle && <p className="body-f muted2" style={{ fontSize: 11 }}>{r.jobTitle}</p>}
                        <p className="body-f muted" style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {messagePreview(r.message)}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              )}

              {conversations.length === 0 ? (
                <p className="body-f muted" style={{ padding: 24, fontSize: 14 }}>
                  Aucune conversation. Publiez ou acceptez une tâche pour démarrer un fil.
                </p>
              ) : (
                conversations.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectConversation(c.id)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '14px 16px',
                      border: 'none',
                      cursor: 'pointer',
                      background: activeId === c.id ? 'rgba(184,123,68,0.15)' : 'transparent',
                      borderBottom: '1px solid rgba(217,179,140,0.08)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <p className="body-f cream-hi" style={{ fontWeight: 600, fontSize: 14 }}>{c.clientName}</p>
                      {c.unreadCount > 0 && (
                        <span style={{ background: gold, color: '#1F2F3F', borderRadius: 999, fontSize: 10, fontWeight: 800, padding: '2px 7px' }}>
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                    {c.jobTitle && (
                      <p className="body-f muted2" style={{ fontSize: 11, marginTop: 2 }}>
                        {c.jobTitle}
                        {c.status === 'inquiry' && ' · Question'}
                        {c.status === 'application' && ' · Candidature'}
                        {c.status === 'archived' && ' · Archivé'}
                      </p>
                    )}
                    <p className="body-f muted2" style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                      {messagePreview(c.lastMessage)}
                    </p>
                  </button>
                ))
              )}
            </div>

            <div
              className="messages-thread-pane"
              style={{ display: 'flex', flexDirection: 'column' }}
            >
              {activeConv ? (
                <>
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(217,179,140,0.12)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                      type="button"
                      className="messages-back-btn"
                      onClick={() => setMobileShowThread(false)}
                      style={{ display: 'none', background: 'transparent', border: 'none', color: gold, cursor: 'pointer', padding: 4 }}
                      aria-label="Retour aux conversations"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                      <p className="serif cream-hi" style={{ fontWeight: 700 }}>{activeConv.clientName}</p>
                      {activeConv.jobTitle && (
                        <p className="body-f muted2" style={{ fontSize: 13, marginTop: 2 }}>{activeConv.jobTitle}</p>
                      )}
                    </div>
                  </div>

                  {jobContext && <JobChatHeader job={jobContext} />}

                  {(conversationStatus === 'application' || conversationStatus === 'inquiry') && (
                    <p
                      className="body-f muted2"
                      style={{
                        margin: '0 18px 8px',
                        fontSize: 12,
                        padding: '10px 12px',
                        borderRadius: 8,
                        background: 'rgba(107,163,196,0.12)',
                        border: '1px solid rgba(107,163,196,0.25)',
                      }}
                    >
                      {conversationStatus === 'inquiry'
                        ? 'Mode questions — gratuit, sans postuler. Pas de téléphone, courriel ou lien tant que le travailleur n\'est pas choisi.'
                        : 'Mode candidature — pas de téléphone, courriel ou lien tant que le travailleur n\'est pas choisi.'}
                    </p>
                  )}

                  <div style={{ flex: 1, overflowY: 'auto', padding: '8px 18px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {messages.map((m) => {
                      if (m.type === 'system') {
                        return (
                          <div key={m.id} style={{ alignSelf: 'center', maxWidth: '90%', textAlign: 'center' }}>
                            <p
                              className="body-f muted2"
                              style={{
                                fontSize: 12,
                                fontStyle: 'italic',
                                padding: '8px 12px',
                                borderRadius: 8,
                                background: 'rgba(217,179,140,0.08)',
                                border: '1px dashed rgba(217,179,140,0.2)',
                              }}
                            >
                              {m.content}
                            </p>
                          </div>
                        );
                      }

                      const mine = m.senderId === user?.id;
                      const isImage = m.type === 'image' && m.attachmentUrl;
                      return (
                        <div key={m.id} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: isImage ? '65%' : '75%' }}>
                          <div
                            style={{
                              padding: isImage ? 6 : '10px 14px',
                              borderRadius: 12,
                              background: mine ? 'rgba(184,123,68,0.25)' : 'rgba(15,25,36,0.6)',
                              border: `1px solid ${mine ? 'rgba(184,123,68,0.4)' : 'rgba(217,179,140,0.15)'}`,
                              opacity: m.id.startsWith('temp-') ? 0.7 : 1,
                              overflow: 'hidden',
                            }}
                          >
                            {isImage ? (
                              <>
                                <a href={m.attachmentUrl} target="_blank" rel="noopener noreferrer">
                                  <img
                                    src={m.attachmentUrl}
                                    alt="Photo envoyée"
                                    style={{ display: 'block', maxWidth: '100%', borderRadius: 8 }}
                                  />
                                </a>
                                {m.content && m.content !== '📷 Photo' && (
                                  <p className="body-f cream-hi" style={{ fontSize: 14, padding: '8px 8px 4px' }}>{m.content}</p>
                                )}
                              </>
                            ) : (
                              <p className="body-f cream-hi" style={{ fontSize: 14 }}>{m.content}</p>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                            <p className="body-f muted2" style={{ fontSize: 11, margin: 0, textAlign: mine ? 'right' : 'left' }}>
                              {new Date(m.createdAt).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}
                              {mine && m.id.startsWith('temp-') && (
                                <span style={{ marginLeft: 6, color: '#D9A441' }}>· Envoi…</span>
                              )}
                              {mine && !m.id.startsWith('temp-') && m.id === lastOwnMessageId && m.isRead && (
                                <span style={{ marginLeft: 6, color: gold }}>· Vu</span>
                              )}
                            </p>
                            {!mine && !m.id.startsWith('temp-') && (
                              <div style={{ position: 'relative' }}>
                                <button
                                  type="button"
                                  disabled={reportingId === m.id}
                                  onClick={() => {
                                    const reason = window.prompt(
                                      `Signaler ce message?\n\n${REPORT_REASONS.map((r) => `${r.id}: ${r.label}`).join('\n')}\n\nEntrez le motif (ex: spam):`,
                                      'spam',
                                    );
                                    if (reason && REPORT_REASONS.some((r) => r.id === reason.trim())) {
                                      handleReport(m.id, reason.trim());
                                    } else if (reason) {
                                      addToast('Motif invalide', 'error');
                                    }
                                  }}
                                  aria-label="Signaler"
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'rgba(217,179,140,0.5)',
                                    cursor: 'pointer',
                                    padding: 2,
                                  }}
                                >
                                  <Flag className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {typingUserId && (
                      <p className="body-f muted2" style={{ fontSize: 12, fontStyle: 'italic', padding: '4px 0' }}>
                        En train d&apos;écrire…
                      </p>
                    )}
                    <div ref={bottomRef} />
                  </div>

                  {canSend ? (
                    <div
                      className="messages-composer"
                      style={{
                        borderTop: '1px solid rgba(217,179,140,0.12)',
                        background: 'rgba(15,25,36,0.85)',
                        flexShrink: 0,
                      }}
                    >
                      {quickReplies.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '10px 14px 0' }}>
                          {quickReplies.map((text) => (
                            <button
                              key={text}
                              type="button"
                              onClick={() => handleQuickReply(text)}
                              className="body-f"
                              style={{
                                fontSize: 12,
                                padding: '6px 10px',
                                borderRadius: 999,
                                border: '1px solid rgba(217,179,140,0.25)',
                                background: 'rgba(15,25,36,0.5)',
                                color: 'rgba(217,179,140,0.9)',
                                cursor: 'pointer',
                              }}
                            >
                              {text}
                            </button>
                          ))}
                        </div>
                      )}
                      <form onSubmit={handleSend} style={{ padding: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={handleImagePick}
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading || sending}
                          aria-label="Envoyer une photo"
                          style={{
                            background: 'transparent',
                            border: '1px solid rgba(217,179,140,0.25)',
                            borderRadius: 8,
                            padding: '10px 12px',
                            color: gold,
                            cursor: uploading ? 'wait' : 'pointer',
                            opacity: uploading ? 0.6 : 1,
                          }}
                        >
                          {uploading ? <Loader2 className="w-4 h-4" style={{ animation: 'spin 0.9s linear infinite' }} /> : <ImagePlus className="w-4 h-4" />}
                        </button>
                        <input
                          className="q-field"
                          value={draft}
                          onChange={(e) => handleDraftChange(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              if (draft.trim() && !sending && !uploading) {
                                handleSend(e as unknown as React.FormEvent);
                              }
                            }
                          }}
                          enterKeyHint="send"
                          placeholder={
                            conversationStatus === 'inquiry'
                              ? 'Posez votre question au client…'
                              : conversationStatus === 'application'
                                ? 'Message pour votre candidature…'
                                : 'Écrire un message…'
                          }
                          aria-label="Message"
                          style={{ flex: 1 }}
                        />
                        <button
                          type="submit"
                          disabled={sending || uploading || sendFeedback === 'sent' || !draft.trim()}
                          className={sendFeedback === 'sent' ? 'messages-send-btn sent' : 'gold-btn messages-send-btn'}
                          aria-label="Envoyer le message"
                          style={{
                            padding: '10px 18px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            flexShrink: 0,
                            minWidth: 108,
                            fontSize: 14,
                            fontWeight: 700,
                          }}
                        >
                          {sending ? (
                            <Loader2 className="w-4 h-4" style={{ animation: 'spin 0.9s linear infinite' }} />
                          ) : sendFeedback === 'sent' ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                          <span>{sendButtonLabel}</span>
                        </button>
                      </form>
                      <p className="body-f muted2" style={{ fontSize: 11, margin: '0 14px 10px', textAlign: 'right' }}>
                        {sending ? 'Envoi en cours…' : sendFeedback === 'sent' ? 'Message envoyé ✓' : 'Tapez votre message puis appuyez sur Envoyer'}
                      </p>
                    </div>
                  ) : (
                    <p className="body-f muted2" style={{ padding: 14, fontSize: 13, borderTop: '1px solid rgba(217,179,140,0.12)', margin: 0 }}>
                      Conversation en lecture seule.
                    </p>
                  )}
                </>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageSquare className="w-12 h-12" style={{ color: 'rgba(217,179,140,0.25)' }} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .messages-thread-pane {
          min-height: 0;
        }
        .messages-composer {
          position: sticky;
          bottom: 0;
          z-index: 2;
        }
        .messages-send-btn.sent {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px 18px;
          min-width: 108px;
          border-radius: 8px;
          border: 2px solid #7FB069;
          background: linear-gradient(180deg, #8BC47A, #6FA85E);
          color: #1F2F3F;
          font-weight: 700;
          cursor: default;
          box-shadow: 0 0 0 2px rgba(127,176,105,0.35);
        }
        @media (max-width: 768px) {
          .messages-layout {
            grid-template-columns: 1fr !important;
            min-height: 70vh !important;
          }
          .messages-back-btn { display: inline-flex !important; }
          .messages-list-pane { display: block !important; }
          .messages-thread-pane { display: none !important; }
          .messages-layout.thread-open .messages-list-pane { display: none !important; }
          .messages-layout.thread-open .messages-thread-pane { display: flex !important; }
          .messages-send-btn { min-width: 96px !important; padding: 10px 14px !important; }
        }
      `}</style>
    </div>
  );
}
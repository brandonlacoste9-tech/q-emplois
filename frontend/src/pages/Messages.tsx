import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import type { Conversation, Message } from '../types';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { gold } from '../styles/design-tokens';

export function Messages() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();
  const jobIdParam = searchParams.get('jobId');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getConversations()
      .then((data) => {
        setConversations(data);
        if (jobIdParam) {
          const match = data.find((c) => c.jobId === jobIdParam);
          if (match) setActiveId(match.id);
          else if (data.length > 0) setActiveId(data[0].id);
        } else if (data.length > 0) {
          setActiveId(data[0].id);
        }
      })
      .catch(() => addToast('Erreur de chargement des conversations', 'error'))
      .finally(() => setLoading(false));
  }, [addToast, jobIdParam]);

  useEffect(() => {
    if (!activeId) return;
    api.getMessages(activeId)
      .then((msgs) => {
        setMessages(msgs.map((m: { id: string; conversationId: string; senderId: string; content: string; createdAt: string; isRead: boolean }) => ({
          id: m.id,
          conversationId: m.conversationId,
          senderId: m.senderId,
          senderName: '',
          content: m.content,
          createdAt: m.createdAt,
          isRead: m.isRead,
        })));
        api.markAsRead(activeId).catch(() => undefined);
      })
      .catch(() => addToast('Erreur de chargement des messages', 'error'));
  }, [activeId, addToast]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeId || !draft.trim()) return;
    setSending(true);
    try {
      const msg = await api.sendMessage(activeId, draft.trim());
      setMessages((prev) => [...prev, {
        id: msg.id,
        conversationId: msg.conversationId,
        senderId: msg.senderId,
        senderName: '',
        content: msg.content,
        createdAt: msg.createdAt,
        isRead: msg.isRead,
      }]);
      setDraft('');
    } catch {
      addToast("Impossible d'envoyer le message", 'error');
    } finally {
      setSending(false);
    }
  };

  const activeConv = conversations.find((c) => c.id === activeId);
  const jobLinkedConv = jobIdParam && !conversations.some((c) => c.jobId === jobIdParam);

  return (
    <div className="leather" style={{ minHeight: '100vh' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        <h1 className="serif cream-hi" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 900, marginBottom: 24 }}>
          Messages
        </h1>

        {jobLinkedConv && (
          <div className="body-f muted" style={{ padding: '12px 16px', marginBottom: 16, borderRadius: 8, background: 'rgba(184,123,68,0.12)', fontSize: 14 }}>
            Aucun fil de discussion pour cette tâche pour le moment. Un chat s'ouvrira automatiquement quand un travailleur accepte la job.
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <Loader2 className="w-8 h-8" style={{ color: gold, animation: 'spin 0.9s linear infinite' }} />
          </div>
        ) : (
          <div className="stitch-box" style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 320px) 1fr', minHeight: 480, background: 'rgba(21,35,50,0.7)', overflow: 'hidden' }}>
            <div style={{ borderRight: '1px solid rgba(217,179,140,0.12)', overflowY: 'auto' }}>
              {conversations.length === 0 ? (
                <p className="body-f muted" style={{ padding: 24, fontSize: 14 }}>
                  Aucune conversation. Acceptez ou publiez une tâche pour démarrer un fil.
                </p>
              ) : (
                conversations.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setActiveId(c.id)}
                    style={{
                      width: '100%', textAlign: 'left', padding: '14px 16px', border: 'none', cursor: 'pointer',
                      background: activeId === c.id ? 'rgba(184,123,68,0.15)' : 'transparent',
                      borderBottom: '1px solid rgba(217,179,140,0.08)',
                    }}
                  >
                    <p className="body-f cream-hi" style={{ fontWeight: 600, fontSize: 14 }}>{c.clientName}</p>
                    {c.jobTitle && (
                      <p className="body-f muted2" style={{ fontSize: 11, marginTop: 2 }}>{c.jobTitle}</p>
                    )}
                    <p className="body-f muted2" style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                      {c.lastMessage?.content ?? 'Nouvelle conversation'}
                    </p>
                  </button>
                ))
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {activeConv ? (
                <>
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(217,179,140,0.12)' }}>
                    <p className="serif cream-hi" style={{ fontWeight: 700 }}>{activeConv.clientName}</p>
                    {activeConv.jobTitle && (
                      <p className="body-f muted2" style={{ fontSize: 13, marginTop: 2 }}>{activeConv.jobTitle}</p>
                    )}
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {messages.map((m) => {
                      const mine = m.senderId === user?.id;
                      return (
                        <div key={m.id} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                          <div style={{
                            padding: '10px 14px', borderRadius: 12,
                            background: mine ? 'rgba(184,123,68,0.25)' : 'rgba(15,25,36,0.6)',
                            border: `1px solid ${mine ? 'rgba(184,123,68,0.4)' : 'rgba(217,179,140,0.15)'}`,
                          }}>
                            <p className="body-f cream-hi" style={{ fontSize: 14 }}>{m.content}</p>
                          </div>
                          <p className="body-f muted2" style={{ fontSize: 11, marginTop: 4, textAlign: mine ? 'right' : 'left' }}>
                            {new Date(m.createdAt).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      );
                    })}
                    <div ref={bottomRef} />
                  </div>
                  <form onSubmit={handleSend} style={{ padding: 14, borderTop: '1px solid rgba(217,179,140,0.12)', display: 'flex', gap: 10 }}>
                    <input
                      className="q-field"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="Écrire un message…"
                      style={{ flex: 1 }}
                    />
                    <button type="submit" disabled={sending} className="gold-btn" style={{ padding: '10px 16px' }}>
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
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
    </div>
  );
}

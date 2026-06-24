import React, { useState, useEffect, useRef } from 'react';

const CATEGORIES = ['GENERAL', 'SHOW', 'SONG', 'VENUE', 'FEEDBACK'];

const categoryColor = (cat) => ({
  GENERAL: 'var(--cyan)',
  SHOW: 'var(--orange)',
  SONG: 'var(--green)',
  VENUE: 'rgba(180,120,255,0.9)',
  FEEDBACK: 'rgba(255,220,0,0.85)',
}[cat] || 'var(--cyan)');

const timeAgo = (iso) => {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const displayName = (post) => post.author_label || post.username;
const displayColor = (post, fallback) => post.author_label ? 'var(--orange)' : fallback;

// How many chars before we truncate body text
const BODY_TRUNCATE = 220;

function FeedAvatar({ initials, color = 'var(--cyan)', size = 34 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `1px solid ${color}55`,
      background: `${color}11`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)', fontSize: size * 0.28,
      color, flexShrink: 0, letterSpacing: '1px',
    }}>
      {(initials || '?').slice(0, 2).toUpperCase()}
    </div>
  );
}

function ReplyRow({ reply }) {
  const [upped, setUpped] = useState(reply.user_reacted);
  const [upCount, setUpCount] = useState(reply.up_count || 0);
  return (
    <div style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <FeedAvatar initials={reply.username} size={28} color="rgba(var(--green-rgb),0.7)" />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--green)' }}>{reply.username}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.66rem', color: 'rgba(255,255,255,0.25)' }}>{timeAgo(reply.created_at)}</span>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.65 }}>{reply.body}</div>
        <button onClick={() => { setUpped(u => !u); setUpCount(c => upped ? c - 1 : c + 1); }}
          style={{ marginTop: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-display)', fontSize: '0.56rem', letterSpacing: '1.5px', color: upped ? 'var(--green)' : 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', gap: 4 }}>
          ▲ {upCount}
        </button>
      </div>
    </div>
  );
}

function PostCard({ post, api, currentUser }) {
  const [expanded, setExpanded] = useState(false);
  const [bodyExpanded, setBodyExpanded] = useState(false);
  const [replies, setReplies] = useState(post.replies || []);
  const [replyCount, setReplyCount] = useState(post.reply_count || 0);
  const [upped, setUpped] = useState(post.user_reacted);
  const [upCount, setUpCount] = useState(post.up_count || 0);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const color = categoryColor(post.category);
  const name = displayName(post);
  const nameColor = displayColor(post, '#ffffff');

  const body = post.body || '';
  const isTruncatable = body.length > BODY_TRUNCATE;
  const displayBody = isTruncatable && !bodyExpanded
    ? body.slice(0, BODY_TRUNCATE).trimEnd() + '…'
    : body;

  const loadReplies = async () => {
    if (replies.length || loadingReplies) return;
    setLoadingReplies(true);
    try {
      const data = await api.get(`/community/posts/${post.id}/replies`);
      setReplies(data.replies || []);
    } catch (e) {} finally { setLoadingReplies(false); }
  };

  const handleExpand = () => { if (!expanded) loadReplies(); setExpanded(e => !e); };
  const handleReact = async () => {
    setUpped(u => !u); setUpCount(c => upped ? c - 1 : c + 1);
    try { await api.post(`/community/posts/${post.id}/react`, {}); } catch (e) {}
  };
  const handleReply = async () => {
    if (!replyText.trim() || replySubmitting) return;
    setReplySubmitting(true);
    try {
      const data = await api.post(`/community/posts/${post.id}/replies`, { body: replyText.trim() });
      setReplies(r => [...r, data.reply]); setReplyCount(c => c + 1);
      setReplyText(''); setShowReplyBox(false); setExpanded(true);
    } catch (e) {} finally { setReplySubmitting(false); }
  };

  return (
    <div style={{
      border: '1px solid rgba(255,255,255,0.06)',
      borderLeft: post.pinned ? '3px solid var(--orange)' : `3px solid ${color}`,
      background: post.pinned ? 'rgba(var(--orange-rgb),0.03)' : 'var(--bg-panel)',
      marginBottom: 10,
    }}>
      <div style={{ padding: '12px 14px 0' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <FeedAvatar initials={name} size={36} color={post.author_label ? 'var(--orange)' : color} />
          <div style={{ flex: 1, minWidth: 0 }}>
            {post.pinned && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.56rem', letterSpacing: '2px', color: 'var(--orange)', border: '1px solid rgba(var(--orange-rgb),0.4)', padding: '2px 8px', background: 'rgba(var(--orange-rgb),0.08)' }}>❄ PINNED · UNCLE EBENEZER</span>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.84rem', color: nameColor, fontWeight: post.author_label ? 700 : 400 }}>{name}</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.56rem', letterSpacing: '2px', padding: '2px 6px', border: `1px solid ${color}44`, color }}>{post.category}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.66rem', color: 'rgba(255,255,255,0.25)', marginLeft: 'auto' }}>{timeAgo(post.created_at)}</span>
            </div>

            {/* Body with truncation */}
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, marginBottom: isTruncatable ? 4 : 12 }}>
              {displayBody}
            </div>
            {isTruncatable && (
              <button onClick={() => setBodyExpanded(b => !b)} style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 10px',
                fontFamily: 'var(--font-display)', fontSize: '0.56rem', letterSpacing: '1.5px',
                color: color, opacity: 0.75,
              }}>
                {bodyExpanded ? '▲ SHOW LESS' : '▼ READ MORE'}
              </button>
            )}
          </div>
        </div>

        {/* Action row */}
        <div style={{ display: 'flex', gap: 16, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.05)', marginLeft: 46 }}>
          <button onClick={handleReact} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', fontFamily: 'var(--font-display)', fontSize: '0.56rem', letterSpacing: '1.5px', color: upped ? color : 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: 5 }}>▲ {upCount}</button>
          <button onClick={handleExpand} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', fontFamily: 'var(--font-display)', fontSize: '0.56rem', letterSpacing: '1.5px', color: expanded ? color : 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: 5 }}>◈ {replyCount} {replyCount === 1 ? 'REPLY' : 'REPLIES'}</button>
          <button onClick={() => { setShowReplyBox(r => !r); if (!expanded) { setExpanded(true); loadReplies(); } }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', fontFamily: 'var(--font-display)', fontSize: '0.56rem', letterSpacing: '1.5px', color: showReplyBox ? color : 'rgba(255,255,255,0.35)' }}>+ REPLY</button>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '0 14px 0 60px' }}>
          {loadingReplies && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', padding: '10px 0' }}>loading...</div>}
          {replies.map(r => <ReplyRow key={r.id} reply={r} />)}
          {showReplyBox && currentUser && (
            <div style={{ padding: '12px 0' }}>
              <textarea value={replyText} onChange={e => setReplyText(e.target.value.slice(0, 500))} placeholder="add a reply..." rows={2} autoFocus
                style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: `1px solid ${color}44`, color: 'var(--white)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', padding: '8px 10px', resize: 'none', outline: 'none', boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <button onClick={handleReply} disabled={!replyText.trim() || replySubmitting}
                  style={{ background: `${color}11`, border: `1px solid ${color}44`, color, fontFamily: 'var(--font-display)', fontSize: '0.56rem', letterSpacing: '2px', padding: '6px 14px', cursor: 'pointer', opacity: (!replyText.trim() || replySubmitting) ? 0.4 : 1 }}>{replySubmitting ? '...' : 'POST'}</button>
                <button onClick={() => setShowReplyBox(false)} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-display)', fontSize: '0.56rem', letterSpacing: '2px', padding: '6px 12px', cursor: 'pointer' }}>CANCEL</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Compact composer — single line prompt, expands on tap
function NewPostBox({ api, onPosted, currentUser }) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [submitting, setSubmitting] = useState(false);
  const color = categoryColor(category);

  const handleSubmit = async () => {
    if (!body.trim() || submitting) return;
    setSubmitting(true);
    try {
      const data = await api.post('/community/posts', { body: body.trim(), category });
      onPosted && onPosted(data.post);
      setBody(''); setCategory('GENERAL'); setOpen(false);
    } catch (e) {} finally { setSubmitting(false); }
  };

  if (!currentUser) return null;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', marginBottom: 12,
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
          borderLeft: '3px solid rgba(var(--cyan-rgb),0.3)',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          border: '1px solid rgba(var(--cyan-rgb),0.3)',
          background: 'rgba(var(--cyan-rgb),0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontSize: '0.6rem',
          color: 'var(--cyan)', flexShrink: 0,
        }}>
          {currentUser.username?.slice(0, 2).toUpperCase()}
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
          what's on your mind, phan?
        </span>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-display)', fontSize: '0.56rem', color: 'rgba(var(--cyan-rgb),0.35)', letterSpacing: '1.5px', flexShrink: 0 }}>+ POST</span>
      </button>
    );
  }

  return (
    <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderLeft: `3px solid ${color}`, padding: '12px 14px', marginBottom: 12 }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)}
            style={{ fontFamily: 'var(--font-display)', fontSize: '0.56rem', letterSpacing: '1.5px', padding: '3px 8px', border: `1px solid ${c === category ? categoryColor(c) + '88' : 'rgba(255,255,255,0.1)'}`, color: c === category ? categoryColor(c) : 'rgba(255,255,255,0.3)', background: c === category ? `${categoryColor(c)}0d` : 'transparent', cursor: 'pointer' }}>{c}</button>
        ))}
      </div>
      <textarea value={body} onChange={e => setBody(e.target.value.slice(0, 1000))} placeholder="what's on your mind, phan?" rows={3} autoFocus
        style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: `1px solid ${color}33`, color: 'var(--white)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', padding: '10px 12px', resize: 'none', outline: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
      <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.66rem', color: 'var(--text-muted)' }}>{body.length}/1000</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { setOpen(false); setBody(''); }} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-display)', fontSize: '0.56rem', letterSpacing: '2px', padding: '6px 12px', cursor: 'pointer' }}>CANCEL</button>
          <button onClick={handleSubmit} disabled={!body.trim() || submitting}
            style={{ background: `${color}11`, border: `1px solid ${color}55`, color, fontFamily: 'var(--font-display)', fontSize: '0.56rem', letterSpacing: '2px', padding: '6px 18px', cursor: 'pointer', opacity: (!body.trim() || submitting) ? 0.4 : 1 }}>{submitting ? '...' : '◈ POST'}</button>
        </div>
      </div>
    </div>
  );
}

export function PhreezeFeed({ api, currentUser }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const loadPosts = async (pg = 1) => {
    setLoading(true);
    try {
      const data = await api.get(`/community/posts?page=${pg}&limit=20`);
      const incoming = data.posts || [];
      setPosts(prev => pg === 1 ? incoming : [...prev, ...incoming]);
      setHasMore(incoming.length === 20);
      setPage(pg);
    } catch (e) {} finally { setLoading(false); }
  };

  useEffect(() => { loadPosts(1); }, []);

  const handlePosted = (newPost) => { setPosts(prev => [newPost, ...prev]); };

  if (loading && !posts.length) return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)', padding: '24px 0', textAlign: 'center' }}>
      LOADING FEED...
    </div>
  );

  return (
    <div style={{ maxWidth: 720, paddingBottom: 80 }}>
      <NewPostBox api={api} onPosted={handlePosted} currentUser={currentUser} />
      {posts.length === 0 && !loading && (
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '2px', textAlign: 'center', padding: '32px 0' }}>
          NO POSTS YET — BE THE FIRST
        </div>
      )}
      {posts.map(post => (
        <PostCard key={post.id} post={post} api={api} currentUser={currentUser} />
      ))}
      {hasMore && (
        <button onClick={() => loadPosts(page + 1)} disabled={loading}
          style={{ width: '100%', padding: '12px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: '0.6rem', letterSpacing: '2px', cursor: 'pointer', marginTop: 8, opacity: loading ? 0.4 : 1 }}>
          {loading ? 'LOADING...' : 'LOAD MORE'}
        </button>
      )}
    </div>
  );
}

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
      <FeedAvatar initials={reply.username} size={28} color="rgba(51,255,51,0.7)" />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--green)' }}>{reply.username}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)' }}>{timeAgo(reply.created_at)}</span>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.65 }}>
          {reply.body}
        </div>
        <button
          onClick={() => { setUpped(u => !u); setUpCount(c => upped ? c - 1 : c + 1); }}
          style={{
            marginTop: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            fontFamily: 'var(--font-display)', fontSize: '0.34rem', letterSpacing: '1.5px',
            color: upped ? 'var(--green)' : 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
          ▲ {upCount}
        </button>
      </div>
    </div>
  );
}

function PostCard({ post, api, currentUser }) {
  const [expanded, setExpanded] = useState(false);
  const [replies, setReplies] = useState(post.replies || []);
  const [replyCount, setReplyCount] = useState(post.reply_count || 0);
  const [upped, setUpped] = useState(post.user_reacted);
  const [upCount, setUpCount] = useState(post.up_count || 0);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const color = categoryColor(post.category);

  const loadReplies = async () => {
    if (replies.length || loadingReplies) return;
    setLoadingReplies(true);
    try {
      const data = await api.get(`/community/posts/${post.id}/replies`);
      setReplies(data.replies || []);
    } catch (e) {}
    finally { setLoadingReplies(false); }
  };

  const handleExpand = () => {
    if (!expanded) loadReplies();
    setExpanded(e => !e);
  };

  const handleReact = async () => {
    setUpped(u => !u);
    setUpCount(c => upped ? c - 1 : c + 1);
    try { await api.post(`/community/posts/${post.id}/react`, {}); } catch (e) {}
  };

  const handleReply = async () => {
    if (!replyText.trim() || replySubmitting) return;
    setReplySubmitting(true);
    try {
      const data = await api.post(`/community/posts/${post.id}/replies`, { body: replyText.trim() });
      setReplies(r => [...r, data.reply]);
      setReplyCount(c => c + 1);
      setReplyText('');
      setShowReplyBox(false);
      setExpanded(true);
    } catch (e) {}
    finally { setReplySubmitting(false); }
  };

  return (
    <div style={{
      border: '1px solid rgba(255,255,255,0.06)',
      borderLeft: post.pinned ? '3px solid var(--orange)' : `3px solid ${color}`,
      background: post.pinned ? 'rgba(255,102,0,0.03)' : 'var(--bg-panel)',
      marginBottom: 10,
    }}>
      <div style={{ padding: '12px 14px 0' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <FeedAvatar initials={post.username} size={36} color={color} />
          <div style={{ flex: 1, minWidth: 0 }}>
            {post.pinned && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.38rem', letterSpacing: '2px', color: 'var(--orange)', border: '1px solid rgba(255,102,0,0.4)', padding: '2px 8px', background: 'rgba(255,102,0,0.08)' }}>❄ PINNED · UNCLE EBENEZER</span>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.84rem', color: '#ffffff' }}>{post.username}</span>
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: '0.3rem', letterSpacing: '2px',
                padding: '2px 6px', border: `1px solid ${color}44`, color,
              }}>{post.category}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', marginLeft: 'auto' }}>{timeAgo(post.created_at)}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, marginBottom: 12 }}>
              {post.body}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.05)', marginLeft: 46 }}>
          <button onClick={handleReact} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            fontFamily: 'var(--font-display)', fontSize: '0.36rem', letterSpacing: '1.5px',
            color: upped ? color : 'rgba(255,255,255,0.25)',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>▲ {upCount}</button>

          <button onClick={handleExpand} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            fontFamily: 'var(--font-display)', fontSize: '0.36rem', letterSpacing: '1.5px',
            color: expanded ? color : 'rgba(255,255,255,0.25)',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>◈ {replyCount} {replyCount === 1 ? 'REPLY' : 'REPLIES'}</button>

          <button onClick={() => { setShowReplyBox(r => !r); if (!expanded) { setExpanded(true); loadReplies(); } }} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            fontFamily: 'var(--font-display)', fontSize: '0.36rem', letterSpacing: '1.5px',
            color: showReplyBox ? color : 'rgba(255,255,255,0.25)',
          }}>+ REPLY</button>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '0 14px 0 60px' }}>
          {loadingReplies && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', padding: '10px 0' }}>loading...</div>
          )}
          {replies.map(r => <ReplyRow key={r.id} reply={r} />)}

          {showReplyBox && (
            <div style={{ padding: '12px 0' }}>
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value.slice(0, 500))}
                placeholder="add a reply..."
                rows={2}
                autoFocus
                style={{
                  width: '100%', background: 'rgba(0,0,0,0.5)',
                  border: `1px solid ${color}44`, color: 'var(--white)',
                  fontFamily: 'var(--font-mono)', fontSize: '0.78rem',
                  padding: '8px 10px', resize: 'none', outline: 'none', boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <button
                  onClick={handleReply}
                  disabled={!replyText.trim() || replySubmitting}
                  style={{
                    background: `${color}11`, border: `1px solid ${color}44`,
                    color, fontFamily: 'var(--font-display)', fontSize: '0.36rem',
                    letterSpacing: '2px', padding: '6px 14px', cursor: 'pointer',
                    opacity: (!replyText.trim() || replySubmitting) ? 0.4 : 1,
                  }}>{replySubmitting ? '...' : 'POST'}</button>
                <button onClick={() => setShowReplyBox(false)} style={{
                  background: 'none', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-display)',
                  fontSize: '0.36rem', letterSpacing: '2px', padding: '6px 14px', cursor: 'pointer',
                }}>CANCEL</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ComposeBox({ api, onPosted }) {
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const limit = 500;

  const handlePost = async () => {
    if (!body.trim() || submitting) return;
    setSubmitting(true);
    try {
      const data = await api.post('/community/posts', { body: body.trim(), category });
      onPosted(data.post);
      setBody('');
      setCategory('GENERAL');
      setOpen(false);
    } catch (e) {}
    finally { setSubmitting(false); }
  };

  if (!open) return (
    <button onClick={() => setOpen(true)} style={{
      width: '100%', padding: '12px 14px', textAlign: 'left', marginBottom: 14,
      background: 'var(--bg-panel)', border: '1px solid rgba(0,224,208,0.2)',
      color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-mono)',
      fontSize: '0.78rem', cursor: 'pointer',
    }}>
      + what's on your mind, phan?
    </button>
  );

  return (
    <div style={{ background: 'var(--bg-panel)', border: '1px solid rgba(0,224,208,0.35)', padding: 14, marginBottom: 14 }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)} style={{
            background: category === cat ? `${categoryColor(cat)}18` : 'transparent',
            border: `1px solid ${category === cat ? categoryColor(cat) : 'rgba(255,255,255,0.1)'}`,
            color: category === cat ? categoryColor(cat) : 'rgba(255,255,255,0.3)',
            fontFamily: 'var(--font-display)', fontSize: '0.34rem', letterSpacing: '1.5px',
            padding: '5px 10px', cursor: 'pointer',
          }}>{cat}</button>
        ))}
      </div>
      <textarea
        value={body}
        onChange={e => setBody(e.target.value.slice(0, limit))}
        placeholder="what's on your mind, phan?"
        rows={4}
        autoFocus
        style={{
          width: '100%', background: 'rgba(0,0,0,0.5)',
          border: '1px solid rgba(0,224,208,0.25)', color: 'var(--white)',
          fontFamily: 'var(--font-mono)', fontSize: '0.82rem',
          padding: '10px 12px', resize: 'none', outline: 'none', boxSizing: 'border-box', lineHeight: 1.7,
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.32rem', letterSpacing: '1px', color: body.length > 450 ? 'var(--orange)' : 'rgba(255,255,255,0.2)' }}>
          {body.length}/{limit}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { setOpen(false); setBody(''); setCategory('GENERAL'); }} style={{
            background: 'none', border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-display)',
            fontSize: '0.36rem', letterSpacing: '2px', padding: '7px 14px', cursor: 'pointer',
          }}>CANCEL</button>
          <button onClick={handlePost} disabled={!body.trim() || submitting} style={{
            background: body.trim() ? 'rgba(0,224,208,0.08)' : 'transparent',
            border: `1px solid ${body.trim() ? 'rgba(0,224,208,0.5)' : 'rgba(255,255,255,0.1)'}`,
            color: body.trim() ? 'var(--cyan)' : 'rgba(255,255,255,0.2)',
            fontFamily: 'var(--font-display)', fontSize: '0.36rem',
            letterSpacing: '2px', padding: '7px 18px', cursor: body.trim() ? 'pointer' : 'default',
            opacity: submitting ? 0.5 : 1,
          }}>{submitting ? '...' : 'POST'}</button>
        </div>
      </div>
    </div>
  );
}

export function PhreezeFeed({ api }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadPosts = async (pageNum = 1, cat = filter) => {
    if (pageNum === 1) setLoading(true); else setLoadingMore(true);
    try {
      const params = new URLSearchParams({ page: pageNum, limit: 20 });
      if (cat !== 'ALL') params.set('category', cat);
      const data = await api.get(`/community/posts?${params}`);
      if (pageNum === 1) setPosts(data.posts || []);
      else setPosts(p => [...p, ...(data.posts || [])]);
      setHasMore(data.has_more || false);
      setPage(pageNum);
    } catch (e) {}
    finally { setLoading(false); setLoadingMore(false); }
  };

  useEffect(() => { loadPosts(1, filter); }, [filter]);

  const handlePosted = (post) => setPosts(p => [post, ...p]);

  return (
    <div style={{ paddingBottom: 20 }}>
      <ComposeBox api={api} onPosted={handlePosted} />

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 0, overflowX: 'auto', marginBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {['ALL', ...CATEGORIES].map(cat => {
          const active = filter === cat;
          const col = cat === 'ALL' ? 'rgba(255,255,255,0.5)' : categoryColor(cat);
          return (
            <button key={cat} onClick={() => setFilter(cat)} style={{
              background: 'transparent', border: 'none',
              borderBottom: active ? `2px solid ${col}` : '2px solid transparent',
              color: active ? col : 'rgba(255,255,255,0.25)',
              fontFamily: 'var(--font-display)', fontSize: '0.38rem', letterSpacing: '2px',
              padding: '6px 12px 8px', cursor: 'pointer', whiteSpace: 'nowrap',
            }}>{cat}</button>
          );
        })}
      </div>

      {loading && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', padding: '20px 0' }}>loading feed...</div>
      )}

      {!loading && posts.length === 0 && (
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.44rem', color: 'var(--text-muted)', letterSpacing: '2px', textAlign: 'center', padding: '40px 0', border: '1px solid var(--border)' }}>
          NO POSTS YET<br/>
          <span style={{ color: 'rgba(0,224,208,0.35)', marginTop: 6, display: 'block' }}>BE THE FIRST TO POST</span>
        </div>
      )}

      {posts.map(post => <PostCard key={post.id} post={post} api={api} />)}

      {hasMore && (
        <button onClick={() => loadPosts(page + 1)} disabled={loadingMore} style={{
          width: '100%', padding: '10px', background: 'transparent',
          border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)',
          fontFamily: 'var(--font-display)', fontSize: '0.38rem', letterSpacing: '2px',
          cursor: 'pointer', marginTop: 8, opacity: loadingMore ? 0.5 : 1,
        }}>{loadingMore ? '...' : 'LOAD MORE'}</button>
      )}
    </div>
  );
}

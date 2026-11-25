'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { CurrentUser } from '@/lib/auth';
import type { CollaborationRequest, GitHubRepoStats, Project, ProjectComment } from '@/lib/types';

type Props = {
  initialProject: Project;
  initialComments: ProjectComment[];
  initialRequests?: CollaborationRequest[];
  githubStats?: GitHubRepoStats | null;
  currentUser: CurrentUser | null;
};

export default function ProjectDetailView({
  initialProject,
  initialComments,
  initialRequests = [],
  githubStats,
  currentUser,
}: Props) {
  const router = useRouter();
  const [project, setProject] = useState<Project>(initialProject);
  const [comments, setComments] = useState<ProjectComment[]>(initialComments);
  const [requests, setRequests] = useState<CollaborationRequest[]>(initialRequests);

  // Comment state
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Collab modal state
  const [showCollabModal, setShowCollabModal] = useState(false);
  const [collabRole, setCollabRole] = useState('');
  const [collabMsg, setCollabMsg] = useState('');
  const [collabSent, setCollabSent] = useState(false);
  const [collabSubmitting, setCollabSubmitting] = useState(false);

  // Edit project state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(project.title);
  const [editShortDesc, setEditShortDesc] = useState(project.shortDescription);
  const [editDesc, setEditDesc] = useState(project.description);
  const [editTech, setEditTech] = useState(project.techStack.join(', '));
  const [editGithub, setEditGithub] = useState(project.githubUrl || '');
  const [editDemo, setEditDemo] = useState(project.demoUrl || '');
  const [editCollab, setEditCollab] = useState(project.lookingForCollaborators);
  const [editRoles, setEditRoles] = useState(project.rolesNeeded.join(', '));
  const [updating, setUpdating] = useState(false);

  const isOwner = currentUser?.id === project.ownerId;
  const isOrganizer = currentUser?.role === 'organizer';
  const canEdit = isOwner || isOrganizer;

  async function handleToggleLike() {
    if (!currentUser) return;
    const nextLiked = !project.hasLiked;
    setProject((prev) => ({
      ...prev,
      hasLiked: nextLiked,
      likesCount: prev.likesCount + (nextLiked ? 1 : -1),
    }));

    try {
      await fetch(`/api/projects/${project.id}/like`, { method: 'POST' });
    } catch (err) {
      console.error('Like failed:', err);
    }
  }

  async function handleToggleBookmark() {
    if (!currentUser) return;
    setProject((prev) => ({ ...prev, hasBookmarked: !prev.hasBookmarked }));

    try {
      await fetch(`/api/projects/${project.id}/bookmark`, { method: 'POST' });
    } catch (err) {
      console.error('Bookmark failed:', err);
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      const response = await fetch(`/api/projects/${project.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to comment');

      const commentObj: ProjectComment = {
        id: data.commentId || `comm-${Date.now()}`,
        projectId: project.id,
        userId: currentUser?.id || 'me',
        userName: currentUser?.name || 'You',
        userEmail: currentUser?.email || '',
        content: newComment.trim(),
        createdAt: new Date().toISOString(),
        canDelete: true,
      };

      setComments((prev) => [...prev, commentObj]);
      setNewComment('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error adding comment');
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm('Delete this comment?')) return;
    setComments((prev) => prev.filter((c) => c.id !== commentId));

    try {
      await fetch(`/api/projects/${project.id}/comments?commentId=${commentId}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Delete comment failed:', err);
    }
  }

  async function handleSendCollabRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!collabMsg.trim() || collabSubmitting) return;

    setCollabSubmitting(true);
    try {
      const response = await fetch(`/api/projects/${project.id}/collaborate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: collabMsg.trim(), roleInterested: collabRole.trim() }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send request');

      setCollabSent(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error sending collaboration request');
    } finally {
      setCollabSubmitting(false);
    }
  }

  async function handleUpdateCollabStatus(requestId: string, status: 'accepted' | 'declined') {
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status } : r)),
    );

    try {
      await fetch(`/api/projects/${project.id}/collaborate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status }),
      });
    } catch (err) {
      console.error('Update request status failed:', err);
    }
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTitle.trim() || updating) return;

    setUpdating(true);
    const techStack = editTech.split(',').map((t) => t.trim()).filter(Boolean);
    const rolesNeeded = editRoles.split(',').map((r) => r.trim()).filter(Boolean);

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          shortDescription: editShortDesc.trim(),
          description: editDesc.trim(),
          techStack,
          githubUrl: editGithub.trim() || null,
          demoUrl: editDemo.trim() || null,
          lookingForCollaborators: editCollab,
          rolesNeeded,
        }),
      });

      if (!response.ok) throw new Error('Failed to update project');

      setProject((prev) => ({
        ...prev,
        title: editTitle.trim(),
        shortDescription: editShortDesc.trim(),
        description: editDesc.trim(),
        techStack,
        githubUrl: editGithub.trim() || null,
        demoUrl: editDemo.trim() || null,
        lookingForCollaborators: editCollab,
        rolesNeeded,
      }));
      setIsEditing(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error saving updates');
    } finally {
      setUpdating(false);
    }
  }

  async function handleDeleteProject() {
    if (!confirm('Are you sure you want to permanently delete this project?')) return;
    try {
      const response = await fetch(`/api/projects/${project.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete project');
      router.push('/projects');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error deleting project');
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Back Link */}
      <div>
        <Link href="/projects" className="back-link">
          ← All projects
        </Link>
      </div>

      {/* Main Project Hero Card */}
      <article className="card" style={{ padding: 'clamp(20px, 5vw, 32px)', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <span className="eyebrow" style={{ color: 'var(--accent)', fontWeight: 700 }}>
              Student Project Showcase
            </span>
            <h1 style={{ margin: '4px 0 6px', fontSize: 'clamp(24px, 4.5vw, 34px)', fontWeight: 800 }}>
              {project.title}
            </h1>
            <p style={{ margin: 0, opacity: 0.8, fontSize: 14 }}>
              Created by <strong>{project.ownerName}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              type="button"
              onClick={handleToggleLike}
              className={`btn ${project.hasLiked ? 'btn--primary' : 'btn--ghost'}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              ♥ {project.likesCount}
            </button>
            <button
              type="button"
              onClick={handleToggleBookmark}
              className={`btn ${project.hasBookmarked ? 'btn--primary' : 'btn--ghost'}`}
              title="Bookmark project"
            >
              {project.hasBookmarked ? '🔖 Saved' : '🏷️ Bookmark'}
            </button>

            {canEdit && (
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => setIsEditing((v) => !v)}
                  className="btn btn--outline"
                  style={{ fontSize: 13 }}
                >
                  {isEditing ? 'Cancel Edit' : 'Edit Project'}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteProject}
                  className="btn btn--ghost"
                  style={{ color: '#dc2626', fontSize: 13 }}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Edit Form */}
        {isEditing && (
          <form onSubmit={handleSaveEdit} className="card" style={{ padding: 18, background: '#f9fafb', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>Edit Project Details</h3>
            <input className="input" placeholder="Title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
            <input className="input" placeholder="Short description" value={editShortDesc} onChange={(e) => setEditShortDesc(e.target.value)} required />
            <textarea className="textarea" rows={4} placeholder="Full description" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} required />
            <input className="input" placeholder="Tech stack (comma separated)" value={editTech} onChange={(e) => setEditTech(e.target.value)} />
            <input className="input" placeholder="GitHub URL" value={editGithub} onChange={(e) => setEditGithub(e.target.value)} />
            <input className="input" placeholder="Demo URL" value={editDemo} onChange={(e) => setEditDemo(e.target.value)} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700 }}>
              <input type="checkbox" checked={editCollab} onChange={(e) => setEditCollab(e.target.checked)} />
              Looking for collaborators
            </label>
            {editCollab && (
              <input className="input" placeholder="Roles needed (comma separated)" value={editRoles} onChange={(e) => setEditRoles(e.target.value)} />
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn btn--ghost" onClick={() => setIsEditing(false)}>Cancel</button>
              <button type="submit" className="btn btn--primary" disabled={updating}>Save Changes</button>
            </div>
          </form>
        )}

        {/* Short Summary & Tech Stack */}
        <p style={{ margin: 0, fontSize: 16, lineHeight: 1.5, fontWeight: 600 }}>
          {project.shortDescription}
        </p>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {project.techStack.map((tech) => (
            <span key={tech} className="chip chip--neutral" style={{ fontSize: 12, padding: '3px 10px' }}>
              {tech}
            </span>
          ))}
        </div>

        {/* External Links Bar */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', borderTop: '1px solid #e5e7eb', paddingTop: 14 }}>
          {project.demoUrl && (
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <span>🚀</span> Live Demo ↗
            </a>
          )}

          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--ghost"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <span>🐙</span> GitHub Repository ↗
            </a>
          )}
        </div>

        {/* Public GitHub Repo Insights Box */}
        {githubStats && (
          <div
            style={{
              padding: '14px 18px',
              borderRadius: 6,
              background: '#f8fafc',
              border: '1.5px solid var(--ink)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 20,
              alignItems: 'center',
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              GitHub Insights:
            </span>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 14 }}>
              <span>⭐ <strong>{githubStats.stars}</strong> stars</span>
              <span>🍴 <strong>{githubStats.forks}</strong> forks</span>
              <span>💻 Language: <strong>{githubStats.language}</strong></span>
              <span style={{ opacity: 0.75 }}>
                Updated {new Date(githubStats.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}

        {/* Full Long Description */}
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
          <h2 style={{ fontSize: 18, margin: '0 0 10px' }}>About this project</h2>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {project.description}
          </p>
        </div>

        {/* Collaborators Banner */}
        {project.lookingForCollaborators && (
          <div
            style={{
              padding: 16,
              background: '#ecfdf5',
              border: '2px solid #10b981',
              borderRadius: 6,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontWeight: 800, color: '#065f46', fontSize: 15 }}>
                🤝 Open for Collaboration
              </div>
              <div style={{ fontSize: 13, color: '#047857', marginTop: 2 }}>
                Roles needed: <strong>{project.rolesNeeded.join(', ') || 'Any contributor'}</strong>
              </div>
            </div>

            {!isOwner && (
              <button
                type="button"
                onClick={() => setShowCollabModal(true)}
                className="btn btn--primary"
                style={{ background: '#059669', borderColor: 'var(--ink)' }}
              >
                Request to Collaborate
              </button>
            )}
          </div>
        )}
      </article>

      {/* Collaboration Modal */}
      {showCollabModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: 20,
          }}
        >
          <div className="card" style={{ maxWidth: 480, width: '100%', padding: 24, background: '#ffffff', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ margin: 0, fontSize: 18 }}>Request to Collaborate on {project.title}</h3>

            {collabSent ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#16a34a' }}>
                  ✓ Your request was sent to {project.ownerName}!
                </p>
                <button type="button" className="btn btn--primary" onClick={() => { setShowCollabModal(false); setCollabSent(false); }}>
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendCollabRequest} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label className="field__label">Role you are interested in</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. Frontend Dev, Testing, Design"
                    value={collabRole}
                    onChange={(e) => setCollabRole(e.target.value)}
                  />
                </div>

                <div>
                  <label className="field__label">Short Message to {project.ownerName} *</label>
                  <textarea
                    rows={4}
                    className="textarea"
                    placeholder="Introduce yourself, your skills, and what you'd like to build together..."
                    value={collabMsg}
                    onChange={(e) => setCollabMsg(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
                  <button type="button" className="btn btn--ghost" onClick={() => setShowCollabModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn--primary" disabled={collabSubmitting}>
                    {collabSubmitting ? 'Sending…' : 'Send Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Owner Inbox: Incoming Collaboration Requests */}
      {isOwner && requests.length > 0 && (
        <section className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>
            Incoming Collaboration Requests ({requests.length})
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {requests.map((req) => (
              <div
                key={req.id}
                style={{
                  padding: 14,
                  border: '1.5px solid var(--ink)',
                  borderRadius: 6,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12,
                  background: req.status === 'accepted' ? '#f0fdf4' : req.status === 'declined' ? '#fef2f2' : '#ffffff',
                }}
              >
                <div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <strong>{req.senderName}</strong>
                    <span style={{ fontSize: 12, opacity: 0.75 }}>({req.senderEmail})</span>
                    {req.roleInterested && (
                      <span className="chip chip--neutral" style={{ fontSize: 11, padding: '2px 6px' }}>
                        Role: {req.roleInterested}
                      </span>
                    )}
                  </div>
                  <p style={{ margin: '6px 0 0', fontSize: 14 }}>{req.message}</p>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {req.status === 'pending' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleUpdateCollabStatus(req.id, 'accepted')}
                        className="btn btn--primary"
                        style={{ fontSize: 12, padding: '4px 10px', minHeight: 30 }}
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateCollabStatus(req.id, 'declined')}
                        className="btn btn--ghost"
                        style={{ fontSize: 12, padding: '4px 10px', minHeight: 30, color: '#dc2626' }}
                      >
                        Decline
                      </button>
                    </>
                  ) : (
                    <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'capitalize' }}>
                      Status: {req.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Comments Section */}
      <section id="comments" className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>
          Comments & Feedback ({comments.length})
        </h2>

        {currentUser ? (
          <form onSubmit={handleAddComment} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <textarea
              rows={2}
              className="textarea"
              placeholder="Leave feedback, ask about architecture, or cheer on the build..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              required
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn--primary" disabled={submittingComment || !newComment.trim()}>
                {submittingComment ? 'Posting…' : 'Post Comment'}
              </button>
            </div>
          </form>
        ) : (
          <div style={{ padding: 12, background: '#f3f4f6', borderRadius: 6, fontSize: 14 }}>
            <Link href="/auth/sign-in" style={{ fontWeight: 700, textDecoration: 'underline' }}>
              Sign in
            </Link>{' '}
            to join the project discussion.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {comments.length === 0 ? (
            <p style={{ margin: 0, opacity: 0.75, fontSize: 14 }}>No comments yet. Start the conversation!</p>
          ) : (
            comments.map((comm) => (
              <div
                key={comm.id}
                style={{
                  padding: 12,
                  border: '1px solid #e5e7eb',
                  borderRadius: 6,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <strong style={{ fontSize: 14 }}>{comm.userName}</strong>
                    <span style={{ fontSize: 12, opacity: 0.65 }}>
                      {new Date(comm.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: 14, lineHeight: 1.45 }}>{comm.content}</p>
                </div>

                {comm.canDelete && (
                  <button
                    type="button"
                    onClick={() => handleDeleteComment(comm.id)}
                    className="btn btn--ghost"
                    style={{ fontSize: 11, padding: '2px 6px', color: '#dc2626' }}
                    title="Delete comment"
                  >
                    Delete
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

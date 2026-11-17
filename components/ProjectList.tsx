'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { CurrentUser } from '@/lib/auth';
import type { Project } from '@/lib/types';
import Card from './ui/Card';

type Props = {
  initialProjects: Project[];
  currentUser: CurrentUser | null;
};

const COMMON_TECH = ['All', 'React', 'Next.js', 'TypeScript', 'Python', 'Node.js', 'PostgreSQL', 'C/C++', 'IoT'];

export default function ProjectList({ initialProjects, currentUser }: Props) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [search, setSearch] = useState('');
  const [selectedTech, setSelectedTech] = useState('All');
  const [onlyCollab, setOnlyCollab] = useState(false);

  // Upload modal state
  const [showUpload, setShowUpload] = useState(false);
  const [title, setTitle] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [description, setDescription] = useState('');
  const [techInput, setTechInput] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [lookingCollab, setLookingCollab] = useState(false);
  const [rolesInput, setRolesInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (onlyCollab && !p.lookingForCollaborators) return false;
      if (selectedTech !== 'All' && !p.techStack.includes(selectedTech)) return false;
      if (search.trim()) {
        const query = search.trim().toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(query);
        const matchesDesc = p.shortDescription.toLowerCase().includes(query);
        const matchesTech = p.techStack.some((t) => t.toLowerCase().includes(query));
        if (!matchesTitle && !matchesDesc && !matchesTech) return false;
      }
      return true;
    });
  }, [projects, selectedTech, onlyCollab, search]);

  async function handleToggleLike(projectId: string) {
    if (!currentUser) return;

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const nextLiked = !p.hasLiked;
        return {
          ...p,
          hasLiked: nextLiked,
          likesCount: p.likesCount + (nextLiked ? 1 : -1),
        };
      }),
    );

    try {
      await fetch(`/api/projects/${projectId}/like`, { method: 'POST' });
    } catch (err) {
      console.error('Like failed:', err);
    }
  }

  async function handleToggleBookmark(projectId: string) {
    if (!currentUser) return;

    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, hasBookmarked: !p.hasBookmarked } : p)),
    );

    try {
      await fetch(`/api/projects/${projectId}/bookmark`, { method: 'POST' });
    } catch (err) {
      console.error('Bookmark failed:', err);
    }
  }

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !shortDesc.trim() || !description.trim() || submitting) return;

    setSubmitting(true);
    setUploadError('');

    const techStack = techInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const rolesNeeded = rolesInput
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          shortDescription: shortDesc.trim(),
          description: description.trim(),
          techStack,
          githubUrl: githubUrl.trim() || null,
          demoUrl: demoUrl.trim() || null,
          imageUrl: imageUrl.trim() || null,
          lookingForCollaborators: lookingCollab,
          rolesNeeded,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to upload project');

      const newProj: Project = {
        id: data.projectId || `proj-${Date.now()}`,
        title: title.trim(),
        shortDescription: shortDesc.trim(),
        description: description.trim(),
        techStack,
        githubUrl: githubUrl.trim() || null,
        demoUrl: demoUrl.trim() || null,
        imageUrl: imageUrl.trim() || null,
        lookingForCollaborators: lookingCollab,
        rolesNeeded,
        ownerId: currentUser?.id || 'me',
        ownerName: currentUser?.name || 'You',
        ownerEmail: currentUser?.email || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        likesCount: 0,
        commentsCount: 0,
        hasLiked: false,
        hasBookmarked: false,
        canEdit: true,
      };

      setProjects((prev) => [newProj, ...prev]);
      setShowUpload(false);
      setTitle('');
      setShortDesc('');
      setDescription('');
      setTechInput('');
      setGithubUrl('');
      setDemoUrl('');
      setImageUrl('');
      setRolesInput('');
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Unable to upload project.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Controls & Search */}
      <div className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 260px', maxWidth: 400 }}>
            <input
              type="search"
              className="input"
              placeholder="Search projects by title, keyword, or tech stack…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={onlyCollab}
                onChange={(e) => setOnlyCollab(e.target.checked)}
              />
              🤝 Looking for Collaborators
            </label>

            {currentUser ? (
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => setShowUpload((v) => !v)}
              >
                {showUpload ? '✕ Close' : '+ Upload Project'}
              </button>
            ) : (
              <Link href="/auth/sign-in" className="btn btn--primary">
                Sign in to post
              </Link>
            )}
          </div>
        </div>

        {/* Tech Stack Filters */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 700, marginRight: 4 }}>Tech Stack:</span>
          {COMMON_TECH.map((t) => {
            const on = selectedTech === t;
            return (
              <button
                key={t}
                type="button"
                className="chip"
                onClick={() => setSelectedTech(t)}
                style={{
                  background: on ? 'var(--ink)' : 'var(--card)',
                  color: on ? '#ffffff' : 'var(--ink)',
                  border: '1.5px solid var(--ink)',
                  cursor: 'pointer',
                  fontSize: 12,
                  padding: '3px 10px',
                }}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      {/* Upload Project Form */}
      {showUpload && (
        <form onSubmit={handleCreateProject} className="card composer" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>Upload a new student project</h2>
          {uploadError && <p className="form-error" role="alert">{uploadError}</p>}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            <div className="field">
              <label htmlFor="proj-title" className="field__label">Project Title *</label>
              <input
                id="proj-title"
                type="text"
                className="input"
                placeholder="e.g. CampusPulse IoT Energy Grid"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="proj-tech" className="field__label">Tech Stack (comma separated) *</label>
              <input
                id="proj-tech"
                type="text"
                className="input"
                placeholder="e.g. Next.js, TypeScript, PostgreSQL, Python"
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="proj-short" className="field__label">Short Elevator Pitch (1-2 sentences) *</label>
            <input
              id="proj-short"
              type="text"
              className="input"
              placeholder="Brief summary for project cards"
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="proj-desc" className="field__label">Full Project Description *</label>
            <textarea
              id="proj-desc"
              rows={4}
              className="textarea"
              placeholder="What problem does it solve? How does it work? What architecture does it use?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <div className="field">
              <label htmlFor="proj-github" className="field__label">GitHub Repo URL</label>
              <input
                id="proj-github"
                type="url"
                className="input"
                placeholder="https://github.com/username/repo"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="proj-demo" className="field__label">Live Demo URL</label>
              <input
                id="proj-demo"
                type="url"
                className="input"
                placeholder="https://myproject.vercel.app"
                value={demoUrl}
                onChange={(e) => setDemoUrl(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="proj-image" className="field__label">Screenshot / Cover Image URL</label>
              <input
                id="proj-image"
                type="url"
                className="input"
                placeholder="https://example.com/screenshot.png"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>
          </div>

          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={lookingCollab}
                onChange={(e) => setLookingCollab(e.target.checked)}
              />
              Looking for collaborators to join this project
            </label>

            {lookingCollab && (
              <div style={{ marginTop: 8 }}>
                <label htmlFor="proj-roles" className="field__label">Roles needed (comma separated)</label>
                <input
                  id="proj-roles"
                  type="text"
                  className="input"
                  placeholder="e.g. Frontend Dev, UI/UX Designer, ML Engineer"
                  value={rolesInput}
                  onChange={(e) => setRolesInput(e.target.value)}
                />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
            <button type="button" className="btn btn--ghost" onClick={() => setShowUpload(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={submitting}>
              {submitting ? 'Publishing…' : 'Publish Project'}
            </button>
          </div>
        </form>
      )}

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <Card className="card" style={{ padding: 40, textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 8px 0' }}>No projects match your filters</h3>
          <p style={{ margin: 0, opacity: 0.8 }}>Try adjusting your search or clear filters to see all projects.</p>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 18 }}>
          {filteredProjects.map((proj) => (
            <article
              key={proj.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: 20,
                gap: 14,
                background: 'var(--card)',
                border: '2px solid var(--ink)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Header & Badges */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                    <Link href={`/projects/${proj.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      {proj.title}
                    </Link>
                  </h2>

                  <button
                    type="button"
                    onClick={() => handleToggleBookmark(proj.id)}
                    className="btn btn--ghost"
                    style={{ padding: '2px 6px', fontSize: 14, minHeight: 28 }}
                    title={proj.hasBookmarked ? 'Remove bookmark' : 'Bookmark project'}
                  >
                    {proj.hasBookmarked ? '🔖' : '🏷️'}
                  </button>
                </div>

                <div style={{ fontSize: 13, opacity: 0.75 }}>
                  By <strong>{proj.ownerName}</strong>
                </div>

                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, opacity: 0.9 }}>
                  {proj.shortDescription}
                </p>

                {/* Tech stack */}
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {proj.techStack.map((tech) => (
                    <span key={tech} className="chip chip--neutral" style={{ fontSize: 11, padding: '2px 8px' }}>
                      {tech}
                    </span>
                  ))}
                </div>

                {/* Looking for Collaborators badge */}
                {proj.lookingForCollaborators && (
                  <div
                    style={{
                      background: '#ecfdf5',
                      border: '1px solid #10b981',
                      borderRadius: 4,
                      padding: '4px 8px',
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#065f46',
                    }}
                  >
                    🤝 Collaborators needed: {proj.rolesNeeded.join(', ') || 'Any role'}
                  </div>
                )}
              </div>

              {/* Card Footer: Links and Actions */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid var(--border-color, #e5e7eb)',
                  paddingTop: 12,
                  marginTop: 6,
                }}
              >
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => handleToggleLike(proj.id)}
                    className={`btn ${proj.hasLiked ? 'btn--primary' : 'btn--ghost'}`}
                    style={{ padding: '4px 10px', fontSize: 12, minHeight: 32 }}
                    title="Like project"
                  >
                    ♥ {proj.likesCount}
                  </button>

                  <Link
                    href={`/projects/${proj.id}#comments`}
                    className="btn btn--ghost"
                    style={{ padding: '4px 10px', fontSize: 12, minHeight: 32 }}
                  >
                    💬 {proj.commentsCount}
                  </Link>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  {proj.demoUrl && (
                    <a
                      href={proj.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn--ghost"
                      style={{ fontSize: 12, padding: '4px 10px', minHeight: 32 }}
                    >
                      Live Demo ↗
                    </a>
                  )}
                  <Link
                    href={`/projects/${proj.id}`}
                    className="btn btn--primary"
                    style={{ fontSize: 12, padding: '4px 10px', minHeight: 32 }}
                  >
                    View Project →
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

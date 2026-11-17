'use client';

import { useState, useSyncExternalStore } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { formatShort } from '@/lib/dates';
import {
  STARTER_SUGGESTIONS,
  createSuggestion,
  getSuggestions,
  getUpvotedIds,
  subscribeSuggestions,
  subscribeUpvotes,
  toggleUpvote,
} from '@/lib/suggestions';

type FeatureSuggestionsProps = {
  defaultAuthor?: string;
};

const TITLE_MAX = 80;
const DESC_MAX = 300;
const SERVER_UPVOTED_IDS: string[] = [];

function getServerSuggestions() {
  return STARTER_SUGGESTIONS;
}

function getServerUpvotedIds() {
  return SERVER_UPVOTED_IDS;
}

export default function FeatureSuggestions({ defaultAuthor = '' }: FeatureSuggestionsProps) {
  const suggestions = useSyncExternalStore(subscribeSuggestions, getSuggestions, getServerSuggestions);
  const upvotedIds = useSyncExternalStore(subscribeUpvotes, getUpvotedIds, getServerUpvotedIds);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [author, setAuthor] = useState(defaultAuthor);
  const [touched, setTouched] = useState({ title: false, description: false });
  const [submitted, setSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const titleTrimmed = title.trim();
  const descTrimmed = description.trim();

  const titleTooLong = title.length > TITLE_MAX;
  const descTooLong = description.length > DESC_MAX;

  let titleError = '';
  if ((touched.title || submitted) && !titleTrimmed) {
    titleError = 'Please provide a feature title.';
  } else if (titleTooLong) {
    titleError = `Title must be ${TITLE_MAX} characters or fewer (${title.length}/${TITLE_MAX}).`;
  }

  let descError = '';
  if ((touched.description || submitted) && !descTrimmed) {
    descError = 'Please describe what should be built.';
  } else if (descTooLong) {
    descError = `Description must be ${DESC_MAX} characters or fewer (${description.length}/${DESC_MAX}).`;
  }

  const isValid = titleTrimmed.length > 0 && !titleTooLong && descTrimmed.length > 0 && !descTooLong;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    if (!isValid) return;

    createSuggestion({
      title,
      description,
      author,
    });

    setTitle('');
    setDescription('');
    if (!defaultAuthor) setAuthor('');
    setTouched({ title: false, description: false });
    setSubmitted(false);
    setSuccessMessage('Thank you! Your feature idea has been submitted.');
  };

  const handleUpvote = (id: string) => {
    toggleUpvote(id);
  };

  return (
    <div className="suggestions-container">
      <Card className="suggestions-form-card">
        <div className="suggestions-form-head">
          <div>
            <h3 className="card__title">Propose a feature</h3>
            <p className="suggestions-form-subtitle">
              Have an idea for CampusHub? Pitch it here and get upvotes from students and mentors.
            </p>
          </div>
        </div>

        {successMessage && (
          <div className="suggestion-alert" role="status" aria-live="polite">
            <span className="suggestion-alert__icon" aria-hidden="true">✓</span>
            <span className="suggestion-alert__text">{successMessage}</span>
            <button
              type="button"
              className="suggestion-alert__dismiss"
              aria-label="Dismiss message"
              onClick={() => setSuccessMessage(null)}
            >
              ×
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="suggestions-form">
          <div className="field">
            <div className="field__head">
              <label htmlFor="suggestion-title" className="field__label">
                Title <span className="field__required" aria-hidden="true">*</span>
              </label>
              <span
                id="title-char-count"
                className={`field__count ${titleTooLong ? 'field__count--error' : ''}`}
                aria-live="polite"
              >
                {title.length}/{TITLE_MAX}
              </span>
            </div>
            <input
              id="suggestion-title"
              type="text"
              className={`input ${titleError ? 'input--error' : ''}`}
              placeholder="e.g. Campus project showcase wall"
              value={title}
              maxLength={TITLE_MAX + 10}
              aria-describedby={`title-char-count ${titleError ? 'title-error' : ''}`.trim()}
              aria-invalid={titleError ? 'true' : 'false'}
              required
              onChange={(e) => {
                setTitle(e.target.value);
                if (successMessage) setSuccessMessage(null);
              }}
              onBlur={() => setTouched((prev) => ({ ...prev, title: true }))}
            />
            {titleError && (
              <span id="title-error" className="form-error" role="alert">
                {titleError}
              </span>
            )}
          </div>

          <div className="field">
            <div className="field__head">
              <label htmlFor="suggestion-desc" className="field__label">
                Description <span className="field__required" aria-hidden="true">*</span>
              </label>
              <span
                id="desc-char-count"
                className={`field__count ${descTooLong ? 'field__count--error' : ''}`}
                aria-live="polite"
              >
                {description.length}/{DESC_MAX}
              </span>
            </div>
            <textarea
              id="suggestion-desc"
              rows={3}
              className={`textarea ${descError ? 'textarea--error' : ''}`}
              placeholder="Explain what problem it solves and how you envision it working..."
              value={description}
              maxLength={DESC_MAX + 20}
              aria-describedby={`desc-char-count ${descError ? 'desc-error' : ''}`.trim()}
              aria-invalid={descError ? 'true' : 'false'}
              required
              onChange={(e) => {
                setDescription(e.target.value);
                if (successMessage) setSuccessMessage(null);
              }}
              onBlur={() => setTouched((prev) => ({ ...prev, description: true }))}
            />
            {descError && (
              <span id="desc-error" className="form-error" role="alert">
                {descError}
              </span>
            )}
          </div>

          <div className="field">
            <label htmlFor="suggestion-author" className="field__label">
              Your name <span className="field__hint">(optional, defaults to Anonymous)</span>
            </label>
            <input
              id="suggestion-author"
              type="text"
              className="input"
              placeholder="e.g. Devdatta Rane or leave blank"
              value={author}
              maxLength={50}
              onChange={(e) => setAuthor(e.target.value)}
            />
          </div>

          <div className="suggestions-form__actions">
            <Button
              type="submit"
              variant="primary"
              disabled={!isValid}
              className="suggestions-form__submit"
            >
              Submit idea
            </Button>
            {!isValid && (submitted || touched.title || touched.description) && (
              <span className="suggestions-form__disabled-hint">
                Please complete required fields before submitting.
              </span>
            )}
          </div>
        </form>
      </Card>

      <div className="suggestions-list-section">
        <div className="section-head">
          <h3 className="section-title suggestions-list-title">Submitted ideas</h3>
          <span className="count">
            {suggestions.length} {suggestions.length === 1 ? 'suggestion' : 'suggestions'}
          </span>
        </div>

        {suggestions.length === 0 ? (
          <Card className="empty">
            <p className="empty-title">No suggestions yet.</p>
            <span className="empty-note">Be the first to share an idea to make campus life better!</span>
          </Card>
        ) : (
          <div className="suggestions-grid">
            {suggestions.map((item) => {
              const isUpvoted = upvotedIds.includes(item.id);
              return (
                <article key={item.id} className="card suggestion-card">
                  <div className="suggestion-card__layout">
                    <button
                      type="button"
                      className="vote suggestion-vote"
                      aria-pressed={isUpvoted}
                      aria-label={`${isUpvoted ? 'Remove upvote from' : 'Upvote'} "${item.title}". Total votes: ${item.upvotes}`}
                      onClick={() => handleUpvote(item.id)}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                        className="suggestion-vote__icon"
                      >
                        <path d="m18 15-6-6-6 6" />
                      </svg>
                      <span className="vote__count">{item.upvotes}</span>
                    </button>

                    <div className="suggestion-card__content">
                      <h4 className="suggestion-card__title">{item.title}</h4>
                      <p className="suggestion-card__description">{item.description}</p>
                      <div className="suggestion-card__footer">
                        <span className="suggestion-card__author">
                          By <strong>{item.author}</strong>
                        </span>
                        <span className="suggestion-card__dot" aria-hidden="true">·</span>
                        <time dateTime={item.createdAt} className="suggestion-card__date">
                          {formatShort(item.createdAt)}
                        </time>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

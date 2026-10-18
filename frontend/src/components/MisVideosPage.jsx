import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import { youtubeThumbnail } from '../lib/youtube.js';
import AccountShell from './AccountShell.jsx';
import './Modal.css';
import { useI18n } from '../i18n/I18nContext.jsx';

const LEVELS = ['principiante', 'intermedio', 'experto'];

function VideoCard({ video }) {
  const { t } = useI18n();
  const thumb = video.videoUrl ? youtubeThumbnail(video.videoUrl) : null;
  const muscleLabel = video.muscleGroup ? t(`videos.muscle.${video.muscleGroup}`) : null;
  const locked = !video.videoUrl;
  return (
    <li>
      <div className={`video-card ${locked ? 'video-card--locked' : ''}`}>
        <span className="video-card__thumb">
          {thumb && <img src={thumb} alt="" loading="lazy" />}
          {!locked ? (
            <a href={video.videoUrl} target="_blank" rel="noreferrer" className="video-card__play" aria-label={t('videos.watchAria', { title: video.title })}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </a>
          ) : (
            <span className="video-card__locked" aria-hidden="true">
              🔒
            </span>
          )}
          {muscleLabel && <span className="video-card__badge">{muscleLabel}</span>}
        </span>
        <span className="video-card__info">
          <span className="video-card__title">{video.title}</span>
          {video.description && <span className="video-card__desc">{video.description}</span>}
          {locked && (
            <span className="video-card__upgrade">
              {t('videos.lockedText')} <a href="/#planes">{t('videos.upgrade')}</a>.
            </span>
          )}
        </span>
      </div>
    </li>
  );
}

function ComingSoonCard() {
  const { t } = useI18n();
  return (
    <li>
      <div className="video-card video-card--locked video-card--soon">
        <span className="video-card__thumb">
          <span className="video-card__locked" aria-hidden="true">
            🔒
          </span>
        </span>
        <span className="video-card__info">
          <span className="video-card__title">{t('videos.soon')}</span>
          <span className="video-card__upgrade">
            {t('videos.soonText')} <a href="/#planes">{t('videos.seePlans')}</a>.
          </span>
        </span>
      </div>
    </li>
  );
}

export default function MisVideosPage() {
  const { user, token, loading } = useAuth();
  const { t } = useI18n();
  const [videosState, setVideosState] = useState({ loading: true, hasVideoAccess: false, hasFullAccess: false, videos: [], error: '' });

  useEffect(() => {
    if (!token) return;
    api
      .myVideos(token)
      .then((data) =>
        setVideosState({
          loading: false,
          hasVideoAccess: data.hasVideoAccess,
          hasFullAccess: data.hasFullAccess,
          videos: data.videos || [],
          error: '',
        })
      )
      .catch((err) => setVideosState({ loading: false, hasVideoAccess: false, hasFullAccess: false, videos: [], error: err.message }));
  }, [token]);

  if (loading) {
    return (
      <AccountShell active="videos">
        <p className="profile__videos-hint">{t('common.loading')}</p>
      </AccountShell>
    );
  }

  if (!user) {
    return (
      <AccountShell active="videos">
        <h1>{t('account.tabs.videos')}</h1>
        <p className="profile__videos-hint">{t('videos.loginToSee')}</p>
        <a className="btn btn-primary" href="/">
          {t('common.backHome')}
        </a>
      </AccountShell>
    );
  }

  return (
    <AccountShell active="videos">
      <h1>{t('account.tabs.videos')}</h1>

      {videosState.loading && <p className="profile__videos-hint">{t('common.loading')}</p>}
      {!videosState.loading && videosState.error && <p className="modal__error">{videosState.error}</p>}

      {!videosState.loading &&
        !videosState.error &&
        LEVELS.map((level) => {
          const videosForLevel = videosState.videos.filter((v) => v.level === level);
          const sectionUnlocked = level === 'experto' ? videosState.hasFullAccess : videosState.hasVideoAccess;
          return (
            <div key={level} className="video-level-section">
              <h2 className="video-level-section__title">
                {!sectionUnlocked && <span aria-hidden="true">🔒 </span>}
                {t(`videos.levels.${level}.label`)} <span className="video-level-section__hint">({t(`videos.levels.${level}.hint`)})</span>
              </h2>
              <ul className="video-grid">
                {videosForLevel.length > 0 ? videosForLevel.map((video) => <VideoCard key={video.id} video={video} />) : <ComingSoonCard />}
              </ul>
            </div>
          );
        })}
    </AccountShell>
  );
}

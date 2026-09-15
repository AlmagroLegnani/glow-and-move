import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import { youtubeThumbnail } from '../lib/youtube.js';
import AccountShell from './AccountShell.jsx';
import './Modal.css';

const MUSCLE_GROUP_LABEL = {
  tren_superior: 'Tren superior',
  tren_inferior: 'Tren inferior',
};

const LEVELS = [
  { id: 'principiante', label: 'Principiante', hint: 'Bloques 1 y 2' },
  { id: 'intermedio', label: 'Intermedio', hint: 'Bloques 3 y 4' },
  { id: 'experto', label: 'Experto', hint: 'Plan Full' },
];

function VideoCard({ video }) {
  const thumb = video.videoUrl ? youtubeThumbnail(video.videoUrl) : null;
  const muscleLabel = MUSCLE_GROUP_LABEL[video.muscleGroup];
  const locked = !video.videoUrl;
  return (
    <li>
      <div className={`video-card ${locked ? 'video-card--locked' : ''}`}>
        <span className="video-card__thumb">
          {thumb && <img src={thumb} alt="" loading="lazy" />}
          {!locked ? (
            <a href={video.videoUrl} target="_blank" rel="noreferrer" className="video-card__play" aria-label={`Ver video de ${video.title}`}>
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
              Este contenido está disponible en una experiencia superior. <a href="/#planes">Actualizar experiencia</a>.
            </span>
          )}
        </span>
      </div>
    </li>
  );
}

function ComingSoonCard() {
  return (
    <li>
      <div className="video-card video-card--locked video-card--soon">
        <span className="video-card__thumb">
          <span className="video-card__locked" aria-hidden="true">
            🔒
          </span>
        </span>
        <span className="video-card__info">
          <span className="video-card__title">Próximamente</span>
          <span className="video-card__upgrade">
            Todavía no hay ejercicios cargados en este nivel. <a href="/#planes">Ver planes</a>.
          </span>
        </span>
      </div>
    </li>
  );
}

export default function MisVideosPage() {
  const { user, token, loading } = useAuth();
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
        <p className="profile__videos-hint">Cargando...</p>
      </AccountShell>
    );
  }

  if (!user) {
    return (
      <AccountShell active="videos">
        <h1>Mis videos</h1>
        <p className="profile__videos-hint">Iniciá sesión para ver tus videos.</p>
        <a className="btn btn-primary" href="/">
          Volver al inicio
        </a>
      </AccountShell>
    );
  }

  return (
    <AccountShell active="videos">
      <h1>Mis videos</h1>

      {videosState.loading && <p className="profile__videos-hint">Cargando...</p>}
      {!videosState.loading && videosState.error && <p className="modal__error">{videosState.error}</p>}

      {!videosState.loading &&
        !videosState.error &&
        LEVELS.map((level) => {
          const videosForLevel = videosState.videos.filter((v) => v.level === level.id);
          const sectionUnlocked = level.id === 'experto' ? videosState.hasFullAccess : videosState.hasVideoAccess;
          return (
            <div key={level.id} className="video-level-section">
              <h2 className="video-level-section__title">
                {!sectionUnlocked && <span aria-hidden="true">🔒 </span>}
                {level.label} <span className="video-level-section__hint">({level.hint})</span>
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

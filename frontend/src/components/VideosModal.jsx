import Modal from './Modal.jsx';
import { youtubeThumbnail } from '../lib/youtube.js';

const MUSCLE_GROUP_LABEL = {
  tren_superior: 'Tren superior',
  tren_inferior: 'Tren inferior',
};

export default function VideosModal({ videosState, onClose, onBack }) {
  return (
    <Modal title="Mis videos" onClose={onClose} size="lg">
      <button type="button" className="modal__back" onClick={onBack}>
        ← Volver a mi perfil
      </button>

      {videosState.loading && <p className="profile__videos-hint">Cargando...</p>}
      {!videosState.loading && videosState.error && <p className="modal__error">{videosState.error}</p>}
      {!videosState.loading && !videosState.error && videosState.locked && (
        <p className="profile__videos-hint">
          Los videos de ejercicios están disponibles a partir del plan Premium.{' '}
          <a href="#planes" onClick={onClose}>
            Ver planes
          </a>
          .
        </p>
      )}
      {!videosState.loading && !videosState.error && !videosState.locked && videosState.videos.length === 0 && (
        <p className="profile__videos-hint">Todavía no hay videos cargados para tu rutina.</p>
      )}
      {!videosState.loading && !videosState.error && !videosState.locked && videosState.videos.length > 0 && (
        <ul className="video-grid">
          {videosState.videos.map((video) => {
            const thumb = youtubeThumbnail(video.videoUrl);
            const muscleLabel = MUSCLE_GROUP_LABEL[video.muscleGroup];
            return (
              <li key={video.id}>
                <a href={video.videoUrl} target="_blank" rel="noreferrer" className="video-card">
                  <span className="video-card__thumb">
                    {thumb && <img src={thumb} alt="" loading="lazy" />}
                    <span className="video-card__play" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                    {muscleLabel && <span className="video-card__badge">{muscleLabel}</span>}
                  </span>
                  <span className="video-card__info">
                    <span className="video-card__title">{video.title}</span>
                    {video.description && <span className="video-card__desc">{video.description}</span>}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}

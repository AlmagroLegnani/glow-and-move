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
      {!videosState.loading && !videosState.error && videosState.videos.length === 0 && (
        <p className="profile__videos-hint">Todavía no hay ejercicios cargados.</p>
      )}
      {!videosState.loading && !videosState.error && videosState.videos.length > 0 && (
        <ul className="video-grid">
          {videosState.videos.map((video) => {
            const thumb = video.videoUrl ? youtubeThumbnail(video.videoUrl) : null;
            const muscleLabel = MUSCLE_GROUP_LABEL[video.muscleGroup];
            const locked = !video.videoUrl;
            return (
              <li key={video.id}>
                <div className={`video-card ${locked ? 'video-card--locked' : ''}`}>
                  <span className="video-card__thumb">
                    {thumb && <img src={thumb} alt="" loading="lazy" />}
                    {!locked ? (
                      <a
                        href={video.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="video-card__play"
                        aria-label={`Ver video de ${video.title}`}
                      >
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
                        Este contenido está disponible en una experiencia superior.{' '}
                        <a href="#planes" onClick={onClose}>
                          Actualizar experiencia
                        </a>
                        .
                      </span>
                    )}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}

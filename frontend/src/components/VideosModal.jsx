import Modal from './Modal.jsx';
import { youtubeThumbnail } from '../lib/youtube.js';

export default function VideosModal({ videosState, onClose, onBack }) {
  return (
    <Modal title="Mis videos" onClose={onClose}>
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
        <ul className="profile__videos-list">
          {videosState.videos.map((video) => {
            const thumb = youtubeThumbnail(video.videoUrl);
            return (
              <li key={video.id}>
                <a href={video.videoUrl} target="_blank" rel="noreferrer" className="profile__video-card">
                  <span className="profile__video-thumb">
                    {thumb && <img src={thumb} alt="" loading="lazy" />}
                    <span className="profile__video-play" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                  </span>
                  <span className="profile__video-info">
                    <span className="profile__video-title">{video.title}</span>
                    {video.description && <span className="profile__video-desc">{video.description}</span>}
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

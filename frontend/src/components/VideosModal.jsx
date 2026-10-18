import Modal from './Modal.jsx';
import { youtubeThumbnail } from '../lib/youtube.js';
import { useI18n } from '../i18n/I18nContext.jsx';

export default function VideosModal({ videosState, onClose, onBack }) {
  const { t } = useI18n();
  return (
    <Modal title={t('account.tabs.videos')} onClose={onClose} size="lg">
      <button type="button" className="modal__back" onClick={onBack}>
        {t('profile.backToProfile')}
      </button>

      {videosState.loading && <p className="profile__videos-hint">{t('common.loading')}</p>}
      {!videosState.loading && videosState.error && <p className="modal__error">{videosState.error}</p>}
      {!videosState.loading && !videosState.error && videosState.videos.length === 0 && (
        <p className="profile__videos-hint">{t('videos.none')}</p>
      )}
      {!videosState.loading && !videosState.error && videosState.videos.length > 0 && (
        <ul className="video-grid">
          {videosState.videos.map((video) => {
            const thumb = video.videoUrl ? youtubeThumbnail(video.videoUrl) : null;
            const muscleLabel = video.muscleGroup ? t(`videos.muscle.${video.muscleGroup}`) : null;
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
                        aria-label={t('videos.watchAria', { title: video.title })}
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
                        {t('videos.lockedText')}{' '}
                        <a href="#planes" onClick={onClose}>
                          {t('videos.upgrade')}
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

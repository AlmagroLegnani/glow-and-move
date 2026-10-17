import { useAvatarSrc, userInitial } from '../lib/avatar.js';
import './UserAvatar.css';

// Avatar del usuario: su foto o el avatar elegido de la galería; si no tiene, la inicial del
// nombre. `avatarUrl` permite previsualizar un valor distinto al guardado (en el selector).
export default function UserAvatar({ user, avatarUrl = user?.avatarUrl, size = 40, className = '' }) {
  const src = useAvatarSrc(avatarUrl);
  // Mientras se genera un avatar de la galería mostramos un círculo vacío, no la inicial.
  const pending = !src && !!avatarUrl;
  return (
    <span
      className={`user-avatar ${src || pending ? '' : 'user-avatar--initial'} ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      aria-hidden="true"
    >
      {src ? <img src={src} alt="" /> : pending ? null : userInitial(user)}
    </span>
  );
}

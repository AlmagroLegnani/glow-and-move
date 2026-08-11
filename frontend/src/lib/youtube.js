export function youtubeThumbnail(videoUrl) {
  try {
    const id = new URL(videoUrl).searchParams.get('v');
    return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
  } catch {
    return null;
  }
}

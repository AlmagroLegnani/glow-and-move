export function youtubeThumbnail(videoUrl) {
  try {
    const id = new URL(videoUrl).searchParams.get('v');
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
  } catch {
    return null;
  }
}

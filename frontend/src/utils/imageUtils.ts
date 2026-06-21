export function getImageSrc(item: {
  imageData?: string | null;
  image?: string | null;
  thumbnailMediumData?: string | null;
  thumbnailSmallData?: string | null;
  thumbnailMedium?: string | null;
  thumbnailSmall?: string | null;
}): string {
  return item.imageData || item.image || '/pp-logo.png';
}

export function getThumbSrc(item: {
  thumbnailMediumData?: string | null;
  thumbnailMedium?: string | null;
  thumbnailSmallData?: string | null;
  thumbnailSmall?: string | null;
  imageData?: string | null;
  image?: string | null;
}): string {
  return item.thumbnailMediumData || item.thumbnailSmallData || item.imageData || item.thumbnailMedium || item.thumbnailSmall || item.image || '/pp-logo.png';
}

import type { VideoItem } from '../types'

/** Builds the "Period 2 of 4" label for multi-part lessons. */
export function videoPeriodLabel(
  video: Pick<VideoItem, 'periodNumber' | 'periodTotal'>,
): string | null {
  if (!video.periodNumber || !video.periodTotal || video.periodTotal < 2) return null
  return `Period ${video.periodNumber} of ${video.periodTotal}`
}

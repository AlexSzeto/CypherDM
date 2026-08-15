import { html } from 'htm/preact'
import { useState, useEffect } from 'preact/hooks'
import { styled } from '../goober-setup.mjs'
import { currentTheme } from '../theme.mjs'
import { Button } from '../io/button.mjs'
import { Panel } from '../layout/panel.mjs'

// =========================================================================
// Styled Components
// =========================================================================

const Controls = styled('div')`
  display: flex;
  align-items: center;
  width: 100%;
  gap: ${(props) => props.gap};
`
Controls.className = 'controls'

const TimelineWrapper = styled('div')`
  display: flex;
  align-items: center;
  flex: 1;
  gap: ${(props) => props.gap};
`
TimelineWrapper.className = 'timeline-wrapper'

const Time = styled('span')`
  font-family: monospace;
  min-width: 40px;
  text-align: center;
  color: ${(props) => props.color};
  font-size: ${(props) => props.fontSize};
`
Time.className = 'time'

const ProgressBar = styled('div')`
  flex: 1;
  height: 6px;
  border-radius: 3px;
  cursor: pointer;
  overflow: hidden;
  background-color: ${(props) => props.backgroundColor};

  &:hover {
    height: 8px;
  }
`
ProgressBar.className = 'progress-bar'

const ProgressFill = styled('div')`
  height: 100%;
  border-radius: 3px;
  transition: width 0.1s linear;
  width: ${(props) => props.width};
  background-color: ${(props) => props.backgroundColor};
`
ProgressFill.className = 'progress-fill'

// =========================================================================
// VideoTimeline Component
// =========================================================================

/**
 * Renders a clickable progress bar + time readouts for a video element owned
 * by the caller.
 *
 * Both listener attachment and initial-state sync use a requestAnimationFrame
 * retry loop so that the component works correctly even when videoRef.current
 * is null at first render (e.g. when the <video> lives inside a TransitionViewer
 * and is committed in a later render cycle).
 */
function VideoTimeline({ videoRef, videoUrl }) {
  const [theme, setTheme] = useState(currentTheme.value)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => currentTheme.subscribe(setTheme), [])

  useEffect(() => {
    let frameId = null
    let attachedVideo = null

    const handleTimeUpdate = () => setCurrentTime(attachedVideo.currentTime)
    const handleLoadedMetadata = () => setDuration(attachedVideo.duration)

    const attach = () => {
      const video = videoRef.current
      if (!video) {
        // videoRef.current is not yet populated — retry on the next frame.
        frameId = requestAnimationFrame(attach)
        return
      }
      frameId = null
      attachedVideo = video
      video.addEventListener('timeupdate', handleTimeUpdate)
      video.addEventListener('loadedmetadata', handleLoadedMetadata)
      // Sync immediately if the video already has metadata loaded.
      if (video.readyState >= 1) setDuration(video.duration)
      setCurrentTime(video.currentTime || 0)
    }

    setCurrentTime(0)
    setDuration(0)
    attach()

    return () => {
      if (frameId !== null) cancelAnimationFrame(frameId)
      if (attachedVideo) {
        attachedVideo.removeEventListener('timeupdate', handleTimeUpdate)
        attachedVideo.removeEventListener(
          'loadedmetadata',
          handleLoadedMetadata,
        )
      }
    }
  }, [videoUrl])

  const progress =
    duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0

  const handleProgressClick = (e) => {
    const video = videoRef.current
    if (!video || duration === 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    video.currentTime = pct * duration
  }

  const formatTime = (secs) => {
    if (isNaN(secs) || !isFinite(secs)) return '0:00'
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return html`
    <${TimelineWrapper} gap=${theme.spacing.small.gap}>
      <${Time}
        color=${theme.colors.text.secondary}
        fontSize=${theme.typography.fontSize.small}
      >${formatTime(currentTime)}</${Time}>

      <${ProgressBar}
        backgroundColor=${theme.colors.overlay.background}
        onClick=${handleProgressClick}
      >
        <${ProgressFill}
          width=${`${progress}%`}
          backgroundColor=${theme.colors.primary.background}
        />
      </${ProgressBar}>

      <${Time}
        color=${theme.colors.text.secondary}
        fontSize=${theme.typography.fontSize.small}
      >${formatTime(duration)}</${Time}>
    </${TimelineWrapper}>
  `
}

// =========================================================================
// VideoPlayer Component
// =========================================================================

/**
 * VideoPlayer Component
 * A simple video player with play/pause controls and a progress timeline.
 *
 * @param {Object} props
 * @param {{ current: HTMLVideoElement|null }} props.videoRef - Mutable ref to the video element
 * @param {string} props.videoUrl - URL of the video (used to detect source changes)
 */
export function VideoPlayer({ videoRef, videoUrl }) {
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    let frameId = null
    let attachedVideo = null

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => setIsPlaying(false)

    const attach = () => {
      const video = videoRef.current
      if (!video) {
        // videoRef.current is not yet populated — retry on the next frame.
        frameId = requestAnimationFrame(attach)
        return
      }
      frameId = null
      attachedVideo = video
      video.addEventListener('play', handlePlay)
      video.addEventListener('pause', handlePause)
      video.addEventListener('ended', handleEnded)
      // Sync play state in case the video was already playing.
      setIsPlaying(!video.paused && !video.ended)
    }

    setIsPlaying(false)
    attach()

    return () => {
      if (frameId !== null) cancelAnimationFrame(frameId)
      if (attachedVideo) {
        attachedVideo.removeEventListener('play', handlePlay)
        attachedVideo.removeEventListener('pause', handlePause)
        attachedVideo.removeEventListener('ended', handleEnded)
      }
    }
  }, [videoUrl])

  const togglePlayPause = () => {
    const video = videoRef.current
    if (!video) return
    if (isPlaying) {
      video.pause()
    } else {
      video.play()
    }
  }

  return html`
    <${Panel} variant="glass" padding="small">
      <${Controls} gap=${currentTheme.value.spacing.medium.gap}>
        <${Button}
          variant="medium-icon"
          color="secondary"
          icon=${isPlaying ? 'stop' : 'play'}
          onClick=${togglePlayPause}
        />
        <${VideoTimeline} videoRef=${videoRef} videoUrl=${videoUrl} />
      </${Controls}>
    </${Panel}>
  `
}

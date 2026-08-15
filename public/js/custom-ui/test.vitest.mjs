/**
 * Baseline smoke tests for custom-ui components.
 *
 * Each test renders the component with minimal props and asserts:
 *   1. No console.error was called (Preact validates prop types and misuse here)
 *   2. No uncaught exception during render
 */
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/preact'
import { html } from 'htm/preact'

afterEach(() => cleanup())

// ── Simple layout / io components ─────────────────────────────────────────

import { Button } from './io/button.mjs'

describe('Button', () => {
  test('renders text variant without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(html`<${Button}>Click me</${Button}>`)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  test('renders icon variant without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(html`<${Button} variant="medium-icon" icon="check" />`)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  test('renders disabled state without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(html`<${Button} disabled=${true}>Disabled</${Button}>`)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  test('renders loading state without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(html`<${Button} loading=${true}>Loading</${Button}>`)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})

// ── Input ─────────────────────────────────────────────────────────────────

import { Input } from './io/input.mjs'

describe('Input', () => {
  test('renders without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      html`<${Input} value="" onInput=${() => {}} placeholder="Type here" />`,
    )
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  test('renders with buttonProps without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(html`
      <${Input}
        label="With button"
        widthScale="full"
        value=""
        onInput=${() => {}}
        buttonProps=${{ icon: 'captions', title: 'Generate', onClick: () => {} }}
      />
    `)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})

// ── Checkbox ──────────────────────────────────────────────────────────────

import { Checkbox } from './io/checkbox.mjs'

describe('Checkbox', () => {
  test('renders unchecked without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(html`<${Checkbox} checked=${false} onChange=${() => {}} />`)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  test('renders checked without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(html`<${Checkbox} checked=${true} onChange=${() => {}} />`)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})

// ── Panel ─────────────────────────────────────────────────────────────────

import { Panel } from './layout/panel.mjs'

describe('Panel', () => {
  test('renders default variant without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(html`<${Panel}>Content</${Panel}>`)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  test('renders elevated variant without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(html`<${Panel} variant="elevated">Content</${Panel}>`)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})

// ── Icon ──────────────────────────────────────────────────────────────────

import { Icon } from './layout/icon.mjs'

describe('Icon', () => {
  test('renders without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(html`<${Icon} name="check" size="24px" />`)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})

// ── Themed base layout helpers ────────────────────────────────────────────

import { HorizontalLayout, VerticalLayout } from './themed-base.mjs'

describe('Layout helpers', () => {
  test('HorizontalLayout renders without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      html`<${HorizontalLayout}><span>A</span><span>B</span></${HorizontalLayout}>`,
    )
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  test('VerticalLayout renders without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(html`<${VerticalLayout}><span>A</span></${VerticalLayout}>`)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  test('HorizontalLayout renders with gap="none" without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      html`<${HorizontalLayout} gap="none"><span>A</span><span>B</span></${HorizontalLayout}>`,
    )
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  test('VerticalLayout renders with gap="none" without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      html`<${VerticalLayout} gap="none"><span>A</span></${VerticalLayout}>`,
    )
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  test('VerticalLayout renders with justifyContent="flex-end" without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      html`<${VerticalLayout} justifyContent="flex-end"><span>A</span></${VerticalLayout}>`,
    )
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  test('HorizontalLayout renders with fitContent without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      html`<${HorizontalLayout} fitContent><span>A</span><span>B</span></${HorizontalLayout}>`,
    )
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})

// ── Slider ────────────────────────────────────────────────────────────────

import { Slider } from './io/slider.mjs'

describe('Slider', () => {
  test('renders without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      html`<${Slider} min=${0} max=${100} value=${50} onChange=${() => {}} />`,
    )
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})

// ── ToggleSwitch ──────────────────────────────────────────────────────────

import { ToggleSwitch } from './io/toggle-switch.mjs'

describe('ToggleSwitch', () => {
  test('renders off state without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(html`<${ToggleSwitch} checked=${false} onChange=${() => {}} />`)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})

// ── AudioPlayer demo usages (mirrors test.html) ───────────────────────────

import { AudioPlayer } from './media/audio-player.mjs'

describe('AudioPlayer (test.html usages)', () => {
  test('renders as overlay on album art without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(html`
      <div style="position: relative; width: 300px; height: 150px;">
        <img
          src="/js/custom-ui/demo/sample-album-cover-1.jpg"
          style="width: 100%; height: 100%; object-fit: cover;"
        />
        <div
          style="position: absolute; bottom: 0; left: 0; right: 0; padding: 8px;"
        >
          <${AudioPlayer}
            audioUrl="/js/custom-ui/demo/sample-music-track-1.mp3"
          />
        </div>
      </div>
    `)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  test('renders standalone full-width without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      html`<${AudioPlayer}
        audioUrl="/js/custom-ui/demo/sample-music-track-3.mp3"
      />`,
    )
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  test('renders normal widthScale without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      html`<${AudioPlayer}
        widthScale="normal"
        audioUrl="/js/custom-ui/demo/sample-music-track-4.mp3"
      />`,
    )
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})

// ── Select ────────────────────────────────────────────────────────────────

import { Select } from './io/select.mjs'

describe('Select', () => {
  const opts = [
    { label: 'One', value: '1' },
    { label: 'Two', value: '2' },
  ]

  test('renders without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(html`<${Select} options=${opts} value="1" onChange=${() => {}} />`)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  test('renders with label and error without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(html`<${Select} label="Type" options=${opts} error="Required" />`)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  test('renders with buttonProps without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(html`
      <${Select}
        label="With button"
        options=${opts}
        value="1"
        onChange=${() => {}}
        buttonProps=${{ icon: 'info', title: 'View', onClick: () => {} }}
      />
    `)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  test('renders options with tooltip without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(html`
      <${Select}
        options=${[
          { label: 'One', value: '1', tooltip: 'The first option' },
          { label: 'Two', value: '2', tooltip: 'The second option' },
        ]}
        value="1"
        onChange=${() => {}}
      />
    `)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  test('renders with a disabled option without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(html`
      <${Select}
        options=${[
          { label: 'One', value: '1' },
          { label: 'Two', value: '2', disabled: true },
        ]}
        value="1"
        onChange=${() => {}}
      />
    `)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})

// ── MultiSelect ────────────────────────────────────────────────────────────

import { MultiSelect } from './io/multi-select.mjs'

describe('MultiSelect', () => {
  test('renders with empty selection without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      html`<${MultiSelect}
        options=${[
          { label: 'A', value: 'A' },
          { label: 'B', value: 'B' },
          { label: 'C', value: 'C' },
        ]}
        value=${[]}
        onChange=${() => {}}
      />`,
    )
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  test('renders with pre-selected values and label without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(html`
      <${MultiSelect}
        label="Keys"
        options=${[
          { label: 'C major', value: 'C major' },
          { label: 'A minor', value: 'A minor' },
          { label: 'G major', value: 'G major' },
        ]}
        value=${['C major', 'G major']}
        onChange=${() => {}}
      />
    `)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  test('renders with object options without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(html`
      <${MultiSelect}
        label="Time Signatures"
        options=${[
          { label: '2/4', value: '2' },
          { label: '3/4', value: '3' },
          { label: '4/4', value: '4' },
          { label: '6/8', value: '6' },
        ]}
        value=${['4', '3']}
        onChange=${() => {}}
      />
    `)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  test('renders with buttonProps without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(html`
      <${MultiSelect}
        options=${[
          { label: 'A', value: 'A' },
          { label: 'B', value: 'B' },
          { label: 'C', value: 'C' },
        ]}
        value=${[]}
        onChange=${() => {}}
        buttonProps=${{ icon: 'info', title: 'Info', onClick: () => {} }}
      />
    `)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  test('renders options with tooltip without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(html`
      <${MultiSelect}
        options=${[
          {
            label: 'Classical',
            value: 'classical',
            tooltip: 'Orchestral music from the 17th–19th century',
          },
          {
            label: 'Jazz',
            value: 'jazz',
            tooltip: 'Improvisational style originating in New Orleans',
          },
        ]}
        value=${[]}
        onChange=${() => {}}
      />
    `)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})

// ── CollapsiblePanel ──────────────────────────────────────────────────────

import { CollapsiblePanel } from './layout/collapsible-panel.mjs'

describe('CollapsiblePanel', () => {
  test('renders collapsed without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(html`
      <${CollapsiblePanel}
        header=${html`<span>Section</span>`}
        content=${html`<p>Content</p>`}
        expanded=${false}
        onExpand=${() => {}}
      />
    `)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  test('renders expanded without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(html`
      <${CollapsiblePanel}
        header=${html`<span>Section</span>`}
        content=${html`<p>Content</p>`}
        expanded=${true}
        onExpand=${() => {}}
      />
    `)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})

// ── BgmPlayerDemo — Panel glass + controls (mirrors test.html) ────────────

import { globalBgmPlayer } from './global-audio-player.mjs'

function makeMockBgmGainNode() {
  return {
    gain: {
      value: 1,
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
  }
}
function makeMockBgmContext() {
  return {
    currentTime: 0,
    state: 'running',
    destination: {},
    resume: vi.fn(),
    createGain: vi.fn().mockImplementation(makeMockBgmGainNode),
    createMediaElementSource: vi
      .fn()
      .mockImplementation(() => ({ connect: vi.fn() })),
  }
}
class MockBgmAudio {
  constructor() {
    this.src = ''
    this.currentTime = 0
    this.duration = 30
    this.crossOrigin = null
    this.preload = 'auto'
    this.play = vi.fn().mockResolvedValue(undefined)
    this.pause = vi.fn()
    this.addEventListener = vi.fn()
    this.removeEventListener = vi.fn()
  }
}

describe('BgmPlayerDemo (test.html usages)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    window.AudioContext = function MockBgmAudioContext() {
      return makeMockBgmContext()
    }
    window.Audio = MockBgmAudio
    globalBgmPlayer.stop()
    globalBgmPlayer._context = null
    globalBgmPlayer._slots = [
      { audio: null, source: null, gain: null },
      { audio: null, source: null, gain: null },
    ]
    globalBgmPlayer._activeSlot = 0
    globalBgmPlayer._playId = 0
  })

  afterEach(() => {
    globalBgmPlayer.stop()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  test('Panel glass variant with style object renders without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(html`
      <${Panel} variant="glass" padding="small" style=${{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <${Button} variant="medium-icon" icon="play" />
        <div style="flex: 1; display: flex; align-items: center; gap: 6px;">
          <span>0:00</span>
          <div style="flex: 1; height: 6px; border-radius: 3px; background: #333;"><div style="height: 100%; width: 0%;"></div></div>
          <span>0:00</span>
        </div>
      </${Panel}>
    `)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})

// ── TransitionViewer ──────────────────────────────────────────────────────

import { TransitionViewer } from './media/transition-viewer.mjs'

describe('TransitionViewer', () => {
  test('renders empty without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      html`<${TransitionViewer}
        style=${{ width: '100px', height: '100px' }}
      />`,
    )
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  test('transitionTo shows initial element without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const ref = { current: null }
    render(
      html`<${TransitionViewer}
        ref=${ref}
        style=${{ width: '100px', height: '100px' }}
      />`,
    )
    if (ref.current) ref.current.transitionTo(html`<div>Content</div>`)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})

// ── Pill ──────────────────────────────────────────────────────────────────────

import { Pill } from './io/pill.mjs'

describe('Pill', () => {
  test('renders static variant without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(html`<${Pill} color="primary">Hello</${Pill}>`)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  test('renders dismiss variant without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(html`<${Pill} color="secondary" onDismiss=${() => {}}>Tag</${Pill}>`)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  test('renders interactive icon variant without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      html`<${Pill} color="success" icon="play" onIconClick=${() => {}}>Playing</${Pill}>`,
    )
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  test('renders template toggle variant without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(html`
      <${Pill}
        color="warning"
        options=${['a', 'b', 'c']}
        onTemplateChange=${() => {}}
      >{'{{a}}'}</${Pill}>
    `)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  test('renders disabled state without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      html`<${Pill} color="danger" disabled=${true} onDismiss=${() => {}}>Tag</${Pill}>`,
    )
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  test('renders all color themes without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    for (const color of [
      'primary',
      'secondary',
      'warning',
      'success',
      'danger',
    ]) {
      render(html`<${Pill} color=${color}>Label</${Pill}>`)
    }
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  test('renders clickable variant without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      html`<${Pill} color="primary" onClick=${() => {}}>clickable</${Pill}>`,
    )
    render(
      html`<${Pill} color="secondary" value="explicit" onClick=${() => {}}>with value</${Pill}>`,
    )
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})

// ── ContentEditablePillInput ──────────────────────────────────────────────────

import { ContentEditablePillInput } from './io/content-editable-pill-input.mjs'

describe('ContentEditablePillInput', () => {
  test('renders with no values without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(html`
      <${ContentEditablePillInput}
        values=${[]}
        onValuesChange=${() => {}}
        suggestions=${['tag1', 'tag2']}
        placeholder="Type here..."
      />
    `)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  test('renders with pre-populated values without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(html`
      <${ContentEditablePillInput}
        label="Tags"
        values=${['apple', 'banana']}
        onValuesChange=${() => {}}
        suggestions=${['apple', 'banana', 'cherry']}
      />
    `)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  test('renders disabled state without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(html`
      <${ContentEditablePillInput}
        values=${['tag1']}
        onValuesChange=${() => {}}
        disabled=${true}
      />
    `)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  test('renders with fixedHeight without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(html`
      <${ContentEditablePillInput}
        values=${[]}
        onValuesChange=${() => {}}
        fixedHeight=${120}
      />
    `)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  test('renders with buttonProps overlay without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(html`
      <${ContentEditablePillInput}
        values=${['tag1']}
        onValuesChange=${() => {}}
        onPillClick=${() => {}}
        buttonProps=${{ icon: 'search', title: 'Browse', onClick: () => {} }}
      />
    `)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  test('renders with both buttonProps and secondaryButtonProps without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(html`
      <${ContentEditablePillInput}
        values=${['tag1']}
        onValuesChange=${() => {}}
        buttonProps=${{ icon: 'price-tag', title: 'Browse', onClick: () => {} }}
        secondaryButtonProps=${{ icon: 'capitalize', title: 'Switch mode', onClick: () => {} }}
      />
    `)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  test('renders with getPillTooltip callback without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(html`
      <${ContentEditablePillInput}
        values=${['blue_eyes', 'long hair']}
        onValuesChange=${() => {}}
        getPillTooltip=${(v) => (v === 'blue_eyes' ? 'Character has blue-coloured irises' : null)}
      />
    `)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})

// ── VideoPlayer ───────────────────────────────────────────────────────────

import { VideoPlayer } from './media/video-player.mjs'

describe('VideoPlayer', () => {
  test('renders with videoRef and videoUrl without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const videoRef = { current: null }
    render(
      html`<${VideoPlayer}
        videoRef=${videoRef}
        videoUrl="/demo/sample-video.mp4"
      />`,
    )
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})

// ── AutocompleteDropdown ──────────────────────────────────────────────────

import { AutocompleteDropdown } from './io/autocomplete-dropdown.mjs'

describe('AutocompleteDropdown', () => {
  test('renders nothing when not visible without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const state = {
      visible: false,
      items: [],
      index: -1,
      left: 0,
      top: 0,
      query: '',
    }
    render(
      html`<${AutocompleteDropdown}
        dropdownState=${state}
        onItemClick=${() => {}}
      />`,
    )
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  test('renders visible dropdown with items without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const state = {
      visible: true,
      items: ['foo', 'bar'],
      index: 0,
      left: 0,
      top: 0,
      query: 'f',
    }
    render(
      html`<${AutocompleteDropdown}
        dropdownState=${state}
        onItemClick=${() => {}}
      />`,
    )
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  test('renders visible dropdown with no matches without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const state = {
      visible: true,
      items: [],
      index: -1,
      left: 0,
      top: 0,
      query: 'xyz',
    }
    render(
      html`<${AutocompleteDropdown}
        dropdownState=${state}
        onItemClick=${() => {}}
      />`,
    )
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})

// ── DynamicList ───────────────────────────────────────────────────────────

import { DynamicList } from './layout/dynamic-list.mjs'

const makeItems = () => [
  { id: 1, label: 'Alpha' },
  { id: 2, label: 'Beta' },
]

describe('DynamicList', () => {
  test('renders with string getTitle without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(html`
      <${DynamicList}
        items=${makeItems()}
        renderItem=${(item) => html`<span>${item.label}</span>`}
        getTitle=${(item) => item.label}
        createItem=${() => ({ id: Date.now(), label: '' })}
        onChange=${() => {}}
      />
    `)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  test('renders with getHeaderContent (VNode header) without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(html`
      <${DynamicList}
        items=${makeItems()}
        renderItem=${(item) => html`<span>${item.label}</span>`}
        getTitle=${(item) => item.label}
        getHeaderContent=${(item) => html`<span><strong>${item.label}</strong><em> pill</em></span>`}
        createItem=${() => ({ id: Date.now(), label: '' })}
        onChange=${() => {}}
      />
    `)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  test('renders with getHeaderContent and no getTitle without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(html`
      <${DynamicList}
        items=${makeItems()}
        renderItem=${(item) => html`<span>${item.label}</span>`}
        getHeaderContent=${(item) => html`<strong>${item.label}</strong>`}
        createItem=${() => ({ id: Date.now(), label: '' })}
        onChange=${() => {}}
      />
    `)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  test('renders condensed mode without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(html`
      <${DynamicList}
        condensed=${true}
        items=${makeItems()}
        renderItem=${(item) => html`<span>${item.label}</span>`}
        createItem=${() => ({ id: Date.now(), label: '' })}
        onChange=${() => {}}
      />
    `)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})

// ── SearchSelectModal ─────────────────────────────────────────────────────

import { SearchSelectModal } from './overlays/search-select.mjs'

describe('SearchSelectModal', () => {
  test('renders single mode with items without errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(html`
      <${SearchSelectModal}
        isOpen=${true}
        title="Pick One"
        items=${['Alpha', 'Beta']}
        mode="single"
        onSelect=${() => {}}
        onClose=${() => {}}
      />
    `)
    // Modal renders via createPortal into document.body
    expect(document.body.textContent).toContain('Alpha')
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  test('single mode: itemAction click fires onClick with the normalised item, not onSelect', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const onSelect = vi.fn()
    const onClose = vi.fn()
    const actionSpy = vi.fn()
    render(html`
      <${SearchSelectModal}
        isOpen=${true}
        title="Pick One"
        items=${['Alpha']}
        mode="single"
        itemActions=${[
          {
            icon: 'copy',
            title: 'Clone',
            onClick: actionSpy,
            closeAfter: true,
          },
        ]}
        onSelect=${onSelect}
        onClose=${onClose}
      />
    `)
    const actionButton = document.body.querySelector('button[title="Clone"]')
    expect(actionButton).not.toBeNull()
    fireEvent.click(actionButton)
    expect(actionSpy).toHaveBeenCalledWith({
      label: 'Alpha',
      value: 'Alpha',
      subtitle: '',
    })
    expect(onSelect).not.toHaveBeenCalled()
    // closeAfter: true → modal is closed after the action runs
    expect(onClose).toHaveBeenCalled()
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  test('multi mode: itemAction click does not toggle the row', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const onSelect = vi.fn()
    const actionSpy = vi.fn()
    render(html`
      <${SearchSelectModal}
        isOpen=${true}
        title="Pick Many"
        items=${[{ label: 'Red', value: 'red' }]}
        mode="multi"
        itemActions=${[{ icon: 'copy', title: 'Clone', onClick: actionSpy }]}
        onSelect=${onSelect}
        onClose=${() => {}}
      />
    `)
    const actionButton = document.body.querySelector('button[title="Clone"]')
    expect(actionButton).not.toBeNull()
    fireEvent.click(actionButton)
    expect(actionSpy).toHaveBeenCalledWith({
      label: 'Red',
      value: 'red',
      subtitle: '',
    })
    expect(onSelect).not.toHaveBeenCalled()
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})

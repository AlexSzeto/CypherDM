// Character harness page — a throwaway surface that exercises the character
// API directly, so the write model can be checked in a browser before any real
// sheet exists. Removed when the app shell supplies the real navigation hub.
import { render } from 'preact'
import { html } from 'htm/preact'
import { useState, useEffect } from 'preact/hooks'

import { Page } from './custom-ui/layout/page.mjs'
import { Caption, H1, VerticalLayout } from './custom-ui/themed-base.mjs'
import { currentTheme } from './custom-ui/theme.mjs'
import { log } from './custom-ui/logger.mjs'
import { CharacterRoster } from './app-ui/harness/character-roster.mjs'
import { CharacterEditor } from './app-ui/harness/character-editor.mjs'

/**
 * Harness page root. Shows the roster until a character is opened, then the
 * editor for that character.
 */
function Harness() {
  const [, setTheme] = useState(currentTheme.value)
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => currentTheme.subscribe(setTheme), [])

  useEffect(() => {
    log('harness', 'info', 'Character harness mounted')
  }, [])

  return html`
    <${Page}>
      <${VerticalLayout} gap="large">
        <${VerticalLayout} gap="none">
          <${H1}>Character Harness<//>
          <${Caption}>
            Temporary surface for the character API. Every field saves itself as
            it is committed.
          <//>
        <//>
        ${
          selectedId
            ? html`<${CharacterEditor}
                id=${selectedId}
                onBack=${() => setSelectedId(null)}
              />`
            : html`<${CharacterRoster} onOpen=${setSelectedId} />`
        }
      <//>
    <//>
  `
}

render(html`<${Harness} />`, document.getElementById('app'))

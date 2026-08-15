// Main application entry point for CypherDM.
import { render } from 'preact'
import { html } from 'htm/preact'
import { useState, useEffect } from 'preact/hooks'
import { Page } from './custom-ui/layout/page.mjs'
import { Panel } from './custom-ui/layout/panel.mjs'
import { H1, H2, Caption, VerticalLayout } from './custom-ui/themed-base.mjs'
import { currentTheme } from './custom-ui/theme.mjs'
import { log } from './custom-ui/logger.mjs'

/**
 * Root application component.
 *
 * Subscribes to `currentTheme` so the whole tree re-renders on a theme switch,
 * per the project's theming convention.
 */
function App() {
  const [, setTheme] = useState(currentTheme.value)

  useEffect(() => currentTheme.subscribe(setTheme), [])

  useEffect(() => {
    log('app', 'info', 'CypherDM client mounted')
  }, [])

  return html`
    <${Page}>
      <${VerticalLayout} gap="large">
        <${H1}>CypherDM<//>
        <${Panel} variant="elevated" padding="large">
          <${VerticalLayout} gap="medium">
            <${H2}>Cypher System Web Companion<//>
            <${Caption}>
              Scaffolding is in place: Preact, htm, and goober are wired up and
              the themed base components are rendering. Feature pages land here
              next.
            <//>
          <//>
        <//>
      <//>
    <//>
  `
}

render(html`<${App} />`, document.getElementById('app'))

/**
 * Harness roster — the list of characters on the server, with create, open,
 * and delete. Throwaway UI: it exists to prove the API, and is removed when
 * the real home page lands.
 */
import { html } from 'htm/preact'
import { useCallback, useEffect, useState } from 'preact/hooks'

import { Button } from '../../custom-ui/io/button.mjs'
import { Panel } from '../../custom-ui/layout/panel.mjs'
import { showDialog } from '../../custom-ui/overlays/dialog.mjs'
import {
  Caption,
  H2,
  HorizontalEdgesLayout,
  HorizontalLayout,
  VerticalLayout,
} from '../../custom-ui/themed-base.mjs'
import {
  createCharacter,
  deleteCharacter,
  listCharacters,
} from '../character-api.mjs'

/**
 * @param {Object} props
 * @param {(id: string) => void} props.onOpen - called with the id of the character to open
 * @returns {preact.VNode}
 */
export function CharacterRoster({ onOpen }) {
  const [characters, setCharacters] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setCharacters(await listCharacters())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const handleCreate = useCallback(async () => {
    const record = await createCharacter('New Character')
    onOpen(record.id)
  }, [onOpen])

  const handleDelete = useCallback(
    async (record) => {
      const choice = await showDialog(
        `Delete ${record.name || 'this character'}? This cannot be undone.`,
        'Delete character',
        ['Delete', 'Cancel'],
      )
      if (choice !== 'Delete') return
      await deleteCharacter(record.id)
      refresh()
    },
    [refresh],
  )

  return html`
    <${VerticalLayout} gap="medium">
      <${HorizontalEdgesLayout}>
        <${H2}>Characters<//>
        <${HorizontalLayout} gap="small" fitContent>
          <${Button}
            variant="medium-icon"
            icon="refresh"
            title="Reload the roster"
            onClick=${refresh}
          />
          <${Button}
            variant="medium-icon-text"
            icon="plus"
            color="primary"
            onClick=${handleCreate}
          >
            New character
          <//>
        <//>
      <//>

      ${
        loading
          ? html`<${Caption}>Loading…<//>`
          : characters.length === 0
            ? html`<${Caption}>No characters yet. Create one to start.<//>`
            : characters.map(
                (record) => html`
                  <${Panel}
                    key=${record.id}
                    variant="outlined"
                    padding="medium"
                  >
                    <${HorizontalEdgesLayout}>
                      <${VerticalLayout} gap="none">
                        <strong>${record.name || '(unnamed)'}</strong>
                        <${Caption}>${record.id}<//>
                      <//>
                      <${HorizontalLayout} gap="small" fitContent>
                        <${Button}
                          variant="small-text"
                          color="primary"
                          onClick=${() => onOpen(record.id)}
                        >
                          Open
                        <//>
                        <${Button}
                          variant="small-icon"
                          color="danger"
                          icon="trash"
                          title="Delete character"
                          onClick=${() => handleDelete(record)}
                        />
                      <//>
                    <//>
                  <//>
                `,
              )
      }
    <//>
  `
}

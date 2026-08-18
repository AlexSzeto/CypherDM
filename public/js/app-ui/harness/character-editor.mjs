/**
 * Harness character editor.
 *
 * Every field writes its own dot path as a field-level patch the moment it is
 * committed — there is no save button, and there is deliberately no revert:
 * a character sheet saves itself. Throwaway UI proving the write model; the
 * real sheet arrives with the editor features.
 */
import { html } from 'htm/preact'
import { useCallback, useEffect, useState } from 'preact/hooks'

import { Button } from '../../custom-ui/io/button.mjs'
import { Input } from '../../custom-ui/io/input.mjs'
import { Textarea } from '../../custom-ui/io/textarea.mjs'
import { Panel } from '../../custom-ui/layout/panel.mjs'
import {
  Caption,
  H2,
  H3,
  HorizontalEdgesLayout,
  HorizontalLayout,
  VerticalLayout,
} from '../../custom-ui/themed-base.mjs'
import { getCharacter, patchCharacter } from './character-api.mjs'

const ACTOR = 'harness'
const POOLS = ['might', 'speed', 'intellect']

/**
 * Read a dot path off a record.
 * @param {Object} record
 * @param {string} path
 * @returns {*}
 */
function readPath(record, path) {
  return path.split('.').reduce((node, key) => node?.[key], record)
}

/**
 * The field panels. Split out from `CharacterEditor` so the loading state and
 * the loaded state differ by one child rather than by the whole tree — a
 * component swapped at a stable position unmounts cleanly, where two
 * differently-shaped roots left an orphaned node behind.
 *
 * @param {Object} props
 * @param {Object} props.record - the character record being edited
 * @param {(path: string, value: *) => void} props.stage - update locally without writing
 * @param {(path: string, value: *) => void} props.commit - write one field to the server
 * @returns {preact.VNode}
 */
function EditorFields({ record, stage, commit }) {
  const textField = (path, label) => html`
    <${Input}
      key=${path}
      label=${label}
      id=${`field-${path}`}
      value=${readPath(record, path) ?? ''}
      onInput=${(e) => stage(path, e.currentTarget.value)}
      onBlur=${(e) => commit(path, e.currentTarget.value)}
    />
  `

  const numberField = (path, label) => html`
    <${Input}
      key=${path}
      label=${label}
      id=${`field-${path}`}
      type="number"
      widthScale="compact"
      value=${readPath(record, path) ?? 0}
      onInput=${(e) => stage(path, e.currentTarget.value)}
      onChange=${(e) => commit(path, Number(e.currentTarget.value) || 0)}
    />
  `

  return html`
    <${VerticalLayout} gap="medium">
      <${Panel} variant="elevated" padding="medium">
        <${VerticalLayout} gap="medium">
          <${H2}>Identity<//>
          ${textField('name', 'Name')} ${textField('descriptor', 'Descriptor')}
          ${textField('type', 'Type')} ${textField('focus', 'Focus')}
          <${HorizontalLayout} gap="medium" fitContent>
            ${numberField('tier', 'Tier')} ${numberField('xp', 'XP')}
            ${numberField('effortLimit', 'Effort')}
            ${numberField('cypherLimit', 'Cypher limit')}
            ${numberField('currency.amount', 'Currency')}
          <//>
        <//>
      <//>

      <${Panel} variant="elevated" padding="medium">
        <${VerticalLayout} gap="medium">
          <${H2}>Pools<//>
          ${POOLS.map(
            (pool) => html`
              <${VerticalLayout} key=${pool} gap="small">
                <${H3}>${pool}<//>
                <${HorizontalLayout} gap="medium" fitContent>
                  ${numberField(`pools.${pool}.max`, 'Max')}
                  ${numberField(`pools.${pool}.current`, 'Current')}
                  ${numberField(`pools.${pool}.edge`, 'Edge')}
                <//>
              <//>
            `,
          )}
        <//>
      <//>

      <${Panel} variant="elevated" padding="medium">
        <${VerticalLayout} gap="medium">
          <${H2}>Notes<//>
          <${Textarea}
            id="field-notes"
            rows=${5}
            value=${record.notes}
            onInput=${(e) => stage('notes', e.currentTarget.value)}
            onBlur=${(e) => commit('notes', e.currentTarget.value)}
          />
          <${Caption}>Last saved ${record.modifiedAt}<//>
        <//>
      <//>
    <//>
  `
}

/**
 * @param {Object} props
 * @param {string} props.id - character id to edit
 * @param {() => void} props.onBack - called when the user leaves the editor
 * @returns {preact.VNode}
 */
export function CharacterEditor({ id, onBack }) {
  const [record, setRecord] = useState(null)
  const [error, setError] = useState(null)

  const reload = useCallback(async () => {
    try {
      setRecord(await getCharacter(id))
      setError(null)
    } catch (loadError) {
      setError(String(loadError))
    }
  }, [id])

  useEffect(() => {
    reload()
  }, [reload])

  /**
   * Commit one field. The server's response is the new truth, so the record is
   * re-seeded from it rather than from the local edit.
   */
  const commit = useCallback(
    async (path, value) => {
      try {
        setRecord(await patchCharacter(id, [{ path, value }], ACTOR))
        setError(null)
      } catch (patchError) {
        setError(String(patchError))
      }
    },
    [id],
  )

  /** Update the local copy without writing, so typing stays responsive. */
  const stage = useCallback((path, value) => {
    setRecord((current) => {
      if (!current) return current
      const next = { ...current }
      const segments = path.split('.')
      const last = segments.pop()
      let target = next
      for (const segment of segments) {
        target[segment] = { ...target[segment] }
        target = target[segment]
      }
      target[last] = value
      return next
    })
  }, [])

  return html`
    <${VerticalLayout} gap="medium">
      <${HorizontalEdgesLayout}>
        <${Button}
          variant="medium-icon-text"
          icon="chevron-left"
          onClick=${onBack}
        >
          Back to roster
        <//>
        <${Button} variant="medium-icon-text" icon="refresh" onClick=${reload}>
          Reload from server
        <//>
      <//>
      ${
        error
          ? html`<${Panel} variant="outlined" color="danger" padding="small"
              >${error}<//
            >`
          : null
      }
      ${
        record
          ? html`<${EditorFields}
              record=${record}
              stage=${stage}
              commit=${commit}
            />`
          : html`<${Caption}>Loading…<//>`
      }
    <//>
  `
}

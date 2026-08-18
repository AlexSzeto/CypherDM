/**
 * Harness list editor.
 *
 * Proves the one property that matters about list rows: every row is addressed
 * by the uid the server assigned it, so editing one row while another is added
 * or deleted can never rewrite the wrong row. Throwaway UI — the real surface
 * arrives with `character-editor-lists`.
 */
import { html } from 'htm/preact'
import { useCallback } from 'preact/hooks'

import { Input } from '../../custom-ui/io/input.mjs'
import { Select } from '../../custom-ui/io/select.mjs'
import { DynamicList } from '../../custom-ui/layout/dynamic-list.mjs'
import { Panel } from '../../custom-ui/layout/panel.mjs'
import { showDialog } from '../../custom-ui/overlays/dialog.mjs'
import {
  H2,
  HorizontalLayout,
  VerticalLayout,
} from '../../custom-ui/themed-base.mjs'
import {
  addListItem,
  patchListItem,
  removeListItem,
} from '../character-api.mjs'

const ACTOR = 'harness'

/** Enum options, mirroring the enums in `characters.schema.json`. */
const OPTIONS = {
  proficiency: ['trained', 'specialized', 'inability'],
  poolType: ['might', 'speed', 'intellect'],
  cypherType: ['manifest', 'subtle'],
}

/**
 * The lists the harness renders, and the fields it exposes for each.
 * `kind` picks the control: text, number, or one of the enums in OPTIONS.
 */
const LISTS = [
  {
    name: 'skills',
    title: 'Skills',
    fields: [
      { key: 'name', label: 'Name', kind: 'text' },
      { key: 'proficiency', label: 'Proficiency', kind: 'proficiency' },
      { key: 'source', label: 'Source', kind: 'text' },
      { key: 'description', label: 'Description', kind: 'text' },
    ],
  },
  {
    name: 'abilities',
    title: 'Abilities',
    fields: [
      { key: 'name', label: 'Name', kind: 'text' },
      { key: 'cost', label: 'Cost', kind: 'number' },
      { key: 'poolType', label: 'Pool', kind: 'poolType' },
      { key: 'description', label: 'Description', kind: 'text' },
    ],
  },
  {
    name: 'attacks',
    title: 'Attacks',
    fields: [
      { key: 'name', label: 'Name', kind: 'text' },
      { key: 'damage', label: 'Damage', kind: 'number' },
      { key: 'description', label: 'Description', kind: 'text' },
    ],
  },
  {
    name: 'cyphers',
    title: 'Cyphers',
    fields: [
      { key: 'name', label: 'Name', kind: 'text' },
      { key: 'level', label: 'Level', kind: 'text' },
      { key: 'cypherType', label: 'Type', kind: 'cypherType' },
      { key: 'effect', label: 'Effect', kind: 'text' },
    ],
  },
  {
    name: 'equipment',
    title: 'Equipment',
    fields: [
      { key: 'name', label: 'Name', kind: 'text' },
      { key: 'description', label: 'Description', kind: 'text' },
    ],
  },
]

/**
 * @param {Object} props
 * @param {Object} props.record - the character record being edited
 * @param {(record: Object) => void} props.onRecord - re-seed the editor from a server response
 * @returns {preact.VNode}
 */
export function CharacterLists({ record, onRecord }) {
  /**
   * Adding and removing are explicit handlers rather than diffs of the array
   * DynamicList would hand back: the server owns row identity, so the list is
   * a view of the record rather than a local array the component mutates.
   */
  const handleAdd = useCallback(
    async (listName) => {
      const { record: updated } = await addListItem(
        record.id,
        listName,
        {},
        ACTOR,
      )
      onRecord(updated)
    },
    [record.id, onRecord],
  )

  const handleDelete = useCallback(
    async (listName, row) => {
      const choice = await showDialog(
        `Delete "${row.name || 'this row'}"?`,
        'Delete row',
        ['Delete', 'Cancel'],
      )
      if (choice !== 'Delete') return
      onRecord(await removeListItem(record.id, listName, row.uid, ACTOR))
    },
    [record.id, onRecord],
  )

  const commitField = useCallback(
    async (listName, uid, key, value) => {
      onRecord(
        await patchListItem(
          record.id,
          listName,
          uid,
          [{ path: key, value }],
          ACTOR,
        ),
      )
    },
    [record.id, onRecord],
  )

  const renderField = (listName, item, field) => {
    const id = `row-${listName}-${item.uid ?? item._localId}-${field.key}`

    if (OPTIONS[field.kind]) {
      return html`
        <${Select}
          key=${field.key}
          id=${id}
          label=${field.label}
          widthScale="normal"
          value=${item[field.key] ?? OPTIONS[field.kind][0]}
          options=${OPTIONS[field.kind].map((value) => ({
            label: value,
            value,
          }))}
          onChange=${(e) =>
            commitField(listName, item.uid, field.key, e.target.value)}
        />
      `
    }

    const isNumber = field.kind === 'number'
    return html`
      <${Input}
        key=${field.key}
        id=${id}
        label=${field.label}
        type=${isNumber ? 'number' : 'text'}
        widthScale=${isNumber ? 'compact' : 'normal'}
        value=${item[field.key] ?? (isNumber ? 0 : '')}
        onBlur=${(e) =>
          commitField(
            listName,
            item.uid,
            field.key,
            isNumber
              ? Number(e.currentTarget.value) || 0
              : e.currentTarget.value,
          )}
      />
    `
  }

  return html`
    <${VerticalLayout} gap="medium">
      ${LISTS.map(
        (list) => html`
          <${Panel} key=${list.name} variant="elevated" padding="medium">
            <${VerticalLayout} gap="small">
              <${H2}>${list.title}<//>
              <${DynamicList}
                items=${record[list.name] ?? []}
                showDragButton=${false}
                condensed=${true}
                createItem=${() => ({ _localId: String(Date.now()) })}
                getTitle=${(item) => item.name || '(unnamed)'}
                onAdd=${() => handleAdd(list.name)}
                onDelete=${(item) => handleDelete(list.name, item)}
                onChange=${() => {}}
                renderItem=${(item) => html`
                  <${HorizontalLayout} gap="small" alignItems="flex-end">
                    ${list.fields.map((field) =>
                      renderField(list.name, item, field),
                    )}
                  <//>
                `}
              />
            <//>
          <//>
        `,
      )}
    <//>
  `
}

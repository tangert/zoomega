import * as React from 'react';
import * as ReactDOM from 'react-dom'
import styled from 'styled-components';
// Import the Slate editor factory.
import { createEditor, Transforms, Range, Editor, Text } from 'slate'
// Import the Slate components and React plugin.
import {
  Slate, Editable, ReactEditor, withReact, useSelected,
  useFocused
} from 'slate-react'
import { theme, DEFAULT_CARD_CONTENT } from './../constants'
import { CHARACTERS } from './../data/characters';

import { useSelect } from "downshift";

const Portal = ({ children }) => {
  return ReactDOM.createPortal(children, document.body)
}

const ContentWrapper = styled.div`
  width: 100%;
  height: 100%;
  resize: none;
  border: none;
  overflow: scroll;
  font-family: sans-serif;
  font-size: ${theme.body}rem;
  min-height: 150px;
  padding: ${theme.padding}px;
  flex-grow: 1;
`

const BoldMark = ({ children }) => (
  <strong>{children}</strong>
)

const CodeElement = props => {
  return (
    <pre {...props.attributes}>
      <code>{props.children}</code>
    </pre>
  )
}


const DefaultElement = props => {
  return <p {...props.attributes}>{props.children}</p>
}



const Leaf = props => {
  const isLink = props.leaf.type === 'wikilink'
  return (
    <span
      {...props.attributes}
      style={{ fontWeight: props.leaf.bold ? 'bold' : 'normal', backgroundColor: isLink ? 'red' : 'transparent' }}
    >
      {props.children}
    </span>
  )
}

const items = [
  'apple',
  'orange',
  'banana'
]

const menuStyles = {
  maxHeight: "200px",
  overflowY: "auto",
  width: "150px",
  margin: 0,
  borderTop: 0,
  background: "white"
};

const DropdownSelect = (props) => {
  const {
    isOpen,
    selectedItem,
    getToggleButtonProps,
    getLabelProps,
    getMenuProps,
    highlightedIndex,
    getItemProps,
  } = useSelect({ items });
  return (
    <div style={{ display: 'inline-block', zIndex: '9999' }}>
      <label {...getLabelProps()}>Choose an element:</label>
      <button {...getToggleButtonProps()}>{selectedItem || "Elements"}</button>
      <ul {...getMenuProps()} style={menuStyles}>
        {isOpen &&
          items.map((item, index) => (
            <li
              style={
                highlightedIndex === index ? { backgroundColor: "#bde4ff" } : {}
              }
              key={`${item}${index}`}
              {...getItemProps({ item, index })}
            >
              {item}
            </li>
          ))}
      </ul>
      {/* if you Tab from menu, focus goes on button, and it shouldn't. only happens here. */}
      <div tabIndex="0" />
    </div>
  );
}

const Content = ({
  id,
  content,
  onUpdate,
  search,
  setSearch,
  searchResults
}) => {
  const editor = React.useMemo(() => withMentions(withReact(createEditor())), [])


  // Target is the current position of the node that you're inserting into.
  const [target, setTarget] = React.useState()
  // Index is the current selected index in the search results array.
  const [index, setIndex] = React.useState(0)
  // const [search, setSearch] = React.useState('')
  const ref = React.useRef()


  // this is the basic search...
  // now you can hook this up to a fuzzy searcher that goeos through the content and titles of all your data! then you can link to cards.
  const chars = CHARACTERS.filter(c =>
    c.toLowerCase().startsWith(search.toLowerCase())
  ).slice(0, 10)

  const renderElement = React.useCallback(props => {
    switch (props.element.type) {
      case 'code':
        return <CodeElement {...props} />
      case 'mention':
        return <MentionElement {...props} />
      default:
        return <DefaultElement {...props} />
    }
  }, [])

  // Define a leaf rendering function that is memoized with `useCallback`.
  const renderLeaf = React.useCallback(props => {
    return <Leaf {...props} />
  }, [])

  const onKeyDown = React.useCallback(
    event => {
      if (event.ctrlKey) {
        switch (event.key) {
          case '`': {
            event.preventDefault()
            const [match] = Editor.nodes(editor, {
              match: n => n.type === 'code',
            })
            Transforms.setNodes(
              editor,
              { type: match ? null : 'code' },
              { match: n => Editor.isBlock(editor, n) }
            )
            break
          }

          case 'l': {
            event.preventDefault()
            const [match] = Editor.nodes(editor, {
              match: n => n.type === 'wikilink',
            })
            Transforms.setNodes(
              editor,
              { type: match ? null : 'wikilink' },
              { match: n => Text.isText(n), split: true }
            )
            break;
          }

          case 'b': {
            event.preventDefault()
            const [match] = Editor.nodes(editor, {
              match: n => n.bold
            })
            Transforms.setNodes(
              editor,
              { bold: match ? false : true },
              { match: n => Text.isText(n), split: true }
            )
            break
          }
        }
      }
      if (target) {
        switch (event.key) {
          case 'ArrowDown':
            event.preventDefault()
            const prevIndex = index >= searchResults.length - 1 ? 0 : index + 1
            setIndex(prevIndex)
            break
          case 'ArrowUp':
            event.preventDefault()
            const nextIndex = index <= 0 ? searchResults.length - 1 : index - 1
            setIndex(nextIndex)
            break
          case 'Tab':
          case 'Enter':
            event.preventDefault()
            Transforms.select(editor, target)
            insertMention(editor, searchResults[index])
            setSearch('')
            setTarget(null)
            break
          case 'Escape':
            event.preventDefault()
            setSearch('')
            setTarget(null)
            break
        }
      }
    },
    [index, search, target]
  )

  React.useEffect(() => {
    if (target && searchResults.length > 0) {
      const el = ref.current
      const domRange = ReactEditor.toDOMRange(editor, target)
      const rect = domRange.getBoundingClientRect()
      el.style.top = `${rect.top + window.pageYOffset + 24}px`
      el.style.left = `${rect.left + window.pageXOffset}px`
    }
  }, [searchResults.length, editor, index, search, target])

  return (
    <ContentWrapper>
      <Slate editor={editor} value={content} onChange={newValue => {
        onUpdate(id, 'content', newValue)
        const { selection } = editor
        if (selection && Range.isCollapsed(selection)) {
          const [start] = Range.edges(selection)
          const wordBefore = Editor.before(editor, start, { unit: 'word' })
          const before = wordBefore && Editor.before(editor, wordBefore)
          const beforeRange = before && Editor.range(editor, before, start)
          const beforeText = beforeRange && Editor.string(editor, beforeRange)
          const beforeMatch = beforeText && beforeText.match(/^@(\w+)$/)
          const after = Editor.after(editor, start)
          const afterRange = Editor.range(editor, start, after)
          const afterText = Editor.string(editor, afterRange)
          const afterMatch = afterText.match(/^(\s|$)/)

          if (beforeMatch && afterMatch) {
            // if you've recognized an @ character basically.
            console.log("before match: ")
            console.log(beforeMatch)
            console.log("after match: ")
            console.log(beforeMatch)
            setTarget(beforeRange)
            setSearch(beforeMatch[1])
            // start the search at index 0
            setIndex(0)
            return
          }
        }
        setTarget(null)

      }}
      >
        <Editable
          placeholder="Start writing here"
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          onKeyDown={onKeyDown}
        />
        {target && searchResults.length > 0 && (
          <Portal>
            <div
              ref={ref}
              style={{
                top: '-9999px',
                left: '-9999px',
                position: 'absolute',
                zIndex: 1,
                padding: '3px',
                background: 'white',
                borderRadius: '4px',
                boxShadow: '0 1px 5px rgba(0,0,0,.2)',
              }}
            >
              {searchResults.map(({item}, i) => (
                <div
                  key={item.id}
                  style={{
                    padding: '1px 3px',
                    borderRadius: '3px',
                    background: i === index ? '#B4D5FF' : 'transparent',
                  }}
                >
                  <div>{item.title}</div>
                  <div>{item.children[0]}</div>
                </div>
              ))}
            </div>
          </Portal>
        )}
      </Slate>
    </ContentWrapper>
  )
}


const withMentions = editor => {
  const { isInline, isVoid } = editor

  editor.isInline = element => {
    return element.type === 'mention' ? true : isInline(element)
  }

  editor.isVoid = element => {
    return element.type === 'mention' ? true : isVoid(element)
  }

  return editor
}

const insertMention = (editor, character) => {
  const mention = { type: 'mention', character, children: [{ text: '' }] }
  Transforms.insertNodes(editor, mention)
  Transforms.move(editor)
}

const Element = props => {
  const { attributes, children, element } = props
  switch (element.type) {
    case 'mention':
      return <MentionElement {...props} />
    default:
      return <p {...attributes}>{children}</p>
  }
}

const MentionElement = ({ attributes, children, element }) => {
  const selected = useSelected()
  const focused = useFocused()
  return (
    <span
      {...attributes}
      contentEditable={false}
      style={{
        padding: '3px 3px 2px',
        margin: '0 1px',
        verticalAlign: 'baseline',
        display: 'inline-block',
        borderRadius: '4px',
        backgroundColor: '#eee',
        fontSize: '0.9em',
        boxShadow: selected && focused ? '0 0 0 2px #B4D5FF' : 'none',
      }}
    >
      @{element.character}
      {children}
    </span>
  )
}

export default Content;
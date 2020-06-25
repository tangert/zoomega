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
import { DEFAULT_CARD_CONTENT } from './../constants'
import { useSelect } from "downshift";
import { DispatchContext, ThemeContext } from './../App';
import { Flipped } from 'react-flip-toolkit'

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
  font-size: ${props => props.theme.body}rem;
  min-height: 150px;
  padding: ${props => props.theme.padding}px;
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

const Content = ({
  id,
  content,
  onUpdate,
  search,
  setSearch,
  searchResults,
  setIsTyping,
}) => {
  const editor = React.useMemo(() => withMentions(withReact(createEditor())), [])

  const { dispatch, fuse } = React.useContext(DispatchContext);
const { theme } = React.useContext(ThemeContext);

  // Target is the current position of the node that you're inserting into.
  const [target, setTarget] = React.useState()
  // Index is the current selected index in the search results array.
  const [index, setIndex] = React.useState(0)
  // const [search, setSearch] = React.useState('')
  const ref = React.useRef()

  const renderElement = React.useCallback(props => {
    switch (props.element.type) {
      case 'code':
        return <CodeElement {...props} />
      case 'mention':
        return <MentionElement goToLevel={(id) => dispatch({ type: 'SET_LEVEL', data: { id } })}{...props} />
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
      if (event.key === '@') {
        // set search every time you want to reference something
        dispatch({ type: 'SET_SEARCH_INDEX' });
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
            insertMention(editor, search, searchResults[index])
            setSearch('')
            setTarget(null)
            break
          case 'Escape':
            event.preventDefault()
            setSearch('')
            setTarget(null)
            break
          case ' ':
            event.preventDefault();

            if (search) {
              event.preventDefault();
              // Replace the text in  the current node with that text and a space.
              const { selection } = editor
              // console.log(selection)
              Transforms.insertText(editor, ' ', { at: selection.focus })
              // setSearch(`${search} `)

              break;
            } else {
              setSearch('')
              setTarget(null)
            }
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
    <Flipped inverseFlipId={id}>
      <ContentWrapper theme={theme}>
        <Slate
          editor={editor} value={content} onChange={newValue => {
            onUpdate(id, 'content', newValue)
            const { selection } = editor

            if (selection && Range.isCollapsed(selection)) {
              const [start] = Range.edges(selection)
              let newStart;
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
            onFocus={(e) => setIsTyping(true)}
            onBlur={(e) => setIsTyping(false)}
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
                {searchResults.map(({ item }, i) => (
                  <div
                    key={item.id}
                    style={{
                      padding: '1px 3px',
                      borderRadius: '3px',
                      background: i === index ? '#B4D5FF' : 'transparent',
                    }}
                  >
                    <div>{item.title}</div>
                  </div>
                ))}
              </div>
            </Portal>
          )}
        </Slate>
      </ContentWrapper>
    </Flipped>
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

// some mentions dont have items. fix that.
const insertMention = (editor, search, { item }) => {
  if (item) {
    const mention = { type: 'mention', search, item, children: [{ text: '' }] }
    Transforms.insertNodes(editor, mention)
    Transforms.move(editor)
  }
}

const MentionElement = ({ attributes, children, search, goToLevel, element }) => {
  // now, onclick you link to that card!
  // you grab the id from cards
  const selected = useSelected()
  const focused = useFocused()
  const { item } = element;
  return (
    <span
      {...attributes}
      contentEditable={false}
      onClick={() => goToLevel(item.id)}
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
      {item.title}
      {children}
    </span>
  )
}

export default Content;
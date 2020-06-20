import * as React from 'react';
import styled from 'styled-components';
// Import the Slate editor factory.
import { createEditor, Transforms, Editor } from 'slate'
// Import the Slate components and React plugin.
import { Slate, Editable, withReact } from 'slate-react'
import { theme, DEFAULT_CARD_CONTENT } from './../constants'

const ContentWrapper = styled.div`
  width: 100%;
  resize: none;
  border: none;
  overflow: visible;
  font-family: sans-serif;
  font-size: ${theme.body}rem;
  min-height: 150px;
  padding: ${theme.padding}px;
  flex-grow: 1;
`

const BoldMark = ({ children }) =>(
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

const Content = ({
  id,
  content,
  onUpdate
}) => {
  const editor = React.useMemo(() => withReact(createEditor()), [])

  const renderElement = React.useCallback(props => {
    switch (props.element.type) {
      case 'code':
        return <CodeElement {...props} />
      default:
        return <DefaultElement {...props} />
    }
  }, [])

  return (
    <ContentWrapper>
        <Slate editor={editor} value={content} onChange={newValue => {
          onUpdate(id, 'content', newValue)
        }}
      >
        <Editable
          placeholder="Start writing here"
          renderElement={renderElement}
          onKeyDown={event => {
          if (event.key === '`' && event.ctrlKey) {
            event.preventDefault()
            // Determine whether any of the currently selected blocks are code blocks.
            const [match] = Editor.nodes(editor, {
              match: n => n.type === 'code',
            })
            // Toggle the block type depending on whether there's already a match.
            Transforms.setNodes(
              editor,
              { type: match ? 'paragraph' : 'code' },
              { match: n => Editor.isBlock(editor, n) }
            )
          }
        }}
        />
      </Slate>
    </ContentWrapper>
  )
}

export default Content;
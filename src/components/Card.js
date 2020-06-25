import * as React from 'react';
import { Flipped } from 'react-flip-toolkit';
import { Resizable } from 're-resizable';
import { Rnd } from 'react-rnd';
import styled from 'styled-components';
import { CARD_SIZE } from './../constants'
import Content from './Content'
import { DispatchContext, ThemeContext } from './../App';

const CardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: ${props => props.theme.foreground};
  color: ${props => props.theme.textPrimary};
  border-radius: 10px;
  width: 100%;
  height: 100%;
  padding: ${props => props.theme.padding * 2}px;
  border: 1px solid rgba(0,0,0,0.1);
  transition-property: box-shadow;
  transition-duration: .1s;
  box-shadow: 0px 4px 10px 2.5px rgba(0,0,0,0.10);
  overflow: scroll;
  &:hover {
    box-shadow: 0px 4px 15px 2.5px rgba(0,0,0,0.20);
  }
`

const CardPreviewContainer = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content flex-start;
  padding-top: ${props => props.theme.padding}px;
  overflow-x: scroll;
`
const CardPreview = styled.div`
  display:  flex;
  align-items: center;
  justify-content: center;
  width: auto;
  white-space: nowrap;
  border: 1px solid ${props => props.theme.textSecondary};
  transition: box-shadow, color;
  transition: .1s;
  font-size:  ${props => props.theme.header}rem;
  padding: ${props => props.theme.padding}px;
  margin-right: ${props => props.theme.padding / 2}px;
  border-radius: 5px;
`

const ActionRow = styled.div`
  display: flex;
  padding-bottom: 8px;
  justify-content: space-between;
  width: 100%;
`

const Input = styled.input`
  border: none;
  font-size: ${props => props.theme.header}rem;
  opacity: 0.7;
  &:focus {
    opacity: 1.0
  }
`
const ActionButton = styled.button`
  background-color: transparent;
  border-radius: 50px;
  opacity: 0;
  transition: 0.2s;
  margin: 4px;
  color: ${props => props.theme.textPrimiary};
  ${CardWrapper}:hover & {
    opacity: 1;
  }
`

const ResizeHandle = styled.div`
  width: 25px;
  height: 25px;
  &:hover {
    background: rgba(0,0,0,0.1);
  }
`

const Card = ({
  id,
  title,
  content,
  position,
  size,
  handleZoom,
  shiftDown,
  search,
  setSearch,
  searchResults,
  currLevel,
  children,
  ...props
}) => {
  const [{ x, y }, setPos] = React.useState({
    x: position.x,
    y: position.y
  });
  const [isTyping, setIsTyping] = React.useState(false)
  const [isFocused, setIsFocused] = React.useState(false)
  const { dispatch } = React.useContext(DispatchContext);
  const { theme } = React.useContext(ThemeContext);

  const onUpdate = (id, property, value) => {
    dispatch({ type: 'UPDATE_CARD', data: { cardId: id, property: property, value: value } })
  }

  const onDelete = (id) => {
    const shouldDelete = confirm('u sure?')
    if (shouldDelete) {
      dispatch({ type: 'REMOVE_CARD', data: { cardId: id, currLevel: currLevel } })
    }
  }

  const focusedStyles = {
    zIndex: 1000,
    left: 0,
    right: 0,
    marginLeft: 'auto',
    marginRight: 'auto',
    width: '50%',
    height: '50%'
  }

  return (
    <Rnd
      position={{ x: x, y: y }}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        padding: `${theme.padding * 2}px`,
        cursor: isTyping ? 'text' : 'move'
      }}
      minWidth={CARD_SIZE * 1.5}
      minHeight={CARD_SIZE * 1.5}
      dragGrid={shiftDown ? [25, 25] : [1, 1]}
      size={{ width: size, height: size }}
      disableDragging={isTyping}
      onDrag={(e, d) => {
        setPos({ x: d.x, y: d.y });
      }}
      onDragStop={(e, d) => {
        setPos({ x: d.x, y: d.y });
        onUpdate(id, 'position', { x: x, y: y })
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        onUpdate(id, 'size', { width: ref.offsetWidth, height: ref.offsetHeight })
      }}
      {...props}
      onBlur={() => setSearch('')}
    >
      <Flipped flipId={id}>
        <CardWrapper theme={theme}>

          { /* Main controls for the card. */}
          <ActionRow theme={theme}>
            <Flipped flipId={`layer-id-${id}`}>
              <Input onFocus={(e) => {
                setIsTyping(true);
                e.stopPropagation();
                e.preventDefault();
              }}

                onBlur={() => setIsTyping(false)}
                onChange={e => onUpdate(id, 'title', e.target.value)}
                value={title}
                theme={theme}
              />
            </Flipped>
            <div>
              <ActionButton onClick={() => onDelete(id)}>x</ActionButton>
              <ActionButton onClick={() => handleZoom(id)}>zoom</ActionButton>
            </div>
          </ActionRow>
          { /* This can be any arbitrary text editor, including code. */}
          <Content
            id={id}
            content={content}
            onUpdate={onUpdate}
            search={search}
            setSearch={setSearch}
            searchResults={searchResults}
            dispatch={dispatch}
            setIsTyping={setIsTyping}
            theme={theme}
          />

          { /* Visualize which cards are in here! */}
          <CardPreviewContainer theme={theme}>
            {children.map(c => {
              return (
                <Flipped key={`child-preview-${c.id}`} flipId={c.id}>
                  <CardPreview>
                    <Flipped inverseFlipId={id}>
                      <div>
                        {c.title}
                      </div>
                    </Flipped>
                  </CardPreview>
                </Flipped>
              );
            })}
          </CardPreviewContainer>
        </CardWrapper>
      </Flipped>
    </Rnd>
  );
};

export default Card;


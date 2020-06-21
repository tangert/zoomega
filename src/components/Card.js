import * as React from 'react';
import { Flipped } from 'react-flip-toolkit';
import { Resizable } from 're-resizable';
import { Rnd } from 'react-rnd';
import styled from 'styled-components';
import { CARD_SIZE, theme } from './../constants'
import Content from './Content'

const CardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: white;
  border-radius: 10px;
  width: 100%;
  height: 100%;
  padding: ${theme.padding * 2}px;
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
  padding-top: ${theme.padding}px;
  overflow-x: scroll;
`
const CardPreview = styled.div`
  display:  flex;
  align-items: center;
  justify-content: center;
  width: auto;
  white-space: nowrap;
  border: 1px solid rgba(0,0,0,0.1);
  transition: box-shadow, color;
  transition: .1s;
  color: rgba(0,0,0,0.7);
  font-size:  ${theme.header}rem;
  padding: ${theme.padding}px;
  margin-right: ${theme.padding / 2}px;
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
  font-size: ${theme.header}rem;
  opacity: 0.7;
  &:focus {
    opacity: 1.0
  }
`
const ActionButton = styled.button`
  color: black;
  background-color: transparent;
  border: grey;
  border-radius: 50px;
  opacity: 0;
  transition: 0.2s;
  ${CardWrapper}:hover & {
    opacity: 1;
  }
`

const Card = ({
  id,
  title,
  content,
  position,
  size,
  handleZoom,
  onUpdate,
  onDelete,
  shiftDown,
  children,
  ...props
}) => {
  const [{ x, y }, setPos] = React.useState({
    x: position.x,
    y: position.y
  });
  const [isTyping, setIsTyping] = React.useState(false)
  const [isFocused, setIsFocused] = React.useState(false)

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
        padding: `${theme.padding * 2}px`
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
    >
      <Flipped flipId={id}>
        <CardWrapper>
        
        { /* Main controls for the card. */ }
          <ActionRow>
            <Flipped flipId={`layer-id-${id}`}>
              <Input onFocus={(e) => {
                setIsTyping(true);
                e.stopPropagation();
                e.preventDefault();
              }}

                onBlur={() => setIsTyping(false)}
                onChange={e => onUpdate(id, 'title', e.target.value)}
                value={title} />
            </Flipped>
            <div>
              <ActionButton onClick={() => onDelete(id)}>x</ActionButton>
              <ActionButton onClick={() => handleZoom(id)}>zoom</ActionButton>
            </div>
          </ActionRow>

          { /* This can be any arbitrary text editor, including code. */ }
          <Content id={id} content={content} onUpdate={onUpdate}/>
          
          { /* Visualize which cards are in here! */ }
          <CardPreviewContainer>
            {children.map(c => {
              return (
                <Flipped key={`child-preview-${c.id}`} flipId={c.id}>
                  <CardPreview>
                    {c.title}
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


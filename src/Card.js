import * as React from 'react';
import { useDrag, usePinch, useGesture } from 'react-use-gesture';
import { Flipped } from 'react-flip-toolkit';
import { Resizable } from 're-resizable';
import { Rnd } from 'react-rnd';

const Card = ({
  id,
  content,
  position,
  size,
  handleZoom,
  onUpdate,
  onDelete,
  children
}) => {
  const [{ x, y }, setPos] = React.useState({
    x: position.x,
    y: position.y
  });
  const [isTyping, setIsTyping] = React.useState(false)

  return (
    <Rnd
      position={{ x: x, y: y }}
      size={{ width: size.width, height: size.height }}
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
    >
      <Flipped key={id} flipId={id}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'white',
            borderRadius: '10px',
            overflow: 'visible',
            height: '100%',
            width: '100%',
            padding: '8px',
            border: '1px solid rgba(0,0,0,0.25)'
          }}
        >
          <Flipped flipId={`layer-id-${id}`}>
            <div>
              <Flipped inverseFlipId={`layer-id-${id}`}>
                <div contentEditable suppressContentEditableWarning>{id}</div>
              </Flipped>
            </div>
          </Flipped>
          <textarea
            value={content}
            onFocus={(e) => {
              setIsTyping(true);
              e.stopPropagation();
              e.preventDefault();
            }}
            onBlur={() => setIsTyping(false)}
            onChange={e => onUpdate(id, 'content', e.target.value)}
            style={{
              width: '100%',
              height: '100%',
              resize: 'none',
              border: 'none',
              overflow: 'visible',
            }}
          />
          <button onClick={() => handleZoom(id)}>zoom zoom</button>
          <button onClick={() => onDelete(id)}>{'delete'}</button>
          <div>
            {children.map(c => {
              return (
                <Flipped key={`child-preview-${c}`} flipId={c}>
                  <div
                    style={{
                      padding: '8px',
                      backgroundColor: 'lightgreen',
                      borderRadius: '10px'
                    }}
                  >
                    <Flipped inverseFlipId={c}>
                      <div>{c}</div>
                    </Flipped>
                  </div>
                </Flipped>
              );
            })}
          </div>
        </div>
      </Flipped>
    </Rnd>

  );
};

export default Card;

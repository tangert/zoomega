import * as React from 'react'
import * as ReactDOM from 'react-dom'
import Card from './Card'
import { Flipper, Flipped } from 'react-flip-toolkit'
import { omit } from 'lodash'

/*
you want to build a basic zui like a blog.

BASICS:
[x] each layer is a text box
[x] you can zoom into each text box
    - theres a button where you can zoom in
[x] store everything as a flat list
[x] remmeber the location of each box
[x] set the content of each box
[x] animate transition between border and root
[x] visualize immediate children

[x] rewrite usestate to use reducer. this can handle
- [x] adding cards
- [x] updating cards (content, position, size)
- [x] deleting cards
- [x] choosing path

Refactoring:
- [] change drag state updates to redux only based on drag end and then eveyrthing else is local state
[] fix text input


Card UX:
[x] resize cards
[] make adding / text tool either t, shift, or command
[] add new cards are location where you touch
[] replace text area with contenteditable...?
[] save state to db.json

Next steps:
[] undo / redo
 - undo delte
[] slash commands at the cursor level
[] visualize content of first few immediate children in cards
[] a layers panel
- brief overview of everything
- can calculate the tree lazily by querying children of each component and only rendering one level at a time... essentially same as actual visualization

[] CLUI!
 - CRUD operations through CLUI each card is content indexed. you can start typing 
 - delete [search by title or content], identify the card, then delete
 - new card
 - connect 
 - move
[] integrate with KSP
[] sell this as a $40 note taking app, everything is exportable, your data is yours, 
[] use Inter as font
[] styled components
[] warnings / modals for basic interaction, perhaps use an existing design system library like GitHub
[] add optional title
[] dark mode
[] make preview of breadcrum the first 20 chars of the content of the card
[] make breadcrumb itself editable
[] emoji selection for bread crumbs
[] add pinch gestures

[] search 
[] connecting cards
[] backlinks
[] more metadata
-- time stamps
-- tags
-- connections
-- have a triple store for connections

[] select like a canvas to delete or group
[] work on styles
- [] bread crumbs
- [] typography
[] mobile support

[] export as markdown with folders and a file describing locations 
*/

const initialState = {
  /*
  - stored flat by UUID
  - have display names
  - each element has a reference to its parent and its children
  - this way you can access any card at once and iterate through them easily, update and delete cards without dealing with nested operations,
*/
  path: ['root'],
  cards: {
    root: {
      id: 'root',
      children: [],
      parent: null,
    }
  }
}

const genID = () => '_' + Math.random().toString(36).substr(2, 9);
const CARD_WIDTH = 200
const CARD_HEIGHT = 200

const App = () => {

  React.useEffect(() => {
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup', onKeyUp)
  }, [])
  
  const [shiftDown, setShiftDown] = React.useState()
  const onKeyDown = (event) => {
    if (event.key === 'Shift') {
      setShiftDown(true)
    }
  }
  const onKeyUp = (event) => {
    setShiftDown(false)
  }

  const createLayer = (parent, position) => ({
    id: genID(),
    title: "",
    content: "",
    position: position || { x: 0, y: 0 },
    size: { width: CARD_WIDTH, height: CARD_HEIGHT },
    children: [],
    parent: parent
  })

  // Idea, can replce curr level with parent of passed id
  const reducer = (state, action) => {
    switch (action.type) {
      // Card state actions
      case 'ADD_CARD': {
        const { cards } = state;
        const { currLevel, position } = action.data
        const newLayer = createLayer(currLevel, position)
        return {
          ...state,
          cards: {
            ...cards,
            [currLevel]: {
              ...cards[currLevel],
              children: [...cards[currLevel].children, newLayer.id]
            },
            [newLayer.id]: newLayer
          }
        }
      }
      case 'UPDATE_CARD': {
        const { cards } = state;
        const { cardId, property, value } = action.data
        return {
          ...state,
          cards: {
            ...cards,
            [cardId]: {
              ...cards[cardId],
              [property]: value
            }
          }
        }
      }
      case 'REMOVE_CARD': {
        const { cards } = state;
        const { cardId, currLevel } = action.data
        const { children } = cards[cardId];

        // Remove the card and all of it's children.
        const newCards = omit(cards, [...children, cardId])
        return {
          ...state,
          cards: {
            ...newCards,
            [currLevel]: {
              ...newCards[currLevel],
              // Then remove any references of that child from the parent
              children: newCards[currLevel].children.filter(c => c !== cardId)
            }
          }
        }
      }
      case 'SET_LEVEL': {
        const { level } = action.data
        return {
          ...state,
          path: state.path.slice(0, level)
        }
      }
      case 'ZOOM_TO_LEVEL': {
        const { level } = action.data
        return {
          ...state,
          path: [...state.path, level]
        }
      }
      default:
        return state
    }
  }

  const [state, dispatch] = React.useReducer(reducer, initialState);

  const { cards, path } = state;

  // Standard set of breadcrumbs that are just pushed / popped like a stack
  // Derived from state
  const currLevel = path[path.length - 1];
  const currCards = cards[currLevel].children

  // Triggers ZUI animations
  const [isZooming, setIsZooming] = React.useState(false)

  const handleCanvasDoubleClick = ({ clientX, clientY }) => {
    if(shiftDown)
    dispatch({
      type: 'ADD_CARD',
      data: {
        currLevel: currLevel,
        position: {
          x: clientX - CARD_WIDTH / 2,
          y: clientY - CARD_HEIGHT / 2
        }
      }
    })
  }

  return (
    <Flipper flipKey={isZooming} onComplete={() => console.log(currLevel)}>
      <div style={{
        width: '100%', height: '100vh',
        fontFamily: 'sans-serif'
      }}>
        <div style={{ display: 'flex' }}>{path.map((loc, idx) => {
          // if you're at the bottom of the path, render a div. Not a button
          if (idx === path.length - 1) {
            return (
              <Flipped key={`layer-id-${loc}`} flipId={`layer-id-${loc}`}>
                <div key={idx}>{loc}</div>
              </Flipped>
            )
          } else {
            // Navigate to higher levels
            return (
              <div key={idx} style={{ display: 'inline-flex' }}>

                <Flipped key={`layer-id-${loc}`} flipId={`layer-id-${loc}`}>
                  <button onClick={() => {
                    dispatch({ type: 'SET_LEVEL', data: { level: idx + 1 } });
                    setIsZooming(!isZooming);
                  }}>
                    {loc}
                  </button>
                </Flipped>
                <span>/</span>
              </div>
            )
          }
        })}
        </div>
        <button onClick={() => dispatch({ type: 'ADD_CARD', data: { currLevel: currLevel } })}>
          'new layer'
        </button>
        <div onDoubleClick={(e) => handleCanvasDoubleClick(e)} style={{ width: '100%', height: '100vh' }}>
          {currCards.map((l, idx) => {
            const { id, content, position, size, children } = cards[l]
            return (
              <Card
                handleZoom={(id) => {
                  dispatch({ type: 'ZOOM_TO_LEVEL', data: { level: id } });
                  setIsZooming(!isZooming);
                }
                }
                key={id}
                id={id}
                children={children}
                content={content}
                position={position}
                size={size}
                onDelete={(id) => dispatch({ type: 'REMOVE_CARD', data: { cardId: id, currLevel: currLevel } })}
                onUpdate={(id, property, value) => dispatch({ type: 'UPDATE_CARD', data: { cardId: id, property: property, value: value } })}
              />
            )
          })}
        </div>
      </div>
      <Flipped flipId={currLevel}>
        <div style={{
          backgroundColor: 'white',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100vh',
          zIndex: -100
        }} />
      </Flipped>
    </Flipper>
  )
}

ReactDOM.render(
  <App />,
  document.getElementById('root')
);
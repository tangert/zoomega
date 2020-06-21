import * as React from 'react'
import * as ReactDOM from 'react-dom'
import Card from './components/Card'
import Breadcrumb from './components/Breadcrumb'
import { Flipper, Flipped } from 'react-flip-toolkit'
import { omit } from 'lodash'
import axios from 'axios';
import styled from 'styled-components';
import { CARD_SIZE, DEFAULT_CARD_CONTENT, theme } from './constants'
import Fuse from 'fuse.js'
// import * as FlexSearch from 'flexsearch';

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
- [x] change drag state updates to redux only based on drag end and then eveyrthing else is local state
[x] fix text input
[x] fix localstorage



Card UX:
[x] resize cards
[x] make adding / text tool either t, shift, or command
[x] add new cards are location where you touch
[x] delete allcards in a layer
[x] save title
[x] navigate to immedaite children
[] basic styles
[] focused view of card 
[] hook up react router
[] select + group and make into a card or delete cards
[] search + select individual, or select all matches



Next steps:
[] visualize content of first few immediate children in cards
[] stacking cards  effect
[] how do you visualize how large something is?

More:
[x] save state to db.json

Extras:
[] undo / redo
[] slash commands at the cursor level
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
[] add optional title
[] use Inter as font
[] styled components
[] dark mode
[] make preview of breadcrum the first 20 chars of the content of the card
[] make breadcrumb itself editable

[] warnings / modals for basic interaction, perhaps use an existing design system library like GitHub

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


function useLocalStorage(defaultValue, key) {
  const [value, setValue] = React.useState(() => {
    const stickyValue = window.localStorage.getItem(key);
    return stickyValue !== null
      ? JSON.parse(stickyValue)
      : defaultValue;
  });
  React.useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue];
}


const fallbackState = {
  /*
  - stored flat by UUID
  - have display names
  - each element has a reference to its parent and its children
  - this way you can access any card at once and iterate through them easily, update and delete cards without dealing with nested operations,
*/
  path: ['root'],
  cards: {
    root: {
      title: 'tyler\'s garden',
      id: 'root',
      children: [],
      parent: null,
    }
  }
}

const BreadcrumbSeparator = styled.div`
  border: none;
  padding: ${theme.padding/2}px ${theme.padding/2}px;
`
const genID = () => '_' + Math.random().toString(36).substr(2, 9);

let fuse;

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

  const createLayer = (parent, position, title) => ({
    id: genID(),
    title: title,
    content: DEFAULT_CARD_CONTENT,
    position: position || { x: 0, y: 0 },
    size: { width: CARD_SIZE, height: CARD_SIZE },
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
        const title = `Card ${cards[currLevel].children.length + 1}`
        const newLayer = createLayer(currLevel, position, title);
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
      case 'REMOVE_ALL_CARDS': {
        const { cards } = state;
        const { currLevel } = action.data
        const newCards = omit(cards, cards[currLevel].children)
        return {
          ...state,
          cards: {
            ...newCards,
            [currLevel]: {
              ...newCards[currLevel],
              children: []
            }
          }
        }
      }
      case 'ZOOM_OUT_TO_LEVEL': {
        const { level } = action.data
        const newPath = state.path.slice(0, level);
        return {
          ...state,
          path: newPath
        }
      }
      case 'ZOOM_TO_LEVEL': {
        const { level } = action.data
        const newPath = [...state.path, level];
        return {
          ...state,
          path: newPath
        }
      }
      // Loads json from the server and uses it as state.
      case 'LOAD_STATE': {
        const { data } = action.data
        return data
      }
      default:
        return state
    }
  }

  const [savedState, setSavedState] = useLocalStorage(fallbackState, 'zoomega-state');
  const [state, dispatch] = React.useReducer(reducer, savedState);
  const [search, setSearch] = React.useState('')
  const [searchResults, setSearchResults] = React.useState([])
  const { cards, path } = state;

  React.useEffect(()=> {
     // Pass in search/setsearch into each component

       // Fuse search engine.
    // Basic architecture
    // Initialize the search index on load.
    // Update the search index on every time you @mention or  wikilink
    if(!fuse) {
      console.log('making new fuse search')
      const searchOptions = {
        includeScore: true,
          // search title and all children's text
          keys: ['title', 'content.children.text']
        }
        const cardList = Object.entries(cards).map(c => c[1])
        // declare the new fuse search engine
        fuse = new Fuse(cardList, searchOptions)
    }
    const result = fuse.search(search)
    setSearchResults(result)
    // listen for top level state
  },[search])

  // Standard set of breadcrumbs that are just pushed / popped like a stack
  // Derived from state  
  const currLevel = path[path.length - 1];
  const currCards = cards[currLevel].children

  // Listen to path change
  React.useEffect(() => {
    if (path) {
      console.log('goot a path!')
      window.location.hash = path.join('/');
    }
    setSavedState(state)
  }, [path]);

  // Triggers ZUI animations
  const [isZooming, setIsZooming] = React.useState(false)

  const handleCanvasDoubleClick = ({ clientX, clientY }) => {
    if (shiftDown)
      dispatch({
        type: 'ADD_CARD',
        data: {
          currLevel: currLevel,
          // this places the card basically where the cursor is
          position: {
            x: clientX - CARD_SIZE / 2,
            y: clientY - CARD_SIZE / 2
          }
        }
      })
  }

  return (
    <Flipper flipKey={isZooming}>
      <div style={{
        width: '100%', height: '100vh',
        fontFamily: 'sans-serif'
      }}>
        <div style={{ display: 'flex' }}>{path.map((loc, idx) => {
          // if you're at the bottom of the path, render a div. Not a button
          const card = cards[loc]
          if (idx === path.length - 1) {
            return (
              <Flipped key={`layer-id-${loc}`} flipId={`layer-id-${loc}`}>
                <Breadcrumb>
                  {card.title}
                </Breadcrumb>
              </Flipped>
            )
          } else {
            // Navigate to higher levels
            return (
              <div key={idx} style={{ display: 'inline-flex', alignItems:'center', justifyContent:'flex-start'}}>
                <Flipped key={`layer-id-${loc}`} flipId={`layer-id-${loc}`}>
                  <Breadcrumb
                    onClick={() => {
                      dispatch({ type: 'ZOOM_OUT_TO_LEVEL', data: { level: idx + 1 } });
                      setIsZooming(!isZooming);
                    }}>
                      {card.title}
                  </Breadcrumb>
                </Flipped>
                <BreadcrumbSeparator>/</BreadcrumbSeparator>
              </div>
                )
              }
            })}
              </div>
              <button onClick={() => dispatch({ type: 'ADD_CARD', data: { currLevel: currLevel } })}>
                new layer
        </button>
              <button onClick={() => {
                const shouldDelete = confirm('this will delete all ur stuff from this layer. u sure?')
                if (shouldDelete) {
                  dispatch({ type: 'REMOVE_ALL_CARDS', data: { currLevel: currLevel } })
                }
              }}>
                delete all! danger!
        </button>
              <button onClick={() => setSavedState(state)}>save</button>
              <div onDoubleClick={(e) => handleCanvasDoubleClick(e)} style={{ width: '100%', height: '100vh' }}>
                {currCards.map((l, idx) => {
                  const { id, title, content, position, size, children } = cards[l]
                  return (
                    <Card
                      key={id}
                      handleZoom={(id) => {
                        dispatch({ type: 'ZOOM_TO_LEVEL', data: { level: id } });
                        setIsZooming(!isZooming);
                      }}
                      title={title}
                      id={id}
                      shiftDown={shiftDown}
                      children={children.map(c => cards[c])}
                      content={content}
                      position={position}
                      size={size}
                      search={search}
                      setSearch={setSearch}
                      searchResults={searchResults}
                      onDelete={(id) => {
                        const shouldDelete = confirm('u sure?')
                        if (shouldDelete) {
                          dispatch({ type: 'REMOVE_CARD', data: { cardId: id, currLevel: currLevel } })
                        }
                      }
                      }
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
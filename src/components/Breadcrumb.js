import * as React from 'react';
import { Flipped } from 'react-flip-toolkit';
import styled from 'styled-components';
import { ThemeContext } from './../App';

const ButtonWrapper = styled.button`
    padding: ${props => props.theme.padding/2}px ${props => props.theme.padding}px;
    background-color: transparent;
    color: ${props => props.theme.textPrimary};
    border-radius: 5px;
    pointer-events: all;
    border: none;
    font-size: 1.2rem;
    transition: 0.2s background-color;
    &:hover {
      background-color: ${props=>props.theme.background};
    }
    &:focus {
      outline: none;
    }
`

const InputWrapper = styled.input`
    padding: ${props => props.theme.padding/2}px ${props => props.theme.padding*1.2}px;
    background-color: transparent;
    color: ${props => props.theme.textPrimary};
    border-radius: 5px;
    pointer-events: all;
    border: none;
    font-size: 1.2rem;
    width: auto;
    transition: 0.2s background-color;
    &:hover {
      background-color: ${props=>props.theme.background};
    }
    
`

const Breadcrumb = ({
  isActive,
  children,
  ...props
}) => {
  const { theme } = React.useContext(ThemeContext);
  return isActive ? (
    <InputWrapper theme={theme} {...props}>
        {children}
    </InputWrapper>
  ) : (
    <ButtonWrapper theme={theme} {...props}>
        {children}
    </ButtonWrapper>
  );
}
export default Breadcrumb;
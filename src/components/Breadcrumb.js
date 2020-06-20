import * as React from 'react';
import { Flipped } from 'react-flip-toolkit';
import styled from 'styled-components';
import { theme } from './../constants'


const BreadcrumbWrapper = styled.button`
    padding: ${theme.padding/2}px ${theme.padding}px;
    background-color: transparent;
    color: ${theme.textPrimary};
    border-radius: 5px;
    pointer-events: all;
    border: none;
    font-size: 1.2rem;
    transition: 0.2s background-color;
    &:hover {
      background-color: #E5E5E5;
    }
`

// const Wrapper = ({ message }) => {
//   return <StyledWrapper>{message}</StyledWrapper>
// }

const Breadcrumb = ({
  isActive,
  children,
  ...props
}) => {
  return (
    <BreadcrumbWrapper {...props}>
    {children}
    </BreadcrumbWrapper>
  )
}
export default Breadcrumb;
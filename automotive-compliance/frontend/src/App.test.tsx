import {describe,it,expect} from 'vitest';
import {render,screen} from '@testing-library/react';
import {BrowserRouter} from 'react-router-dom';
import App from './App';
describe('AutoTrace application shell',()=>{it('renders the product identity and workspace navigation',()=>{render(<BrowserRouter><App/></BrowserRouter>);expect(screen.getByText('AutoTrace')).toBeInTheDocument();expect(screen.getByText('Compliance overview')).toBeInTheDocument();expect(screen.getByLabelText('Select demo account')).toBeInTheDocument();});});

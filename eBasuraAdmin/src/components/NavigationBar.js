
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Collapse,
  Navbar,
  NavbarToggler,
  NavbarBrand,
  Nav,
  NavItem,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem } from 'reactstrap';


export default class NavigationBar extends React.Component {
  constructor(props) {
    super(props);

    this.toggle = this.toggle.bind(this);
    this.state = {
      isOpen: false
    };
  }
  toggle() {
    this.setState({
      isOpen: !this.state.isOpen
    });
  }
  render() {
    return (
        <Navbar 
          color="light" light 
          expand="md"
          className="shadow"
          >
          <NavbarBrand href="/"></NavbarBrand>
          <NavbarToggler onClick={this.toggle} />
          <Collapse isOpen={this.state.isOpen} navbar>
            <Nav className="ml-auto" navbar>
              <NavItem>
                <NavLink className="nav-link" to="/monitor">Monitor</NavLink>
              </NavItem>
              <NavItem>
                <NavLink className="nav-link" to="/collections">Collections</NavLink>
              </NavItem>
              <NavItem>
                <NavLink className="nav-link" to="/users">Users</NavLink>
              </NavItem>
              <NavItem>
                <NavLink className="nav-link" to="/trucks">Trucks</NavLink>
              </NavItem>
              <NavItem>
                <NavLink className="nav-link" to="/batches">Batches</NavLink>
              </NavItem>
            </Nav>
          </Collapse>
        </Navbar>
    );
  }
}
import React, { Component } from 'react';
import logo from './logo.svg';
import { BrowserRouter, Switch, Route, Link } from "react-router-dom";

import PickupLocationsCRUD from './pages/PickupLocationsCRUD.js'
import TrucksCRUD from './pages/TrucksCRUD.js'
import UsersCRUD from './pages/UsersCRUD.js'
import BatchesCRUD from './pages/BatchesCRUD.js';
import NavigationBar from './components/NavigationBar';

class App extends Component {
  render() {
    return (
      <BrowserRouter>
          <div id="container">
            <NavigationBar />
            <Route path="/pickup_locations" component={PickupLocationsCRUD} />
            <Route path="/users" component={UsersCRUD} />
            <Route path="/batches" component={BatchesCRUD} />
            <Route path="/trucks" component={TrucksCRUD} />
          </div>
      </BrowserRouter>
    );
  }
}

export default App;

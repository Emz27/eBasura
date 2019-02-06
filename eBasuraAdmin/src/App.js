import React, { Component } from 'react';
import logo from './logo.svg';
import { BrowserRouter, Switch, Route, Link } from "react-router-dom";

import Monitor from './pages/Monitor.js';
import Collections from './pages/Collections.js'
import UsersCRUD from './pages/UsersCRUD.js'
import TrucksCRUD from './pages/TrucksCRUD.js'
import BatchesCRUD from './pages/BatchesCRUD.js';
import NavigationBar from './components/NavigationBar';

import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCaretUp, faCaretDown } from '@fortawesome/free-solid-svg-icons'

library.add(faCaretUp)
library.add(faCaretDown)

class App extends Component {
  render() {
    return (
      <BrowserRouter>
          <div id="container" className="d-flex flex-column">
            <NavigationBar />
            <Switch>
              <Route path="/monitor" component={Monitor} />
              <Route path="/collections" component={Collections} />
              <Route path="/users" component={UsersCRUD} />
              <Route path="/batches" component={BatchesCRUD} />
              <Route path="/trucks" component={TrucksCRUD} />
              <Route component={Monitor}/>
            </Switch>
          </div>
      </BrowserRouter>
    );
  }
}

export default App;

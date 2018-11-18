import React, { Component } from 'react';


export default class TrucksCRUD extends Component{
  constructor(props){
    super(props);
    this.state = {

    }
  }
  render(){           
      return (
        <div id="trucksCrudContainer">
          TrucksCRUD
          <form>
            <label>
              Name:
              <input type="text" name="name" value />

            </label>
            <input type="submit" value="Submit" />
          </form>
        </div>
      )   
  }
}
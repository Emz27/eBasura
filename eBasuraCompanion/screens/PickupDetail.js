import React, { Component } from 'react'
import { StyleSheet } from 'react-native'
import MapView  from 'react-native-maps'


export default class PickupMap extends Component {
  constructor(props){
    super(props);

  }
  render(){
    return (
      <MapView />
    )
  }
}
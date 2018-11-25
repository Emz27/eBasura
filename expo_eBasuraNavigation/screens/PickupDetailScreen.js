import React from 'react';
import { TouchableHighlight, Text, View, AsyncStorage, FlatList, StyleSheet } from 'react-native'
import { ExpoConfigView } from '@expo/samples';

import * as firebase from 'firebase';
import 'firebase/firestore';

export default class PickupLocationsScreen extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      user: {},
      truck: {},
      pickuplocations: [],
      route: {legs:[]},
      pickup: this.props.navigation.getParam('pickup',{}) 
    };
    
  }
  static navigationOptions = {
    title: 'Pickup Details',
  };


  render() {
    const { navigate } = this.props.navigation;
    return (
      <View style={styles.container}>
        <Text>{this.state.pickup.pickupid}</Text>
        <Text>{this.state.pickup.address}</Text>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container:{
    flex:1,
    backgroundColor:'white',
  },
});
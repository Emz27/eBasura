
import React, { Component } from 'react'
import { StyleSheet, View, StatusBar, Dimensions } from 'react-native'
import MapView, { Marker } from 'react-native-maps'

import Colors from './../constants/Colors.js'

export default class PickupMap extends Component {
  constructor(props){
    super(props);
    this.state = {
      user: props.navigation.getParam('user'),
      pickupLocations: props.navigation.getParam('pickupLocations'),
      currentLocation: props.navigation.getParam('currentLocation'),
    }

  }
  static navigationOptions = {
    header: null
  };
  render(){
    var initialRegion = {
      latitude: this.state.currentLocation.latitude,
      longitude: this.state.currentLocation.longitude,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA,
    };
    
    var markers = createPickupMarkers( this.state.pickupLocations );

    return (
      <View style={styles.container}>
        <StatusBar 
          backgroundColor={Colors.purpleDark}
        />
        <View style={styles.header}></View>
        <MapView
          style={styles.map}
          ref={ref => { this.map = ref; }}
          initialRegion={initialRegion}
          showsUserLocation={true}
          showsMyLocationButton={false}
          toolbarEnabled={false}
          // onLayout={async ()=>{
          //   await this.loadData();
          // }}
          // onPress={(event)=>{
          //   if(this.state.isMockLocation){
          //     this.setCollectorPosition(event.nativeEvent.coordinate);
          //   }
          //   this.closePickupInfo();
          // }}
          // onUserLocationChange={(event)=>{
          //   if(!this.state.isMockLocation){
          //     this.setCollectorPosition(event.nativeEvent.coordinate);
          //   }
          // }}
        >
        { markers }
        </MapView>
        <View style={styles.footer}></View>
      </View>
    )
    
  }
}

function createPickupMarkers(pickups){
  return pickups.map((pickup, index)=>{
    return (
      <Marker
        flat={false}
        key={pickup.pickupDocId}
        coordinate={{
          latitude: pickup.location.latitude,
          longitude: pickup.location.longitude,
        }}
        tracksViewChanges={false}
        // onPress={()=>{
        //   this.setState({selectedPickup: pickup}, this.openPickupInfo)
        // }}
      />
    );

  })
}

let { width, height } = Dimensions.get('window')
const ASPECT_RATIO = width / height
const LATITUDE_DELTA = 0.01
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO

var styles = StyleSheet.create({
  container:{
    flex: 1,
  },
  map:{
    flex:1,
  },
  header:{
    height: 40,
    backgroundColor: Colors.purpleLight,
  },
  footer:{
    height: 40,
    backgroundColor: Colors.purpleLight,
  }
})
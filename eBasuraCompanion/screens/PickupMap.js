
import React, { Component } from 'react'
import { AsyncStorage, Text, Animated,Button, StyleSheet, View, StatusBar, Dimensions } from 'react-native'
import MapView, { Marker } from 'react-native-maps'

import Colors from './../constants/Colors.js'
import firebase from 'react-native-firebase';

export default class PickupMap extends Component {
  constructor(props){
    super(props);
    var user = props.navigation.getParam('user');
    this.state = {
      user: user,
      pickupLocations: props.navigation.getParam('pickupLocations'),
      currentLocation: props.navigation.getParam('currentLocation'),
      isPickupInfoOpen: false,
      selectedPickup: {pickupDocId: ""},
    }
    this.pickupInfoTranslateY = new Animated.Value(-300);
  }
  static navigationOptions = {
    header: null
  };
  openPickupInfo(){
    this.setState({isPickupInfoOpen: true}, async ()=>{
      Animated.spring(this.pickupInfoTranslateY,
        {
          toValue: 30,
          useNativeDriver: true,
        }
      ).start();
    });
  }
  closePickupInfo(){
    this.setState({isPickupInfoOpen: false}, async ()=>{
      Animated.spring(this.pickupInfoTranslateY,
        {
          toValue: -300,
          useNativeDriver: true,
        }
      ).start();
    });
  }

  render(){
    var initialRegion = {
      latitude: this.state.currentLocation.latitude,
      longitude: this.state.currentLocation.longitude,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA,
    };
    var buttonStyle = {
      height: 50,
      width: 100,
      borderRadius: 30,
    }
    
    var markers = this.createPickupMarkers( this.state.pickupLocations );

    return (
      <View style={styles.container}>
        <StatusBar 
          backgroundColor={Colors.purpleDark}
        />
        <View style={styles.header}></View>
        <Animated.View style={[ styles.pickupInfo, {translateY: this.pickupInfoTranslateY} ]}>
          <View style={styles.pickupInfoContentBox}>
              <Text style={{ fontWeight: "bold", fontSize:10}}>{"Address"}</Text>
              <Text style={{ fontSize:8 }}>{this.state.selectedPickup.address}</Text>
          </View>
          <View style={styles.pickupInfoButtonBox}>
            <Button
              onPress={()=>{
              }}
              title="Send Report"
              style={buttonStyle}
            />
            <View style={{height: 5}}/>
            {(this.state.selectedPickup.pickupDocId != this.state.user.pickupDocId)
            ?<Button
              onPress={async ()=>{
                var user = {...this.state.user};  

                user.pickupDocId = this.state.selectedPickup.pickupDocId;
                await firebase.firestore().collection("Users").doc(user.userDocId)
                  .update({pickupDocId: user.pickupDocId});
                this.setState({
                  user: user,
                });
              }}
              title="Subscribe"
              style={buttonStyle}
            />
            :<Button
              
              onPress={async ()=>{
                var user = {...this.state.user};  

                user.pickupDocId = "";
                await firebase.firestore().collection("Users").doc(user.userDocId)
                  .update({pickupDocId: ""});
                this.setState({
                  user: user,
                });
              }}
              title="Unsubscribe"
              style={buttonStyle}
            />}

          </View>
        </Animated.View>
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
          onPress={(event)=>{
            this.closePickupInfo();
          }}
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
  createPickupMarkers(pickups){
    return pickups.map((pickup, index)=>{
      return (
        <Marker
          flat={false}
          key={(pickup.pickupDocId != this.state.user.pickupDocId)?pickup.pickupDocId:pickup.pickupDocId+ (new Date()).toDateString()}
          coordinate={{
            latitude: pickup.location.latitude,
            longitude: pickup.location.longitude,
          }}
          pinColor={(pickup.pickupDocId != this.state.user.pickupDocId)?Colors.purple:"#00ffaa"}
          tracksViewChanges={false}
          onPress={()=>{
            this.setState({selectedPickup: pickup}, this.openPickupInfo)
          }}
        />
      );
  
    })
  }
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
  },
  pickupInfo:{
    position: "absolute",
    flexDirection:"row",
    height: 100,
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: "white",
    zIndex: 4000,
    borderRadius: 10,
    elevation: 5,
  },
  pickupInfoColorLabelBox:{
    height: "100%",
    width:"5%",
    borderBottomStartRadius: 10, 
    borderTopStartRadius: 10,
  },
  pickupInfoContentBox:{
    height:"100%",
    flex:1,
    backgroundColor: "white",
    padding: 5,
  },
  pickupInfoButtonBox:{
    height:"100%", 
    width:"40%",
    borderBottomEndRadius: 10, 
    borderTopEndRadius: 10,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
})
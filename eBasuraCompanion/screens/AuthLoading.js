import React, { Component } from 'react'
import {AsyncStorage, View, ActivityIndicator, StyleSheet, Dimensions } from 'react-native'
import firebase from 'react-native-firebase'
import moment from 'moment'



export default class AuthLoading extends Component{
  constructor(props){
    super(props);
  }
  async componentDidMount(){
    await this.loadData();
  }
  async loadData(){
    var usersRef = firebase.firestore().collection("Users");
    var pushToken = await this.getPushToken();
    var pickupLocations = [];

    var users = await usersRef.where( "pushToken", "==", pushToken ).get();
    if(users.docs.length == 0){
      var user = {
        pushToken: pushToken,
        pickupDocId: "",
        type: "resident",
      }
      await usersRef.add(user);
      await AsyncStorage.setItem("user",JSON.stringify(user));
      return this.loadData();
    }

    user = users.docs[0].data();
    user.userDocId = users.docs[0].id;

    var pickups = await firebase.firestore().collection("PickupLocations").get();
    pickups.docs.forEach(( item, index )=>{
      var doc = item.data();
      pickupLocations.push({
        pickupDocId: item.id,
        ...doc,
      })
    });
    var pos = await getCurrentPosition();

    var currentLocation = {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude, 
    }

    this.props.navigation.navigate("PickupMap", {user, pickupLocations, currentLocation});
  }
  async getPushToken(){
    let pushToken = "";

    if(await firebase.messaging().hasPermission()){
      await firebase.messaging().requestPermission();
    } 
    pushToken = await firebase.messaging().getToken();
    return pushToken;
  }
  render(){
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    )
  }
}
getCurrentPosition = (options = {}) => {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
};


var styles = StyleSheet.create({
  container:{
    flex:1,
    justifyContent: "center",
    alignItems: "center",
  }
})
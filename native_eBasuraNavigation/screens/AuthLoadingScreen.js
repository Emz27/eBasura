
import React from 'react';
import {
  ActivityIndicator,
  AsyncStorage,
  StatusBar,
  StyleSheet,
  View,
  Platform
} from 'react-native';
// import { Constants, Location, Permissions } from 'expo';

import firebase from 'react-native-firebase';
import moment from 'moment';

import polyline from 'google-polyline';

getCurrentPosition = (options = {}) => {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
};

const dumpsiteLocation = {
  latitude: 14.7181,
  longitude: 121.1042,
}
const GOOGLE_API_KEY = 'AIzaSyAKLNDKXRY5niSySOE8TIdz2yFgBmHyhjo';

export default class AuthLoadingScreen extends React.Component {
  constructor(props) {
    super(props);
    console.log("AuthLoadingScreen Start");
    try{
      this._bootstrapAsync();
    }
    catch(error){
      console.log(error);
    }
  }
  async componentWillMount() {

  }
  // Fetch the token from storage then navigate to our appropriate place
  async _bootstrapAsync(){
    //await AsyncStorage.clear();
    const { navigate } = this.props.navigation;
    console.log("AsyncStorage get User");
    var userToken = {};
    try{
      userToken = JSON.parse(await AsyncStorage.getItem('user'));
    }
    catch(e){
      console.log("AsyncStorage get User Failed", e);
    }
    let token = userToken;
    console.log("AsyncStorage fetch successful", userToken);
    if(userToken == null){
      console.log("No User retrieved");
    }
    if (!userToken || userToken == null) {
      console.log("User not logged in redirecting to Sign In");
      return navigate('SignIn');
    }
    
    var userData = {};
    console.log("get user start");
    try{
      userData = await firebase.firestore().collection('Users').where('userId','==',token.userId).get();
    }
    catch(e){
      console.log("get user failed", e);
    }
    console.log("get user success", userData);
    if ( userData.docs.length ){
      this.user = { key: userData.docs[0].id, ...userData.docs[0].data() };

      let pushToken = "";
      const enabled = await firebase.messaging().hasPermission();
      if (enabled) {
        pushToken = await firebase.messaging().getToken();
      } 
      else {
        await firebase.messaging().requestPermissions();
        pushToken = await firebase.messaging().getToken();
      }
      try{
        let res = firebase.firestore().collection("Users").doc(this.user.key).update({ pushToken: pushToken });
      }
      catch(e){ console.log(e) }

      console.log(token);
      console.log("Load Data");
      await this.loadData();
      console.log("Load Data Suceessful, redirecting to MainPage");
      return navigate('Main', JSON.stringify({ 'user':this.user }));
    }
    else {
      console.log("Deleting user from session");
      await AsyncStorage.removeItem('user');
      console.log("Session removed, redirecting to SignIn")
      return navigate('SignIn');
    }
  }
  generatePaths(route){
    var paths = [];
    var pickupPaths = [];
    route.legs.forEach((leg)=>{
      let legPoints = [];
      leg.steps.forEach((step)=>{
        decodedPolyline = polyline.decode(step.polyline.points );
        let stepPoints = [];
        decodedPolyline.forEach((item)=>{
          stepPoints = [...stepPoints, { latitude: item[0], longitude: item[1] }];
        })
        legPoints = [...legPoints, ...stepPoints];
      });
      paths = [...paths, ...legPoints];
      pickupPaths.push(legPoints);
    })
    return {pickupPaths, paths};
  }
  async getDirection( destinationLatLng, waypointsLatLng){
    console.log("google api get directions start");
    let pos = {
      coords: {
        latitude: 14.61881,
        longitude: 121.057171,
      }
    }
    console.log("geolocation start");
    try{
      pos = await getCurrentPosition();
    }
    catch(e){
      console.log("Fail to get device location ", e)
    }
    var origin = pos.coords.latitude+","+pos.coords.longitude;
    var destination = destinationLatLng.latitude+","+destinationLatLng.longitude;
    var waypoints = waypointsLatLng.map( item => item.latitude+','+item.longitude ).join('|');
    let route = {};
    let response = {};
    let responseJson = {};
    try{
      response = await fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&waypoints=optimize:true|${waypoints}&key=${GOOGLE_API_KEY}`);
      responseJson = await response.json();
      if(responseJson.status == "OK"){
        route = responseJson.routes[0];
        return route;
      } 
    }
    catch(e){
      console.log("Get directions failed", e);
    }
    console.log("Get directions finished", responseJson);
    return false;
  }
  async loadData(){
    console.log("Load Data Start");
    let collectionsToday = [];
    let collectionsHistory = [];
    var collectedCollections =[];
    var pendingCollections = [];
    var skippedCollections = [];
    console.log("Get collections by userId ", this.user.userId);
    let collections = {};
    try{
      collections = await firebase.firestore().collection("Collections")
                                .where("collectors","array-contains",this.user.userId)
                                .get();
    }
    catch(e){
      console.log("Get collections failed", e);
    }
    console.log("fetch successful", collections);
    var collectionsHistoryOrder = 1;
    var collectedCollectionsOrder = 1;
    var pendingCollectionsOrder = 1;
    var skippedCollectionsOrder = 1;
    collections.docs.forEach((doc)=>{
      let currentDate = new Date();
      let collectionDate = new Date(doc.data().dateTime);
      //console.console.log(`current date: ${currentDate}, doc date: ${collectionDate}, isSame : ${moment(currentDate).isSame(collectionDate,'day')}`)
      var data = doc.data();
      var col = {
        key: doc.id,
        address: data.address,
        comment: data.comment,
        dateTime: data.dateTime,
        location: data.location,
        pickupId: data.pickupId,
        pickupDocId: data.pickupDocId,
        status: data.status,
        truckDocId: data.truckDocId,
        collectors: data.collectors,
      }
      if(moment(currentDate).isSame(collectionDate,'day')){
        
        if(col.status == "pending"){
          col.order = pendingCollectionsOrder;
          pendingCollections.push(col);
          pendingCollectionsOrder++;
        }
        else if(col.status == "collected"){
          col.order = collectedCollectionsOrder;
          collectedCollections.push(col);
          collectedCollectionsOrder++;
        }
        else{
          col.order = skippedCollectionsOrder;
          skippedCollections.push(col);
          skippedCollectionsOrder++;
        }
        collectionsToday.push(col);
      }
      else{
        col.order = collectionsHistoryOrder;
        collectionsHistory.push(col);
        collectionsHistoryOrder++;
      }
    });

    if(collectionsToday.length <= 0){
      console.log("Create batchProcess");
      var batchProcess = {};
      try{
        batchProcess = await firebase.firestore().batch();
      }
      catch(e){
        console.log("Failed to create batchProcess");
      }
      console.log("batchProcess end");
    
      console.log("Get truck start",this.user.truck.truckDocId )
      var truckResult = {};
      try{
        truckResult = await firebase.firestore().collection("Trucks").doc(this.user.truck.truckDocId).get();
      }
      catch(e){
        console.log("Failed to get truck", e);
      }
      console.log("Get truck end", truckResult);

      if(truckResult.exists){
        var data = truckResult.data();

        data.batch.pickupLocations.forEach((pickup)=>{
          batchProcess.set(
            firebase.firestore().collection("Collections").doc(),
            {
              address: pickup.address,
              comment: pickup.comment,
              dateTime: new Date(),
              location: pickup.location,
              pickupDocId: pickup.pickupDocId,
              status: "pending",
              batchId: data.batch.batchId,
              truckDocId: truckResult.id,
              collectors: data.collectors.map((c)=>c.userId),
            }
          );
        });
        console.log("Database commit");
        try{
          await batchProcess.commit();
        }
        catch(e){
          console.log("Commit failed", e)
        }
        
        console.log("commit finished");
        return this.loadData();
      }

    }
    console.log("collectionsToday"+collectionsToday);
    console.log("collectionsHistory"+collectionsHistory);
    


    let route = {}
    var destination = dumpsiteLocation;
    console.log("waypoints coords", waypoints);
    var waypoints = pendingCollections.map( item => { return {latitude: item.location.latitude, longitude: item.location.longitude}} );
    route = await this.getDirection(destination, waypoints);
    this.paths = [];
    this.pickupPaths = [];
    if(route != false) {
      console.log("Retrieved atleast one route", route);
      // arrange 
      pendingCollections = route.waypoint_order.map((item, index)=>{
        return pendingCollections[item];
      })
      var r = this.generatePaths(route);
      this.paths = r.paths;
      this.pickupPaths = r.pickupPaths;
    }

    console.log("Save data start")
    try{
      await AsyncStorage.setItem('user', JSON.stringify(this.user));
      await AsyncStorage.setItem('collectionsToday',  JSON.stringify(collectionsToday));
      await AsyncStorage.setItem('collectionsHistory',  JSON.stringify(collectionsHistory));
      await AsyncStorage.setItem('route',  JSON.stringify(route));
      await AsyncStorage.setItem('paths',  JSON.stringify(this.paths));
      await AsyncStorage.setItem('pickupPaths',  JSON.stringify(this.pickupPaths));
      await AsyncStorage.setItem('collectedCollections',  JSON.stringify(collectedCollections));
      await AsyncStorage.setItem('pendingCollections',  JSON.stringify(pendingCollections));
      await AsyncStorage.setItem('skippedCollections',  JSON.stringify(skippedCollections));
    }
    catch(e){
      console.log("");
    } 
    console.log("Save data end");
    console.log("Load data end");
  }
  // Render any loading content that you like here
  render() {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
        <StatusBar barStyle="default" />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
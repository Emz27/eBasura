
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

var polyline = require( 'google-polyline' );

getCurrentPosition = (options = {}) => {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
};

// const screenName = "AuthLoadingScreen";
// const log = (message = "", data = {})=>{
//   console.console.log(screenName + " --> "+ message, data);
// }

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
    // if (Platform.OS === 'android' && !Constants.isDevice) {
    // } 
    // else {
    //   let { status } = await Permissions.askAsync(Permissions.LOCATION);
    //   if (status !== 'granted') {
    //   }
    // }
  }
  // Fetch the token from storage then navigate to our appropriate place
  _bootstrapAsync = async () => {
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
  };
  loadData = async ()=>{
    console.log("Load Data Start");
    let collectionsToday = [];
    let collectionsHistory = [];
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
    var collectionsTodayIndex = 1;
    var collectionsHistoryIndex = 1;
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
        col.order = collectionsTodayIndex;
        collectionsToday.push(col);
        collectionsTodayIndex++;
      }
      else{
        col.order = collectionsHistoryIndex;
        collectionsHistory.push(col);
        collectionsHistoryIndex++;
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
    console.log("geolocation end", pos);
  
    origin = pos.coords.latitude+","+pos.coords.longitude;

    let destination = origin;
    let waypoints = collectionsToday.map( item => item.location.latitude+','+item.location.longitude ).join('|');
    console.log("origin coords", origin);
    console.log("waypoints coords", waypoints);
    console.log("google api get directions start");
    let response = {};
    let responseJson = {};
    try{
      response = await fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&waypoints=optimize:true|${waypoints}&key=${GOOGLE_API_KEY}`);
      responseJson = await response.json();
    }
    catch(e){
      console.log("Get directions failed", e);
    }
    console.log("Get directions finished", responseJson);
    let route = {}
    if(responseJson.status === "OK") {
      console.log("Retrieved atleast one route", responseJson.routes[0]);
      route = responseJson.routes[0];
      // arrange 
      collectionsToday = route.waypoint_order.map((item, index)=>{
        return collectionsToday[item];
      })
    }
    this.coordinates = [];
    this.paths = [];
    console.log("Route legs", route.legs);
    route.legs.forEach((leg)=>{
      leg.steps.forEach((step)=>{
        let startLatLng = {latitude: step.start_location.lat, longitude: step.start_location.lng};
        let endLatLng = {latitude: step.end_location.lat, longitude: step.end_location.lng}
        this.coordinates.push(startLatLng);
        this.coordinates.push(endLatLng);
        decodedPolyline = polyline.decode(step.polyline.points );
        decodedPolyline.forEach((item)=>{
          this.paths = [...this.paths, { latitude: item[0], longitude: item[1] }];
        })
      })
    })
    console.log("Save data start")
    try{
      await AsyncStorage.setItem('user', JSON.stringify(this.user));
      await AsyncStorage.setItem('collectionsToday',  JSON.stringify(collectionsToday));
      await AsyncStorage.setItem('collectionsHistory',  JSON.stringify(collectionsHistory));
      await AsyncStorage.setItem('route',  JSON.stringify(route));
      await AsyncStorage.setItem('coordinates',  JSON.stringify(this.coordinates));
      await AsyncStorage.setItem('paths',  JSON.stringify(this.paths));
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
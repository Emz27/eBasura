import React from 'react';
import { TouchableHighlight, Text, View, AsyncStorage, FlatList, StyleSheet, Dimensions,Modal, Alert } from 'react-native'

import firebase from 'react-native-firebase';
import MapView, {Marker} from 'react-native-maps'

import moment from 'moment'

let { width, height } = Dimensions.get('window')
const ASPECT_RATIO = width / height
const LATITUDE_DELTA = 0.008
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO

const METERS_TO_NOTIFY = 20;
const METERS_TO_REACH = 20;
const PATH_DIVISION_RATIO = 3
const emptyCoord = { latitude: "", longitude: ""}
const emptyPickup = { key: "" }

export default class PickupDetail extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      user: {},
      truck: {},
      pickupCollections: [],
      route: {legs:[]},
      pickup: this.props.navigation.getParam('pickup',{}) 
    };
  }
  static navigationOptions = {
    header: null,
    title: 'Pickup Details',
  };

  async loadData(){

    var result = await firebase.firestore().collection("Collections").where("pickupDocId","==", this.state.pickup.pickupDocId).get();
    var pickupCollections = [];
    if(result.docs.length > 0){
      result.docs.forEach((item,index)=>{
        var data = item.data();
        var pickup = {...data};
        pickup.key = moment(data.dateTime).format("D/M/YYYY  h:mm a")
        pickupCollections.push(pickup);
      })
    }
    pickupCollections.sort(function(a,b){
      return new Date(b.dateTime) - new Date(a.dateTime);
    });
    this.map.animateToNavigation({
      latitude: this.state.pickup.location.latitude,
      longitude: this.state.pickup.location.longitude,
    },0,0);
    this.setState({pickupCollections})
  }
  render() {
    var pickup = this.state.pickup;
    var initialRegion = {
      latitude: this.state.pickup.location.latitude,
      longitude: this.state.pickup.location.longitude,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA,
    };

    var pickupMarker = 
    <Marker
      flat={false}
      tracksViewChanges={false}
      coordinate={{
        latitude: pickup.location.latitude,
        longitude: pickup.location.longitude,
      }}
    />;
    return (
      <View style={styles.container}>
        
        <View style={[styles.InfoContainer]}>
          <View style={[styles.detail]}>
            <Text style={{fontWeight: "bold" }}>{"Address"}</Text>
            <Text>{this.state.pickup.address}</Text>
          </View>
          <MapView
            style={styles.map}
            ref={ref => { this.map = ref; }}
            initialRegion={initialRegion}
            showsUserLocation={false}
            showsMyLocationButton={false}
            toolbarEnabled={false}
            onLayout={async ()=>{
              await this.loadData();
            }}
          >
          {pickupMarker}
          </MapView>
        </View>
        <FlatList
          style={{flex:1}}
          data={this.state.pickupCollections}
          renderItem={({item}) =>{
            return (
              <View style={[{
                flexDirection: "row",
                borderColor: "black",
                borderWidth: 1,
                borderRadius: 5,
                marginTop: 10,
                marginHorizontal: 10,
                padding: 10,
                // elevation: 5,
              }]}>
                
                <View style={{}}>
                  <View style={{flex:1}}><Text><Text style={{fontWeight: "bold"}}>{"Date: "}</Text>{moment(item.dateTime).format("D/M/YYYY")}</Text></View>
                  <View style={{flex:1}}>{(item.status!="pending")?<Text><Text style={{fontWeight: "bold"}}>{"Time: "}</Text>{moment(item.dateTime).format("h:mm a")}</Text>:null}</View>
                  <View style={{flex:1}}><Text><Text style={{fontWeight: "bold"}}>{"Status: "}</Text>{item.status}</Text></View>
                </View>
                <View style={{flex:1,alignItems: "center"}}>
                  <Text style={{fontWeight: "bold"}}>{"Driver Remarks"}</Text>
                  <Text>{(item.driverRemarks)?item.driverRemarks:"none"}</Text>
                </View>
              </View>
            )
          }}
        />

      </View>
    )
  }
}



const styles = StyleSheet.create({
  container:{
    flex:1,
    backgroundColor:'white',
    marginTop: 40,
    marginBottom: 40,
    padding: 10,
  },

  InfoContainer:{
    width: "100%",
    height: 150,
    flexDirection: "row",
  },
  detail:{
    flex:1,
    alignItems: "center",
  },
  map:{
    flex:1,
  },
});
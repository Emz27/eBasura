
import React, { Component } from 'react'
import { Modal, TextInput, TouchableOpacity, AsyncStorage, Text, Animated,Button, StyleSheet, View, StatusBar, Dimensions, Alert } from 'react-native'
import MapView, { Marker } from 'react-native-maps'

import Colors from './../constants/Colors.js'
import firebase from 'react-native-firebase';

import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Entypo from 'react-native-vector-icons/Entypo';

const DetailIcon = (<MaterialCommunityIcons name="information-variant" size={15} color="black" />)
const FeedbackIcon = (<Entypo name="chat" size={15} color="black" />)

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
      modalVisible: false,
      residentRemarks: "",
    }
    this.pickupInfoTranslateY = new Animated.Value(-300);
  }
  static navigationOptions = {
    header: null
  };
  componentDidMount() {
    this.notificationDisplayedListener = firebase.notifications().onNotificationDisplayed((notification) => {
        // Process your notification as required
        // ANDROID: Remote notifications do not contain the channel ID. You will have to specify this manually if you'd like to re-display the notification.
    });
    this.notificationListener = firebase.notifications().onNotification((notification) => {
        // Process your notification as required
        notification.android.setChannelId('channelId');
        notification.setSound("default");
        notification.android.setPriority(firebase.notifications.Android.Priority.High);
        firebase.notifications().displayNotification(notification);
    });
  }

  componentWillUnmount() {
      this.notificationDisplayedListener();
      this.notificationListener();
  }
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
        <Modal
          animationType="slide"
          transparent={true}
          visible={this.state.modalVisible}
          presentationStyle={"overFullScreen"}
          onRequestClose={() => {
            // Alert.alert('Modal has been closed.');
          }}>
          <View style={{
              marginTop: "40%", 
              marginHorizontal: 20, 
              backgroundColor:"white", 
              padding: 15, 
              elevation: 5,
              borderRadius: 5,
            }}>
              <Text>Write your feedback message for the selected pickup location</Text>
              <TextInput
                style={{marginTop: 20,marginBottom: 20,height:80, width:"100%", borderColor: 'gray', borderWidth: 1}}
                onChangeText={(text) =>{
                  return this.setState({residentRemarks:text});
                }}
                value={this.state.residentRemarks}
                placeholder="Feedback..."
                multiline={true}
                numberOfLines={3}
              />
              <Button
                onPress={async ()=>{
                  
                  var feedback = this.state.residentRemarks;
                  this.setState({
                    modalVisible: !this.state.modalVisible ,
                    residentRemarks: "",
                  }, async ()=>{
                    Alert.alert(
                      'Feedback sent!',
                      'feedback: '+ feedback,
                      [
                      ],
                      { cancelable: true }
                    )
                    firebase.firestore().collection("Feedbacks").add({
                      userDocId: this.state.user.userDocId,
                      message: feedback,
                      pickupDocId: this.state.selectedPickup.pickupDocId,
                      dateTime: new Date(),
                    });
                  });
                }}
                title="Ok"
                color="#841584"
              />
              <Button
                onPress={()=>{
                  this.setState({residentRemarks: "", modalVisible: !this.state.modalVisible });
                }}
                title="Cancel"
                color="#841584"
              />

          </View>
        </Modal>
        <View style={styles.header}></View>
        <Animated.View style={[ styles.pickupInfo, {translateY: this.pickupInfoTranslateY} ]}>
          <View style={{flex: 1, flexDirection: "row"}}>
            <View style={styles.pickupInfoContentBox}>
                <Text style={{ fontWeight: "bold", fontSize:10}}>{"Address"}</Text>
                <Text style={{ fontSize:8 }}>{this.state.selectedPickup.address}</Text>
            </View>
            <View style={styles.pickupInfoButtonBox}>
              <TouchableOpacity
                style={{
                    borderWidth:1,
                    borderColor:'rgba(0,0,0,0.2)',
                    alignItems:'center',
                    justifyContent:'center',
                    width:30,
                    height:30,
                    backgroundColor:'#fff',
                    borderRadius:30,
                    elevation:2,
                    marginHorizontal:5,
                  }}
                  onPress={()=>{
                    //this.props.navigation.navigate('PickupDetail',{pickup:item});
                  }}
                >
                {DetailIcon}
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                    borderWidth:1,
                    borderColor:'rgba(0,0,0,0.2)',
                    alignItems:'center',
                    justifyContent:'center',
                    width:30,
                    height:30,
                    backgroundColor:'#fff',
                    borderRadius:30,
                    elevation:2,
                    marginHorizontal:5,
                  }}
                  onPress={()=>{
                    this.setState({
                      modalVisible: !this.state.modalVisible, 
                      residentRemarks: "",
                    })
                  }}
                >
                {FeedbackIcon}
              </TouchableOpacity>
              <View style={{height: 5}}/>
            </View>
          </View>
          <View>
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
    height: 120,
    top: 20,
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
    flexDirection: "row",
    borderBottomEndRadius: 10, 
    borderTopEndRadius: 10,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
})
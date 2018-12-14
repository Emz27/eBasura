import React from 'react';
import { ScrollView, TouchableOpacity,TouchableNativeFeedback, Button, TouchableWithoutFeedback, Text, View, AsyncStorage, FlatList, StyleSheet, Animated, Dimensions } from 'react-native'
// import { MapView , Icon, } from 'expo'
import MapView from 'react-native-maps'
import { Marker} from 'react-native-maps'


import firebase from 'react-native-firebase';

import moment from 'moment';


import { MonoText } from '../components/StyledText';

let { width: windowX } = Dimensions.get('window')

let { width, height } = Dimensions.get('window')
const ASPECT_RATIO = width / height
const LATITUDE_DELTA = 0.008
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO

export default class collectionsTodayScreen extends React.Component {
  constructor(props){
    super(props);
    this.loadData();
    this.state = {
      user:{},
      collectionsToday:[],
      collectionsHistory:[],
      type:"current",
    }
    this.coordinates = [];
    this.uniqueCollections = [];

    this.willFocusNavigationCallback = this.props.navigation.addListener(
      'didFocus',
      async (payload) => {
        var collectionsToday = [...this.state.collectionsToday];

        var refreshedCollectionsToday = JSON.parse(await AsyncStorage.getItem('collectionsToday'));

        collectionsToday.map(( item, index )=>{
          var pickup = refreshedCollectionsToday.find((p, index)=>{
            return item.key == p.key;
          })
          if(pickup){
            item.dateTime = pickup.dateTime;
            item.status = pickup.status;
          }
        });
        this.setState({
          collectionsToday
        })
      }
    );
    
  }
  infoLeftOpenOffset = (-1)*windowX*.1;
  infoRightOpenOffset = windowX*.1;
  infoLeftCloseOffset = (-1)*windowX*.4;
  infoRightCloseOffset = windowX*.4;
  static navigationOptions = {
    header: null,
  }
  onPressSignOut = async () =>{
    await AsyncStorage.removeItem('eBasuraNavigationUser');
    this.props.navigation.navigate('AuthLoading');
  }
  componentWillUnmount(){
    this.willFocusNavigationCallback.remove();
  }
  async loadData(){
    var collectionsHistory = await this.getCollectionsHistory();
    var collectionsToday = await this.getCollectionsToday();
    var user = await this.getUser();

    this.uniqueCollections = [...collectionsToday];

    collectionsHistory.forEach((pickup, index)=>{
      var duplicatePickupCount = 0;

      this.uniqueCollections.reduce((duplicatePickupCount, u, i)=>{
        if(u.pickupid == pickup.pickupId ) duplicatePickupCount++;
        return duplicatePickupCount;
      });
      if(duplicatePickupCount == 0) this.uniqueCollections.push(pickup);
    })

    

    this.coordinates = [];
    

    this.uniqueCollections.forEach((pickup, index)=>{
      this.coordinates.push({
        latitude: pickup.location.latitude,
        longitude: pickup.location.longitude,
      })
    })
    console.log(JSON.stringify(this.coordinates)+"hello coordinates");
    // this.map.fitToCoordinates(this.coordinates, {
    //   edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
    //   animated: true,
    // });
    //this.map.fitToSuppliedMarkers(this.coordinates, true);
    this.setState({
      collectionsToday: collectionsToday,
      collectionsHistory: collectionsHistory,
      user: user,
    })

    console.log('Pickup Locations Loaded');
  }
  async getCollectionsHistory(){
    var collectionsHistory = JSON.parse(await AsyncStorage.getItem('collectionsHistory'));
    collectionsHistory = collectionsHistory.map((pickup)=>{
      pickup.isOpen = false;

      pickup.infoLeftCurrentOffset = new Animated.Value( this.infoLeftCloseOffset );
      pickup.infoRightCurrentOffset = new Animated.Value( this.infoRightCloseOffset );

      return pickup;
    });
    return collectionsHistory;
  }
  async getCollectionsToday(){
    var collectionsToday = JSON.parse(await AsyncStorage.getItem('collectionsToday'))
    
    collectionsToday = collectionsToday.map((pickup)=>{
      pickup.isOpen = false;
      pickup.infoLeftCurrentOffset = new Animated.Value( this.infoLeftCloseOffset );
      pickup.infoRightCurrentOffset = new Animated.Value( this.infoRightCloseOffset );

      return pickup;
    });

    return collectionsToday;
  }
  async getUser(){
    return JSON.parse(await AsyncStorage.getItem('user'));
  }
  async onItemPress(item){

    // this.map.animateToNavigation({
    //   latitude: item.location.latitude,
    //   longitude: item.location.longitude,
    // },0,0);
    
    const anims = [];
    var addAnim = (pickupItem, type)=>{
      anims.push(
      Animated.spring(
        pickupItem.infoLeftCurrentOffset,
        {
          toValue: (type!="open")?this.infoLeftCloseOffset: this.infoLeftOpenOffset,
          friction: 3,
          tension: 40,
          useNativeDriver: true,}
      ),
      Animated.spring(
        pickupItem.infoRightCurrentOffset,
        {
          toValue: (type!="open")?this.infoRightCloseOffset: this.infoRightOpenOffset,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }
      ));
      if(type!="open")pickupItem.isOpen = false;
      else pickupItem.isOpen = true;
    };
    
    var openItems = [...this.state.collectionsToday, ...this.state.collectionsHistory].filter((i)=>{
      return i.isOpen == true;
    });
    if(openItems.length){
      openItems.forEach((i)=>{
        if(i.key != item.key)addAnim(i,"close");
      })
    }
    if(item.isOpen) addAnim(item,"close");
    else addAnim(item,"open");

    await Animated.parallel( anims,{ useNativeDriver: true }).start();
    // item.markerRef.showCallout();
    
  }
  render() {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
        <TouchableOpacity
          style={{
              borderWidth:1,
              borderColor:'rgba(0,0,0,0.2)',
              alignItems:'center',
              justifyContent:'center',
              width:100,
              height:30,
              backgroundColor:'#fff',
              borderRadius:30,
              elevation:2,
              marginHorizontal:20,
              marginVertical:"auto",
              borderColor:((this.state.type == "current")?"blue":"black")
            }}
          onPress={()=>{
            this.setState({type:"current"});
          }}
        >
          <MonoText style={[{color:(this.state.type == "current")?"blue":"black"}]}>Current</MonoText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[{
              borderWidth:1,
              borderColor:'rgba(0,0,0,0.2)',
              alignItems:'center',
              justifyContent:'center',
              width:100,
              height:30,
              backgroundColor:'#fff',
              borderRadius:30,
              elevation:2,
              marginHorizontal:20,
              marginVertical:"auto",
              borderColor:((this.state.type == "history")?"blue":"black")
            }]}
          onPress={()=>{
            this.setState({type:"history"});
          }}
        >
            <MonoText style={[{color:(this.state.type == "history")?"blue":"black"}]}>History</MonoText>
        </TouchableOpacity>
        </View>
        <FlatList
          style={styles.listContainer}
          data={(this.state.type=="current")?this.state.collectionsToday:this.state.collectionsHistory}
          renderItem={({item}) =>{
            let statusColor = "white";
                  var bottomMargin = {};
                  switch(item.status){
                    case "skipped":{
                      statusColor = "gray"
                      break;
                    }
                    case "collected":{
                      statusColor = "green"
                      break;
                    }
                    default:{
                      break;
                    }
                  }
                  return (
                  <View
                    style={[styles.itemContainer]}>
                    <TouchableNativeFeedback
                        onPress={()=>{
                          this.onItemPress(item);
                        }}
                        background={TouchableNativeFeedback.SelectableBackground()}>
                      <View style={styles.itemContentContainer}>
                        <MonoText>{item.pickupid}</MonoText>
                        <MonoText style={{fontSize: 9}}>{item.address}</MonoText>
                        <MonoText style={{fontSize: 10}}>{
                          (()=>{
                            if( item.status == "collected") return "Collected: "+moment(item.dateTime).format("D/M/YYYY  h:mm a");
                            else if( item.status == "skipped" ) return "Skipped Collection: "+moment(item.dateTime).format("D/M/YYYY  h:mm a");
                            else return "- - -";
                          })()
                        }</MonoText>
                      </View>
                    </TouchableNativeFeedback>
                    <Animated.View 
                      style={[
                          styles.itemInfoContainer,
                          styles.itemLeftInfoContainer,
                          {
                            backgroundColor: statusColor
                          },
                          { 
                            transform: [{ translateX: item.infoLeftCurrentOffset }] 
                          },
                        ]}
                    >
                      <View style={{overflow:"hidden",flex:1,flexDirection:"row",alignItems: "center", alignContent: "space-between", elevation:2, backgroundColor:"white", margin:5,paddingRight: windowX*.1,paddingLeft: windowX*.1, borderRadius: 10}}>
                        <MonoText>{item.status}</MonoText>
                      </View>
                    </Animated.View>
                    <Animated.View 
                      style={[
                        styles.itemInfoContainer,
                        styles.itemRightInfoContainer,
                        {
                          backgroundColor: statusColor
                        },
                        { 
                          transform: [{ translateX: item.infoRightCurrentOffset }] 
                        },
                      ]}
                    >
                      <View style={{flex:1,flexDirection:"row",alignItems: "center", alignContent: "space-between", elevation:2, backgroundColor:"white", margin:5,paddingLeft: windowX*.1, borderRadius: 10}}>
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
                            marginLeft:5,
                          }}
                      >
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
                            this.props.navigation.navigate('PickupDetail',{pickup:item});
                          }}
                      >
                      </TouchableOpacity>
                      </View>
                    </Animated.View>
                  </View>)
          }}
        />
      </View>
    );
  }
}


const styles = StyleSheet.create({
  container:{
    flex:1,
    marginTop: 40,
    marginBottom: 40,
    backgroundColor:"white",
  },
  headerContainer:{
    height:50,
    elevation: 3,
    flexDirection:"row",
    justifyContent:"center",
    alignItems:"center",
    backgroundColor:"white",
    //position:"absolute",
    //top:20,
    zIndex: 1000,
  },
  map:{
    position:"absolute",
    top:0,
    bottom:0,
    right:0,
    left:0,
  },
  listContainer :{
    flex:1,
    zIndex: 1,
  },
  itemContainer :{
    height:80,
    marginTop: 5,
  },
  itemContentContainer: {
    flex:1,
    backgroundColor: "white",
    borderRadius:5,
    marginHorizontal:10,
    alignItems: "center",
    borderWidth:.7,
    borderColor:"#aaa",
    paddingHorizontal:windowX*.1,
  },
  itemInfoContainer:{
    position: "absolute",
    width: "50%",
    top:8,
    bottom:8,
    backgroundColor: "white",
    elevation:2,
  },
  itemLeftInfoContainer: {
    left: 0,
    transform:[{translateX: -144}],
    borderTopRightRadius:10,
    borderBottomRightRadius:10,
  },
  itemRightInfoContainer: {
    right: 0,
    transform:[{translateX: 144}],
    borderTopLeftRadius:10,
    borderBottomLeftRadius:10,
  },
});
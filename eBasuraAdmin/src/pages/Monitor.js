import React from 'react';
import { Row, Col, Button, ListGroup, ListGroupItem, ButtonGroup } from 'reactstrap';
import {Gmaps, Marker, Circle, Polyline } from 'react-gmaps';
import {firestore} from 'firebase'
import 'firebase/firestore';

import truckIcon from '../images/truck_icon.png';
import startIcon from '../images/start_icon.png';
import endIcon from '../images/end_icon.png';
import pendingIcon from '../images/pending_icon.png';
import collectedIcon from '../images/collected_icon.png';
import skippedIcon from '../images/skipped_icon.png';

import posed from 'react-pose';
import moment from 'moment';

const GOOGLE_API_KEY = 'AIzaSyAKLNDKXRY5niSySOE8TIdz2yFgBmHyhjo';

var statusLabel = ( status )=>{

  var availableColor = "green";
  var unavailableColor = "red";
  var currentColor = ""

  if(status === "new") currentColor = availableColor;
  else currentColor = unavailableColor;
  return(
    <div style={{
      height: 10, 
      width: 10, 
      borderRadius: 10, 
      borderColor: "white", 
      borderWidth: 10,
      backgroundColor: currentColor,
      boxShadow: `1px 1px 1px grey`,
    }}></div>
  )
}

const PickupInfo = posed.div({
  open: {
    x: 0,
    transition: {
      duration: 150,
      ease: 'linear'
    }
  },
  close: {
    x: -300,
    transition: {
      duration: 150,
      ease: 'linear'
    }
  },
  
});

const MapLegend = posed.div({
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
})

const TruckItem = posed.div({
  hoverable: true,
  init: { x: 0},
  hover: { x: -10 },
});

const TruckPanel = posed.div({
  open:{
    opacity: 1,
    zIndex: 9999,
  },
  close:{
    opacity: 0,
    zIndex: -1,
  }
});
const TruckList = posed.div({
  open:{
    opacity: 1,
    zIndex: 9999,
  },
  close:{
    opacity: 0,
    zIndex: -1,
  }
});
const MessageContainer = posed.div({
  open: {
    y: 0
  },
  close: {
    y: 300
  }
})
const VideoContainer = posed.div({
  open: {
    y: 0
  },
  close: {
    y: 300
  }
})

export default class Monitor extends React.Component {
  constructor(){
    super();
    this.state = {
      truckDocId: "",
      truckId: "", 
      batch: {},
      collectors: [],

      trucks:[],
      users:[],
      batches:[],
      removedUsers:[],
      addedUsers:[],
      isLoading: false,
      rtcPeerConnection : null,
      videoSrc: null,
      pickupLocations: [],
      selectedPickup: {},
      collections: [],
      pickupFeedbacks: [],
      infoPose: "close",
      videoPose: "close",
      truckListPose: "open",
      truckPanelPose: "close",
      messagePose: "close",


      paths: [],
      collectorPos: {
        latitude: 0,
        longitude: 0,
      }
    }

    this.connections = []

  }
  emptyForm = {
    truckDocId: "",
    truckId: "", 
    collectors: [],
    batch: {},
    truckIdError: "",
  }
  componentDidMount = async ()=>{
    await this.loadData();
    this.video = document.getElementById("video");
  }
  componentWillUnmount(){
    try{
      this.truckListener();
      this.collectionListener();
    }
    catch(e){console.log(e.message)}
  }
  loadData = async ()=>{

    this.truckListener = firestore().collection("Trucks")
    .onSnapshot(async (querySnapshot)=>{
      let trucks = []

      for( let doc of querySnapshot.docs){
        var data = doc.data();
        var connection = this.connections.find((i)=>i.truckDocId === doc.id)
        if(typeof connection === 'undefined' || connection === 'false'){
          var newConn = {
            truckDocId: doc.id,
            peerConnection: await this.createConnection(doc.id),
            status: "new",
          };
          this.connections.push(newConn)
        }
        else{
          if(data.status === "new" && data.remoteDescriptionStatus === "pending" && data.remoteIceCandidateStatus === "pending"){
            await this.resetConnection(connection);
          }
        }

        trucks.push({
          ...doc.data(),
          truckDocId: doc.id,
          truckId: doc.data().truckId
        })
        
      }
      this.setState({ trucks });
    });
    console.log(moment().startOf('day').toString());
    console.log(moment().endOf('day').toString());
    
    this.collectionListener = await firestore().collection("Collections")
    .where("dateTime",">",new Date(moment().startOf('day').toString()))
    .where("dateTime","<",new Date(moment().endOf('day').toString()))
    .onSnapshot(async (querySnapshot)=>{
      var collections = []
      for( var collection of querySnapshot.docs ){
        collections.push({ 
          collectionDocId: collection.id,
          ...collection.data(),
        })
      }
      this.setState({pickupLocations: collections})
    });
    
  }
  async onSelect(item){

    this.setState({
      isloading: true,
      truckDocId: item.truckDocId,
      truckId: item.truckId,
    },async ()=>{
      if(item.status === "new"){
        try{
          await this.startConnection(item.truckDocId);
        }
        catch(e){console.log(e)}
        this.setState({ isLoading: false });
      }
    })
  }
  async resetConnection( conn ){
    console.log("reset");
    try{
      conn.peerConnection.close(); 
    }
    catch(e) {console.log(e.message)}
    conn.peerConnection = await this.createConnection(conn.truckDocId);
  }
  async createConnection (truckDocId){

    var truck = await firestore().collection("Trucks").doc(truckDocId).get();
    var configuration = {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]};
    var pc = new RTCPeerConnection(configuration);
    var iceCandidates = [];

    var dataChannel = pc.createDataChannel("sendData",{negotiated: true, id: 0});
    dataChannel.onopen = (event)=>{
      console.log("sendchannel on open")
    };
    dataChannel.onclose = (event)=>{
      console.log("sendchannel on close")
    }
    dataChannel.onmessage = (message)=>{
      var data = JSON.parse(message.data)
      if(data.hasOwnProperty("paths")){
        console.log("paths");
        data.paths = data.paths.map(( pos )=>{
          return {
            lat: pos.latitude,
            lng: pos.longitude,
          }
        })
      }
      console.log("message", data);
      this.setState({ ...data});
    };


    pc.addEventListener('iceconnectionstatechange', async (event)=>{
      console.log("onIceStateChange: ", event.target.iceConnectionState);
      if(event.target.iceConnectionState === "closed" || event.target.iceConnectionState === "disconnected"){
        this.setState({
          paths: [],
          collectorPos: {
            longitutude: 0,
            latitude: 0,
          },
          videoPose: "close", 
          messagePose: "close",
          truckListPose: "open", 
          truckPanelPose: "close",
        })
      }
      if(event.target.iceConnectionState === "connected"){
        this.setState({ videoPose: "open",messagePose: "open", truckListPose: "close", truckPanelPose: "open"  })
      }
      else if(event.target.iceConnectionState === "failed"){
        try{
          for( let conn of this.connections){
            await this.resetConnection( conn );
          }
          await firestore().collection("Trucks").doc(this.state.truckDocId).update({
            status: "failed"
          })
        }
        catch(e){console.log(e.message)}
      }
      try{
          var connection = this.connections.find((i)=>i.truckDocId === truckDocId);
          connection.status = event.target.iceConnectionState;
      }
      catch(e){console.log(e)}
    });
    pc.addEventListener('track', (event)=>{
      if (this.video.srcObject !== event.streams[0]) {
        this.video.srcObject = event.streams[0];
        console.log('received remote stream!');
      }
    });
    pc.addEventListener('icecandidate', async (event)=>{
      try{
        var ic = event.candidate;
        if(event.candidate == null || event.candidate === "") iceCandidates.push(null);
        else{
          ic = new RTCIceCandidate(ic);
          iceCandidates.push(ic.toJSON());
        } 
        
        if(event.candidate == null || event.candidate === ""){
          truck.data().localIceCandidates.forEach((c, i)=>{
            if(c != null && c !== ""){
              pc.addIceCandidate(c);
            }
          })
          await firestore().collection("Trucks").doc(truckDocId).update({
            remoteIceCandidates: iceCandidates,
            remoteIceCandidateStatus: "sent",
          });
          console.log("iceCandidate sent: "+ truckDocId);
          iceCandidates = [];
        }
      }
      catch(e){ console.log(e)}
    });
    return pc;
  }
  async startConnection (truckDocId){
    var truck = await firestore().collection("Trucks").doc(truckDocId).get();
    var connection = this.connections.find((item)=>item.truckDocId === truckDocId)
    if(connection){
      var pc = connection.peerConnection;
      try{
        console.log("iceConnectionState before set remote description: "+ pc.iceConnectionState);
        await pc.setRemoteDescription(new RTCSessionDescription(truck.data().localDescription));
        var answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await firestore().collection("Trucks").doc(truckDocId).update({
          remoteDescription: answer.toJSON(),
          remoteDescriptionStatus: "sent",
        })
  
      }
      catch(e){
        console.log(e.message);
      }
    }
  }
  legendItems = ()=>{
    var items = [];
    var images = {};
    images.pending = pendingIcon;
    images.collected = collectedIcon;
    images.skipped = skippedIcon;
    images.start = startIcon;
    images.end = endIcon;
    images.truck = truckIcon;
    var marker_legend = (imageName, description)=>(
      <div key={imageName} className="d-flex">
        <div className="col-2 p-0">
          <img style={{margin: "auto"}} alt="load" width="21.5px" height="31px" src={images[imageName]} />
        </div>
        <div className="col p-0 text-center"><small><b>{description}</b></small></div>
      </div>
    )
    var nav_legend = (imageName, description)=>(
      <div key={imageName} className="d-flex">
        <div className="col-2 p-0">
          <img style={{margin: "auto"}} alt="load"src={images[imageName]} />
        </div>
        <div className="col p-0 text-center"><small><b>{description}</b></small></div>
      </div>
    )
    var path_legend = (
      <div key={"path"} className="d-flex">
        <div className="col-2 d-flex p-0 align-items-center" >
          <div style={{backgroundColor: "#720D5D", height: 3, width: "100%"}}></div>
        </div>
        <div className="col p-0 text-center"><small><b>{"Truck path"}</b></small></div>
      </div>
    )
    items.push(marker_legend("pending", "Pending Collection"));
    items.push(marker_legend("collected", "Collected Collection"));
    items.push(marker_legend("skipped", "Skipped Collection"));

    if(this.state.paths.length > 0){
      items.push(nav_legend("start", "Start point"));
      items.push(nav_legend("end", "End point"));
      items.push(nav_legend("truck", "Truck location"));
      items.push(path_legend);

    }

    return items;
  }
  navigationMarkers = ()=>{
    var markers = [];
    var images = {};
    images.start = startIcon;
    images.end = endIcon;
    images.truck = truckIcon;
    var addMarker = ( name, coord )=>{
      markers.push(
        <Marker
          key={name + Date.now()}
          lat={coord.lat}
          lng={coord.lng} 
          icon={images[name]}
        />
      )
    } 
      
    if(this.state.paths.length > 0){
      addMarker(
        "start", 
        {
          lat: this.state.paths[0].lat,
          lng: this.state.paths[0].lng
        }
      );
      addMarker(
        "end", 
        {
          lat: this.state.paths[this.state.paths.length - 1].lat,
          lng: this.state.paths[this.state.paths.length - 1].lng
        }
      );
      addMarker(
        "truck", 
        {
          lat:this.state.collectorPos.latitude,
          lng:this.state.collectorPos.longitude
        }
      );
    }
    return markers;
  }
  pickupMarkers = ()=>{
    return this.state.pickupLocations.map((item, index)=>{
      var label = ""
      if(item.status === "pending") label = "P"
      else if(item.status === "collected") label = "C"
      else if(item.status === "skipped") label = "S"

      return (
        <Marker
          key={item.collectionDocId}
          lat={item.location.latitude}
          lng={item.location.longitude}
          label={label}
          onClick={()=>{
            console.log("collectionDocId: "+item.collectionDocId);
            console.log("pickupDocId: "+ item.pickupDocId);
            firestore().collection("Feedbacks").where("pickupDocId", "==", item.pickupDocId).get()
            .then((onSnapShot)=>{
              var feedbacks = []
              onSnapShot.docs.forEach(( doc )=>{
                var data = doc.data();
                feedbacks.push({...data,dateTime: data.dateTime.toDate() , feedbackDocId: doc.id});
              })
              console.log("pickupFeedbacks", feedbacks)
              console.log("selectedPickup", item)

              this.setState({
                infoPose: "open",
                pickupFeedbacks: feedbacks,
                selectedPickup: item,
              })
            })
            
          }}
      />
      )
    })
  }
  
  render (){
    var truckCollections = this.state.pickupLocations.filter((pickup)=>{
      return pickup.truckDocId === this.state.truckDocId;
    })

    var logCollections = [...truckCollections];
    logCollections.forEach((item, index)=>{
      item.dateTimeLog = item.dateTime.toDate();
      if(item.status === "skipped") item.dateTimeLog = item.dateTimeSkipped.toDate();
      else if(item.status === "collected") item.dateTimeLog = item.dateTimeCollected.toDate();
    });
    logCollections.sort((a,b)=>{
      return new Date(b.dateTimeLog) - new Date(a.dateTimeLog);
    })
    logCollections = logCollections.filter((item)=>{
      return (item.status === "skipped" || item.status === "collected")
    })
    return (
      <div className="col d-flex">
        <div 
          style={{overflow:"hidden"}}
          className="col p-0 m-0">
          <PickupInfo className="shadow" pose={this.state.infoPose} style={{
            position: "absolute",
            height: "100%",
            width: 300,
            left: 0,
            padding: 15,
            backgroundColor: "white",
            zIndex: 9000,
            marginVertical: "auto",
          }}>
            <div>
              <div>
                <b>Address:</b> {this.state.selectedPickup.address}
              </div>
              <div>
                <b>Status:</b> {this.state.selectedPickup.status}
              </div>
            </div>
            <hr />
            <div>
              <b>Resident Feedbacks</b>
            </div>
            <ListGroup flush
              style={{
                width: "270px",
                maxHeight: "400px",
                marginBottom: "10px",
                overflow:"scroll",
              }}
            
            >
            {
              this.state.pickupFeedbacks.map((feedback)=>
                  <ListGroupItem
                    key={feedback.feedbackDocId}>
                    <div
                      style={{
                        height: "30px"
                      }}>
                    {feedback.message}
                    </div>
                    <div 
                      style={{
                        height: "10px"
                      }}
                    >
                      <small style={{fontSize: 9, flexDirection: "column-reverse"}}>{moment(feedback.dateTime).fromNow()}</small>
                    </div>
                  </ListGroupItem>

                )
              }
            </ListGroup>
          </PickupInfo>
          <VideoContainer 
            pose={this.state.videoPose} 
            style={{
              position: "absolute",
              bottom: -50,
              right: 20,
              zIndex: 9000,
              height: 300,
              width: 200,
              boxShadow: "#777 0px -10px 5px -6px",

            }}
            className="d-flex flex-column"
          >
            <video id="video" style={{height: "100%", width: "100%"}} playsInline autoPlay ></video>
          </VideoContainer>
          <MessageContainer 
            pose={this.state.messagePose} 
            style={{
              position: "absolute",
              bottom: 20,
              right: 400,
              zIndex: 9000,
              height: 55,
              width: 300,
              padding: 7,
              backgroundColor: "white",
              boxShadow: "#777 0px -10px 5px -6px",

            }}
            className="d-flex flex-row"
          >
            <div class="input-group mb-1">
              <input
                onChange={(e)=>this.setState({messageToDriver: e.target.value})}
                value={this.state.messageToDriver} type="text" class="form-control" placeholder="Send Alert to Driver"/>
              <div class="input-group-append">
                <button 
                  onClick={async ()=>{
                    try{
                      await firestore().collection("Notifications").add({
                        title: "Alert from admin",
                        body: this.state.messageToDriver,
                        truckDocId: this.state.truckDocId,
                      });
                      alert("Alert to driver sent!\nalert message: "+ this.state.messageToDriver);
                      this.setState({messageToDriver: ""});
                    }
                    catch(e){console.log(e.message)}
                    
                  }}
                class="btn btn-primary" type="button">Send</button>
              </div>
            </div>
          </MessageContainer>
          <MapLegend 
            pose={this.state.isInfoOpen} 
            style={{
              position: "absolute",
              top: 10,
              right: 5,
              width: 180,
              zIndex: 9000,
            }}
            className="d-flex flex-column"
          >
            {this.legendItems()}
          </MapLegend>

          <Gmaps
              width={'100%'}
              height={'100%'}
              lat={14.61881}
              lng={121.057171}
              zoom={12}
              loadingMessage={'Be happy'}
              params={{v: '3.exp', key: GOOGLE_API_KEY}}
              onMapCreated={(map)=>{
                map.setOptions({
                  disableDefaultUI: true
                });
              }}
              onClick={()=>{
                this.setState({
                  infoPose: "close",
                })
              }}
              >
              {
                <Polyline 
                  path={this.state.paths}
                  geodesic={true} 
                  strokeColor= {'#720D5D'}
                  strokeOpacity= {1.0}
                  strokeWeight= {3}
                />
              }
              { this.navigationMarkers() }
              { this.pickupMarkers() }
            </Gmaps>
        </div>
        <div className="p-0" 
          style={{
            boxShadow: "#777 -10px 0px 5px -6px",
            height: "100%",
            width: "280px",
          }}
        >
            <TruckList 
             pose={this.state.truckListPose}
             >
             <div style={{margin: "25px"}}><h2>Truck List</h2></div>
            <ListGroup flush
              style={{
                flex: 1,
                height: "100%",
                width: "270px",
              }}
            >
            
              {
                this.state.trucks.map((truck)=>
                <TruckItem>
                    <ListGroupItem
                    key={truck.truckDocId}>
                        
                          
                        <div className="d-flex align-items-center ">
                              { statusLabel(truck.status) }

                            <div className="ml-4">{truck.truckId}</div>
                            {
                              (truck.status === "new")
                              ?<ButtonGroup size="sm" className="ml-auto">
                                <Button
                                  disabled={this.state.isLoading}
                                  onClick={()=>{this.onSelect(truck)}}>Connect</Button>
                              </ButtonGroup>
                              :null
                            }
                            
                          </div>
                          
                    </ListGroupItem>
                    </TruckItem>

                )
              }
            </ListGroup>
            </TruckList>
            {
              (truckCollections.length > 0)
              ?<TruckPanel pose={this.state.truckPanelPose}
              style={{
                position:"absolute",
                top:0,
                bottom:0,
                width: "280px",
              }}
              className="d-flex flex-column"
            >

              <div className="col">
              <div style={{margin: "15px"}}><b>{"Truck ID: "}</b>{this.state.truckId}</div>
              <hr />
              <div style={{margin: "15px"}}>
                <div><b>Status</b></div>
                <div>Total: {truckCollections.length}</div>
                <div>Collected: {
                  truckCollections.reduce((accumulator, currentValue) =>{
                    if(currentValue.status === "collected"){
                      return accumulator + 1;
                    }
                    return accumulator;
                  },0)
                }</div>
                <div>Skipped: {
                  truckCollections.reduce((accumulator, currentValue) =>{
                    if(currentValue.status === "skipped"){
                      return accumulator + 1;
                    }
                    return accumulator;
                  },0)
                }</div>
                <div>Pending: {
                  truckCollections.reduce((accumulator, currentValue) =>{
                    if(currentValue.status === "pending"){
                      return accumulator + 1;
                    }
                    return accumulator;
                  },0)
                }</div>
              </div>
              
              <hr />
              <div style={{margin: "15px"}}><b>Trip Logs</b></div>
            <ListGroup flush
              style={{
                width: "270px",
                maxHeight: "170px",
                marginBottom: "10px",
                overflow:"scroll",
              }}
            >
              {
                logCollections.map((item)=>{
                  if(item.status === "collected"){
                    return (
                    <ListGroupItem style={{fontSize: 9}} key={item.collectionDocId}>
                    - <b>Collected Pickup</b> - {moment(item.dateTimeLog).fromNow()}
                    </ListGroupItem>
                    )
                  }
                  else {
                    return(
                    <ListGroupItem style={{fontSize: 9}} key={item.collectionDocId}>
                    - <b>Skipped Pickup</b> - {moment(item.dateTimeLog).fromNow()}
                    </ListGroupItem>
                    )
                  }
                })
              }
              {
                <ListGroupItem  style={{fontSize: 9}} key={"alsdjflakdfj"}>
                  - <b>Initiate Trip</b> - {moment(truckCollections[0].dateTime.toDate()).fromNow()}
                </ListGroupItem>
              }
              
            </ListGroup>
              </div>
              <div>
                <button
                  onClick={async ()=>{
                    try{
                      for( let conn of this.connections){
                        await this.resetConnection( conn );
                      }
                    }
                    catch(e){console.log(e.message)}
                  }}
                type="button" className="btn btn-block btn-danger">{"Disconnect"}</button>
              </div>
              
            </TruckPanel>
              :null
            }
            
            
            

        </div>
      </div>
    );
  }
}
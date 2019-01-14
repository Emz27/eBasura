import React from 'react';
import { Row, Col, Button, ListGroup, ListGroupItem, ButtonGroup } from 'reactstrap';
import {Gmaps, Marker, Circle } from 'react-gmaps';
import {firestore} from 'firebase'
import 'firebase/firestore';

import Anime from 'react-anime';
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
      console.log("message", JSON.parse(message.data));
    };


    pc.addEventListener('iceconnectionstatechange', async (event)=>{
      console.log("onIceStateChange: ", event.target.iceConnectionState);
      if(event.target.iceConnectionState === "connected"){
        try{
          // for( var conn of this.connections){
          //   await this.resetConnection( conn );
          // }
        }
        catch(e){console.log(e)}
      }
      else if(event.target.iceConnectionState === "failed"){
        try{
          for( let conn of this.connections){
            await this.resetConnection( conn );
          }
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
  render (){
    return (
      <div className="col d-flex">
        <div className="col p-0 m-0">
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
              // onClick={this.onMapClick}
              >
              {
                <Circle
                lat={14.61881}
                lng={121.057171}
                strokeColor= {'#FF0000'}
                strokeOpacity= {1}
                strokeWeight={3}
                fillColor= {'#FF0000'}
                fillOpacity={1}
                radius={20} />
              }
              {
                this.state.pickupLocations.map((item, index)=>
                {
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
                  />
                  )
                })
              }
            </Gmaps>
        </div>
        <div className="col-md-3 d-flex flex-column p-0" 
          style={{
            boxShadow: "#777 -10px 0px 5px -6px",
            height: "100%",
            width: "500px",
          }}
        >
          <div className="col">
            
            <video id="video" style={{height: "100%", width: "100%"}} playsInline autoPlay ></video>
          </div>
          <div className="col">
          
            <ListGroup flush>
            
              {
                this.state.trucks.map((truck)=>
                
                    <ListGroupItem key={truck.truckDocId}>
                      
                          <div className="d-flex align-items-center ">
                            <Anime 
                              key={truck.truckDocId+Date.now()}
                              easing="easeOutElastic"
                              duration={1000}
                              direction="alternate"
                              loop={false}
                              delay={(el, index) => index * 240}
                              scale={[.75, .9]}>
                              { statusLabel(truck.status) }
                            </Anime>
                            <div>{truck.truckId}</div>
                            <ButtonGroup size="sm" className="ml-auto">
                              <Button
                                disabled={this.state.isLoading}
                                onClick={()=>{this.onSelect(truck)}}>select</Button>
                            </ButtonGroup>
                          </div>
                    </ListGroupItem>
                )
              }
            </ListGroup>
          </div>

        </div>
      </div>
    );
  }
}
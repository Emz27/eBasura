import React, { Component } from 'react';
import { Row, Col, Button, ButtonGroup, Form, FormGroup, FormFeedback, Label, Input, ListGroup, ListGroupItem } from 'reactstrap';
import {Gmaps, Marker, InfoWindow, Circle} from 'react-gmaps';

import { firestore } from 'firebase';
import 'firebase/firestore';

const GOOGLE_API_KEY = 'AIzaSyAKLNDKXRY5niSySOE8TIdz2yFgBmHyhjo';

const coords = {
  lat: 51.5258541,
  lng: -0.08040660000006028
};

const params = {v: '3.exp', key: GOOGLE_API_KEY};
export default class PickupLocationsCRUD extends Component{
  constructor(){
    super();
    this.state = {

      pickupLocations: [],
      infoWindows: []
    }
  }
  onMapCreated = (map)=>{
    map.setOptions({
      disableDefaultUI: true
    });
  }

  onDragEnd = (e)=>{
    console.log('onDragEnd', e);
  }

  onInfoCloseClick = ()=>{
    console.log('onCloseClick');
  }

  onMapClick= (e)=>{
    console.log('onClick', e, e.latLng, e.latLng.lat());
    var infoWindow = {
      location: {
        latitude: e.latLng.lat(),
        longitude: e.latLng.lng(),
      }
    };
    this.setState({
      infoWindows:[...this.state.infoWindows, infoWindow]
    })
  }
  componentDidMount = ()=>{
    this.setState({
      isLoading: true
    }, async ()=>{
      await this.loadData();
    })
  }
  loadData = async ()=>{
    var pickupLocations = [];
    var pickupLocationResults = await firestore().collection("PickupLocations").get();
    if(pickupLocationResults.docs.length > 0){
      pickupLocations = pickupLocationResults.docs.map(( doc ,index )=>{
        var data = doc.data();
        return {
          pickupDocId: doc.id,
          pickupId: data.pickupId,
          address: data.address,
          comment: data.comment,
          location: {
            latitude: data.location.latitude,
            longitude: data.location.longitude,
          }
        }
      })
    }

    this.setState({
      pickupLocations: pickupLocations,
      isLoading: false
    });
  }
  render() {
    return (
      <Row className="mt-5">
        <Col>
          <Gmaps
            width={'100%'}
            height={'600px'}
            lat={14.61881}
            lng={121.057171}
            zoom={12}
            loadingMessage={'Be happy'}
            params={params}
            onMapCreated={this.onMapCreated}
            onClick={this.onMapClick}>
            {
              this.state.pickupLocations.map((item, index)=>
                <Marker
                key={item.pickupId}
                lat={item.location.latitude}
                lng={item.location.longitude}
                />
              )
            }
            {
              this.state.infoWindows.map((item, index)=>
                <InfoWindow
                key={index}
                lat={item.location.latitude}
                lng={item.location.longitude}
                content={<Button>sdfsdf</Button>}
                onCloseClick={(e)=>{this.onInfoCloseClick(e,index)}} />
              )
            }
          </Gmaps>
        </Col>
        <Col>
          <ListGroup flush>
            {
              this.state.pickupLocations.map((item)=>
                <ListGroupItem key={item.pickupDocId}>
                    <Row>
                      <div>{item.pickupId}</div>
                    </Row>
                    <Row>
                      <div>{item.address}</div>
                    </Row>  
                </ListGroupItem>
              )
            }
          </ListGroup>
        </Col>
      </Row>
      
    );
  }
}